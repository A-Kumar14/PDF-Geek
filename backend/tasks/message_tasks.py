"""Async LLM agentic pipeline via Celery."""

import json
from datetime import datetime

from celery_app import celery_app
from logging_config import get_logger
from models import db, StudySession, ChatMessage
from services.ai_service import AIService
from services.file_service import FileService
from services.rag_service import RAGService, MemoryService
from services.tools import ToolExecutor

logger = get_logger(__name__)

ai_service = AIService()
file_service = FileService()
rag_service = RAGService(ai_service, file_service)
memory_service = MemoryService(ai_service)
tool_executor = ToolExecutor(rag_service, ai_service)


@celery_app.task(bind=True, max_retries=1, default_retry_delay=5)
def send_message_task(self, session_id, user_id, question, deep_think=False):
    """Run the full agentic RAG pipeline asynchronously.

    Returns {message_id, answer, sources, artifacts, suggestions}.
    """
    try:
        session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return {"error": "Session not found"}

        model_override = AIService.RESPONSE_MODEL if deep_think else None

        # Build chat history from DB
        recent_msgs = ChatMessage.query.filter_by(session_id=session_id).order_by(
            ChatMessage.created_at
        ).limit(20).all()
        chat_history = [{"role": m.role, "content": m.content} for m in recent_msgs]

        # Memory context
        memory_context = ""
        preference_context = ""
        try:
            memories = memory_service.retrieve_relevant_memory(user_id, question, n=3)
            if memories:
                memory_context = " | ".join(memories[:3])
            preference_context = memory_service.get_user_preferences(user_id)
        except Exception as e:
            logger.warning("memory.retrieval.failed", error=str(e))

        # Agentic RAG pipeline
        result = ai_service.answer_with_tools(
            question=question,
            chat_history=chat_history,
            tool_executor=tool_executor,
            session_id=session_id,
            user_id=user_id,
            persona=session.persona or "academic",
            file_type="pdf",
            model_override=model_override,
            memory_context=memory_context,
            preference_context=preference_context,
        )

        # Save assistant message
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=result.get("answer", ""),
            sources_json=json.dumps(result.get("sources", [])),
            artifacts_json=json.dumps(result.get("artifacts", [])),
            suggestions_json=json.dumps(result.get("suggestions", [])),
            tool_calls_json=json.dumps(result.get("tool_calls", [])),
        )
        db.session.add(assistant_msg)

        session.updated_at = datetime.utcnow()
        db.session.commit()

        logger.info("message.sent", session_id=session_id, message_id=assistant_msg.id)

        return {
            "message_id": assistant_msg.id,
            "answer": result.get("answer", ""),
            "sources": result.get("sources", []),
            "artifacts": result.get("artifacts", []),
            "suggestions": result.get("suggestions", []),
        }

    except Exception as exc:
        logger.error("message.send.failed", error=str(exc), session_id=session_id)
        raise self.retry(exc=exc)
