from __future__ import annotations

from app.main import app


def test_auth_openapi_includes_remember_me() -> None:
    schema = app.openapi()
    components = schema["components"]["schemas"]

    login_schema = components["LoginRequest"]
    register_schema = components["RegisterRequest"]

    assert "remember_me" in login_schema["properties"]
    assert "remember_me" in register_schema["properties"]
