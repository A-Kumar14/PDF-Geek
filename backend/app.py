import os
import re
import json
import logging
from functools import wraps
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

import jwt as pyjwt
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import Config
from models import db, User, StudySession, ChatMessage, SessionDocument
from auth import auth_bp, JWT_SECRET
from services.ai_service import AIService, PersonaManager, get_persona_prompt
from services.file_service import FileService
from services.rag_service import RAGService, MemoryService
from services.tools import ToolExecutor

# ---------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# Simple in-file validation and rate limiting
# ---------------------------------------------------------
class InputValidator:
    """Minimal input validation helpers for upload endpoint."""

    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".mp3", ".wav", ".m4a", ".webm", ".ogg"}
    MAX_QUESTION_LENGTH = 2000

    @classmethod
    def validate_file_upload(cls, file):
        if file is None:
            return False, "No file provided"
        filename = getattr(file, "filename", "") or ""
        if filename.strip() == "":
            return False, "No file selected"
        lower = filename.lower()
        if not any(lower.endswith(ext) for ext in cls.ALLOWED_EXTENSIONS):
            return False, "Unsupported file type. Allowed: PDF, DOCX, TXT, PNG, JPG, MP3, WAV, M4A"
        return True, ""

    @classmethod
    def validate_question(cls, question: str):
        if not question or not question.strip():
            return False, "Question cannot be empty"
        if len(question) > cls.MAX_QUESTION_LENGTH:
            return False, "Question is too long"
        return True, ""

    @staticmethod
    def sanitize_input(text: str) -> str:
        return text.strip()

    @classmethod
    def validate_chat_history(cls, history):
        if history is None:
            return True, ""
        if not isinstance(history, list):
            return False, "Chat history must be a list"
        for item in history:
            if not isinstance(item, dict):
                return False, "Invalid chat history entry"
            role = item.get("role")
            content = item.get("content")
            if role not in ("user", "assistant"):
                return False, "Invalid role in chat history"
            if not isinstance(content, str):
                return False, "Invalid content in chat history"
        return True, ""


class IPRateLimiter:
    """Very simple in-memory per-IP rate limiter."""

    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits = {}

    def _prune(self, ip: str, now: float):
        timestamps = self._hits.get(ip, [])
        cutoff = now - self.window_seconds
        self._hits[ip] = [t for t in timestamps if t >= cutoff]

    def is_allowed(self, ip: str):
        import time

        now = time.time()
        self._prune(ip, now)
        timestamps = self._hits.get(ip, [])
        if len(timestamps) >= self.max_requests:
            return False, 0
        timestamps.append(now)
        self._hits[ip] = timestamps
        remaining = max(self.max_requests - len(timestamps), 0)
        return True, remaining

    def get_remaining_time(self, ip: str) -> int:
        import time

        now = time.time()
        timestamps = self._hits.get(ip, [])
        if not timestamps:
            return 0
        oldest = min(timestamps)
        remaining = int(self.window_seconds - (now - oldest))
        return max(remaining, 0)


# ---------------------------------------------------------
# Flask app setup
# ---------------------------------------------------------
app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
with app.app_context():
    db.create_all()

CORS(
    app,
    origins=[
        "http://localhost:3000",
        "https://localhost:3000",
        "https://file-geek.vercel.app",
        re.compile(r"https://.*\.vercel\.app"),
        re.compile(r"https://.*\.onrender\.com"),
    ],
)

app.register_blueprint(auth_bp, url_prefix="/auth")

ai_service = AIService()
file_service = FileService()
rag_service = RAGService(ai_service, file_service)
memory_service = MemoryService(ai_service)
tool_executor = ToolExecutor(rag_service, ai_service)
rate_limiter = IPRateLimiter()

