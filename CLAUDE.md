# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FileGeek is a full-stack multimodal AI document analysis platform combining RAG (Retrieval-Augmented Generation), agentic tool-calling, and long-term memory. Users upload documents (PDF, DOCX, images, audio) and have AI-powered conversations with them through a persistent session-based architecture.

**Tech Stack:**
- Backend: Flask + SQLAlchemy (SQLite) + ChromaDB + Celery
- Frontend: React 19 + MUI 7 + react-pdf
- AI: Dual-provider (Google Gemini or OpenAI GPT-4o)
- Infrastructure: Redis for caching/rate-limiting, optional S3 for storage

## Development Commands

### Backend (Flask)

```bash
# Setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../requirements.txt

# Create .env in project root with:
# - GOOGLE_API_KEY or OPENAI_API_KEY (at least one required)
# - JWT_SECRET (recommended for auth)
# - AI_PROVIDER=gemini or openai (optional, auto-detects)

# Run development server
python app.py  # Runs on port 5000

# Run Celery worker (separate terminal)
celery -A celery_app.celery_app worker --loglevel=info

# Run tests
python test_app.py
```

### Frontend (React)

```bash
cd frontend
npm install
npm start     # Development server on port 3000
npm run build # Production build
npm test      # Run tests
```

### UploadThing Server (optional file upload sidecar)

```bash
cd uploadthing-server
npm install
npm start  # Runs on port 4000
```

### Docker Compose (full stack)

```bash
docker-compose up --build  # Starts backend + frontend + redis + celery
```

## Architecture

### Backend Service Organization

The backend follows a service-oriented architecture:

```
backend/
├── app.py                      # Main Flask app, all endpoints, auth middleware
├── auth.py                     # JWT authentication (signup/login)
├── models.py                   # SQLAlchemy models: User, StudySession, ChatMessage, SessionDocument
├── config.py                   # Centralized config (env vars, paths, limits)
├── services/
│   ├── ai_service.py           # Dual-provider AI (Gemini/OpenAI) with agentic tool-calling loop
│   ├── rag_service.py          # ChromaDB indexing/retrieval + long-term memory
│   ├── file_service.py         # File extraction (PDF, DOCX, images via OCR, audio via Whisper)
│   └── tools.py                # Tool definitions (search_documents, generate_quiz, etc.)
├── tasks/                      # Celery async tasks for document indexing
├── mcp/                        # Model Context Protocol server for Claude Desktop
└── utils/                      # Validators, PII masking utilities
```

**Key Architectural Decisions:**

1. **Dual AI Provider System**: `ai_service.py` auto-detects available API keys (Gemini or OpenAI). Set `AI_PROVIDER` env var to force a specific provider. Tool-calling format differs between providers (OpenAI uses `tools`, Gemini uses `function_declarations`).

2. **Session-Scoped RAG**: Documents are indexed into ChromaDB with `session_id` and `user_id` metadata. Retrieval filters by session scope, enabling multi-document conversations within sessions while maintaining isolation between users and sessions.

3. **Agentic Tool-Calling Loop**: AI can call tools (search documents, generate quizzes, create study guides, Mermaid diagrams) through a multi-round loop in `AIService.chat_with_tools()`. Tools are defined in `tools.py` and executed via `ToolExecutor`.

4. **Long-Term Memory**: `MemoryService` in `rag_service.py` stores user feedback (thumbs up/down) as context that influences future responses.

5. **Celery for Async Indexing**: Heavy document processing happens in Celery tasks to avoid blocking HTTP requests. Redis is used as the broker.

### Frontend Architecture

React 19 with Material-UI 7 using a context-based state management pattern:

