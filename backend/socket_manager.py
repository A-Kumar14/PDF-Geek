"""Socket.IO server for real-time document indexing progress.

Architecture:
  Celery Worker → redis.publish('indexing_progress', JSON)
                → AsyncRedisManager (python-socketio) fan-out
                → Browser Socket.IO client

The Socket.IO app is mounted at /socket.io in main.py.
Celery workers use socketio.RedisManager(write_only=True) to emit directly.
"""

import os

import socketio
from config import Config

REDIS_URL = Config.REDIS_URL

# AsyncServer with Redis pub/sub fan-out via AsyncRedisManager.
# Falls back gracefully if Redis is unavailable (AsyncServer without manager).
try:
    sio = socketio.AsyncServer(
        async_mode="asgi",
        client_manager=socketio.AsyncRedisManager(REDIS_URL),
        cors_allowed_origins="*",
        logger=False,
        engineio_logger=False,
    )
except Exception:
    # Redis unavailable — use in-memory (no cross-worker fan-out)
    sio = socketio.AsyncServer(
        async_mode="asgi",
        cors_allowed_origins="*",
        logger=False,
        engineio_logger=False,
    )

# Wrap as ASGI app for mounting in FastAPI
socket_app = socketio.ASGIApp(sio, socketio_path="")


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def disconnect(sid):
    pass


@sio.event
async def join(sid, data):
    """Client joins a task-specific room to receive progress events."""
    room = data.get("room") if isinstance(data, dict) else str(data)
    if room:
        await sio.enter_room(sid, room)
