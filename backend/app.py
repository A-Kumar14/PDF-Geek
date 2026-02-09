import os
import json
import logging
from datetime import datetime

import chromadb
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

from services.ai_service import AIService
from services.pdf_service import PDFService

# ChromaDB persistence path (under backend directory)
CHROMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_data")
NUM_RETRIEVAL_CHUNKS = 5

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

    ALLOWED_EXTENSIONS = {".pdf"}
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
            return False, "Only PDF files are allowed"
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
    """Simple in-memory per-IP rate limiter."""

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

CORS(
    app,
    origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3000",
        "https://*.vercel.app",
        "https://pdf-geek.vercel.app",
    ],
)

ai_service = AIService()
pdf_service = PDFService()
rate_limiter = IPRateLimiter()

# ChromaDB client and collection for RAG
os.makedirs(CHROMA_PATH, exist_ok=True)
_chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
chroma_collection = _chroma_client.get_or_create_collection(
    name="pdf_chunks",
    metadata={"description": "PDF text chunks for RAG"},
)

UPLOAD_FOLDER = "uploads"
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------------------------------
# Middleware
# ---------------------------------------------------------
@app.before_request
def before_request():
    """Log all requests and check rate limits for /upload."""
    client_ip = request.remote_addr or "unknown"
    logger.info(f"Request from {client_ip}: {request.method} {request.path}")

    if request.path == "/upload":
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
# Routes
# ---------------------------------------------------------
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return (
        jsonify(
            {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
            }
        ),
        200,
    )


@app.route("/upload", methods=["POST"])
def upload_pdf():
    """
    Handle PDF upload with RAG pipeline:
    1. Save and validate file
    2. Extract text from PDF
    3. Chunk text into segments
    4. Generate embeddings and store in ChromaDB
    5. Retrieve relevant chunks for question
    6. Generate answer using context
    """
    try:
        # 1) Basic file presence check
        if "pdf" not in request.files:
            logger.warning("No PDF file in request")
            return jsonify({"error": "No PDF file provided"}), 400

        file = request.files["pdf"]

        # 2) Validate file
        is_valid, error_msg = InputValidator.validate_file_upload(file)
        if not is_valid:
            logger.warning(f"File validation failed: {error_msg}")
            return jsonify({"error": error_msg}), 400

        # 3) Save file safely
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, safe_filename)

        try:
            file.save(filepath)
            logger.info(f"File saved: {filepath}")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            return jsonify({"error": "Failed to save file"}), 500

        # 4) Extract metadata and text from PDF
        file_info = pdf_service.get_file_info(filepath)
        if not file_info:
            return jsonify({"error": "Failed to process file"}), 500

        extracted_text = pdf_service.extract_text(filepath)
        if not extracted_text:
            return jsonify({"error": "Failed to extract text from PDF"}), 500

        # 5) Validate question
        question = (request.form.get("question", "") or "").strip()
        is_valid, error_msg = InputValidator.validate_question(question)
        if not is_valid:
            return jsonify({"error": error_msg}), 400

        question = InputValidator.sanitize_input(question)

        # 6) Parse and validate chat history
        chat_history_str = request.form.get("chatHistory", "[]")
        try:
            chat_history = json.loads(chat_history_str)
        except json.JSONDecodeError:
            logger.warning("Invalid chat history format")
            return jsonify({"error": "Invalid chat history format"}), 400

        is_valid, error_msg = InputValidator.validate_chat_history(chat_history)
        if not is_valid:
            return jsonify({"error": error_msg}), 400

        # 7) RAG: Chunk -> Embed & Store -> Retrieve -> Augment
        document_id = safe_filename
        chunks = pdf_service.chunking_function(extracted_text)

        if chunks:
            # Embed chunks and store in ChromaDB
            chunk_embeddings = ai_service.get_embeddings(chunks)
            chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
            chroma_collection.add(
                ids=chunk_ids,
                embeddings=chunk_embeddings,
                documents=chunks,
                metadatas=[{"document_id": document_id} for _ in chunks],
            )
            logger.info(f"Stored {len(chunks)} chunks in ChromaDB for {document_id}")

        # Retrieve relevant chunks for the question
        try:
            question_embedding = ai_service.get_embeddings([question])[0]
            results = chroma_collection.query(
                query_embeddings=[question_embedding],
                n_results=min(NUM_RETRIEVAL_CHUNKS, max(1, len(chunks))),
                where={"document_id": document_id},
            )
            relevant_chunks = results["documents"][0] if results["documents"] else []
        except Exception as e:
            logger.warning(f"ChromaDB query failed: {e}, using no context")
            relevant_chunks = []

        # Remove this document's chunks from ChromaDB (avoid accumulation)
        if chunks:
            try:
                chroma_collection.delete(where={"document_id": document_id})
            except Exception as e:
                logger.warning(f"ChromaDB delete failed: {e}")

        # Augment: answer using only retrieved chunks
        logger.info(f"Answering from {len(relevant_chunks)} relevant chunks")
        ai_response = ai_service.answer_from_context(
            relevant_chunks, question, chat_history
        )

        if not ai_response:
            logger.error("AI analysis failed")
            return jsonify({"error": "Failed to generate AI response"}), 500

        # 8) Cleanup uploaded file
        try:
            os.remove(filepath)
            logger.info(f"Cleaned up file: {filepath}")
        except Exception as e:
            logger.warning(f"Failed to clean up file {filepath}: {str(e)}")

        # 9) Build response (include RAG sources for citations)
        sources = []
        for i, chunk_text in enumerate(relevant_chunks, start=1):
            excerpt = (chunk_text[:200] + "...") if len(chunk_text) > 200 else chunk_text
            sources.append({"index": i, "excerpt": excerpt.strip()})

        response_data = {
            "message": "Document processed successfully",
            "text": extracted_text,
            "answer": ai_response,
            "file_info": file_info,
            "sources": sources,
        }

        logger.info("Request processed successfully")
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Unexpected error in upload endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# ---------------------------------------------------------
# Error handlers
# ---------------------------------------------------------
@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({"error": "File too large (max 10MB)"}), 413


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500


# ---------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------
if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY environment variable is required")
        raise SystemExit(1)

    logger.info("Starting PDFGeek backend server...")
    app.run(debug=False, host="0.0.0.0", port=5000)