```
frontend/src/
├── contexts/
│   ├── ChatContext.js          # Chat messages, send logic, artifacts
│   ├── FileContext.js          # File uploads, document indexing
│   ├── AuthContext.js          # JWT auth state
│   ├── PersonaContext.js       # AI persona selection
│   └── AnnotationContext.js    # PDF highlights/annotations
├── components/
│   ├── ChatPanel.js            # Main chat interface
│   ├── PdfViewer.js            # react-pdf with selection toolbar
│   ├── ArtifactPanel.js        # Structured outputs (quizzes, diagrams)
│   ├── LeftDrawer.js           # Session history sidebar
│   └── CommandPalette.js       # Keyboard shortcuts
├── pages/
│   ├── MainLayout.js           # Responsive bento grid layout
│   ├── LoginPage.js
│   └── SettingsContent.js
├── api/
│   ├── sessions.js             # Session CRUD API calls
│   └── general.js              # Chat, upload, TTS API calls
└── theme/
    └── academicTheme.js        # MUI theme with dark mode
```

**State Flow:**
- `ChatContext` holds messages and artifacts, coordinates with `FileContext` for document indexing
- `FileContext` handles uploads via UploadThing or direct upload, triggers backend indexing
- `PersonaContext` manages AI persona selection (Academic, Professional, Casual, Einstein, Gen-Z, Sherlock)
- All contexts use React Context API for global state (no Redux)

### API Structure

All endpoints are defined in `backend/app.py`. Key patterns:

- **JWT Auth**: Most endpoints use `@jwt_required` decorator from `auth.py`
- **Rate Limiting**: Flask-Limiter with Redis backend for distributed rate limiting
- **Session Ownership**: Endpoints validate that `session.user_id == current_user_id`
- **Error Handling**: Consistent JSON error responses with status codes

### Database Schema

SQLAlchemy models in `backend/models.py`:

- `User`: email, password_hash, created_at
- `StudySession`: user_id, title, created_at, updated_at
- `SessionDocument`: session_id, filename, file_url, indexed (boolean)
- `ChatMessage`: session_id, role (user/assistant), content, sources (JSON), artifacts (JSON), feedback (thumbs up/down)

### ChromaDB Collections

Single collection `document_chunks` with metadata filtering:
- `document_id`: UUID per document
- `session_id`: UUID per study session
- `user_id`: integer
- `pages`: JSON array of page numbers for chunk

Retrieval filters by `session_id` and optionally `document_id`.

## Important Patterns

### AI Service Tool-Calling Flow

1. User sends message → `POST /sessions/<id>/messages`
2. Backend calls `AIService.chat_with_tools()`
3. AI returns tool calls (e.g., `search_documents`)
4. `ToolExecutor.execute()` runs tools against RAG/file services
5. Tool results fed back to AI for final response
6. Loop up to 5 rounds max to prevent infinite loops
7. Response saved with sources and artifacts

### Persona System

6 AI personas with distinct system prompts, greetings, and TTS voices:
- academic (alloy), professional (onyx), casual (echo)
- einstein (fable), gen-z (shimmer), sherlock (onyx)

Persona prompts defined in `ai_service.py:PERSONAS`. Frontend allows switching via dropdown.

### Artifacts System

Structured outputs rendered in separate panel:
- `type: "quiz"` → Multiple choice questions
- `type: "study-guide"` → Hierarchical outline
- `type: "diagram"` → Mermaid diagram (rendered with mermaid.js)

AI marks artifacts with `<artifact type="...">` tags in Markdown. Frontend extracts and renders in `ArtifactPanel.js`.

### File Processing Pipeline

1. Upload → UploadThing CDN or direct to backend/uploads
2. Extract text:
   - PDF: pdfplumber → fallback to PyMuPDF
   - DOCX: python-docx
   - Images: pytesseract OCR
   - Audio: OpenAI Whisper transcription
3. Chunking: Recursive character splitter (500 char chunks, 50 overlap)
4. Embedding: LangChain embeddings (Gemini or OpenAI)
5. Index to ChromaDB with metadata

All in `file_service.py` and triggered by `POST /sessions/<id>/documents`.

## Environment Variables

