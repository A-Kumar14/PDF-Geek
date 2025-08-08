import os
import json
import logging
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
from services.ai_service import AIService
from services.pdf_service import PDFService
from utils.validators import InputValidator
from utils.rate_limiter import IPRateLimiter

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)


CORS(app, origins=[
    "http://localhost:3000",
    "http://localhost:3001"
])

ai_service = AIService()
pdf_service = PDFService()
rate_limiter = IPRateLimiter()

UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.before_request
def before_request():
    """Log all requests and check rate limits"""
    client_ip = request.remote_addr
    logger.info(f"Request from {client_ip}: {request.method} {request.path}")
    

    if request.path == '/upload':
        is_allowed, remaining = rate_limiter.is_allowed(client_ip)
        if not is_allowed:
            remaining_time = rate_limiter.get_remaining_time(client_ip)
            return jsonify({
                "error": "Rate limit exceeded",
                "remaining_time": remaining_time,
                "message": f"Too many requests. Try again in {remaining_time} seconds."
            }), 429

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }), 200

@app.route('/upload', methods=['POST'])
def upload_pdf():
    """Handle PDF upload and analysis"""
    try:
        if 'pdf' not in request.files:
            logger.warning("No PDF file in request")
            return jsonify({"error": "No PDF file provided"}), 400
        
        file = request.files['pdf']
        is_valid, error_msg = InputValidator.validate_file_upload(file)
        
        if not is_valid:
            logger.warning(f"File validation failed: {error_msg}")
            return jsonify({"error": error_msg}), 400

        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
        
        try:
            file.save(filepath)
            logger.info(f"File saved: {filepath}")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            return jsonify({"error": "Failed to save file"}), 500

        file_info = pdf_service.get_file_info(filepath)
        if not file_info:
            return jsonify({"error": "Failed to process file"}), 500

        extracted_text = pdf_service.extract_text(filepath)
        if not extracted_text:
            return jsonify({"error": "Failed to extract text from PDF"}), 500

        question = request.form.get("question", "").strip()
        is_valid, error_msg = InputValidator.validate_question(question)
        
        if not is_valid:
            return jsonify({"error": error_msg}), 400

        question = InputValidator.sanitize_input(question)

        chat_history_str = request.form.get("chatHistory", "[]")
        try:
            chat_history = json.loads(chat_history_str)
        except json.JSONDecodeError:
            logger.warning("Invalid chat history format")
            return jsonify({"error": "Invalid chat history format"}), 400

        is_valid, error_msg = InputValidator.validate_chat_history(chat_history)
        if not is_valid:
            return jsonify({"error": error_msg}), 400

        logger.info(f"Starting AI analysis for question: {question[:50]}...")
        ai_response = ai_service.analyze_document(filepath, question, chat_history)
        
        if not ai_response:
            logger.error("AI analysis failed")
            return jsonify({"error": "Failed to generate AI response"}), 500

        try:
            os.remove(filepath)
            logger.info(f"Cleaned up file: {filepath}")
        except Exception as e:
            logger.warning(f"Failed to clean up file {filepath}: {str(e)}")

        response_data = {
            "message": "Document processed successfully",
            "text": extracted_text,
            "answer": ai_response,
            "file_info": file_info
        }
        
        logger.info("Request processed successfully")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Unexpected error in upload endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({"error": "File too large (max 10MB)"}), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY environment variable is required")
        exit(1)
    
    logger.info("Starting PDFGeek backend server...")
    app.run(debug=False, host='0.0.0.0', port=5000)
