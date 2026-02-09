# PDFGeek - AI-Powered PDF Assistant

A full-stack intelligent chatbot for analyzing PDF documents using AI. Built with React and Flask, PDFGeek provides a clean web interface where users can upload PDFs, view them live, and chat with the document using OpenAI's language models with RAG (Retrieval-Augmented Generation).

## Features

### RAG-Powered Analysis
- **Smart Chunking**: Documents are split into overlapping chunks for better context retrieval
- **Vector Embeddings**: Uses OpenAI's `text-embedding-3-small` model for semantic search
- **ChromaDB Integration**: Vector storage for efficient similarity search
- **Source Citations**: Responses include references to the source text

### User Experience
- **Quick Actions**: One-click buttons for "Summarize", "Key Takeaways", and "Simplify Language"
- **Skeleton Loading**: Pulsing skeleton loader provides visual feedback during AI processing
- **Auto-Scroll**: Chat automatically scrolls to show new messages
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Drag & Drop**: Simply drag PDF files onto the interface to upload
- **Collapsible Panels**: Resize or collapse the PDF viewer and chat panels

### Security
- **Input Validation**: File type, size, and content validation
- **Rate Limiting**: 20 requests per minute per IP
- **Secure File Handling**: Files are processed and deleted immediately
- **Environment Variables**: API keys stored securely in environment

### Developer Features
- **Modular Architecture**: Clean separation between services
- **Docker Support**: Easy deployment with Docker Compose
- **Health Monitoring**: `/health` endpoint for service monitoring
- **Comprehensive Logging**: Structured logs for debugging

---

## Architecture

```
PDFGeek/
├── backend/
│   ├── services/
│   │   ├── ai_service.py     # OpenAI integration + embeddings
│   │   └── pdf_service.py    # PDF extraction + chunking
│   ├── config.py             # Configuration management
│   └── app.py                # Flask app with RAG pipeline
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   └── App.js            # Main application
│   └── public/
├── requirements.txt          # Python dependencies
└── docker-compose.yml        # Container orchestration
```

---

## Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/A-Kumar14/PDF-Geek.git
   cd PDF-Geek
   ```

2. **Set up environment variables**
   ```bash
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Option 2: Manual Setup

#### Backend Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variable
export OPENAI_API_KEY=your_openai_api_key_here

# Run the backend
cd backend
python app.py
```

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## Configuration

### Environment Variables

Create a `.env` file in the root or backend directory:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
FLASK_DEBUG=False
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
LOG_LEVEL=INFO
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/upload` | POST | Upload PDF and ask questions |

### Response Format

```json
{
  "message": "Document processed successfully",
  "text": "Extracted document text...",
  "answer": "AI-generated response...",
  "file_info": {
    "filename": "document.pdf",
    "size_mb": 1.5,
    "page_count": 10
  },
  "sources": [
    {"index": 1, "excerpt": "Relevant text from document..."},
    {"index": 2, "excerpt": "Another relevant section..."}
  ]
}
```

---

## How It Works

1. **Upload**: User uploads a PDF document
2. **Extract**: Text is extracted using pdfplumber/PyMuPDF
3. **Chunk**: Document is split into overlapping chunks (1000 chars, 200 overlap)
4. **Embed**: Chunks are converted to vectors using OpenAI embeddings
5. **Store**: Vectors are stored in ChromaDB
6. **Query**: User's question is embedded and similar chunks are retrieved
7. **Answer**: Top 5 relevant chunks are sent to GPT-4o-mini for response generation
8. **Cite**: Response includes source citations from the document

---

## Development

### Running Tests

```bash
cd backend
python -m pytest
```

### Dependencies

**Backend (Python)**
- Flask 3.1.1
- OpenAI >= 1.0.0
- ChromaDB >= 0.4.0
- pdfplumber, PyMuPDF

**Frontend (Node.js)**
- React
- react-markdown
- rehype-highlight

---

## Deployment

### Docker Deployment

```bash
docker-compose up --build -d
```

### Production Considerations

- Set `FLASK_DEBUG=False`
- Use a proper secret key
- Configure CORS for your domain
- Set up SSL/TLS
- Use a production WSGI server (gunicorn)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see LICENSE file for details.

---

**Made by A-Kumar14**
