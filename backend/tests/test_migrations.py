from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_alembic_head_creates_account_token_tables(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "migrations.sqlite3"
    database_url = f"sqlite+aiosqlite:///{database_path}"
    monkeypatch.setenv("DATABASE_URL", database_url)

    backend_root = Path(__file__).resolve().parents[1]
    alembic_cfg = Config(str(backend_root / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(alembic_cfg, "head")

    sync_engine = create_engine(f"sqlite:///{database_path}")
    try:
        inspector = inspect(sync_engine)
        table_names = inspector.get_table_names()
        refresh_token_columns = {column["name"] for column in inspector.get_columns("refresh_tokens")}
    finally:
        sync_engine.dispose()

    assert "refresh_tokens" in table_names
    assert "email_verification_tokens" in table_names
    assert "password_reset_tokens" in table_names
    assert "remember_me" in refresh_token_columns
