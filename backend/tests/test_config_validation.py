from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_production_rejects_insecure_runtime_settings() -> None:
    settings = Settings(
        environment="production",
        debug=True,
        allowed_hosts=["localhost"],
        cors_origins=["https://example.com"],
        jwt_secret_key="local-development-secret-change-me",
    )

    with pytest.raises(ValueError, match="DEBUG must be false in production"):
        settings.validate_runtime()


def test_production_requires_explicit_security_values() -> None:
    settings = Settings(
        environment="production",
        debug=False,
        allowed_hosts=["*"],
        cors_origins=["*"],
        jwt_secret_key="x" * 32,
    )

    with pytest.raises(ValueError, match="ALLOWED_HOSTS must contain explicit hosts in production"):
        settings.validate_runtime()

    settings.allowed_hosts = ["example.com"]
    with pytest.raises(ValueError, match="CORS_ORIGINS must contain explicit origins in production"):
        settings.validate_runtime()


def test_settings_validate_database_url_scheme() -> None:
    with pytest.raises(ValidationError):
        Settings(database_url="postgres://localhost/mymoviegallery")


def test_docs_enabled_defaults_off_in_production() -> None:
    assert Settings(environment="production", jwt_secret_key="x" * 32).docs_enabled is False
    assert Settings(environment="development").docs_enabled is True
