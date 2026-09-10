from __future__ import annotations

import asyncio
import tempfile
import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth import REFRESH_TOKEN_COOKIE_NAME, pwd_context
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import User

_AUTH_REMEMBER_ME_COOKIE_NAME = "mmg-auth-remember-me"


@pytest.fixture()
def client() -> Iterator[TestClient]:
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
                        is_verified=True,
                        locale="en",
                        timezone="UTC",
                        marketing_opt_in=False,
                    )
                )
                await session.commit()

        asyncio.run(setup_database())
        app.dependency_overrides[get_db] = override_get_db

        with TestClient(app) as test_client:
            yield test_client

        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())


def _set_cookie_header(headers: object) -> str:
    # httpx exposes get_list(); keep a small fallback for compatibility.
    if hasattr(headers, "get_list"):
        values = headers.get_list("set-cookie")
        return values[-1] if values else ""
    return getattr(headers, "get", lambda *_: "")("set-cookie", "")


def test_login_refresh_and_logout_flow(client: TestClient) -> None:
    headers = {"Host": "localhost"}

    login_response = client.post(
        "/api/auth/login",
        json={"email": "auth@example.com", "password": "StrongPass123!", "remember_me": False},
        headers=headers,
    )
    assert login_response.status_code == 200
    login_body = login_response.json()
    assert login_body["token_type"] == "bearer"
    assert login_body["user"]["is_verified"] is True
    assert client.cookies.get(REFRESH_TOKEN_COOKIE_NAME)

    set_cookie = _set_cookie_header(login_response.headers)
    assert REFRESH_TOKEN_COOKIE_NAME in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Path=/" in set_cookie
    assert "SameSite=Lax" in set_cookie
    assert "Max-Age=" not in set_cookie

    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["is_verified"] is True

    refresh_response = client.post("/api/auth/refresh", headers=headers)
    assert refresh_response.status_code == 200
    refresh_body = refresh_response.json()
    assert refresh_body["access_token"] != login_body["access_token"]
    assert refresh_body["user"]["email"] == "auth@example.com"
    assert refresh_body["user"]["is_verified"] is True

    refresh_set_cookie = _set_cookie_header(refresh_response.headers)
    assert REFRESH_TOKEN_COOKIE_NAME in refresh_set_cookie
    assert "Max-Age=" not in refresh_set_cookie

    logout_response = client.post("/api/auth/logout", headers=headers)
    assert logout_response.status_code == 200
    assert logout_response.json()["detail"] == "Logged out"
    assert client.cookies.get(REFRESH_TOKEN_COOKIE_NAME) is None
    assert client.cookies.get(_AUTH_REMEMBER_ME_COOKIE_NAME) is None

    expired_refresh = client.post("/api/auth/refresh", headers=headers)
    assert expired_refresh.status_code == 401


def test_register_returns_unverified_account(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New User",
            "email": "newuser@example.com",
            "password": "StrongPass123!",
            "is_private": False,
            "remember_me": True,
        },
        headers={"Host": "localhost"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "newuser@example.com"
    assert body["user"]["is_verified"] is False

    set_cookie = _set_cookie_header(response.headers)
    assert REFRESH_TOKEN_COOKIE_NAME in set_cookie
    assert "Max-Age=" in set_cookie