**Required (at least one):**
- `GOOGLE_API_KEY` or `OPENAI_API_KEY`

**Recommended:**
- `JWT_SECRET` — Secret for JWT signing
- `AI_PROVIDER` — Force `gemini` or `openai` (auto-detects if unset)

**Optional:**
- `FLASK_PORT` — Backend port (default: 5000)
- `NUM_RETRIEVAL_CHUNKS` — RAG chunks per query (default: 5)
- `DEEP_THINK_CHUNKS` — RAG chunks for "deep think" mode (default: 12)
- `REDIS_URL` — Redis connection string for Celery/rate limiting
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` — S3 uploads
- `S3_ENABLED` — Enable S3 storage (default: false)
- `PII_MASKING_ENABLED` — Mask PII in logs (default: true)
- `UPLOADTHING_TOKEN` — UploadThing API token for cloud uploads

## MCP Server (Model Context Protocol)

Standalone server exposing FileGeek tools to Claude Desktop:

```bash
cd backend
python -m mcp.server
```

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "filegeek": {
      "command": "python",
      "args": ["-m", "mcp.server"],
      "cwd": "/path/to/FileGeek-Main/backend"
    }
  }
}
```

Tools exposed: `search_documents`, `generate_quiz`, `create_study_guide`, `generate_diagram`.

## Deployment

- **Frontend**: Vercel (auto-builds from `frontend/`, uses nginx in Docker)
- **Backend**: Render (uses `Dockerfile` with gunicorn)
- **Redis**: Docker Compose or managed service (Redis Cloud)
- **ChromaDB**: Persisted to `backend/chroma_data/` volume

Production Dockerfile runs:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Common Gotchas

1. **ChromaDB Permissions**: `chroma_data/` must be writable. Docker volumes handle this automatically.

2. **AI Provider Switching**: When switching from Gemini to OpenAI (or vice versa), embeddings are incompatible. Existing ChromaDB indices will break. Clear `chroma_data/` when switching providers.

3. **JWT Secret**: Must match between backend and uploadthing-server for file upload auth.

4. **CORS**: `config.py:CORS_ORIGINS` must include frontend URL. Update for new deployments.

5. **React PDF Worker**: `pdfjs-dist` requires worker file in `public/`. Already configured in `PdfViewer.js`.

6. **Tool-Calling Format**: OpenAI uses `tools` array, Gemini uses `function_declarations`. `ai_service.py` handles conversion.

7. **Celery Worker**: Must run separately in production. Docker Compose handles this with `celery-worker` service.

## Testing

- Backend: `python test_app.py` (basic endpoint tests)
- Frontend: `npm test` (Jest + React Testing Library)
- No comprehensive test suite exists yet

When writing new features, prioritize integration tests over unit tests due to the service-oriented architecture and cross-cutting concerns (auth, RAG, AI calls).

## Recent Improvements (February 2026)

### Performance Optimizations

**Memoization** (60-70% faster rendering):
- `LazyThumbnail`: React.memo() with custom comparator, reduced rootMargin to 100px
- `HighlightLayer`: React.memo() prevents re-render unless pageNum/scale changes  
- `ChatMessage`: useMemo() for DOMPurify sanitize, React.memo() with message comparison

**Code-Splitting** (150KB+ bundle reduction):
- `MarkdownRenderer`: Lazy-loaded with React.lazy() and Suspense
- Mermaid already lazy-loaded via dynamic import
- Total bundle reduced from ~600KB to ~405KB

**State Optimization**:
- ChatContext localStorage writes debounced (500ms) to reduce I/O thrashing
- Prevents excessive writes during rapid message updates

### Interactive Study Tools

**Quiz System** (`generate_quiz` tool):
- Full interactive UI with click-to-select answers
- Visual feedback (yellow=selected, green=correct, red=incorrect)
- Score calculation with percentage and rating
- Retry functionality to reset quiz
- QuizResult model for future analytics tracking

