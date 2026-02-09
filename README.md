# PDFGeek — AI-Powered PDF Assistant

PDFGeek is a full-stack web application for uploading PDFs, viewing them, and interacting with them through a conversational interface powered by OpenAI models and a retrieval-augmented generation (RAG) approach.

Key features
- RAG-based semantic search with vector embeddings
- Multiple PDF extraction methods (pdfplumber, PyMuPDF)
- Source citations in AI responses
- Input validation and rate limiting for safety
- Docker Compose for easy local deployment
- Health-check endpoint at `/health`

Repository layout
```
PDFGeek/
├── backend/                # Flask backend and services
├── frontend/               # React frontend (create-react-app)
├── docker-compose.yml      # Docker Compose configuration
└── requirements.txt        # Python dependencies
```

Quick start (Docker)

1. Clone the repository

```bash
git clone https://github.com/A-Kumar14/PDF-Geek.git
cd PDF-Geek
```

2. Add environment variables

```bash
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

3. Start services

```bash
docker-compose up --build
```

Open the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health: http://localhost:5000/health

Manual backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
python app.py
```

Manual frontend setup

```bash
cd frontend
npm install
npm start
```

Configuration
- Place `OPENAI_API_KEY` in a `.env` file at the project root or in `backend/`.
- Optional env vars: `FLASK_DEBUG`, `FLASK_HOST`, `FLASK_PORT`, `LOG_LEVEL`.

API endpoints
| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/upload` | POST | Upload and analyze a PDF |
