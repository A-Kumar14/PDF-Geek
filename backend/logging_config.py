"""Structured logging configuration using structlog."""

import logging
import os
import sys

import structlog


def _mask_pii_processor(logger, method_name, event_dict):
    """structlog processor that masks PII in log event messages."""
    from utils.pii import mask_pii

    if "event" in event_dict and isinstance(event_dict["event"], str):
        event_dict["event"] = mask_pii(event_dict["event"])
    return event_dict


def configure_logging():
    """Set up structlog with JSON output in production, console in dev."""
    env = os.getenv("FLASK_ENV", "development")
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    is_production = env == "production"

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        _mask_pii_processor,
    ]

    if is_production:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(getattr(logging, log_level, logging.INFO))

    # Quiet noisy libraries
    for lib in ("urllib3", "celery.worker", "celery.redirected"):
        logging.getLogger(lib).setLevel(logging.WARNING)


def get_logger(name):
    """Drop-in replacement for logging.getLogger() that returns a structlog logger."""
    configure_logging()
    return structlog.get_logger(name)
