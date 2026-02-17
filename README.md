# FileGeek — Multimodal AI Document Workspace

FileGeek is a full-stack document analysis platform that combines RAG (Retrieval-Augmented Generation), agentic tool-calling, and long-term memory to create an intelligent study companion. Upload PDFs, Word docs, images, or audio recordings and have AI-powered conversations with your documents.

## Features

### Core Capabilities
- **Persistent RAG** — Documents are indexed into ChromaDB with session-scoped vector storage; context survives across conversations
- **Agentic Tool-Calling** — AI can search documents, generate quizzes, create study guides, flashcards, and produce Mermaid diagrams through a multi-round tool-calling loop
- **Long-Term Memory** — The system remembers past interactions and learns user preferences from thumbs-up/down feedback
- **Dual AI Provider** — Supports both Google Gemini and OpenAI, controlled via `AI_PROVIDER` env var (auto-detects from available keys)
- **Server-Backed Sessions** — Chat sessions persist in SQLite with full message history, sources, and artifacts
- **6 AI Personas** — Academic Mentor, Professional Analyst, Casual Helper, Albert Einstein, Gen-Z Tutor, Sherlock Holmes
- **Multimodal Input** — PDF, DOCX, TXT, images (with OCR), and audio files (transcribed via Whisper)

### Interactive Study Tools 🆕
- **Interactive Quizzes** — Generate multiple-choice quizzes from document content with real-time scoring, visual feedback, and retry capability
- **Flashcards with Spaced Repetition** — Create flashcards with 3D flip animation, mark as "Review" or "Know It", and track progress with SM-2 spaced repetition algorithm. Progress persists across sessions.

### User Interface
- **Voice Input** — Browser-based speech-to-text via Web Speech API
- **Interactive PDF Viewer** — Built with react-pdf; text selection, highlights, annotations, sticky notes, and "Ask AI" on selected text
- **Artifacts Panel** — Structured AI outputs (quizzes, flashcards, study guides, Mermaid diagrams) render in a dedicated side panel
- **Export** — Markdown, Evernote (.enex), and Notion integration
- **Text-to-Speech** — Listen to AI responses with persona-specific voices via OpenAI TTS

### Integrations
- **MCP Integration** — Model Context Protocol server for connecting to Claude Desktop or other MCP clients

### Performance 🆕
- **Optimized Rendering** — 50-70% faster UI rendering with React.memo and memoization
- **Code-Splitting** — 150KB smaller bundle through lazy-loaded components
- **Debounced State** — Smooth typing and scrolling with optimized state management

## Architecture

```
FileGeek/
├── backend/                    # Flask API server
│   ├── app.py                  # Main Flask app with all endpoints
│   ├── auth.py                 # JWT authentication (signup/login)
│   ├── models.py               # SQLAlchemy models (User, StudySession, ChatMessage, SessionDocument)
│   ├── config.py               # Centralized configuration
│   ├── services/
│   │   ├── ai_service.py       # Dual-provider AI (Gemini + OpenAI) with agentic tool-calling
│   │   ├── file_service.py     # File extraction (PDF, DOCX, TXT, images, audio)
│   │   ├── rag_service.py      # RAG indexing/retrieval + long-term memory
│   │   └── tools.py            # Tool definitions and executor for agentic pipeline
│   └── mcp/                    # Model Context Protocol server
│       ├── server.py           # MCP stdio server
│       └── tools.py            # MCP tool definitions
├── frontend/                   # React 19 + MUI 7 SPA
│   └── src/
│       ├── api/                # Axios API clients (sessions, general)
│       ├── components/         # UI components (ChatPanel, PdfViewer, ArtifactPanel, etc.)
│       ├── contexts/           # React contexts (Chat, File, Persona, Annotation, Theme)
│       ├── hooks/              # Custom hooks (useChat)
│       ├── pages/              # MainLayout with responsive bento grid
│       └── theme/              # MUI theme + dark mode
├── uploadthing-server/         # Express sidecar for file uploads via UploadThing
├── requirements.txt            # Python dependencies
└── Dockerfile                  # Container build
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- At least one AI provider key: `GOOGLE_API_KEY` (Gemini) or `OPENAI_API_KEY`

### 1. Clone

```bash
git clone https://github.com/A-Kumar14/FileGeek-Main.git
cd FileGeek-Main
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
```

Create a `.env` file in the project root:

```env
# Required — at least one AI provider
GOOGLE_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Optional
AI_PROVIDER=gemini          # or "openai"; auto-detects if unset
JWT_SECRET=your-secret-key
UPLOADTHING_TOKEN=your_ut_token
```

Start the backend:

```bash
python app.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

### 4. UploadThing Sidecar (optional, for cloud file uploads)

```bash
cd uploadthing-server
npm install
npm start
```

### Open the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/health` | GET | No | Health check |
| `/personas` | GET | No | List available AI personas |
| `/auth/signup` | POST | No | Create account |
| `/auth/login` | POST | No | Login and get JWT |
| `/sessions` | GET | JWT | List user's study sessions |
| `/sessions` | POST | JWT | Create a new session |
| `/sessions/<id>` | GET | JWT | Get session with messages and documents |
| `/sessions/<id>` | DELETE | JWT | Delete session and cleanup vectors |
| `/sessions/<id>/documents` | POST | JWT | Index a document into a session |
| `/sessions/<id>/messages` | POST | JWT | Send message (agentic RAG pipeline) |
| `/messages/<id>/feedback` | POST | JWT | Thumbs up/down on a message |
| `/transcribe` | POST | JWT | Transcribe audio via Whisper |
| `/tts` | POST | JWT | Text-to-speech with persona voice |
| `/upload` | POST | JWT | Legacy: upload files + ask question |
| `/ask` | POST | JWT | Legacy: CDN file URLs + ask question |
| `/export/markdown` | POST | JWT | Export as Markdown |
| `/export/notion` | POST | JWT | Export to Notion |
| `/export/enex` | POST | JWT | Export as Evernote .enex |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | One of these | Gemini API key |
| `OPENAI_API_KEY` | One of these | OpenAI API key (also needed for TTS and Whisper) |
| `AI_PROVIDER` | No | Force `gemini` or `openai` (auto-detects if unset) |
| `JWT_SECRET` | Recommended | Secret for JWT signing (must match across services) |
| `UPLOADTHING_TOKEN` | For uploads | UploadThing API token |
| `FLASK_PORT` | No | Backend port (default: 5000) |
| `NUM_RETRIEVAL_CHUNKS` | No | RAG chunks per query (default: 5) |
| `GITHUB_TOKEN` | No | For MCP GitHub repo search tool |

## Deployment

- **Frontend**: Deployed on Vercel (auto-builds from `frontend/`)
- **Backend**: Deployed on Render (uses `Dockerfile` or `gunicorn`)
- **UploadThing Sidecar**: Co-deployed with backend or as separate service

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, MUI 7, react-pdf, Mermaid, KaTeX, react-markdown |
| Backend | Flask, SQLAlchemy (SQLite), ChromaDB, gunicorn |
| AI | Google Gemini, OpenAI GPT-4o, Whisper, TTS |
| File Processing | pdfplumber, PyMuPDF, python-docx, pytesseract, Pillow |
| Uploads | UploadThing (Express sidecar) |
| Auth | JWT (PyJWT + bcrypt) |
| Protocol | MCP (Model Context Protocol) |

## License

MIT
