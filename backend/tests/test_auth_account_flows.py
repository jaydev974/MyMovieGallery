from __future__ import annotations

import asyncio
import tempfile
import uuid
from collections.abc import Iterator
from pathlib import Path
from typing import NamedTuple

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth import pwd_context
from app.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import User


class AuthTestContext(NamedTuple):
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def auth_context() -> Iterator[AuthTestContext]:
    with tempfile.TemporaryDirectory() as tmpdir:
        database_path = Path(tmpdir) / "auth.sqlite3"
        engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}")
        sessionmaker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

        async def override_get_db():
            async with sessionmaker() as session:
                yield session

        async def setup_database() -> None:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
            async with sessionmaker() as session:
                session.add(
                    User(
                        id=uuid.uuid4(),
                        email="auth@example.com",
                        username="authuser",
                        full_name="Auth User",
                        password_hash=pwd_context.hash("StrongPass123!"),
                        is_private=False,
                        is_active=True,
                        is_verified=False,
                        locale="en",
                        timezone="UTC",
                        marketing_opt_in=False,
                    )
                )
                await session.commit()

        asyncio.run(setup_database())
        app.dependency_overrides[get_db] = override_get_db

        with TestClient(app) as test_client:
            yield AuthTestContext(test_client, sessionmaker)

        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())


@pytest.mark.parametrize("endpoint", ["/api/auth/password-reset/request", "/api/auth/email-verification/request"])
def test_token_requests_expose_debug_tokens(auth_context: AuthTestContext, endpoint: str) -> None:
    response = auth_context.client.post(endpoint, json={"email": "auth@example.com"}, headers={"Host": "localhost"})

    assert response.status_code == 200
    assert response.json()["detail"].startswith("If an account exists")
    assert response.json()["token"]


@pytest.mark.parametrize("endpoint", ["/api/auth/password-reset/request", "/api/auth/email-verification/request"])
def test_token_requests_hide_tokens_in_production(
    auth_context: AuthTestContext,
    monkeypatch: pytest.MonkeyPatch,
    endpoint: str,
) -> None:
    monkeypatch.setattr(settings, "environment", "production")

    response = auth_context.client.post(endpoint, json={"email": "auth@example.com"}, headers={"Host": "example.com"})

    assert response.status_code == 200
    assert response.json()["detail"].startswith("If an account exists")
    assert response.json()["token"] is None


def test_password_reset_updates_password_and_revokes_sessions(auth_context: AuthTestContext) -> None:
    headers = {"Host": "localhost"}

    request_response = auth_context.client.post(
        "/api/auth/password-reset/request",
        json={"email": "auth@example.com"},
        headers=headers,
    )
    token = request_response.json()["token"]

    confirm_response = auth_context.client.post(
        "/api/auth/password-reset/confirm",
        json={"token": token, "password": "NewStrongPass123!"},
        headers=headers,
    )
    assert confirm_response.status_code == 200
    assert confirm_response.json()["detail"] == "Password updated"

    successful_login = auth_context.client.post(
        "/api/auth/login",
        json={"email": "auth@example.com", "password": "NewStrongPass123!"},
        headers=headers,
    )
    assert successful_login.status_code == 200

    failed_login = auth_context.client.post(
        "/api/auth/login",
        json={"email": "auth@example.com", "password": "StrongPass123!"},
        headers=headers,
    )
    assert failed_login.status_code == 401


@pytest.mark.asyncio
async def test_email_verification_marks_user_verified(auth_context: AuthTestContext) -> None:
    headers = {"Host": "localhost"}

    request_response = auth_context.client.post(
        "/api/auth/email-verification/request",
        json={"email": "auth@example.com"},
        headers=headers,
    )
    token = request_response.json()["token"]

    confirm_response = auth_context.client.post(
        "/api/auth/email-verification/confirm",
        json={"token": token},
        headers=headers,
    )
    assert confirm_response.status_code == 200
    assert confirm_response.json()["detail"] == "Email verified"

    async with auth_context.sessionmaker() as session:
        user = await session.scalar(select(User).where(User.email == "auth@example.com"))
        assert user is not None
        assert user.is_verified is True