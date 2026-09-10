from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_alembic_head_includes_refresh_token_remember_me(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "remember_me.sqlite3"
    database_url = f"sqlite+aiosqlite:///{database_path}"
    monkeypatch.setenv("DATABASE_URL", database_url)

    backend_root = Path(__file__).resolve().parents[1]
    alembic_cfg = Config(str(backend_root / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(alembic_cfg, "head")

    sync_engine = create_engine(f"sqlite:///{database_path}")
    try:
        columns = {column["name"] for column in inspect(sync_engine).get_columns("refresh_tokens")}
    finally:
        sync_engine.dispose()

    assert "remember_me" in columns
