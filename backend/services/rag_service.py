import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Optional

import chromadb
from config import Config

logger = logging.getLogger(__name__)


class RAGService:
    """Manages ChromaDB indexing and retrieval with session-scoped persistence."""

    def __init__(self, ai_service, file_service):
        self.ai_service = ai_service
        self.file_service = file_service

        os.makedirs(Config.CHROMA_PATH, exist_ok=True)
        self._client = chromadb.PersistentClient(path=Config.CHROMA_PATH)
        self.collection = self._client.get_or_create_collection(
            name="document_chunks",
            metadata={"description": "Document text chunks for RAG"},
        )

    def index_document(self, filepath: str, document_id: str, session_id: str, user_id: int) -> Dict:
        """Extract, chunk, embed, and store a local file. Returns indexing stats."""
        page_texts = self.file_service.extract_text_universal(filepath)
        if not page_texts:
            return {"chunk_count": 0, "page_count": 0, "text": ""}

        extracted_text = "\n\n".join(p["text"] for p in page_texts)
        chunks_with_pages = self.file_service.chunking_function_with_pages(page_texts)
        chunk_texts = [c["text"] for c in chunks_with_pages]

        if chunk_texts:
            chunk_embeddings = self.ai_service.get_embeddings(chunk_texts)
            chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunk_texts))]
            chunk_metas = [
                {
                    "document_id": document_id,
                    "session_id": session_id,
                    "user_id": str(user_id),
                    "pages": json.dumps(c["pages"]),
                }
                for c in chunks_with_pages
            ]
            self.collection.add(
                ids=chunk_ids,
                embeddings=chunk_embeddings,
                documents=chunk_texts,
                metadatas=chunk_metas,
            )
            logger.info(f"Indexed {len(chunk_texts)} chunks for doc={document_id} session={session_id}")

        return {
            "chunk_count": len(chunk_texts),
            "page_count": len(page_texts),
            "text": extracted_text,
        }

    def index_from_url(self, url: str, name: str, document_id: str, session_id: str, user_id: int) -> Dict:
        """Download a file from CDN and index it."""
        import requests as http_requests
        from werkzeug.utils import secure_filename

        filename = secure_filename(name) or "file"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        safe_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, safe_filename)

        try:
            dl_resp = http_requests.get(url, timeout=30, stream=True)
            dl_resp.raise_for_status()
            with open(filepath, "wb") as fout:
                for chunk in dl_resp.iter_content(chunk_size=8192):
                    fout.write(chunk)
        except Exception as e:
            logger.error(f"Failed to download {url}: {e}")
            raise

        try:
            result = self.index_document(filepath, document_id, session_id, user_id)
            result["filepath"] = filepath
            result["file_type"] = self.file_service.detect_file_type(filepath)
            file_info = self.file_service.get_file_info(filepath)
            result["file_info"] = file_info
            return result
        finally:
            try:
                os.remove(filepath)
            except Exception:
                pass

    def query(self, question: str, session_id: str, user_id: int, n_results: int = 5) -> Dict:
        """Session-scoped retrieval. Returns chunks, metas, and image paths."""
        try:
            question_embedding = self.ai_service.get_embeddings([question])[0]

            where_filter = {
                "$and": [
                    {"session_id": session_id},
                    {"user_id": str(user_id)},
                ]
            }

            # Count docs for this session
            try:
                existing = self.collection.get(where=where_filter, limit=1)
                total = len(existing["ids"]) if existing["ids"] else 0
            except Exception:
                total = n_results

            if total == 0:
                return {"chunks": [], "metas": []}

            results = self.collection.query(
                query_embeddings=[question_embedding],
                n_results=min(n_results, max(1, total)),
                where=where_filter,
            )

            chunks = results["documents"][0] if results["documents"] else []
            metas = results["metadatas"][0] if results["metadatas"] else []

            return {"chunks": chunks, "metas": metas}

        except Exception as e:
            logger.warning(f"RAG query failed: {e}")
            return {"chunks": [], "metas": []}

    def delete_session_documents(self, session_id: str):
        """Delete all ChromaDB entries for a session."""
        try:
            self.collection.delete(where={"session_id": session_id})
            logger.info(f"Deleted ChromaDB docs for session={session_id}")
        except Exception as e:
            logger.warning(f"ChromaDB session delete failed: {e}")

    def build_sources(self, chunks: List[str], metas: List[dict]) -> List[dict]:
        """Build source citation list from RAG results."""
        sources = []
        for i, (chunk_text, meta) in enumerate(zip(chunks, metas), start=1):
            excerpt = (chunk_text[:200] + "...") if len(chunk_text) > 200 else chunk_text
            pages = json.loads(meta.get("pages", "[]")) if meta else []
            sources.append({"index": i, "excerpt": excerpt.strip(), "pages": pages})
        return sources


class MemoryService:
    """Long-term user memory stored in a separate ChromaDB collection."""

    def __init__(self, ai_service):
        self.ai_service = ai_service
        os.makedirs(Config.CHROMA_PATH, exist_ok=True)
        self._client = chromadb.PersistentClient(path=Config.CHROMA_PATH)
        self.collection = self._client.get_or_create_collection(
            name="user_memory",
            metadata={"description": "Long-term user interaction memory"},
        )

    def store_interaction(self, user_id: int, question: str, answer: str, feedback: Optional[str] = None):
        """Store a Q&A interaction summary for future recall."""
        summary = f"Q: {question[:200]}\nA: {answer[:300]}"
        if feedback:
            summary += f"\nFeedback: {feedback}"

        try:
            embedding = self.ai_service.get_embeddings([summary])[0]
            mem_id = f"mem_{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
            self.collection.add(
                ids=[mem_id],
                embeddings=[embedding],
                documents=[summary],
                metadatas=[{
                    "user_id": str(user_id),
                    "feedback": feedback or "",
                    "timestamp": datetime.utcnow().isoformat(),
                }],
            )
        except Exception as e:
            logger.warning(f"Failed to store memory: {e}")

    def retrieve_relevant_memory(self, user_id: int, question: str, n: int = 3) -> List[str]:
        """Retrieve past interactions relevant to the current question."""
        try:
            embedding = self.ai_service.get_embeddings([question])[0]
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=n,
                where={"user_id": str(user_id)},
            )
            return results["documents"][0] if results["documents"] else []
        except Exception as e:
            logger.warning(f"Memory retrieval failed: {e}")
            return []

    def get_user_preferences(self, user_id: int) -> str:
        """Aggregate feedback patterns into a preference string."""
        try:
            positive = self.collection.get(
                where={"$and": [{"user_id": str(user_id)}, {"feedback": "up"}]},
                limit=20,
            )
            negative = self.collection.get(
                where={"$and": [{"user_id": str(user_id)}, {"feedback": "down"}]},
                limit=20,
            )

            pos_count = len(positive["ids"]) if positive["ids"] else 0
            neg_count = len(negative["ids"]) if negative["ids"] else 0

            if pos_count == 0 and neg_count == 0:
                return ""

            prefs = []
            if pos_count > 0:
                pos_docs = positive["documents"][:5] if positive["documents"] else []
                prefs.append(f"User liked responses like: {'; '.join(d[:80] for d in pos_docs)}")
            if neg_count > 0:
                neg_docs = negative["documents"][:5] if negative["documents"] else []
                prefs.append(f"User disliked responses like: {'; '.join(d[:80] for d in neg_docs)}")

            return " | ".join(prefs)
        except Exception as e:
            logger.warning(f"Preference aggregation failed: {e}")
            return ""
