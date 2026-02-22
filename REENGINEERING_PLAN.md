# FileGeek Reengineering Plan
## From Flask/React to FastAPI/Next.js with LangGraph & PostgreSQL/Qdrant

**Document Created**: February 21, 2026  
**Status**: Planning Phase  
**Estimated Duration**: 8-12 weeks

---

## Executive Summary

FileGeek will undergo a comprehensive technology stack modernization to improve scalability, type safety, and maintainability. This document outlines the complete migration strategy across backend, frontend, database, authentication, styling, and AI logic layers.

### Key Benefits
- **Type Safety**: Full TypeScript + Python type hints reduce runtime errors
- **Scalability**: FastAPI async/await + Next.js server components support higher throughput
- **State Management**: LangGraph replaces linear tool-calling with robust, debuggable state machines
- **Database**: PostgreSQL + Qdrant provide enterprise-grade reliability and vector search
- **Modern Stack**: Auth.js integration, Shadcn/ui components, tailored styling reduces technical debt
- **Performance**: Server-side rendering in Next.js, async FastAPI endpoints, connection pooling

---

## Part 1: Current Architecture Analysis

### Backend (Flask)
```
Current State:
├── Monolithic Flask app (app.py ~2000+ lines)
├── Linear tool-calling loop in AIService.chat_with_tools()
├── JWT auth in auth.py (basic token-based)
├── SQLite database (single file, concurrent access issues)
├── ChromaDB for vector storage (file-based)
├── Celery workers for async tasks
├── Basic error handling and logging
└── MCP server as separate module
```

**Pain Points**:
- Flask is synchronous; asyncio integration is awkward
- SQLite lacks concurrent write support (production risk)
- ChromaDB file-based storage doesn't scale horizontally
- Tool-calling is hardcoded loop (max 5 rounds) with no state visibility
- JWT implementation lacks refresh token rotation
- No request validation framework
- Tight coupling between endpoints and business logic

### Frontend (React)
```
Current State:
├── React 19 with Context API
├── Material-UI 7 + Tailwind (mixed styling)
├── react-pdf for document viewing
├── Manual fetch() calls to backend
├── localStorage for session persistence
├── No TypeScript (runtime errors possible)
├── Client-side only auth (no session validation)
└── Memoization optimizations (February 2026 additions)
```

**Pain Points**:
- Context API doesn't scale well beyond 6-7 contexts
- MUI + Tailwind creates styling conflicts/duplication
- No type safety on API responses
- No server-side rendering (SEO issues, slower initial load)
- Manual data fetching prone to race conditions
- localStorage as source of truth (unreliable)

### Database (SQLite + ChromaDB)
```
Current State:
├── SQLite (backend/instance/app.db)
│   └── User, StudySession, ChatMessage, SessionDocument, QuizResult, FlashcardProgress
├── ChromaDB (backend/chroma_data/)
│   └── Single collection: document_chunks with metadata filtering
└── Redis (Celery broker + rate limiting cache)
```

