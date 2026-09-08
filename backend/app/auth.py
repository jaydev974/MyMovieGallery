from __future__ import annotations

import os
import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "local-development-secret"))
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    username: str
    name: str
    joined_date: datetime
    bio: str | None = None
    location: str | None = None


class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    bio: str | None = Field(default=None, max_length=2000)
    location: str | None = Field(default=None, max_length=180)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        name=user.full_name or user.username,
        joined_date=user.created_at,
        bio=user.bio,
        location=user.location,
    )


def _create_access_token(user_id: uuid.UUID) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def _username_base(name: str, email: str) -> str:
    candidate = re.sub(r"[^a-z0-9]+", "", name.casefold())
    if not candidate:
        candidate = email.split("@", 1)[0].casefold()
    return candidate[:70] or "member"


async def _unique_username(base: str, session: AsyncSession) -> str:
    username = base
    suffix = 2
    while await session.scalar(select(User.id).where(User.username == username)) is not None:
        username = f"{base[:75 - len(str(suffix))]}{suffix}"
        suffix += 1
    return username


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_db)) -> AuthResponse:
    email = str(payload.email).casefold()
    existing_user = await session.scalar(select(User).where(User.email == email))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    username = await _unique_username(_username_base(payload.name, email), session)
    user = User(
        id=uuid.uuid4(),
        email=email,
        username=username,
        full_name=payload.name.strip(),
        password_hash=pwd_context.hash(payload.password),
    )
    session.add(user)
    try:
        await session.commit()
        await session.refresh(user)
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unable to create this account") from error

    return AuthResponse(
        access_token=_create_access_token(user.id),
        token_type="bearer",
        user=_user_response(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db)) -> AuthResponse:
    email = str(payload.email).casefold()
    user = await session.scalar(select(User).where(User.email == email, User.deleted_at.is_(None)))
    if user is None or not user.password_hash or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive")

    user.last_login_at = datetime.now(timezone.utc)
    await session.commit()
    return AuthResponse(
        access_token=_create_access_token(user.id),
        token_type="bearer",
        user=_user_response(user),
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = uuid.UUID(str(payload.get("sub")))
    except (JWTError, ValueError, TypeError) as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from error

    user = await session.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account unavailable")
    return user


@router.get("/me", response_model=UserResponse)
async def current_user(user: User = Depends(get_current_user)) -> UserResponse:
    return _user_response(user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    payload: ProfileUpdateRequest,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserResponse:
    user.full_name = payload.name.strip()
    user.bio = payload.bio
    user.location = payload.location
    await session.commit()
    await session.refresh(user)
    return _user_response(user)