UPLOAD_FOLDER = Config.UPLOAD_FOLDER
MAX_CONTENT_LENGTH = Config.MAX_CONTENT_LENGTH
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------------------------------
# JWT decorator
# ---------------------------------------------------------
def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization token"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.jwt_payload = payload
        except pyjwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except pyjwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def _get_user_id():
    return request.jwt_payload.get("user_id")


# ---------------------------------------------------------
# Middleware
# ---------------------------------------------------------
@app.before_request
def before_request():
    """Log all requests and check rate limits."""

    client_ip = request.remote_addr or "unknown"
    logger.info(f"Request from {client_ip}: {request.method} {request.path}")

    rate_limited_paths = ("/upload", "/ask", "/sessions")
    if any(request.path.startswith(p) for p in rate_limited_paths):
        is_allowed, remaining = rate_limiter.is_allowed(client_ip)
        if not is_allowed:
            remaining_time = rate_limiter.get_remaining_time(client_ip)
            return (
                jsonify(
                    {
                        "error": "Rate limit exceeded",
                        "remaining_time": remaining_time,
                        "message": f"Too many requests. Try again in {remaining_time} seconds.",
                    }
                ),
                429,
            )


# ---------------------------------------------------------
# Routes — Health & Personas
# ---------------------------------------------------------
@app.route("/health", methods=["GET"])
def health_check():
    return (
        jsonify(
            {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "version": "3.0.0",
            }
        ),
        200,
    )


@app.route("/personas", methods=["GET"])
def list_personas():
    return jsonify({"personas": PersonaManager.list_all()}), 200


# =========================================================
# SESSION ENDPOINTS
# =========================================================

@app.route("/sessions", methods=["GET"])
@jwt_required
def list_sessions():
    """List user's study sessions."""
    user_id = _get_user_id()
    sessions = StudySession.query.filter_by(user_id=user_id).order_by(
        StudySession.updated_at.desc()
    ).limit(50).all()
    return jsonify({"sessions": [s.to_dict() for s in sessions]}), 200


@app.route("/sessions", methods=["POST"])
@jwt_required
def create_session():
    """Create a new study session."""
    user_id = _get_user_id()
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip() or "Untitled Session"
    persona = (data.get("persona") or "").strip() or "academic"

    session = StudySession(user_id=user_id, title=title, persona=persona)
    db.session.add(session)
    db.session.commit()

    return jsonify({"session": session.to_dict()}), 201


@app.route("/sessions/<session_id>", methods=["GET"])
@jwt_required
def get_session(session_id):
    """Get session with messages and documents."""
    user_id = _get_user_id()
    session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
    return jsonify({"session": session.to_dict(include_messages=True, include_documents=True)}), 200


@app.route("/sessions/<session_id>", methods=["DELETE"])
@jwt_required
def delete_session(session_id):
    """Delete session and cleanup ChromaDB."""
    user_id = _get_user_id()
    session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    rag_service.delete_session_documents(session_id)
    db.session.delete(session)
    db.session.commit()

    return jsonify({"message": "Session deleted"}), 200


@app.route("/sessions/<session_id>/documents", methods=["POST"])
@jwt_required
def index_session_document(session_id):
    """Index a document into a session's RAG collection."""
    user_id = _get_user_id()
    session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    data = request.get_json(silent=True) or {}
    file_url = data.get("url", "")
    file_name = data.get("name", "document")

    if not file_url:
        return jsonify({"error": "File URL is required"}), 400

    # Validate URL origin
    allowed_prefixes = (
        "https://utfs.io/",
        "https://uploadthing.com/",
        "https://ufs.sh/",
        "https://4k40e5rcbl.ufs.sh/",
    )
    if not any(file_url.startswith(p) for p in allowed_prefixes):
        return jsonify({"error": "File URL origin not allowed"}), 400

    document_id = f"{session_id}_{secure_filename(file_name)}_{datetime.now().strftime('%H%M%S')}"

    try:
        result = rag_service.index_from_url(file_url, file_name, document_id, session_id, user_id)
    except Exception as e:
        logger.error(f"Document indexing failed: {e}")
        return jsonify({"error": f"Failed to index document: {file_name}"}), 500

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

    return jsonify({
        "message": "Document indexed",
        "document": doc_record.to_dict(),
    }), 201


