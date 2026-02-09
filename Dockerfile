# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/

# Create uploads directory
RUN mkdir -p backend/uploads

# Set working directory to backend so relative imports work
WORKDIR /app/backend

ENV PYTHONPATH=/app/backend
ENV FLASK_ENV=production

# Render provides PORT; default to 5000 for local Docker
ENV PORT=5000
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Run with gunicorn (production WSGI server)
CMD gunicorn app:app --bind 0.0.0.0:${PORT} --workers 2 --timeout 120
