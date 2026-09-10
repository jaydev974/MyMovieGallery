from __future__ import annotations

from sqlalchemy import Boolean, Column, text

from app.models import RefreshToken


def patch_refresh_token_model() -> None:
    """Attach the remember_me column to the mapped RefreshToken class at runtime."""
    table = RefreshToken.__table__
    if "remember_me" in table.c:
        return

    column = Column("remember_me", Boolean(), nullable=False, server_default=text("false"))
    table.append_column(column)
    RefreshToken.__mapper__.add_property("remember_me", table.c.remember_me)


patch_refresh_token_model()
