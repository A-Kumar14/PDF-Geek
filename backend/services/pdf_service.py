import os
import logging
from typing import Optional, List
import pdfplumber

# Try to import PyMuPDF with proper error handling
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    try:
        # Try alternative import
        from PyMuPDF import fitz
        PYMUPDF_AVAILABLE = True
    except ImportError:
        PYMUPDF_AVAILABLE = False
        logging.warning("PyMuPDF not available, using pdfplumber only")

from pathlib import Path

logger = logging.getLogger(__name__)

class PDFService:
    def __init__(self):
        self.supported_extensions = ['.pdf']
        self.max_file_size = 10 * 1024 * 1024  # 10MB
    
    def extract_text(self, filepath: str) -> Optional[str]:
        """
        Extract text from PDF using multiple methods for better accuracy
        """
        try:
            # Validate file
            if not self._validate_file(filepath):
                return None
            
            # Try multiple extraction methods
            text = self._extract_with_pdfplumber(filepath)
            if not text or len(text.strip()) < 50:  # If text is too short, try PyMuPDF
                if PYMUPDF_AVAILABLE:
                    text = self._extract_with_pymupdf(filepath)
            
            if text:
                logger.info(f"Successfully extracted text from {filepath}")
                return text.strip()
            else:
                logger.error(f"Failed to extract text from {filepath}")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting text from {filepath}: {str(e)}")
            return None
    
    def _extract_with_pdfplumber(self, filepath: str) -> Optional[str]:
        """Extract text using pdfplumber"""
        try:
            full_text = []
            with pdfplumber.open(filepath) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    if text.strip():
                        full_text.append(text.strip())
            return "\n\n".join(full_text)
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {str(e)}")
            return None
    
    def _extract_with_pymupdf(self, filepath: str) -> Optional[str]:
        """Extract text using PyMuPDF as fallback"""
        if not PYMUPDF_AVAILABLE:
            return None
            
        try:
            full_text = []
            doc = fitz.open(filepath)
            for page in doc:
                text = page.get_text()
                if text.strip():
                    full_text.append(text.strip())
            doc.close()
            return "\n\n".join(full_text)
        except Exception as e:
            logger.warning(f"PyMuPDF extraction failed: {str(e)}")
            return None
    
    def _validate_file(self, filepath: str) -> bool:
        """Validate PDF file"""
        try:
            if not os.path.exists(filepath):
                logger.error(f"File not found: {filepath}")
                return False
            
            # Check file size
            file_size = os.path.getsize(filepath)
            if file_size > self.max_file_size:
                logger.error(f"File too large: {file_size} bytes")
                return False
            
            # Check file extension
            file_ext = Path(filepath).suffix.lower()
            if file_ext not in self.supported_extensions:
                logger.error(f"Unsupported file type: {file_ext}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"File validation error: {str(e)}")
            return False
    
    def get_file_info(self, filepath: str) -> Optional[dict]:
        """Get basic information about the PDF file"""
        try:
            if not self._validate_file(filepath):
                return None
            
            file_size = os.path.getsize(filepath)
            file_name = os.path.basename(filepath)
            
            # Get page count using PyMuPDF if available
            page_count = 0
            if PYMUPDF_AVAILABLE:
                try:
                    doc = fitz.open(filepath)
                    page_count = len(doc)
                    doc.close()
                except:
                    page_count = 0
            
            return {
                "filename": file_name,
                "size_bytes": file_size,
                "size_mb": round(file_size / (1024 * 1024), 2),
                "page_count": page_count
            }
            
        except Exception as e:
            logger.error(f"Error getting file info: {str(e)}")
            return None
