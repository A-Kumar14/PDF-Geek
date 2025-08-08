import os
import logging
from typing import List, Dict, Optional
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable is required")
    
    def analyze_document(self, filepath: str, question: str, chat_history: List[Dict]) -> Optional[str]:
        """
        Analyze a PDF document using OpenAI's API with proper error handling
        """
        try:
            if not os.path.exists(filepath):
                logger.error(f"File not found: {filepath}")
                return None
            
            if not question.strip():
                logger.error("Empty question provided")
                return None

            with open(filepath, "rb") as f:
                file_response = self.client.files.create(
                    file=f,
                    purpose="user_data"
                )
            
            
            messages = [
                {
                    "role": 'system',
                    "content": (
                        "You are an AI assistant that analyzes PDF documents. "
                        "Answer questions based only on the content of the uploaded PDF. "
                        "If a question cannot be answered from the document content, "
                        "politely explain that the information is not available in the document. "
                        "Provide clear, concise, and accurate responses."
                    )
                }
            ]
            
            
            for entry in chat_history:
                if entry.get("role") in ["user", "assistant"] and entry.get("content"):
                    messages.append({
                        "role": entry["role"], 
                        "content": entry["content"]
                    })
            
            
            messages.append({
                "role": "user",
                "content": [
                    {"type": "input_file", "file_id": file_response.id},
                    {"type": "input_text", "text": question}
                ]
            })

            response = self.client.responses.create(
                model="gpt-4o-mini",  
                input=messages
            )
            
            logger.info(f"Successfully processed question: {question[:50]}...")
            return response.output_text
            
        except Exception as e:
            logger.error(f"Error during AI analysis: {str(e)}")
            return None
    
    def validate_file(self, filepath: str) -> bool:
        """
        Validate uploaded file
        """
        try:
            if not os.path.exists(filepath):
                return False
            
            #(max 10MB)
            file_size = os.path.getsize(filepath)
            if file_size > 10 * 1024 * 1024:  # 10MB
                return False
            
            
            if not filepath.lower().endswith('.pdf'):
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"File validation error: {str(e)}")
            return False
