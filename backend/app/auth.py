from __future__ import annotations

import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from hashlib import sha256

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.models import RefreshToken, User
from app.rate_limit import limiter

router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
JWT_ALGORITHM = settings.jwt_algorithm
JWT_SECRET_KEY = settings.jwt_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days
REFRESH_TOKEN_COOKIE_NAME = "mmg-refresh-token"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    is_private: bool = False


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
    avatar_url: str | None = None
    is_private: bool


class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    bio: str | None = Field(default=None, max_length=2000)
    location: str | None = Field(default=None, max_length=180)
    avatar_url: str | None = Field(default=None, max_length=512)
    is_private: bool | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class LogoutResponse(BaseModel):
    detail: str


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        name=user.full_name or user.username,
        joined_date=user.created_at,
        bio=user.bio,
        location=user.location,
        avatar_url=user.avatar_url,
        is_private=user.is_private,
    )


def _create_access_token(user_id: uuid.UUID) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def _create_refresh_token_value() -> str:
    return secrets.token_urlsafe(48)


def _hash_refresh_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def _refresh_cookie_kwargs() -> dict[str, object]:
    is_production = settings.environment == "production"
    return {
        "httponly": True,
        "secure": is_production,
        "samesite": "none" if is_production else "lax",
        "path": "/",
        "max_age": int(timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()),
    }


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        refresh_token,
        **_refresh_cookie_kwargs(),
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_TOKEN_COOKIE_NAME, path="/")


async def _store_refresh_token(session: AsyncSession, user_id: uuid.UUID) -> tuple[str, RefreshToken]:
    refresh_token_value = _create_refresh_token_value()
    refresh_token = RefreshToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token_hash=_hash_refresh_token(refresh_token_value),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    session.add(refresh_token)
    await session.flush()
    return refresh_token_value, refresh_token


async def _issue_auth_response(response: Response, session: AsyncSession, user: User) -> AuthResponse:
    refresh_token_value, _ = await _store_refresh_token(session, user.id)
    await session.commit()
    _set_refresh_cookie(response, refresh_token_value)
    return AuthResponse(
        access_token=_create_access_token(user.id),
        token_type="bearer",
        user=_user_response(user),
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


async def _load_refresh_token(session: AsyncSession, refresh_token_value: str) -> RefreshToken | None:
    refresh_token = await session.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == _hash_refresh_token(refresh_token_value))
    )
    if refresh_token is None:
        return None
    now = datetime.now(timezone.utc)
    if refresh_token.revoked_at is not None or refresh_token.expires_at <= now:
        return None
    user = await session.scalar(select(User).where(User.id == refresh_token.user_id, User.deleted_at.is_(None)))
    if user is None or not user.is_active:
        return None
    return refresh_token


async def _refresh_user_session(session: AsyncSession, refresh_token: RefreshToken) -> tuple[User, str]:
    user = await session.scalar(select(User).where(User.id == refresh_token.user_id, User.deleted_at.is_(None)))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account unavailable")

    new_refresh_value, new_refresh_record = await _store_refresh_token(session, user.id)
    refresh_token.revoked_at = datetime.now(timezone.utc)
    refresh_token.replaced_by_token_id = new_refresh_record.id
    await session.commit()
    return user, new_refresh_value


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    payload: RegisterRequest,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
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
        is_private=payload.is_private,
    )
    session.add(user)
    try:
        await session.commit()
        await session.refresh(user)
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unable to create this account") from error

    return await _issue_auth_response(response, session, user)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
    email = str(payload.email).casefold()
    user = await session.scalar(select(User).where(User.email == email, User.deleted_at.is_(None)))
    if user is None or not user.password_hash or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive")

    user.last_login_at = datetime.now(timezone.utc)
    await session.commit()
    return await _issue_auth_response(response, session, user)


@router.post("/refresh", response_model=AuthResponse)
@limiter.limit("20/minute")
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_TOKEN_COOKIE_NAME),
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")

    refresh_record = await _load_refresh_token(session, refresh_token)
    if refresh_record is None:
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user, new_refresh_value = await _refresh_user_session(session, refresh_record)
    _set_refresh_cookie(response, new_refresh_value)
    await session.refresh(user)
    return AuthResponse(
        access_token=_create_access_token(user.id),
        token_type="bearer",
        user=_user_response(user),
    )


@router.post("/logout", response_model=LogoutResponse)
@limiter.limit("20/minute")
async def logout(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_TOKEN_COOKIE_NAME),
    session: AsyncSession = Depends(get_db),
) -> LogoutResponse:
    if refresh_token:
        refresh_record = await session.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == _hash_refresh_token(refresh_token))
        )
        if refresh_record is not None and refresh_record.revoked_at is None:
            refresh_record.revoked_at = datetime.now(timezone.utc)
            await session.commit()
    _clear_refresh_cookie(response)
    return LogoutResponse(detail="Logged out")


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


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_db),
) -> User | None:
    """Resolve a viewer when present without turning public profile views into auth failures."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = uuid.UUID(str(payload.get("sub")))
    except (JWTError, ValueError, TypeError):
        return None
    return await session.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None), User.is_active.is_(True)))


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
    user.avatar_url = payload.avatar_url
    if payload.is_private is not None:
        user.is_private = payload.is_private
    await session.commit()
    await session.refresh(user)
    return _user_response(user)
