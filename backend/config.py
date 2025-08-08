import os
from dotenv import load_dotenv

load_dotenv()

class Config:

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "1000"))

    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    HOST = os.getenv("FLASK_HOST", "0.0.0.0")
    PORT = int(os.getenv("FLASK_PORT", "5000"))

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    ALLOWED_EXTENSIONS = {'.pdf'}

    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "20"))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://pdf-geek.vercel.app",
        "https://production-domain.com" 
    ]
    
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    @classmethod
    def validate(cls):
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        if not cls.OPENAI_API_KEY.startswith('sk-'):
            raise ValueError("Invalid OpenAI API key format")
        
        return True
    
    @classmethod
    def get_cors_origins(cls):
        cors_origins = os.getenv("CORS_ORIGINS")
        if cors_origins:
            return [origin.strip() for origin in cors_origins.split(",")]
        return cls.CORS_ORIGINS
