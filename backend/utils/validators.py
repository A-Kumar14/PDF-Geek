import re
import os
from typing import Optional, Dict, Any
from werkzeug.utils import secure_filename

class InputValidator:
    """Utility class for input validation and sanitization"""
    
    @staticmethod
    def validate_question(question: str) -> tuple[bool, str]:
        """
        Validate user question
        Returns: (is_valid, error_message)
        """
        if not question or not question.strip():
            return False, "Question cannot be empty"
        
        if len(question.strip()) > 1000:
            return False, "Question too long (max 1000 characters)"
        
        # Check for potentially harmful content
        harmful_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'data:text/html',
            r'vbscript:',
            r'onload=',
            r'onerror='
        ]
        
        for pattern in harmful_patterns:
            if re.search(pattern, question, re.IGNORECASE):
                return False, "Question contains potentially harmful content"
        
        return True, ""
    
    @staticmethod
    def validate_chat_history(chat_history: list) -> tuple[bool, str]:
        """
        Validate chat history format
        Returns: (is_valid, error_message)
        """
        if not isinstance(chat_history, list):
            return False, "Chat history must be a list"
        
        if len(chat_history) > 50:  # Limit chat history length
            return False, "Chat history too long"
        
        for entry in chat_history:
            if not isinstance(entry, dict):
                return False, "Invalid chat history entry format"
            
            if 'role' not in entry or 'content' not in entry:
                return False, "Chat history entries must have 'role' and 'content'"
            
            if entry['role'] not in ['user', 'assistant']:
                return False, "Invalid role in chat history"
            
            if not isinstance(entry['content'], str):
                return False, "Content must be a string"
        
        return True, ""
    
    @staticmethod
    def validate_file_upload(file) -> tuple[bool, str]:
        """
        Validate uploaded file
        Returns: (is_valid, error_message)
        """
        if not file:
            return False, "No file uploaded"
        
        if file.filename == '':
            return False, "No file selected"
        
        # Check file extension
        allowed_extensions = {'.pdf'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            return False, f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        
        # Check file size (10MB limit)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)  # Reset file pointer
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            return False, "File too large (max 10MB)"
        
        # Sanitize filename
        filename = secure_filename(file.filename)
        if not filename:
            return False, "Invalid filename"
        
        return True, ""
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """
        Sanitize user input to prevent XSS
        """
        if not text:
            return ""
        
        # Remove potentially dangerous HTML tags
        dangerous_tags = ['<script>', '</script>', '<iframe>', '</iframe>', '<object>', '</object>']
        sanitized = text
        for tag in dangerous_tags:
            sanitized = sanitized.replace(tag, '')
        
        # Remove javascript: protocol
        sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
        
        return sanitized.strip()
    
    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validate OpenAI API key format
        """
        if not api_key:
            return False
        
        # Basic format validation for OpenAI API keys
        if not api_key.startswith('sk-'):
            return False
        
        if len(api_key) < 20:
            return False
        
        return True
