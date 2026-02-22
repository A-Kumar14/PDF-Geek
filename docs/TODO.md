# FileGeek — Product TODO

> Priority tiers: **P0** = must-have / blocking · **P1** = high-value · **P2** = future  
> Items marked 🧠 are engineer-added suggestions beyond the original docs.  
> ✅ = implemented

---

## 🔴 P0 — Stability & Core Fixes

- [ ] Resolve Redis connection warnings on startup (seen in deployment logs)
- [ ] Ensure ChromaDB collection is fully cleaned up on session deletion (prevent stale vectors)
- [ ] Formalize DB schema management with **Alembic** migrations (covers `QuizResult`, `FlashcardProgress`, future models)
- ✅ 🧠 `/health` now pings ChromaDB + Redis, returns `"ok"` or `"unavailable"` per service
- ✅ 🧠 `/workers/status` reports live Celery worker count and names
- ✅ 🧠 **Input sanitization for file names** — strip non-ASCII chars before `document_id` generation
- ✅ **Auth speed fix** — bcrypt rounds reduced from 12→10 (~4x faster on Vercel cold starts, still above OWASP minimums)

---

## 🟠 P1 — Knowledge & Retrieval

- [ ] **Smart Citation Engine** — extract DOI, Author, Date metadata from PDF text selections; generate APA / MLA / BibTeX citations on demand
- [ ] **Concept Mapping** — generate Mermaid or D3.js relationship diagrams showing how entities across documents connect
- ✅ **Multi-Document RAG** — `query_all_sessions()` enables cross-session user-scoped semantic search
- ✅ 🧠 **Cross-session search** — backend method to search all a user's documents regardless of session
- [ ] 🧠 **Chunk size tuning UI** — expose a settings toggle for small/medium/large chunk sizes

---

## 🟠 P1 — Learning Systems

- ✅ **Active Review Queue** — `/review` page with 3D flip cards for all SM-2 due flashcards
- ✅ **Analytics Dashboard** — quiz score trends, flashcard mastery bar, cards-due CTA
- ✅ **Socratic Mode Persona** — AI responds only with guiding questions, never direct answers
- ✅ **Flashcard rendering fix** — backend now extracts generated card JSON from AI answer text and injects it into `artifact.content` before streaming (was silently missing `content` field, causing blank artifact panel)
- [ ] **Cornell Note-Taking Panel** — auto-populate "Cues" and "Summary" sections from user highlights
- [ ] 🧠 **Difficulty auto-adjustment** — bump defaults based on user's historical quiz accuracy
- [ ] 🧠 **Session summary card** — "what you learned" digest after closing a session

---

## 🟡 P1 — Performance & Frontend

- [ ] **PDF Virtualization** — `react-window` virtual scrolling for 200+ page docs
- [ ] Keep frontend bundle **below 500KB** (currently ~405KB — enforce with CI check)
- [ ] **Redis ETag caching** for `/sessions` and `/personas` endpoints
- [ ] **PDF pre-fetching** — prefetch adjacent pages near current page range
- [ ] 🧠 **Streaming flashcard generation** — stream each card as generated instead of waiting for full array
- [ ] 🧠 **Optimistic UI for indexing** — skeleton placeholder while AI generates flashcards

---

## 🟡 P1 — Security & Infrastructure

- [ ] **User-tier rate limiting** — per-user-tier limits (Free vs. Pro) keyed on JWT `user_id`
- [ ] **Offline support via Service Workers**
- [ ] 🧠 **Webhook / email on indexing failure** — notify user if Celery task fails

---

## 🟢 P2 — Collaboration & Export

- [ ] **Shared Study Rooms** — real-time WebSocket collaborative sessions
- ✅ **Anki export** — `[ANKI CSV]` button on flashcard artifacts (front,back compatible)
- ✅ **Obsidian export** — `[OBSIDIAN MD]` button with `[[WikiLink]]` syntax
- [ ] **Google Drive / Notion bi-directional sync**
- [ ] 🧠 **PDF annotation export** — export highlights + notes as annotated PDF

---

## 🟢 P2 — UX & Accessibility

- [ ] **WCAG 2.1 AA compliance** for 3D flashcard flip (keyboard nav, focus rings, screen-reader labels)
- [ ] **Pulse animation** for AI "thinking" state
- [ ] **High-contrast indexing completion indicator**
- [ ] 🧠 **Dark / light theme toggle** — persist in user profile, not just `localStorage`
- [ ] 🧠 **Mobile-responsive layout** — Command Palette and Artifact Panel bottom-sheet for mobile
- ✅ 🧠 **Keyboard shortcut reference** — `?` key opens shortcut cheat-sheet modal

---

## 📈 Success Metrics to Instrument

- [ ] Track **DAU flashcard review sessions** (retention metric)
- [ ] Lighthouse CI score gate: **> 85** on every PR
- [ ] Track **agentic tool calls per session**
- [ ] 🧠 Track **RAG chunk hit rate** (% of tool calls that retrieved ≥ 1 chunk)
