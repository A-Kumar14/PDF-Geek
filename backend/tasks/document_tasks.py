"""Async document indexing via Celery."""

import json
from datetime import datetime

from celery_app import celery_app
from logging_config import get_logger
from models import db, SessionDocument
from services.ai_service import AIService
from services.file_service import FileService
from services.rag_service import RAGService

logger = get_logger(__name__)

ai_service = AIService()
file_service = FileService()
rag_service = RAGService(ai_service, file_service)


@celery_app.task(bind=True, max_retries=2, default_retry_delay=5)
def index_document_task(self, session_id, user_id, file_url, file_name):
    """Download, extract, and index a document into ChromaDB.

    Phases reported via update_state:
      DOWNLOADING → EXTRACTING → INDEXING → completed
    """
    from werkzeug.utils import secure_filename

    document_id = f"{session_id}_{secure_filename(file_name)}_{datetime.now().strftime('%H%M%S')}"

    try:
        # Phase 1: Downloading
        self.update_state(state="DOWNLOADING", meta={"phase": "downloading", "file_name": file_name})
        logger.info("document.download.start", file_url=file_url, session_id=session_id)

        # Phase 2: Extracting + Indexing (rag_service.index_from_url handles both)
        self.update_state(state="EXTRACTING", meta={"phase": "extracting", "file_name": file_name})

        result = rag_service.index_from_url(file_url, file_name, document_id, session_id, user_id)

        # Phase 3: Storing DB record
        self.update_state(state="INDEXING", meta={"phase": "indexing", "file_name": file_name})

        doc_record = SessionDocument(
            session_id=session_id,
            file_name=file_name,
            file_type=result.get("file_type", "unknown"),
            file_url=file_url,
            chroma_document_id=document_id,
            chunk_count=result.get("chunk_count", 0),
            page_count=result.get("page_count", 0),
        )
        db.session.add(doc_record)
        db.session.commit()

        logger.info("document.indexed", document_id=document_id, chunks=result.get("chunk_count", 0))

        return {
            "status": "completed",
            "document": doc_record.to_dict(),
        }

    except Exception as exc:
        logger.error("document.index.failed", error=str(exc), session_id=session_id)
        raise self.retry(exc=exc)
