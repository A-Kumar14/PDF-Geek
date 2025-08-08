# 🧠 PDFGeek - AI-Powered PDF Analysis

A full-stack intelligent chatbot for analyzing PDF documents using AI. Built with React and Flask, it provides a clean web interface where users can upload PDFs, view them live, and chat with the document using OpenAI's language models.

## ✨ New Features & Improvements

### 🔒 **Security Enhancements**
- **Input validation** and sanitization to prevent XSS attacks
- **Rate limiting** to prevent abuse (20 requests per minute)
- **File validation** with size and type checks
- **Secure file handling** with automatic cleanup
- **CORS configuration** for production deployment

### 🚀 **Performance Improvements**
- **Service layer architecture** for better code organization
- **Multiple PDF extraction methods** (pdfplumber + PyMuPDF)
- **Error handling** with proper logging
- **Health check endpoint** for monitoring
- **Docker containerization** for easy deployment

### 🎨 **User Experience**
- **Toast notifications** for user feedback
- **Loading spinners** with better visual feedback
- **Error boundaries** for graceful error handling
- **Dark mode** support
- **Responsive design** for mobile devices
- **File validation** with helpful error messages

### 🔧 **Developer Experience**
- **Modular architecture** with separate services
- **Configuration management** with environment variables
- **Comprehensive logging** for debugging
- **Docker support** for consistent environments
- **Health monitoring** endpoints

---

## 🏗️ Architecture

```
PDFGeek/
├── backend/
│   ├── services/          # Business logic layer
│   │   ├── ai_service.py  # OpenAI integration
│   │   └── pdf_service.py # PDF processing
│   ├── utils/             # Utility functions
│   │   ├── validators.py  # Input validation
│   │   └── rate_limiter.py # Rate limiting
│   ├── config.py          # Configuration management
│   └── app.py            # Flask application
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ErrorBoundary.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── Toast.js
│   │   └── App.js        # Main application
│   └── public/
└── docker-compose.yml     # Container orchestration
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/PDFGeek.git
   cd PDFGeek
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**
   ```bash
   # Create .env file in backend directory
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

5. **Run the backend**
   ```bash
   python app.py
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
FLASK_DEBUG=False
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
LOG_LEVEL=INFO
RATE_LIMIT_REQUESTS=20
RATE_LIMIT_WINDOW=60
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/upload` | POST | Upload and analyze PDF |

### Request Format

```json
{
  "pdf": "file",
  "question": "What is this document about?",
  "chatHistory": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous answer"}
  ]
}
```

---

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
python -m flake8 .

# Frontend linting
cd frontend
npm run lint
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build

# Docker build
docker-compose -f docker-compose.prod.yml up --build
```

---

## 📊 Monitoring & Logging

### Health Check
- Endpoint: `GET /health`
- Returns application status and version

### Logging
- Structured logging with timestamps
- Different log levels (INFO, WARNING, ERROR)
- Request/response logging

### Error Handling
- Graceful error handling with user-friendly messages
- Rate limit exceeded notifications
- File validation errors
- API error responses

---

## 🔒 Security Features

### Input Validation
- File type validation (PDF only)
- File size limits (10MB max)
- Question length limits (1000 characters)
- XSS prevention with input sanitization

### Rate Limiting
- 20 requests per minute per IP
- Configurable limits via environment variables
- Automatic cleanup of old requests

### File Security
- Secure filename handling
- Automatic file cleanup after processing
- Temporary file storage with timestamps

---

## 🚀 Deployment

### Docker Deployment

1. **Production build**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```

2. **Environment variables**
   ```bash
   # Set production environment variables
   export OPENAI_API_KEY=your_production_key
   export FLASK_ENV=production
   export SECRET_KEY=your_secret_key
   ```

### Cloud Deployment

#### Heroku
```bash
# Create Heroku app
heroku create your-pdfgeek-app

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key
heroku config:set FLASK_ENV=production

# Deploy
git push heroku main
```

#### AWS/GCP/Azure
- Use the provided Dockerfile
- Set up environment variables
- Configure load balancer and SSL

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- Flask and React communities for excellent documentation
- Contributors and users for feedback and suggestions

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/PDFGeek/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/PDFGeek/discussions)
- **Email**: your-email@example.com

---

**Made with ❤️ by the PDFGeek team**
