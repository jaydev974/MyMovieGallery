from __future__ import annotations

from app.models import RefreshToken


def test_refresh_token_model_exposes_remember_me() -> None:
    assert hasattr(RefreshToken, "remember_me")
    assert "remember_me" in RefreshToken.__table__.c
