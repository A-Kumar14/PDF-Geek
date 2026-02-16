"""PII masking utility with pre-compiled regex patterns."""

import re

# Pre-compiled patterns for common PII
_EMAIL_RE = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
_PHONE_RE = re.compile(
    r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
)
_SSN_RE = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
_ADDRESS_RE = re.compile(
    r'\b\d{1,5}\s+(?:[A-Z][a-z]+\s?){1,4}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Ct|Court|Way|Pl|Place)\.?\b',
    re.IGNORECASE,
)

_PATTERNS = [
    (_EMAIL_RE, "[EMAIL]"),
    (_PHONE_RE, "[PHONE]"),
    (_SSN_RE, "[SSN]"),
    (_ADDRESS_RE, "[ADDRESS]"),
]


def mask_pii(text):
    """Replace PII matches with placeholder tokens.

    >>> mask_pii("Contact john@email.com or 555-123-4567")
    'Contact [EMAIL] or [PHONE]'
    """
    if not text:
        return text
    for pattern, replacement in _PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def has_pii(text):
    """Quick check whether text contains any PII patterns."""
    if not text:
        return False
    return any(pattern.search(text) for pattern, _ in _PATTERNS)
