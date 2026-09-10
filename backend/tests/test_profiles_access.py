from __future__ import annotations

import asyncio
import tempfile
import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth import get_optional_current_user
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import User


@pytest.fixture()
def client() -> Iterator[TestClient]:
    with tempfile.TemporaryDirectory() as tmpdir:
        database_path = Path(tmpdir) / "profiles.sqlite3"
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
                        email="private@example.com",
                        username="privateuser",
                        full_name="Private User",
                        is_private=True,
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
        app.dependency_overrides[get_optional_current_user] = lambda: None

        with TestClient(app) as test_client:
            yield test_client

        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())


def test_private_profile_is_redacted(client: TestClient) -> None:
    response = client.get("/api/users/privateuser", headers={"Host": "localhost"})

    assert response.status_code == 200
    body = response.json()
    assert body["is_private"] is True
    assert body["is_owner"] is False
    assert body["restricted"] is True
    assert body["bio"] is None
    assert body["location"] is None
    assert body["watched"] == []
    assert body["favorites"] == []
    assert body["rated"] == []


def test_private_watched_view_is_forbidden(client: TestClient) -> None:
    response = client.get("/api/users/privateuser/watched", headers={"Host": "localhost"})

    assert response.status_code == 403
    assert response.json()["detail"] == "This account is private"
