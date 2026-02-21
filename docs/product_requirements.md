# Product Requirements Document: FileGeek
**Status:** Draft | **Version:** 2.0 | **Date:** February 21, 2026

---

## 1. Executive Summary

FileGeek is a multimodal AI document workspace designed to transform static information (PDFs, images, audio, DOCX) into interactive, long-term knowledge. By combining Retrieval-Augmented Generation (RAG), agentic tool-calling, and spaced-repetition learning, FileGeek serves as an "external brain" for students and professionals.

## 2. Target Audience

- **University Students:** Needing to synthesize large volumes of academic papers and prep for exams.
- **Researchers:** Managing vast libraries of documentation with a need for cross-document synthesis.
- **Lifelong Learners:** Users looking for a structured way to retain information from diverse media (audio lectures + slide decks).

## 3. Current State Analysis (MVP)

Based on recent implementation logs, the system currently supports:

- **Multimodal Input:** OCR for images and Whisper for audio transcription.
- **Interactive Study Tools:** 3D animated flashcards with SM-2 algorithm and interactive quizzes.
- **Advanced UX:** Keyboard-first navigation via a Command Palette (⌘K) and a bento-grid layout.
- **Architecture:** Dual-provider AI (Gemini/OpenAI) with session-scoped vector storage in ChromaDB.

---

## 4. Functional Requirements

### 4.1 Knowledge Management & Synthesis (P0)

- **Multi-Document RAG:** The ability to query across all documents in a session simultaneously, rather than one-by-one.
- **Smart Citation Engine:** Automatically extract metadata (DOI, Author, Date) to generate APA/MLA/BibTeX citations directly from PDF text selections.
- **Concept Mapping:** Generate visual relationship diagrams (D3.js or Mermaid) showing how entities in different documents connect.

### 4.2 Advanced Learning Systems (P1)

- **Active Review Queue:** A dedicated dashboard showing flashcards due for review based on the SM-2 `next_review_date`.
- **Socratic Mode Persona:** A specialized AI persona that refuses to give direct answers, instead guiding the user through the document via inquiry.
- **Cornell Note-Taking Integration:** A structured note panel that auto-populates "Cues" and "Summaries" based on user highlights.

### 4.3 Collaboration & Portability (P2)

- **Shared Study Rooms:** Real-time WebSocket-based collaboration where multiple users can annotate the same document and chat in a shared session.
- **Anki/Obsidian Export:** One-click export of flashcards to `.apkg` format and notes to Markdown with WikiLink support.

---

## 5. Technical Requirements

### 5.1 Performance Goals

- **Bundle Size Optimization:** Maintain frontend bundle below 500KB (currently ~405KB).
- **PDF Virtualization:** Implement `react-window` for the PDF viewer to ensure smooth scrolling for documents exceeding 200 pages.
- **Caching:** Implement Redis-based ETag caching for `/sessions` and `/personas` to reduce API latency.

### 5.2 Security & Infrastructure

- **Rate Limiting:** Transition from global limits to user-tier-based limiting (Free vs. Pro) using JWT identifiers.
- **Database Migrations:** Formalize schema management using Alembic/Flask-Migrate to handle new models like `QuizResult` and `FlashcardProgress`.
- **Offline Support:** Utilize Service Workers to allow users to read indexed documents and view past chats without an active internet connection.

---

## 6. User Experience (UX) Design

- **Command Palette Supremacy:** Since the sidebar was removed in Phase 7, the Palette must remain the "Single Source of Truth."
- **Visual Feedback:** High-contrast "Success" indicators for document indexing and "Pulse" animations for AI "thinking" states.
- **Accessibility:** Ensure WCAG 2.1 AA compliance, specifically focusing on keyboard navigation for the 3D flashcard components.

---

## 7. Roadmap & Implementation Plan

### Phase 1: Stability & Scale (Immediate)
- **Bug Fixes:** Resolve Redis connection warnings and ensure ChromaDB collection cleanup on session deletion.
- **Performance:** Implement PDF pre-fetching for adjacent pages.

### Phase 2: The "Deep Study" Update (1–2 Months)
- Implement the Review Queue for flashcards.
- Connect the `QuizResult` model to a frontend Analytics Dashboard to track student progress over time.

### Phase 3: The "Social Research" Update (3–4 Months)
- Launch Collaborative Sessions via WebSockets.
- Integrate Google Drive/Notion bi-directional sync.

---

## 8. Success Metrics

- **Retention:** Number of users returning for flashcard review sessions.
- **Performance:** Lighthouse score > 85 for the main workspace.
- **Engagement:** Average number of "Agentic Tools" (quizzes, diagrams) generated per session.