**Pain Points**:
- SQLite locks on concurrent writes (production bottleneck)
- No built-in replication or backup strategies
- ChromaDB file-based (can't be horizontally scaled)
- No connection pooling
- No support for complex queries or aggregations

### Authentication (JWT in auth.py)
```
Current State:
├── JWT tokens generated on login
├── Stored in localStorage (frontend)
├── No refresh token rotation
├── Basic role-based access control
└── No third-party provider integration
```

**Pain Points**:
- No token refresh mechanism (prone to expiration)
- localStorage vulnerable to XSS
- No social login support
- No multi-device session management
- Basic middleware implementation

---

## Part 2: Target Architecture

### Backend (FastAPI)
```
Target State:
├── Async FastAPI with pydantic models for validation
├── Dependency injection for services
├── LangGraph state machines for tool-calling
│   ├── Graph nodes (initialize, retrieve, think, respond, tool_use)
│   ├── State persistence to database
│   ├── Built-in debugging/visualization
│   └── Support for parallel tool execution
├── Database layer
│   ├── SQLAlchemy ORM with async support
│   ├── Alembic for migrations
│   └── Connection pooling (psycopg3)
├── Authentication
│   ├── Auth.js integration (JWT + refresh tokens)
│   ├── Multi-tenant support
│   └── Session management
├── Structured logging (structlog)
├── OpenAPI/Swagger documentation (auto-generated)
├── Docker-ready with gunicorn/uvicorn
└── Testing with pytest + fixtures
```

**Structure**:
```
backend/
├── main.py                           # FastAPI app initialization
├── config.py                         # Pydantic Settings
├── dependencies.py                   # DI container
├── database.py                       # SQLAlchemy setup
├── migrations/                       # Alembic migrations
│   └── versions/
├── models/
│   ├── __init__.py
│   ├── user.py                       # User model
│   ├── session.py                    # StudySession model
│   ├── message.py                    # ChatMessage model
│   ├── document.py                   # SessionDocument model
│   ├── quiz.py                       # QuizResult model
│   └── flashcard.py                  # FlashcardProgress model
├── schemas/
│   ├── __init__.py
│   ├── user.py                       # Pydantic request/response schemas
│   ├── session.py
│   ├── message.py
│   ├── document.py
│   └── tool.py                       # Tool-calling schemas
├── routers/
│   ├── __init__.py
│   ├── auth.py                       # Auth endpoints (login, signup, refresh)
│   ├── sessions.py                   # Session CRUD endpoints
│   ├── messages.py                   # Message/chat endpoints
│   ├── documents.py                  # Document upload/indexing
│   ├── tools.py                      # Tool execution endpoints
│   └── health.py                     # Health check
├── services/
│   ├── __init__.py
│   ├── auth_service.py               # JWT/refresh token logic
│   ├── ai_service.py                 # Dual-provider AI calls
│   ├── rag_service.py                # Vector search (Qdrant)
│   ├── file_service.py               # Document processing
│   └── user_service.py               # User operations
├── agents/                           # LangGraph state machines
│   ├── __init__.py
│   ├── chat_agent.py                 # Main chat graph
│   ├── quiz_agent.py                 # Quiz generation graph
│   ├── flashcard_agent.py            # Flashcard generation graph
│   ├── states.py                     # Agent state definitions
│   └── tools.py                      # Tool node implementations
├── tasks/                            # Background tasks (Celery or APScheduler)
│   ├── __init__.py
│   ├── document_indexing.py
│   └── cleanup.py
├── utils/
│   ├── __init__.py
│   ├── validators.py
│   ├── pii.py
│   ├── logger.py                     # Structured logging setup
│   └── jwt_handler.py                # JWT utilities
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_chat.py
│   ├── test_documents.py
│   └── test_agents.py
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

### Frontend (Next.js with TypeScript)
```
Target State:
├── TypeScript for full type safety
├── Next.js 15 (App Router)
├── Server Components + Client Components
├── Shadcn/ui component library
├── Pure Tailwind CSS (no MUI conflicts)
├── Auth.js for authentication
├── TanStack Query (React Query) for data fetching
├── Zustand for client-side state (minimal)
├── next-auth middleware for protected routes
├── Markdown rendering with rehype/remark
├── PDF viewing with react-pdf
└── Docker-ready with Node.js alpine
```

**Structure**:
```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/page.tsx         # Auth.js callback
│   ├── (dashboard)/
│   │   ├── sessions/page.tsx         # Session list
│   │   ├── sessions/[id]/page.tsx    # Session detail
│   │   └── settings/page.tsx
│   └── api/auth/[...nextauth]/
│       └── route.ts                  # NextAuth route handler
├── components/
│   ├── ui/                           # Shadcn/ui components (generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   └── ...
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── ArtifactPanel.tsx
│   ├── documents/
│   │   ├── PdfViewer.tsx
│   │   ├── DocumentUpload.tsx
│   │   └── DocumentList.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   └── artifacts/
│       ├── QuizCard.tsx
│       ├── FlashcardComponent.tsx
│       └── DiagramViewer.tsx
├── hooks/
│   ├── useSession.ts                 # Get current session
│   ├── useChat.ts                    # Manage chat state + API calls
│   ├── useDocuments.ts               # Manage documents + uploads
│   └── useQueries.ts                 # TanStack Query hooks
├── lib/
│   ├── api/
│   │   ├── client.ts                 # Fetch wrapper with auth
│   │   ├── sessions.ts
│   │   ├── messages.ts
│   │   ├── documents.ts
│   │   └── tools.ts
│   ├── auth.ts                       # NextAuth configuration
│   ├── types/
│   │   ├── api.ts                    # API response types
│   │   ├── chat.ts
│   │   ├── session.ts
│   │   └── document.ts
│   ├── utils.ts
│   └── queryClient.ts
├── middleware.ts                     # NextAuth middleware
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── Dockerfile
```

### Database Schema (PostgreSQL)
```
Target State:
├── Users table (expanded)
│   ├── id (UUID)
│   ├── email (unique)
│   ├── password_hash (nullable for OAuth)
│   ├── auth_provider (jwt, oauth_google, oauth_microsoft)
│   ├── display_name
│   ├── avatar_url
│   ├── created_at
│   ├── updated_at
│   ├── last_login_at
│   └── is_active
├── Sessions table
│   ├── id (UUID)
│   ├── user_id (FK)
│   ├── title
│   ├── description
│   ├── created_at
│   ├── updated_at
│   └── archived_at
├── Documents table
│   ├── id (UUID)
│   ├── session_id (FK)
│   ├── filename
│   ├── file_url (S3/blob storage)
│   ├── file_type (pdf, docx, image, audio)
│   ├── file_size
│   ├── indexed (boolean)
│   ├── chunks_count
│   ├── created_at
│   └── metadata (JSONB)
├── Messages table
│   ├── id (UUID)
│   ├── session_id (FK)
│   ├── role (user, assistant)
│   ├── content (text)
│   ├── sources (JSONB - array of doc references)
│   ├── artifacts (JSONB - structured outputs)
│   ├── feedback (thumbs_up|thumbs_down|null)
│   ├── lang_graph_state (JSONB - LangGraph checkpoint)
│   ├── created_at
│   └── updated_at
├── QuizResults table
│   ├── id (UUID)
│   ├── message_id (FK)
│   ├── user_id (FK)
│   ├── score (float)
│   ├── total_questions (int)
│   ├── answers (JSONB)
│   ├── created_at
│   └── feedback (text)
├── FlashcardProgress table
│   ├── id (UUID)
│   ├── message_id (FK)
│   ├── user_id (FK)
│   ├── card_id (string)
│   ├── status (remaining|reviewing|known)
│   ├── ease_factor (float)
│   ├── interval_days (int)
│   ├── next_review_at (timestamp)
│   ├── created_at
│   └── updated_at
└── Indexes
    ├── users(email) - unique
    ├── sessions(user_id)
    ├── documents(session_id)
    ├── messages(session_id, created_at DESC)
    ├── quiz_results(user_id)
    └── flashcard_progress(message_id, user_id)
```

### Vector Storage (Qdrant)
```
Target State:
├── Qdrant standalone or cloud deployment
├── Collections:
│   ├── document_chunks
│   │   ├── Vector dimension: 768 (Gemini) or 1536 (OpenAI)
│   │   ├── Distance metric: Cosine
│   │   ├── Indexing: HNSW
│   │   └── Payload:
│   │       ├── chunk_id (UUID)
│   │       ├── document_id (FK)
│   │       ├── session_id (FK)
│   │       ├── user_id (FK)
│   │       ├── text (searchable)
│   │       ├── page_numbers (array)
│   │       ├── source_filename
│   │       └── created_at
│   └── memory_vectors
│       ├── User feedback as vectors (future)
│       ├── Conversation history (future)
│       └── Learning patterns (future)
└── API:
    ├── Search: /collections/document_chunks/points/search
    ├── Upsert: /collections/document_chunks/points/upsert
    └── Delete: /collections/document_chunks/points/delete
```

### Authentication (Auth.js / NextAuth.js)
```
Target State:
├── NextAuth.js v5 (Auth.js) integration
├── Providers:
│   ├── Credentials (JWT - for existing users)
│   ├── Google (OAuth 2.0)
│   ├── Microsoft (OAuth 2.0)
│   └── Optional: GitHub
├── JWT strategy:
│   ├── Access token (15 min expiry)
│   ├── Refresh token (7 days expiry)
│   ├── Rolling sessions (auto-refresh)
│   └── HttpOnly cookies for refresh token
├── Middleware:
│   ├── Protected routes (require session)
│   ├── Public routes (login, signup, docs)
│   └── Admin routes (future)
└── Database:
    ├── User sessions stored in PostgreSQL
    ├── Account linking for OAuth
    └── Verification tokens for email confirmation
```

### AI Logic (LangGraph)
```
Target State:
├── LangGraph state machines replace linear loops
├── Main chat agent graph:
│   ├── State definition
│   │   ├── input (user message)
│   │   ├── chat_history (list of messages)
│   │   ├── retrieved_docs (vector search results)
│   │   ├── ai_thoughts (reasoning)
│   │   ├── tool_calls (pending executions)
│   │   ├── tool_results (executed tool outputs)
│   │   ├── response (final AI response)
│   │   ├── artifacts (structured outputs)
│   │   └── round_count (cycle tracking)
│   ├── Nodes:
│   │   ├── initialize: Setup state
│   │   ├── retrieve: RAG search (Qdrant)
│   │   ├── think: AI reasoning + tool planning
│   │   ├── route: Decision logic (tool_use, respond, refine)
│   │   ├── tool_use: Execute tools (parallel execution)
│   │   ├── respond: Generate final response
│   │   └── checkpoint: Persist state
│   ├── Edges:
│   │   ├── initialize → retrieve
│   │   ├── retrieve → think
│   │   ├── think → route (conditional)
│   │   ├── route → tool_use (if tools selected)
│   │   ├── tool_use → think (loop back)
│   │   ├── route → respond (if no tools)
│   │   └── respond → checkpoint
│   └── Memory:
│       ├── Checkpoints in PostgreSQL
│       ├── State recovery on reconnect
│       └── Conversation visualization
├── Specialized graphs:
│   ├── quiz_agent: Generate ← retrieve → reflect → refine → output
│   ├── flashcard_agent: Extract → formulate → validate → output
│   └── study_guide_agent: Outline → fill → review → output
└── Tools (nodes):
    ├── search_documents (Qdrant)
    ├── generate_quiz
    ├── generate_flashcards
    ├── create_study_guide
    ├── generate_diagram
    └── feedback_analyzer
```

### Styling (Tailwind + Shadcn/ui)
```
Target State:
├── Pure Tailwind CSS (no MUI conflicts)
├── Shadcn/ui component library
│   ├── Built on Radix UI primitives
│   ├── Pre-built: Button, Card, Dialog, Input, Select, etc.
│   ├── Fully customizable via Tailwind
│   └── TypeScript support
├── Theme system
│   ├── Light/dark mode toggle
│   ├── CSS variables for colors
│   └── Tailwind configuration
├── Layout components
│   ├── Responsive grid/flexbox
│   ├── Mobile-first design
│   └── Sidebar/header navigation
└── Benefits:
    ├── Smaller bundle size (no MUI)
    ├── Consistent styling language
    ├── Better TypeScript integration
    └── Community-driven components
```

---

## Part 3: Migration Strategy

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Set up new infrastructure and data pipeline

#### 1.1 Database Setup
- [ ] Provision PostgreSQL instance (AWS RDS or managed provider)
  - Configuration: 2 vCPU, 8GB RAM for initial load
  - Backup: Automated daily snapshots
  - Multi-AZ for high availability
  - Connection pooling: pgBouncer (100 connections)
- [ ] Provision Qdrant instance
  - Configuration: Standalone or managed (Qdrant Cloud)
  - Vector dimension: 768 or 1536 (match embedding provider)
  - Persistence: Enable snapshots
- [ ] Create PostgreSQL schema
  - Run Alembic migrations (from empty DB)
  - Create indexes for common queries
  - Test: Verify connections from backend
- [ ] Set up S3/Blob storage for documents
  - Bucket: `filegeek-documents-prod`
  - Lifecycle policy: Auto-delete after 90 days
  - CORS configuration for frontend

#### 1.2 Backend Foundation
- [ ] Initialize FastAPI project structure
  - Create `main.py` with FastAPI app
  - Set up `config.py` with Pydantic Settings
  - Configure logging (structlog)
  - Create `dependencies.py` for DI
- [ ] Database layer
  - Set up SQLAlchemy with async support
  - Create `models/` files (user, session, message, etc.)
  - Initialize Alembic migrations folder
  - Create first migration: `001_initial_schema.py`
- [ ] Authentication foundation
  - Implement JWT utilities
  - Create `auth_service.py` with signup/login
  - Set up `routers/auth.py` endpoints
  - Test: Create user, login, verify token
- [ ] Testing infrastructure
  - Set up pytest with fixtures
  - Create `conftest.py` with database fixtures
  - Write basic test for auth endpoints

#### 1.3 Next.js Foundation
- [ ] Initialize Next.js 15 project with TypeScript
  - Create `app/` directory structure
  - Set up `tailwind.config.ts`
  - Install shadcn/ui and dependencies
- [ ] Set up Auth.js integration
  - Create `lib/auth.ts` configuration
  - Create `api/auth/[...nextauth]/route.ts`
  - Set up middleware for protected routes
- [ ] Create basic layouts
  - Root layout with providers (AuthProvider, QueryClientProvider)
  - Main dashboard layout
  - Test: Verify page loads, auth flow works

### Phase 2: Data Migration (Weeks 3-4)
**Goal**: Migrate existing data from SQLite + ChromaDB to PostgreSQL + Qdrant

#### 2.1 Data Export Tools
- [ ] Create migration CLI script
  - Read SQLite database
  - Export users, sessions, messages, documents
  - Generate CSV files
  - Validate data integrity
- [ ] Create vector re-embedding pipeline
  - Read ChromaDB collection
  - Re-embed chunks with FastAPI AI service (Gemini/OpenAI)
  - Write to Qdrant
  - Track migration progress (checkpoints)
- [ ] Handle data transformations
  - User: Add `auth_provider`, set to "jwt"
  - Message: Extract sources/artifacts to JSONB
  - Document: Link to S3 URLs (upload originals)
  - Quiz/Flashcard: Validate state schemas

#### 2.2 Data Import Tests
- [ ] Dry-run migration
  - Create staging PostgreSQL DB
  - Import test data (1-2 sample documents)
  - Verify record counts match
  - Check foreign key constraints
  - Query samples to validate data
- [ ] Vector search validation
  - Query Qdrant with sample questions
  - Compare results with old ChromaDB
  - Verify similarity/relevance
  - Check metadata preservation
- [ ] Parallel running
  - Run both systems (old + new) simultaneously
  - Compare responses
  - Identify discrepancies, fix migrations

#### 2.3 Document File Migration
- [ ] Upload all documents to S3
  - Create directory structure: `s3://filegeek-documents-prod/{user_id}/{session_id}/{doc_id}`
  - Update database file_url pointers
  - Verify S3 access from backend
- [ ] Handle large files
  - Use multipart upload for files > 100MB
  - Progress tracking in database
  - Resume capability for interrupted uploads

### Phase 3: Backend Implementation (Weeks 5-6)
**Goal**: Complete FastAPI backend with LangGraph agents

#### 3.1 API Endpoints (Router Implementation)
- [ ] `routers/sessions.py`
  - POST `/sessions` - Create session
  - GET `/sessions` - List user's sessions (paginated)
  - GET `/sessions/{id}` - Get single session
  - PUT `/sessions/{id}` - Update title/description
  - DELETE `/sessions/{id}` - Archive session
- [ ] `routers/messages.py`
  - POST `/sessions/{id}/messages` - Send message (triggers chat agent)
  - GET `/sessions/{id}/messages` - Get conversation history (paginated)
  - PUT `/messages/{id}/feedback` - Send feedback (thumbs up/down)
  - GET `/messages/{id}/sources` - Get message sources
- [ ] `routers/documents.py`
  - POST `/sessions/{id}/documents` - Upload document (multipart)
  - GET `/sessions/{id}/documents` - List session documents
  - DELETE `/documents/{id}` - Delete document (hard delete from S3)
  - GET `/documents/{id}/status` - Check indexing progress
- [ ] `routers/tools.py` (streaming endpoint)
  - POST `/sessions/{id}/tools/execute` - Manual tool invocation
  - WebSocket `/ws/sessions/{id}` - Streaming chat (LangGraph checkpoints)

#### 3.2 LangGraph Agent Implementation
- [ ] `agents/states.py` - State definitions
  - Define `ChatState`, `QuizState`, `FlashcardState` TypedDict
  - Include all fields from .../Part 2 AI Logic section
- [ ] `agents/chat_agent.py` - Main chat graph
  - Implement nodes: initialize, retrieve, think, route, tool_use, respond, checkpoint
  - Wire edges with conditional routing
  - Add error handling (invalid tool calls, API timeouts)
  - Implement max_rounds=5 limit
- [ ] `agents/tools.py` - Tool implementations
  - `search_documents`: Query Qdrant with filters
  - `generate_quiz`: Call AI to generate quiz artifact
  - `generate_flashcards`: Call AI to generate flashcard artifact
  - `create_study_guide`: Call AI for outline
  - `generate_diagram`: Call AI for Mermaid syntax
- [ ] Setup checkpointing
  - PostgreSQL checkpointer backend
  - Save state after each round
  - Load state on reconnection

#### 3.3 Services Layer Refactoring
- [ ] `services/ai_service.py`
  - Refactor for dual-provider (Gemini/OpenAI)
  - Update tool-calling to use LangGraph format
  - Add structured output parsing
- [ ] `services/rag_service.py`
  - Replace ChromaDB with Qdrant client
  - Update search method signature
  - Add filters for session/user isolation
  - Implement similarity threshold
- [ ] `services/file_service.py`
  - Refactor for S3 storage (instead of local uploads/)
  - Update async support (asyncio)
  - Add document chunking with LangChain's recursive splitter
- [ ] `services/auth_service.py` (new)
  - JWT generation/validation with refresh token rotation
  - Password hashing (bcrypt)
  - MultiAuthProvider interface

#### 3.4 Testing
- [ ] Unit tests for services
  - Test RAG search filtering
  - Test AI parsing (different providers)
  - Test file processing pipeline
- [ ] Integration tests for endpoints
  - Test full chat flow (message → agent → response)
  - Test document upload → indexing → search
  - Test LangGraph state persistence
- [ ] Agent tests
  - Test graph node execution
  - Test state transitions
  - Test error recovery

### Phase 4: Frontend Implementation (Weeks 7-8)
**Goal**: Complete Next.js frontend with TypeScript and Shadcn/ui

#### 4.1 Pages & Layouts
- [ ] Authentication pages
  - `app/(auth)/login/page.tsx` - Login form
  - `app/(auth)/signup/page.tsx` - Signup form
  - `app/(auth)/callback/page.tsx` - OAuth callback redirect
- [ ] Dashboard pages
  - `app/(dashboard)/sessions/page.tsx` - Session list with pagination
  - `app/(dashboard)/sessions/[id]/page.tsx` - Chat interface
  - `app/(dashboard)/settings/page.tsx` - User settings
- [ ] Home page
  - `app/page.tsx` - Public landing (or redirect to dashboard if authenticated)

#### 4.2 Chat Interface
- [ ] `components/chat/ChatPanel.tsx`
  - Message list (virtualized for performance)
  - Input field with file upload
  - Sticky message input at bottom
- [ ] `components/chat/ChatMessage.tsx`
  - Render user/assistant messages
  - Syntax highlighting for code
  - Markdown rendering (rehype/remark)
  - Source citations (links to document references)
- [ ] `components/chat/ArtifactPanel.tsx`
  - Render quiz artifacts (interactive)
  - Render flashcard artifacts (3D flip animation)
  - Render Mermaid diagrams
  - Render study guides (collapsible outline)

#### 4.3 Document & PDF Viewing
- [ ] `components/documents/PdfViewer.tsx`
  - React-pdf integration
  - Zoom controls
  - Page navigation
  - Selection toolbar for highlighting
- [ ] `components/documents/DocumentUpload.tsx`
  - Drag-and-drop zone
  - File type validation
  - Progress indicator
  - Multi-file support
- [ ] `components/documents/DocumentList.tsx`
  - List session documents
  - Delete buttons
  - Indexing status badges

#### 4.4 Custom Hooks & API Layer
- [ ] `hooks/useChat.ts`
  - Manage chat messages state
  - Handle message sending (call backend)
  - Handle streaming responses (WebSocket)
  - Manage artifacts
- [ ] `hooks/useDocuments.ts`
  - Upload document
  - Fetch document list
  - Delete document
  - Progress tracking
- [ ] `lib/api/client.ts`
  - Fetch wrapper with Auth.js session
  - Error handling
  - Retry logic
  - Request/response logging
- [ ] `lib/api/` endpoints
  - `sessions.ts`: CRUD operations
  - `messages.ts`: Send message, get history, feedback
  - `documents.ts`: Upload, list, delete
  - `tools.ts`: Manual tool execution

#### 4.5 Shadcn/ui Setup
- [ ] Initialize Shadcn/ui components
  - Run `npx shadcn-ui@latest add` for:
    - button, card, input, textarea
    - dialog, dropdown-menu, sheet (for sidebar)
    - toast, skeleton, spinner
    - scroll-area, tabs, accordion
  - Customize Tailwind config for theming

#### 4.6 Styling & Theme
- [ ] Create theme system
  - Light/dark mode toggle (localStorage + system preference)
  - Color palette (primary, secondary, accent, destructive)
  - Apply via CSS variables
- [ ] Responsive layout
  - Mobile-first breakpoints (sm, md, lg, xl)
  - Sidebar drawer on mobile (Sheet component)
  - Optimized chat interface for small screens
- [ ] Component styling
  - Consistent spacing/padding
  - Typography hierarchy
  - Focus states and accessibility

#### 4.7 Testing
- [ ] Component tests (Jest + React Testing Library)
  - ChatMessage rendering
  - Document upload validation
  - Chat input functionality
- [ ] Integration tests
  - Full chat flow (login → upload → chat → artifact)
  - Session switching
  - Dark mode persistence

### Phase 5: Deployment & Optimization (Weeks 9-10)
**Goal**: Deploy new stack and optimize performance

#### 5.1 Docker & Container Setup
- [ ] Backend Dockerfile
  - Python 3.11 alpine base
  - Pip install from requirements.txt
  - Expose port 8000 (FastAPI)
  - Health check endpoint
- [ ] Frontend Dockerfile
  - Node.js 20 alpine base
  - Build Next.js app (`npm run build`)
  - Nginx reverse proxy (port 3000)
  - Static asset caching
- [ ] `docker-compose.yml` for local development
  - PostgreSQL service
  - Qdrant service
  - Redis service (optional Celery)
  - Backend service (FastAPI)
  - Frontend service (Next.js)

#### 5.2 Environment Configuration
- [ ] Backend `.env`
  - DATABASE_URL (PostgreSQL connection string)
  - QDRANT_URL (Qdrant instance)
  - AI_PROVIDER (gemini or openai)
  - GOOGLE_API_KEY or OPENAI_API_KEY
  - JWT_SECRET
  - NEXTAUTH_SECRET (shared with frontend)
  - S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
  - CORS_ORIGINS (NextAuth callback URL)
- [ ] Frontend `.env.local`
  - NEXTAUTH_URL (backend URL)
  - NEXTAUTH_SECRET (same as backend)
  - NEXT_PUBLIC_API_URL (backend API endpoint)

#### 5.3 Performance Optimization
- [ ] Backend
  - Database connection pooling (psycopg pool)
  - Caching layer (Redis) for frequently accessed data
  - Response compression (gzip)
  - Batch operations where possible (bulk indexing)
- [ ] Frontend
  - Code-splitting (already using Next.js dynamic imports)
  - Image optimization (next/image component)
  - Server-side rendering for initial chat (faster FCP)
  - Streaming chat responses (Server-Sent Events or WebSocket)
- [ ] Database
  - Add missing indexes (user lookup, session queries)
  - Optimize query plans
  - Archival strategy for old messages

#### 5.4 Monitoring & Logging
- [ ] Backend
  - Structured logging (structlog → JSON)
  - Application metrics (request count, latency, errors)
  - Error tracking (Sentry)
  - Database query monitoring
- [ ] Frontend
  - Performance metrics (lighthouse, web vitals)
  - Error boundaries (React Error Boundary)
  - User analytics (optional)
- [ ] Deployment targets
  - Production: Render.com or AWS ECS
  - Staging: Separate environment for testing

#### 5.5 Security Hardening
- [ ] Backend
  - Rate limiting (Redis-backed)
  - CORS configuration (NextAuth callback domain only)
  - Request validation (Pydantic)
  - SQL injection prevention (ORM usage)
  - CSRF protection (if needed for form endpoints)
- [ ] Frontend
  - Content Security Policy headers
  - Secure cookie settings (HttpOnly, Secure, SameSite)
  - Input sanitization (DOMPurify)
  - XSS prevention

### Phase 6: Cutover & Validation (Weeks 11-12)
**Goal**: Switch production traffic to new stack

#### 6.1 Pre-Cutover Testing
- [ ] Load testing
  - Simulate production traffic (100s of concurrent users)
  - Identify bottlenecks (database, API, AI calls)
  - Measure response times
- [ ] User acceptance testing (UAT)
  - Invite beta users to test new interface
  - Verify feature parity (all old features work)
  - Collect feedback on UX changes
- [ ] Regression testing
  - Test all AI features (quiz, flashcard, diagrams)
  - Verify document processing (PDF, DOCX, images, audio)
  - Check session persistence across browsers

#### 6.2 Cutover Plan
- [ ] Parallel running period (1-2 weeks)
  - Run old + new stacks simultaneously
  - Route % of traffic to new stack gradually (blue-green deployment)
  - Monitor new stack for errors
  - Verify consistency between stacks
- [ ] Traffic migration schedule
  - Day 1: Route 10% of traffic to new stack
  - Day 2-3: Route 25% of traffic
  - Day 4-5: Route 50% of traffic
  - Day 6-7: Route 75% of traffic
  - Day 8: Route 100% of traffic (old stack standby)
  - Day 9+: Decommission old stack

#### 6.3 Rollback Strategy
- [ ] Rollback checklist
  - Old Flask/React stack remains deployed
  - Database backup before migration
  - Quick DNS failover (if using CDN)
  - Notification plan (user communication)
- [ ] Rollback triggers
  - >5% error rate on new stack
  - Response time >2s (SLA breach)
  - Data corruption detected
  - Critical bug in core features

#### 6.4 Post-Cutover
- [ ] Monitor new stack
  - Daily health checks (logs, errors, performance)
  - Weekly performance reviews
  - Monthly optimization passes
- [ ] Decommissioning old stack
  - Keep database backups for 30 days
  - Archive old code to GitHub releases
  - Document migration lessons learned

---

## Part 4: Technical Considerations

### LangGraph vs. Linear Tool-Calling

**Why LangGraph?**

| Aspect | Current Loop | LangGraph |
|--------|--------------|-----------|
| **Visual Debugging** | Logs only | Graph representation in UI |
| **State Persistence** | Ephemeral | Checkpoints to database |
| **Parallel Execution** | Sequential tools | Parallel tool execution |
| **Conditional Logic** | If/else statements | First-class edge conditions |
| **Error Recovery** | Manual re-call | Automatic state recovery |
| **Agent Composition** | Copy-paste code | Reusable graph patterns |

**Example**: Within one turn, execute `search_documents` and `generate_quiz` in parallel instead of sequentially.

### Authentication Transition

**Old (JWT in auth.py)**:
- Single hardcoded secret
- No refresh mechanism
- localStorage storage (XSS risk)
- Manual session validation

**New (Auth.js)**:
- Industry-standard library
- Automatic token refresh
- HttpOnly cookies (secure by default)
- OAuth provider support
- Built-in session validation middleware

**Migration Path**:
1. Deploy Auth.js alongside old JWT for 2-3 weeks
2. Support both `Authorization: Bearer {token}` (old) and session cookies (new)
3. Redirect login to Auth.js
4. Gradually migrate existing tokens to new systems
5. Remove old JWT endpoints after 30 days

### Database from SQLite to PostgreSQL

**Why PostgreSQL?**

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Concurrent Writes** | Single writer | Multiple writers |
| **Scalability** | ~100 users | 1M+ users |
| **Backup** | File copy | WAL + streaming replication |
| **Connection Pooling** | Limited | pgBouncer support |
| **Data Types** | Basic | JSONB, Arrays, UUIDs |
| **Full-Text Search** | Basic | Advanced (tsvector) |
| **Transactions** | Basic ACID | Full ACID + isolation levels |

**Cost Estimate** (AWS RDS):
- Development: $15-30/month (t3.micro)
- Production: $50-200/month (t3.small + multi-AZ)

### Vector Search: ChromaDB to Qdrant

**Why Qdrant?**

| Aspect | ChromaDB | Qdrant |
|--------|----------|--------|
| **Deployment** | File-based | Standalone service |
| **Scalability** | Single instance | Horizontal scaling |
| **API** | Python library | HTTP/gRPC |
| **Replication** | None | Built-in |
| **Filters** | Metadata filtering | Complex queries |
| **Performance** | ~1ms (small) | ~5-50ms (large scale) |

**Cost Estimate** (Qdrant Cloud):
- Free tier: Up to 10GB vectors
- Paid: $99-500/month based on size

### Styling: MUI + Tailwind → Pure Tailwind + Shadcn

**Bundle Size Reduction**:
- Remove MUI: ~250KB
- Add Shadcn/ui: ~50KB (only used components)
- Net savings: ~200KB (33% reduction)

**Maintenance**:
- Fewer dependency conflicts
- Consistent Tailwind config
- Easier to customize components
- Better component discoverability

---

## Part 5: Risk Assessment & Mitigations

### High-Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Data loss during migration** | Medium | Critical | Dry-run on staging, backup old DB, validate checksums |
| **Vector re-embedding incompatibility** | Medium | High | Test with sample docs, compare old/new results |
| **Auth.js integration bugs** | Low | High | Comprehensive testing, built-in rollback support |
| **Performance degradation** | Medium | High | Load testing before cutover, bottleneck identification |
| **PostgreSQL connection issues** | Low | High | Connection pooling, monitoring, fallback strategy |
| **Qdrant availability** | Low | Medium | Use managed Qdrant Cloud with SLA, fallback to keyword search |
| **FastAPI async bugs** | Low | Medium | Thorough testing, gradual traffic migration |
| **Next.js hydration issues** | Low | Low | Server-side rendering disabled where needed, careful state management |

### Contingency Plans

1. **Database Migration Failure**
   - Rollback: Restore from backup, revert DNS
   - Timeline: <30 minutes
   - Communication: Notify users of temporary maintenance

2. **Auth.js Integration Issues**
   - Fallback: Use old JWT endpoints temporarily
   - Immediate fix: Patch Auth.js config
   - Timeline: <2 hours

3. **Qdrant Performance**
   - Monitor: Query latency, index size
   - If slow: Reduce vector dimensions, increase replica nodes
   - Fallback: Implement keyword search layer

4. **Frontend Build Failure**
   - Fallback: Deploy old React frontend on new backend
   - Fix: Address TypeScript/build issues
   - Timeline: <1 hour

---

## Part 6: Success Criteria & Validation

### Phase 1 Success Metrics
- [ ] PostgreSQL DB accessible, schema created
- [ ] Qdrant instance running, test collections created
- [ ] FastAPI app boots without errors
- [ ] Next.js dev server runs on localhost:3000

### Phase 2 Success Metrics
- [ ] 100% of SQLite records migrated to PostgreSQL
- [ ] Vector checksums match between ChromaDB and Qdrant (within 1% tolerance)
- [ ] 100% of documents uploaded to S3
- [ ] Row counts validated post-migration

### Phase 3 Success Metrics
- [ ] All API endpoints respond with correct schemas (OpenAPI docs generated)
- [ ] LangGraph chat agent completes 5 full rounds without errors
- [ ] Tool execution (search, quiz, flashcards) works end-to-end
- [ ] Unit test coverage: >70%

### Phase 4 Success Metrics
- [ ] All pages render without TypeScript errors
- [ ] Auth.js login/signup flow works
- [ ] Chat UI displays messages, artifacts, sources correctly
- [ ] File upload and PDF viewing work

### Phase 5 Success Metrics
- [ ] Docker images build successfully
- [ ] Full stack runs with `docker-compose up`
- [ ] App responds to 1000 concurrent users
- [ ] Response time <1s for 95th percentile
- [ ] Zero downtime deployments work

### Phase 6 Success Metrics
- [ ] Parallel running shows <0.1% difference in responses
- [ ] Zero data loss during cutover
- [ ] Error rate <0.5% during first week
- [ ] User feedback positive on UX changes

---

## Part 7: Resource Requirements

### Infrastructure
- MacBook Pro / Linux machine for development
- AWS/GCP account for PostgreSQL, Qdrant, S3
- Render.com or similar for production deployment
- GitHub for version control

### Personnel & Time Estimates

| Role | Time (weeks) | Tasks |
|------|------|-------|
| **Backend Engineer** | 6-7 | FastAPI setup, LangGraph, migration, APIs |
| **Frontend Engineer** | 5-6 | Next.js setup, components, styling, auth |
| **DevOps Engineer** | 2-3 | Docker, CI/CD, database setup, monitoring |
| **QA/Testing** | 2-3 | UAT, load testing, regression testing |
| **Total Team-Weeks** | 15-19 | ~4 people for 4 weeks, or parallel work |

### Tool Licenses
- GitHub: Free (public repo) or $21/month (private)
- Render.com: Free tier or $7-25/month (production)
- AWS: Variable (S3 ~$0.023 per GB, RDS starting $50/month)
- Qdrant Cloud: Free tier or $99/month (production)

---

## Part 8: Communication & Documentation

### Documentation Deliverables

1. **Architecture Decision Records (ADRs)**
   - ADR-001: Why PostgreSQL over SQLite
   - ADR-002: Why Qdrant over ChromaDB
   - ADR-003: Why LangGraph over linear loops
   - ADR-004: Why Auth.js over custom JWT

2. **API Documentation**
   - OpenAPI/Swagger (auto-generated by FastAPI)
   - User guide for API clients
   - Error code reference

3. **Frontend Component Library**
   - Storybook (optional) or component documentation
   - TypeScript interface definitions
   - Usage examples for common tasks

4. **Database Schema** (Alembic migrations document all changes)
   - ER diagram (dbdiagram.io export)
   - Query performance guide
   - Backup/recovery procedures

5. **Deployment Runbooks**
   - Local development setup
   - Staging deployment
   - Production deployment
   - Rollback procedures
   - Troubleshooting guide

### Stakeholder Communication

- **Weekly progress updates** to team
- **Bi-weekly demos** of completed features
- **Pre-cutover notification** to users (1 week in advance)
- **Post-cutover retrospective** (lessons learned)

---

## Part 9: Testing Strategy

### Unit Tests
- **Backend**: Service methods (RAG search, AI parsing, auth)
- **Frontend**: Hook logic, utility functions, component rendering

### Integration Tests
- **Backend**: API endpoints, database transactions, LangGraph state
- **Frontend**: Auth flow, chat sending, document upload

### User Acceptance Testing (UAT)
- Beta users test new interface for 1-2 weeks
- Feature parity verification
- Performance feedback

### Load Testing
- **Targets**:
  - 100 concurrent users
  - 50 chat messages/second
  - 10 document uploads/minute
- **Tools**: Locust or k6
- **Acceptance**: Response time <1s (p95)

### Canary Deployment
- Route 5-10% of traffic to new stack initially
- Monitor error rates, latency, success rates
- Gradually increase traffic over 1 week

---

## Part 10: Post-Migration Optimizations

### Quick Wins (Week 1-2 after cutover)
- [ ] Add Redis caching for frequently accessed data (sessions, documents)
- [ ] Implement response compression (gzip)
- [ ] Optimize database indexes based on real traffic patterns
- [ ] Add rate limiting (token bucket algorithm)

### Medium-term (Month 1-2)
- [ ] Implement full-text search in PostgreSQL (tsvector)
- [ ] Add analytics dashboard (message volume, active users)
- [ ] Implement batch processing for bulk document imports
- [ ] Add WebSocket support for real-time collaborative features

### Long-term (Quarter 2-3)
- [ ] Multi-tenancy support (allow team workspaces)
- [ ] Fine-tuning of AI models for domain-specific use
- [ ] Real-time collaboration (shared document editing)
- [ ] Mobile app (React Native)
- [ ] Browser extension for document capture

---

## Part 11: Deprecated Components & Cleanup

### To Be Removed
1. **Backend**
   - `backend/app.py` (monolithic Flask app)
   - `backend/auth.py` (old JWT)
   - `backend/celery_app.py` (replace with Celery in FastAPI structure)
   - `backend/chroma_data/` (ChromaDB data)

2. **Frontend**
   - `frontend/src/components/` (old React components, rewrite in Next.js)
   - `frontend/src/pages/` (old CRA routing, replace with App Router)
   - Material-UI dependencies
   - react-redux (if any)

3. **Root**
   - `ChatBot-main/` (legacy chatbot project)
   - `remove_coauthor.sh` (development utility)
   - Old markdown files (COAUTHOR_REMOVAL_GUIDE.md, etc.)

### Archive & Version Control
- Tag release `v1.0-legacy` to preserve old code
- Create `legacy/` branch for reference
- Document breaking changes in MIGRATION_GUIDE.md

---

## Timeline Overview

```
Week 1-2:   Foundation Setup (PostgreSQL, Qdrant, FastAPI, Next.js)
Week 3-4:   Data Migration & Validation
Week 5-6:   Backend Implementation (APIs, LangGraph, Services)
Week 7-8:   Frontend Implementation (Pages, Components, Styling)
Week 9-10:  Deployment Setup, Performance Optimization
Week 11-12: Cutover & Validation
→ Post-Cutover: Monitoring, Optimization, Feature Iterations
```

---

## Appendix A: Technology Stack Comparison

### Backend
```
OLD:                              NEW:
Flask (minimal framework)    →     FastAPI (async, validation)
SQLAlchemy sync              →     SQLAlchemy async
SQLite (single file)         →     PostgreSQL (production DB)
ChromaDB (file-based)        →     Qdrant (service-based)
Manual tool loops            →     LangGraph (state machines)
PyJWT (manual)               →     Auth.js integration
```

### Frontend
```
OLD:                              NEW:
React 19                     →     React 19 (unchanged)
Context API                  →     Zustand + useCallback (lighter)
Material-UI 7                →     Shadcn/ui (lighter)
Tailwind + MUI               →     Pure Tailwind (cleaner)
JavaScript                   →     TypeScript (type safety)
CRA routing                  →     Next.js App Router (SSR)
```

### Database
```
OLD:                              NEW:
SQLite                       →     PostgreSQL
ChromaDB standalone          →     Qdrant standalone
File-based backups           →     WAL + replication
```

---

## Appendix B: FAQ

**Q: Will users experience downtime?**
A: With blue-green deployment and gradual traffic migration, there should be <30s of downtime during DNS cutover. Most users won't notice.

**Q: What about existing document embeddings?**
A: Re-embeddings are calculated with the same model (Gemini/OpenAI), so similarity scores should be ~99% the same.

**Q: Can we run both stacks simultaneously?**
A: Yes! The migration plan includes 1-2 weeks of parallel running for validation.

**Q: What if Auth.js causes issues?**
A: We can fall back to old JWT endpoints within minutes. Auth.js failures are isolated to new frontend.

**Q: Do users need to re-login?**
A: Users logged into old Flask app will need to re-authenticate on new system. Plan for this in communication.

---

## Summary

This reengineering plan provides a **structured, phased approach** to modernizing FileGeek over 12 weeks. The strategy minimizes risk through:

1. ✅ **Modular phases** (foundation → data → backend → frontend → deploy)
2. ✅ **Parallel validation** (run old + new stacks simultaneously)
3. ✅ **Gradual rollout** (blue-green deployment, traffic ramping)
4. ✅ **Rollback safety** (old stack remains deployable)
5. ✅ **Testing coverage** (unit → integration → UAT → load testing)

**Next Steps**:
- Review plan with team
- Identify bottlenecks/dependencies
- Confirm resource allocation
- Refine timeline based on team capacity
- Begin Phase 1 (Foundation)

