from __future__ import annotations

from app.auth import LoginRequest, RegisterRequest


def test_auth_requests_expose_remember_me() -> None:
    assert "remember_me" in LoginRequest.model_fields
    assert "remember_me" in RegisterRequest.model_fields