@app.route("/sessions/<session_id>/messages", methods=["POST"])
@jwt_required
def send_session_message(session_id):
    """Send a message in a session — uses agentic RAG pipeline."""
    user_id = _get_user_id()
    session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    is_valid, error_msg = InputValidator.validate_question(question)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    deep_think = bool(data.get("deepThink", False))
    model_override = AIService.RESPONSE_MODEL if deep_think else None

    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=question)
    db.session.add(user_msg)
    db.session.commit()

    # Build chat history from DB
    recent_msgs = ChatMessage.query.filter_by(session_id=session_id).order_by(
        ChatMessage.created_at
    ).limit(20).all()
    chat_history = [{"role": m.role, "content": m.content} for m in recent_msgs[:-1]]

    # Memory context
    memory_context = ""
    preference_context = ""
    try:
        memories = memory_service.retrieve_relevant_memory(user_id, question, n=3)
        if memories:
            memory_context = " | ".join(memories[:3])
        preference_context = memory_service.get_user_preferences(user_id)
    except Exception as e:
        logger.warning(f"Memory retrieval failed: {e}")

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

    # Update session timestamp
    session.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message_id": assistant_msg.id,
        "answer": result.get("answer", ""),
        "sources": result.get("sources", []),
        "artifacts": result.get("artifacts", []),
        "suggestions": result.get("suggestions", []),
    }), 200


