# FileGeek — Product TODO

> Priority tiers: **P0** = must-have / blocking · **P1** = high-value · **P2** = future  
> Items marked 🧠 are engineer-added suggestions beyond the original docs.

---

## 🔴 P0 — Stability & Core Fixes

- [ ] Resolve Redis connection warnings on startup (seen in deployment logs)
- [ ] Ensure ChromaDB collection is fully cleaned up on session deletion (prevent stale vectors)
- [ ] Formalize DB schema management with **Alembic** migrations (covers `QuizResult`, `FlashcardProgress`, future models)
- [ ] 🧠 Add a health-check for ChromaDB connectivity on `/health` endpoint so deploy platforms can detect vector DB issues early
- [ ] 🧠 Add a Celery worker health endpoint (`/workers/status`) so the UI can warn users when async indexing is unavailable

---

## 🟠 P1 — Knowledge & Retrieval

- [ ] **Multi-Document RAG** — query across *all* documents in a session simultaneously instead of the current single-document scope
- [ ] **Smart Citation Engine** — extract DOI, Author, Date metadata from PDF text selections; generate APA / MLA / BibTeX citations on demand
- [ ] **Concept Mapping** — generate Mermaid or D3.js relationship diagrams showing how entities across documents connect
- [ ] 🧠 **Cross-session search** — let users search across all their past sessions ("find where I read about X")
- [ ] 🧠 **Chunk size tuning UI** — expose a settings toggle for small/medium/large chunk sizes so power users can tune retrieval quality

---

## 🟠 P1 — Learning Systems

- [ ] **Active Review Queue** — dedicated dashboard listing all flashcards whose `next_review_date ≤ today` (SM-2 driven)
- [ ] Connect `QuizResult` model to a **frontend Analytics Dashboard** — show score trends, topic weak spots, and time-on-task
- [ ] **Socratic Mode Persona** — AI persona that guides users via questions rather than direct answers
- [ ] **Cornell Note-Taking Panel** — auto-populate "Cues" and "Summary" sections from user highlights
- [ ] 🧠 **Difficulty auto-adjustment** — bump `num_cards` / `num_questions` defaults based on user's historical quiz accuracy
- [ ] 🧠 **Session summary card** — after closing a session, show a "what you learned" digest (key concepts, cards mastered, quiz score)

---

## 🟡 P1 — Performance & Frontend

- [ ] **PDF Virtualization** — implement `react-window` virtual scrolling in the PDF viewer for 200+ page docs
- [ ] Keep frontend bundle **below 500KB** (currently ~405KB — enforce with a CI bundle-size check)
- [ ] **Redis ETag caching** for `/sessions` and `/personas` endpoints to cut API latency
- [ ] **PDF pre-fetching** — prefetch adjacent pages when user is near the edge of current page range
- [ ] 🧠 **Streaming flashcard generation** — stream each flashcard as it's generated instead of waiting for the full JSON array (faster perceived performance)
- [ ] 🧠 **Optimistic UI for indexing** — show a skeleton/placeholder in the artifact panel immediately after the user asks for flashcards, before the AI responds

---

## 🟡 P1 — Security & Infrastructure

- [ ] **User-tier rate limiting** — move from global limits to per-user-tier limits (Free vs. Pro) keyed on JWT `user_id`
- [ ] **Offline support via Service Workers** — allow users to read previously indexed docs and view past chats without internet
- [ ] 🧠 **Input sanitization for file names** — strip non-ASCII chars from uploaded file names before they hit `document_id` generation to prevent ChromaDB key collisions
- [ ] 🧠 **Webhook / email on indexing failure** — notify user if Celery task fails instead of silently showing 0% forever

---

## 🟢 P2 — Collaboration & Export

- [ ] **Shared Study Rooms** — real-time WebSocket collaborative sessions where multiple users annotate/chat on the same document
- [ ] **Anki export** — one-click `.apkg` export of generated flashcard decks
- [ ] **Obsidian export** — export session notes to Markdown with `[[WikiLink]]` syntax support
- [ ] **Google Drive / Notion bi-directional sync** — import docs from Drive, push notes back to Notion
- [ ] 🧠 **PDF annotation export** — export highlights + sticky notes as a standalone annotated PDF

---

## 🟢 P2 — UX & Accessibility

- [ ] **WCAG 2.1 AA compliance** for the 3D flashcard flip component (keyboard nav, focus rings, screen-reader labels)
- [ ] **Pulse animation** for AI "thinking" state (distinguish from the static loading spinner)
- [ ] **High-contrast success indicator** for document indexing completion (more prominent than current progress bar)
- [ ] 🧠 **Dark / light theme toggle** — persist preference in user profile, not just `localStorage`
- [ ] 🧠 **Mobile-responsive layout** — Command Palette and Artifact Panel are desktop-only today; add a bottom-sheet variant for mobile
- [ ] 🧠 **Keyboard shortcut reference** — `?` key opens a shortcut cheat-sheet modal

---

## 📈 Success Metrics to Instrument

- [ ] Track **DAU flashcard review sessions** (retention metric)
- [ ] Lighthouse CI score gate: **> 85** on every PR
- [ ] Track **agentic tool calls per session** (quizzes + diagrams + flashcards generated)
- [ ] 🧠 Track **RAG chunk hit rate** (% of tool calls that retrieved ≥ 1 chunk) to catch retrieval regressions early
