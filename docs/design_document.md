# FileGeek Design Document
**Version:** 2.0  
**Date:** February 21, 2026  
**Status:** Architecture Specification

---

## 1. System Overview

FileGeek is a multimodal AI document intelligence platform designed to transform static files into interactive, high-retention knowledge bases. It utilizes a Retrieval-Augmented Generation (RAG) architecture coupled with an agentic tool-calling loop to provide contextual answers, generate study artifacts, and manage long-term user memory.

## 2. Architecture Goals

- **Multimodality:** Support for PDF, DOCX, TXT, images (OCR), and audio (Whisper).
- **Performance:** UI rendering optimized for large documents and rapid chat interaction.
- **Persistence:** Session-based storage for chat history, indexed vectors, and study progress.
- **Extensibility:** Dual AI provider support (Gemini and OpenAI) with a Model Context Protocol (MCP) server for external client integration.

## 3. System Architecture

### 3.1 Backend (Flask/FastAPI)

The backend acts as the orchestration layer for AI services and file processing.

- **AI Service:** Manages dual-provider logic (Gemini/OpenAI) and handles the agentic tool-calling loop.
- **RAG Service:** Manages document indexing and retrieval using ChromaDB for session-scoped vector storage.
- **File Service:** Handles text extraction from various formats using pdfplumber, pytesseract (OCR), and OpenAI Whisper (audio).
- **Async Processing:** Uses Celery and Redis to handle long-running document indexing tasks without blocking the main thread.

### 3.2 Frontend (React 19)

A modern SPA built for high interactivity and performance.

- **State Management:** Utilizes React Context API across multiple domains (Chat, File, Persona, Annotation, Theme).
- **Command Palette (⌘K):** Serves as the primary navigation and action hub, replacing traditional sidebars for a keyboard-first experience.
- **Artifact System:** A dedicated panel for rendering structured AI outputs like interactive quizzes, 3D flip-animation flashcards, and Mermaid diagrams.
- **PDF Viewer:** Built with react-pdf, supporting text selection, highlights, and sticky notes.

### 3.3 Data Layer

- **SQLAlchemy (SQLite):** Stores relational data including Users, StudySessions, ChatMessages, and SessionDocuments.
- **ChromaDB:** A vector database for storing document embeddings to power semantic search.
- **Redis:** Used for task queuing (Celery) and rate limiting.

---

## 4. Key Design Patterns

### 4.1 Agentic Tool-Calling Loop

The AI does not just respond with text; it can autonomously decide to call specific tools to fulfill user needs:

- `search_documents` — Queries the RAG system for context.
- `generate_quiz` — Creates interactive multiple-choice assessments.
- `generate_flashcards` — Produces cards for spaced-repetition study.

### 4.2 Spaced Repetition (SM-2 Algorithm)

For flashcards, the system implements the SM-2 algorithm to calculate optimal review intervals based on user feedback ("Review" vs. "Know It"). This progress is persisted in the `FlashcardProgress` database model.

### 4.3 Performance Optimizations

- **Memoization:** Critical components like `LazyThumbnail` and `HighlightLayer` are wrapped in `React.memo` to reduce re-renders during zoom or scroll by up to 60%.
- **Code-Splitting:** Lazy-loading large components (e.g., `MarkdownRenderer`) reduced the initial bundle size by ~150KB.
- **Debounced I/O:** LocalStorage writes are debounced (500ms) to prevent UI lag during rapid state updates.

---

## 5. Security and Integration

- **Authentication:** JWT-based signup and login system.
- **Rate Limiting:** Implemented via slowapi to prevent API abuse.
- **MCP Integration:** Provides a Model Context Protocol server, allowing Claude Desktop and other MCP clients to interact with the FileGeek toolset.

## 6. Deployment

- **Frontend:** Deployed on Vercel with auto-builds.
- **Backend:** Deployed on Render using Docker for containerization.
- **File Storage:** Supports local storage or S3-compatible services via a pre-signed URL flow.