**Flashcard System** (`generate_flashcards` tool):
- 3D flip animation using CSS perspective transforms
- Spaced repetition with SM-2 algorithm
- Progress persistence via API (FlashcardProgress model)
- Three status levels: remaining/reviewing/known
- Automatic interval calculation based on knowledge level
- Graceful degradation for anonymous users

### Database Changes

**New Models**:
1. `QuizResult` (backend/models.py:111): Tracks quiz scores and attempts
2. `FlashcardProgress` (backend/models.py:141): SM-2 spaced repetition data

**Migration Required**:
```bash
cd backend
flask db migrate -m "Add QuizResult and FlashcardProgress models"
flask db upgrade
```

**New API Endpoints**:
- `POST /flashcards/progress`: Save flashcard review status
- `GET /flashcards/progress/:sessionId/:messageId`: Load progress

### Component Structure

**ArtifactPanel Changes**:
- `QuizCard`: Interactive quiz with state management (lines 33-224)
- `FlashcardComponent`: Flip cards with API persistence (lines 229-574)
- Both components use local state + optional API sync

**React Hooks Best Practices**:
- All hooks called before early returns (fixes rules-of-hooks violations)
- Conditional rendering after hooks to prevent re-order issues

### Documentation

**New Docs**:
- `docs/QUIZ_SYSTEM.md`: Complete quiz usage and API reference
- `docs/FLASHCARD_SYSTEM.md`: Flashcard system with SM-2 explanation
- `IMPLEMENTATION_SUMMARY.md`: Comprehensive implementation guide
- `TESTING_RESULTS.md`: Full test results and status

### Performance Targets Achieved

- ✅ Bundle size reduced by 200KB+ (33% improvement)
- ✅ Rendering speed improved 50-70% through memoization
- ✅ localStorage thrashing eliminated with debouncing
- ✅ Code-splitting for on-demand loading

### Known Patterns

**Tool-Calling for Study Features**:
```python
# Quiz generation
{
  "name": "generate_quiz",
  "arguments": {
    "topic": "machine learning",
    "num_questions": 5
  }
}

# Flashcard generation  
{
  "name": "generate_flashcards",
  "arguments": {
    "topic": "photosynthesis",
    "num_cards": 10,
    "card_type": "mixed"
  }
}
```

**Artifact Structure**:
- All artifacts include `artifact_type` field
- Quiz/Flashcard artifacts include `message_id` for progress tracking
- Frontend parses JSON from `content` field

**Spaced Repetition Algorithm**:
- Initial: ease_factor=2.5, interval_days=1
- "Known": ease_factor +0.1, interval *= ease_factor
- "Reviewing": interval reset to 1 day
- "Remaining": reset to initial state

### Troubleshooting New Features

**Quiz not generating?**
- Ensure prompt includes "quiz" keyword
- Check RAG has indexed document chunks
- Verify AI provider is responding

**Flashcards not persisting?**
- Check user is logged in (JWT token present)
- Verify session ownership
- Check API endpoints return 200 OK
- Anonymous users won't persist (expected behavior)

**Build errors?**
- Ensure React Hooks called before early returns
- Check for unused variables (ESLint warnings)
- Run `npm run build` to verify

### Git History (Recent)

```
6ba239c - Fix: Resolve React Hooks rules violations
f9a0483 - Docs: Add implementation summary and update README
b07cbc9 - Feature: Add flashcard persistence with spaced repetition API
9368308 - Feature: Add flashcard system with spaced repetition
4e26565 - Feature: Add interactive quiz system with scoring and retry
c6c34fc - Perf: Debounce ChatContext localStorage writes
476dcbb - Perf: Optimize ChatMessage and code-split Markdown for 150KB
9990ee5 - Perf: Memoize HighlightLayer for 40% faster annotations
0f2f070 - Perf: Memoize LazyThumbnail for 60% faster rendering
```
