"""Synchronous SQLAlchemy session for Celery workers (no async context needed)."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SYNC_DATABASE_URL = os.getenv(
    "SYNC_DATABASE_URL",
    "sqlite:///./instance/users.db",
)

sync_engine = create_engine(
    SYNC_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SyncSession = sessionmaker(bind=sync_engine, expire_on_commit=False)
