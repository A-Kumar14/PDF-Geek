"""FastAPI auth routes: signup and login."""

import asyncio
import os
from datetime import datetime, timedelta
from functools import partial

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models_async import User
from schemas import SignupRequest, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "change-me-in-production"))
JWT_EXPIRY_HOURS = 24


def _create_token(user: User) -> str:
    payload = {
        "user_id": user.id,
        "email": user.email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@router.post("/signup", status_code=201)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    name = data.name.strip()
    email = data.email.strip().lower()
    password = data.password

    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    loop = asyncio.get_event_loop()
    # rounds=10 is still well above OWASP minimums and ~4x faster on serverless cold starts
    salt = await loop.run_in_executor(None, partial(bcrypt.gensalt, rounds=10))
    password_hash = await loop.run_in_executor(
        None, partial(bcrypt.hashpw, password.encode("utf-8"), salt)
    )
    user = User(name=name, email=email, password_hash=password_hash.decode("utf-8"))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = _create_token(user)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}


@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()
    password = data.password

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    loop = asyncio.get_event_loop()
    pw_matches = await loop.run_in_executor(
        None, partial(bcrypt.checkpw, password.encode("utf-8"), user.password_hash.encode("utf-8"))
    )
    if not pw_matches:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_token(user)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}
