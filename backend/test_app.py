import unittest
import tempfile
import os
from app import app
from services.pdf_service import PDFService
from utils.validators import InputValidator

class TestPDFGeek(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        self.pdf_service = PDFService()
        self.validator = InputValidator()

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'healthy')

    def test_upload_endpoint_no_file(self):
        """Test upload endpoint without file"""
        response = self.app.post('/upload')
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)

    def test_question_validation(self):
        """Test question validation"""
        is_valid, error = self.validator.validate_question("What is this document about?")
        self.assertTrue(is_valid)
        self.assertEqual(error, "")

        is_valid, error = self.validator.validate_question("")
        self.assertFalse(is_valid)
        self.assertIn("empty", error)

        long_question = "A" * 1001
        is_valid, error = self.validator.validate_question(long_question)
        self.assertFalse(is_valid)
        self.assertIn("too long", error)

    def test_chat_history_validation(self):
        """Test chat history validation"""
        valid_history = [
            {"role": "user", "content": "What is this?"},
            {"role": "assistant", "content": "This is a document."}
        ]
        is_valid, error = self.validator.validate_chat_history(valid_history)
        self.assertTrue(is_valid)
        self.assertEqual(error, "")

        invalid_history = [{"role": "invalid", "content": "test"}]
        is_valid, error = self.validator.validate_chat_history(invalid_history)
        self.assertFalse(is_valid)
        self.assertIn("Invalid role", error)

    def test_pdf_service_validation(self):
        """Test PDF service file validation"""
        is_valid = self.pdf_service._validate_file("non_existent.pdf")
        self.assertFalse(is_valid)

        # Test with valid file path (but file doesn't exist)
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f:
            f.write(b"test content")
            temp_file = f.name

        is_valid = self.pdf_service._validate_file(temp_file)
        self.assertFalse(is_valid)
        
        os.unlink(temp_file)

if __name__ == '__main__':
    unittest.main()
