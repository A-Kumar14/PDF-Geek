"""Input validation helpers — moved from app.py + prompt injection detection."""

import re


class InputValidator:
    """Minimal input validation helpers for upload endpoint."""

    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".mp3", ".wav", ".m4a", ".webm", ".ogg"}
    MAX_QUESTION_LENGTH = 2000

    @classmethod
    def validate_file_upload(cls, file):
        if file is None:
            return False, "No file provided"
        filename = getattr(file, "filename", "") or ""
        if filename.strip() == "":
            return False, "No file selected"
        lower = filename.lower()
        if not any(lower.endswith(ext) for ext in cls.ALLOWED_EXTENSIONS):
            return False, "Unsupported file type. Allowed: PDF, DOCX, TXT, PNG, JPG, MP3, WAV, M4A"
        return True, ""

    @classmethod
    def validate_question(cls, question: str):
        if not question or not question.strip():
            return False, "Question cannot be empty"
        if len(question) > cls.MAX_QUESTION_LENGTH:
            return False, "Question is too long"
        return True, ""

    @staticmethod
    def sanitize_input(text: str) -> str:
        return text.strip()

    @classmethod
    def validate_chat_history(cls, history):
        if history is None:
            return True, ""
        if not isinstance(history, list):
            return False, "Chat history must be a list"
        for item in history:
            if not isinstance(item, dict):
                return False, "Invalid chat history entry"
            role = item.get("role")
            content = item.get("content")
            if role not in ("user", "assistant"):
                return False, "Invalid role in chat history"
            if not isinstance(content, str):
                return False, "Invalid content in chat history"
        return True, ""


# Pre-compiled patterns for common prompt injection attempts
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+", re.IGNORECASE),
    re.compile(r"forget\s+(all\s+)?(your\s+)?instructions", re.IGNORECASE),
    re.compile(r"<\|im_start\|>", re.IGNORECASE),
    re.compile(r"\[INST\]", re.IGNORECASE),
    re.compile(r"system\s*:\s*you\s+are", re.IGNORECASE),
    re.compile(r"override\s+(system|safety)\s+(prompt|instructions)", re.IGNORECASE),
    re.compile(r"do\s+not\s+follow\s+(your|the)\s+(rules|instructions)", re.IGNORECASE),
]


def check_prompt_injection(text):
    """Detect common prompt injection patterns.

    Returns True if a suspicious pattern is found. This is defense-in-depth;
    the function logs a warning but does not block the request.
    """
    if not text:
        return False
    return any(pattern.search(text) for pattern in _INJECTION_PATTERNS)