@app.route("/messages/<int:message_id>/feedback", methods=["POST"])
@jwt_required
def message_feedback(message_id):
    """Thumbs up/down on a message."""
    user_id = _get_user_id()
    data = request.get_json(silent=True) or {}
    feedback = data.get("feedback", "")

    if feedback not in ("up", "down"):
        return jsonify({"error": "Feedback must be 'up' or 'down'"}), 400

    msg = ChatMessage.query.get(message_id)
    if not msg:
        return jsonify({"error": "Message not found"}), 404

    # Verify ownership
    session = StudySession.query.filter_by(id=msg.session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Not authorized"}), 403

    msg.feedback = feedback
    db.session.commit()

    # Store in long-term memory
    try:
        # Find the user question that preceded this assistant message
        user_msg = ChatMessage.query.filter(
            ChatMessage.session_id == msg.session_id,
            ChatMessage.role == "user",
            ChatMessage.id < msg.id,
        ).order_by(ChatMessage.id.desc()).first()

        if user_msg:
            memory_service.store_interaction(
                user_id,
                user_msg.content,
                msg.content[:300],
                feedback,
            )
    except Exception as e:
        logger.warning(f"Failed to store feedback in memory: {e}")

    return jsonify({"message": "Feedback recorded"}), 200


# =========================================================
# AUDIO TRANSCRIPTION
# =========================================================

@app.route("/transcribe", methods=["POST"])
@jwt_required
def transcribe_audio():
    """Transcribe audio file using OpenAI Whisper API."""
    try:
        f = request.files.get("file")
        if not f:
            return jsonify({"error": "No audio file provided"}), 400

        filename = getattr(f, "filename", "") or ""
        ext = os.path.splitext(filename.lower())[1]
        if ext not in Config.ALLOWED_AUDIO_EXTENSIONS:
            return jsonify({"error": f"Unsupported audio format. Allowed: {', '.join(Config.ALLOWED_AUDIO_EXTENSIONS)}"}), 400

        # Need OpenAI client for Whisper
        openai_client = ai_service.client
        if not openai_client:
            return jsonify({"error": "Transcription requires OPENAI_API_KEY to be set"}), 503

        safe_filename = secure_filename(filename)
        filepath = os.path.join(UPLOAD_FOLDER, f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{safe_filename}")
        f.save(filepath)

        try:
            with open(filepath, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text",
                )
            return jsonify({"transcript": transcript}), 200
        finally:
            try:
                os.remove(filepath)
            except Exception:
                pass

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return jsonify({"error": "Transcription failed"}), 500


# =========================================================
# LEGACY ENDPOINTS (backward compat)
# =========================================================

ALLOWED_URL_PREFIXES = (
    "https://utfs.io/",
    "https://uploadthing.com/",
    "https://ufs.sh/",
    "https://4k40e5rcbl.ufs.sh/",
)


@app.route("/upload", methods=["POST"])
@jwt_required
def upload_file():
    """Handle file upload and analysis (legacy — kept for backward compat)."""

    try:
        file_count = int(request.form.get("fileCount", "1"))
        files = []
        for i in range(file_count):
            f = request.files.get(f"file_{i}") or (request.files.get("file") if i == 0 else None) or (request.files.get("pdf") if i == 0 else None)
            if f:
                files.append(f)

        if not files:
            return jsonify({"error": "No file provided"}), 400

        for f in files:
            is_valid, error_msg = InputValidator.validate_file_upload(f)
            if not is_valid:
                return jsonify({"error": error_msg}), 400

        question = (request.form.get("question", "") or "").strip()
        is_valid, error_msg = InputValidator.validate_question(question)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        question = InputValidator.sanitize_input(question)

        chat_history_str = request.form.get("chatHistory", "[]")
        try:
            chat_history = json.loads(chat_history_str)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid chat history format"}), 400

        is_valid, error_msg = InputValidator.validate_chat_history(chat_history)
        if not is_valid:
            return jsonify({"error": error_msg}), 400

        deep_think = (request.form.get("deepThink", "") or "").lower() == "true"
        n_chunks = Config.DEEP_THINK_CHUNKS if deep_think else Config.NUM_RETRIEVAL_CHUNKS
        model_override = AIService.RESPONSE_MODEL if deep_think else None
        persona = (request.form.get("persona", "") or "").strip() or "academic"

        all_chunks_with_pages = []
        all_file_infos = []
        filepaths = []
        image_filepaths = []
        combined_text = ""
        primary_file_type = "pdf"

        for f in files:
            filename = secure_filename(f.filename)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            safe_filename = f"{timestamp}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
            filepaths.append(filepath)

            try:
                f.save(filepath)
            except Exception as e:
                logger.error(f"Error saving file: {str(e)}")
                return jsonify({"error": "Failed to save file"}), 500

            file_type = file_service.detect_file_type(filepath)
            if primary_file_type == "pdf":
                primary_file_type = file_type

            if file_type == "image":
                image_filepaths.append(filepath)

            file_info = file_service.get_file_info(filepath)
            if file_info:
                file_info["file_type"] = file_type
                all_file_infos.append(file_info)

            page_texts = file_service.extract_text_universal(filepath)
            if not page_texts:
                continue

            extracted_text = "\n\n".join(p["text"] for p in page_texts)
            combined_text += extracted_text + "\n\n"

            document_id = safe_filename
            chunks_with_pages = file_service.chunking_function_with_pages(page_texts)
            chunk_texts = [c["text"] for c in chunks_with_pages]

            if chunk_texts:
                chunk_embeddings = ai_service.get_embeddings(chunk_texts)
                chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunk_texts))]
                chunk_metas = [
                    {"document_id": document_id, "pages": json.dumps(c["pages"])}
                    for c in chunks_with_pages
                ]
                rag_service.collection.add(
                    ids=chunk_ids,
                    embeddings=chunk_embeddings,
                    documents=chunk_texts,
                    metadatas=chunk_metas,
                )
                all_chunks_with_pages.extend(
                    [(document_id, c) for c in chunks_with_pages]
                )

        if not all_chunks_with_pages:
            return jsonify({"error": "Failed to extract text from uploaded file(s)"}), 500

        relevant_chunks = []
        relevant_metas = []
        try:
            question_embedding = ai_service.get_embeddings([question])[0]
            total_chunks = sum(1 for _ in all_chunks_with_pages)
            results = rag_service.collection.query(
                query_embeddings=[question_embedding],
                n_results=min(n_chunks, max(1, total_chunks)),
            )
            relevant_chunks = results["documents"][0] if results["documents"] else []
            relevant_metas = results["metadatas"][0] if results["metadatas"] else []
        except Exception as e:
            logger.warning(f"ChromaDB query failed: {e}")

        # Cleanup ephemeral entries
        for doc_id, _ in all_chunks_with_pages:
            try:
                rag_service.collection.delete(where={"document_id": doc_id})
            except Exception as e:
                logger.warning(f"ChromaDB delete failed: {e}")

        ai_response = ai_service.answer_from_context(
            relevant_chunks, question, chat_history,
            model_override=model_override,
            persona=persona,
            file_type=primary_file_type,
            image_paths=image_filepaths or None,
        )

        if not ai_response:
            return jsonify({"error": "Failed to generate AI response"}), 500

        for filepath in filepaths:
            try:
                os.remove(filepath)
            except Exception:
                pass

        sources = rag_service.build_sources(relevant_chunks, relevant_metas)

        return jsonify({
            "message": "Document processed successfully",
            "text": combined_text.strip(),
            "answer": ai_response,
            "file_info": all_file_infos[0] if all_file_infos else {},
            "file_infos": all_file_infos,
            "sources": sources,
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error in upload endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/ask", methods=["POST"])
@jwt_required
def ask():
    """Accept file URLs (from UploadThing CDN) + question, run RAG pipeline."""
    import requests as http_requests

    try:
        data = request.get_json(silent=True) or {}

        file_urls = data.get("fileUrls", [])
        if not isinstance(file_urls, list) or not file_urls:
            return jsonify({"error": "fileUrls array is required"}), 400

        question = (data.get("question") or "").strip()
        is_valid, error_msg = InputValidator.validate_question(question)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        question = InputValidator.sanitize_input(question)

        chat_history = data.get("chatHistory", [])
        is_valid, error_msg = InputValidator.validate_chat_history(chat_history)
        if not is_valid:
            return jsonify({"error": error_msg}), 400

        deep_think = bool(data.get("deepThink", False))
        n_chunks = Config.DEEP_THINK_CHUNKS if deep_think else Config.NUM_RETRIEVAL_CHUNKS
        model_override = AIService.RESPONSE_MODEL if deep_think else None
        persona = (data.get("persona") or "").strip() or "academic"

        all_chunks_with_pages = []
        all_file_infos = []
        filepaths = []
        image_filepaths = []
        combined_text = ""
        primary_file_type = "pdf"

        for entry in file_urls:
            url = entry.get("url", "") if isinstance(entry, dict) else str(entry)
            name = entry.get("name", "file") if isinstance(entry, dict) else "file"

            if not any(url.startswith(prefix) for prefix in ALLOWED_URL_PREFIXES):
                return jsonify({"error": f"File URL origin not allowed: {url}"}), 400

            try:
                dl_resp = http_requests.get(url, timeout=30, stream=True)
                dl_resp.raise_for_status()
            except Exception as e:
                logger.error(f"Failed to download file from {url}: {e}")
                return jsonify({"error": f"Failed to download file: {name}"}), 502

            filename = secure_filename(name) or "file"
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            safe_filename = f"{timestamp}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
            filepaths.append(filepath)

            with open(filepath, "wb") as fout:
                for chunk in dl_resp.iter_content(chunk_size=8192):
                    fout.write(chunk)

            file_type = file_service.detect_file_type(filepath)
            if primary_file_type == "pdf":
                primary_file_type = file_type

            if file_type == "image":
                image_filepaths.append(filepath)

            file_info = file_service.get_file_info(filepath)
            if file_info:
                file_info["file_type"] = file_type
                all_file_infos.append(file_info)

            page_texts = file_service.extract_text_universal(filepath)
            if not page_texts:
                continue

            extracted_text = "\n\n".join(p["text"] for p in page_texts)
            combined_text += extracted_text + "\n\n"

            document_id = safe_filename
            chunks_with_pages = file_service.chunking_function_with_pages(page_texts)
            chunk_texts = [c["text"] for c in chunks_with_pages]

            if chunk_texts:
                chunk_embeddings = ai_service.get_embeddings(chunk_texts)
                chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunk_texts))]
                chunk_metas = [
                    {"document_id": document_id, "pages": json.dumps(c["pages"])}
                    for c in chunks_with_pages
                ]
                rag_service.collection.add(
                    ids=chunk_ids,
                    embeddings=chunk_embeddings,
                    documents=chunk_texts,
                    metadatas=chunk_metas,
                )
                all_chunks_with_pages.extend(
                    [(document_id, c) for c in chunks_with_pages]
                )

        if not all_chunks_with_pages:
            return jsonify({"error": "Failed to extract text from uploaded file(s)"}), 500

        relevant_chunks = []
        relevant_metas = []
        try:
            question_embedding = ai_service.get_embeddings([question])[0]
            total_chunks = sum(1 for _ in all_chunks_with_pages)
            results = rag_service.collection.query(
                query_embeddings=[question_embedding],
                n_results=min(n_chunks, max(1, total_chunks)),
            )
            relevant_chunks = results["documents"][0] if results["documents"] else []
            relevant_metas = results["metadatas"][0] if results["metadatas"] else []
        except Exception as e:
            logger.warning(f"ChromaDB query failed: {e}")

        for doc_id, _ in all_chunks_with_pages:
            try:
                rag_service.collection.delete(where={"document_id": doc_id})
            except Exception as e:
                logger.warning(f"ChromaDB delete failed: {e}")

        ai_response = ai_service.answer_from_context(
            relevant_chunks, question, chat_history,
            model_override=model_override,
            persona=persona,
            file_type=primary_file_type,
            image_paths=image_filepaths or None,
        )

        if not ai_response:
            return jsonify({"error": "Failed to generate AI response"}), 500

        for filepath in filepaths:
            try:
                os.remove(filepath)
            except Exception:
                pass

        sources = rag_service.build_sources(relevant_chunks, relevant_metas)

        return jsonify({
            "message": "Document processed successfully",
            "text": combined_text.strip(),
            "answer": ai_response,
            "file_info": all_file_infos[0] if all_file_infos else {},
            "file_infos": all_file_infos,
            "sources": sources,
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error in /ask endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# ---------------------------------------------------------
# TTS endpoint
# ---------------------------------------------------------
@app.route("/tts", methods=["POST"])
@jwt_required
def text_to_speech():
    """Convert text to speech using OpenAI TTS API with persona voice."""
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        persona = (data.get("persona") or "").strip() or "academic"
        if not text:
            return jsonify({"error": "Text is required"}), 400
        if len(text) > 4096:
            return jsonify({"error": "Text too long (max 4096 characters)"}), 400

        tts_client = ai_service.client
        if not tts_client:
            return jsonify({"error": "TTS requires OPENAI_API_KEY to be set"}), 503

        voice = PersonaManager.voice_for(persona)

        response = tts_client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
        )

        audio_bytes = response.content
        return Response(audio_bytes, mimetype="audio/mpeg")

    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        return jsonify({"error": "Failed to generate audio"}), 500


# ---------------------------------------------------------
# Export endpoints
# ---------------------------------------------------------
@app.route("/export/notion", methods=["POST"])
@jwt_required
def export_to_notion():
    """Export content to Notion using user's integration token."""
    try:
        import requests as http_requests

        data = request.get_json(silent=True) or {}
        title = data.get("title", "FileGeek Export")
        content = data.get("content", "")
        notion_token = request.headers.get("X-Notion-Token", "")

        if not notion_token:
            return jsonify({"error": "Notion integration token required"}), 400
        if not content:
            return jsonify({"error": "Content is required"}), 400

        search_resp = http_requests.post(
            "https://api.notion.com/v1/search",
            headers={
                "Authorization": f"Bearer {notion_token}",
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
            },
            json={"query": "", "page_size": 1},
            timeout=10,
        )

        if search_resp.status_code != 200:
            return jsonify({"error": "Failed to connect to Notion. Check your token."}), 400

        results = search_resp.json().get("results", [])
        parent_id = results[0]["id"] if results else None

        if not parent_id:
            return jsonify({"error": "No pages found in Notion workspace. Create a page first."}), 400

        blocks = []
        for i in range(0, len(content), 2000):
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": content[i:i + 2000]}}]
                },
            })

        create_resp = http_requests.post(
            "https://api.notion.com/v1/pages",
            headers={
                "Authorization": f"Bearer {notion_token}",
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
            },
            json={
                "parent": {"page_id": parent_id},
                "properties": {"title": [{"text": {"content": title}}]},
                "children": blocks[:100],
            },
            timeout=15,
        )

        if create_resp.status_code in (200, 201):
            page_url = create_resp.json().get("url", "")
            return jsonify({"message": "Exported to Notion", "url": page_url}), 200
        else:
            return jsonify({"error": "Failed to create Notion page"}), 500

    except Exception as e:
        logger.error(f"Notion export error: {str(e)}")
        return jsonify({"error": "Export failed"}), 500


