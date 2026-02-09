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
<<<<<<< HEAD

    def answer_from_context(
        self,
        context_chunks: List[str],
        question: str,
        chat_history: List[Dict],
    ) -> Optional[str]:
        """
        Answer the question using only the provided context chunks (no file upload).
        Used for RAG: relevant chunks are retrieved from ChromaDB and passed here.
        """
        try:
            if not question.strip():
                logger.error("Empty question provided")
                return None

            context = "\n\n---\n\n".join(context_chunks) if context_chunks else ""

            system_content = (
                "You are an AI assistant that answers questions based only on the provided document excerpts. "
                "Use only the context below to answer. If the answer is not in the context, "
                "say so clearly. Provide clear, concise, and accurate responses."
            )

            messages = [
                {"role": "system", "content": system_content},
                {"role": "user", "content": f"Context from the document:\n\n{context}\n\n---\n\nQuestion: {question}"},
            ]

            if chat_history:
                history_messages = []
                for entry in chat_history:
                    if entry.get("role") in ("user", "assistant") and entry.get("content"):
                        history_messages.append(
                            {"role": entry["role"], "content": entry["content"]}
                        )
                messages = [messages[0]] + history_messages + [messages[1]]

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
            )
            answer = response.choices[0].message.content
            logger.info(f"Answered from context ({len(context_chunks)} chunks)")
            return answer

        except Exception as e:
            logger.error(f"Error in answer_from_context: {str(e)}")
            return None

    def get_embeddings(self, text_list: List[str]) -> List[List[float]]:
        """Return list of embedding vectors, one per item in text_list."""
        if not text_list:
            return []
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text_list,
            encoding_format="float",
        )
        return [item.embedding for item in response.data]


=======
    
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
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