@app.route("/export/markdown", methods=["POST"])
@jwt_required
def export_markdown():
    """Export content as Markdown file download."""
    try:
        data = request.get_json(silent=True) or {}
        title = data.get("title", "FileGeek Export")
        content = data.get("content", "")

        if not content:
            return jsonify({"error": "Content is required"}), 400

        md_content = f"# {title}\n\n{content}\n"
        return Response(
            md_content,
            mimetype="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{title}.md"'},
        )

    except Exception as e:
        logger.error(f"Markdown export error: {str(e)}")
        return jsonify({"error": "Export failed"}), 500


@app.route("/export/enex", methods=["POST"])
@jwt_required
def export_enex():
    """Export content as Evernote .enex XML file."""
    try:
        data = request.get_json(silent=True) or {}
        title = data.get("title", "FileGeek Export")
        content = data.get("content", "")

        if not content:
            return jsonify({"error": "Content is required"}), 400

        from xml.sax.saxutils import escape
        now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        html_content = content.replace("\n", "<br/>")

        enex = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export4.dtd">
<en-export export-date="{now}" application="FileGeek">
  <note>
    <title>{escape(title)}</title>
    <content><![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>{escape(html_content)}</en-note>]]></content>
    <created>{now}</created>
  </note>
</en-export>"""

        return Response(
            enex,
            mimetype="application/xml",
            headers={"Content-Disposition": f'attachment; filename="{title}.enex"'},
        )

    except Exception as e:
        logger.error(f"ENEX export error: {str(e)}")
        return jsonify({"error": "Export failed"}), 500


# ---------------------------------------------------------
# Error handlers
# ---------------------------------------------------------
@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large (max 10MB)"}), 413


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500


# ---------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------
if __name__ == "__main__":
    has_gemini = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    has_openai = os.getenv("OPENAI_API_KEY")
    if not has_gemini and not has_openai:
        logger.error("Set GOOGLE_API_KEY (Gemini) or OPENAI_API_KEY to start the server")
        raise SystemExit(1)

    logger.info("Starting FileGeek backend server...")
    app.run(debug=False, host="0.0.0.0", port=5000)
