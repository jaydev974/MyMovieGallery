from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), extra="ignore", case_sensitive=False)

    environment: Literal["development", "test", "staging", "production"] = "development"
    debug: bool = False
    app_version: str = "1.0.0"
    api_docs_enabled: bool | None = None
    allowed_hosts: list[str] = Field(default_factory=lambda: ["localhost", "127.0.0.1"])
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    database_url: str = "postgresql+asyncpg://mymoviegallery:mymoviegallery@localhost:5432/mymoviegallery"
    database_pool_size: int = Field(default=5, ge=1, le=50)
    database_max_overflow: int = Field(default=10, ge=0, le=100)
    database_pool_timeout_seconds: float = Field(default=30.0, gt=0, le=120)
    database_pool_recycle_seconds: int = Field(default=1800, ge=60, le=86400)
    request_max_body_bytes: int = Field(default=2_000_000, ge=1_024, le=50_000_000)
    jwt_secret_key: str = "local-development-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=30, ge=5, le=1440)
    omdb_api_key: str | None = None
    omdb_timeout_seconds: float = Field(default=8.0, gt=0, le=30)

    @field_validator("allowed_hosts", "cors_origins", mode="before")
    @classmethod
    def parse_csv(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("database_url")
    @classmethod
    def require_async_database(cls, value: str) -> str:
        if not value.startswith(("postgresql+asyncpg://", "sqlite+aiosqlite://")):
            raise ValueError("DATABASE_URL must use postgresql+asyncpg or sqlite+aiosqlite")
        return value

    def validate_runtime(self) -> None:
        if self.environment == "production":
            if self.debug:
                raise ValueError("DEBUG must be false in production")
            if self.jwt_secret_key == "local-development-secret-change-me" or len(self.jwt_secret_key) < 32:
                raise ValueError("JWT_SECRET_KEY must be at least 32 characters in production")
            if not self.allowed_hosts or "*" in self.allowed_hosts:
                raise ValueError("ALLOWED_HOSTS must contain explicit hosts in production")
            if not self.cors_origins or "*" in self.cors_origins:
                raise ValueError("CORS_ORIGINS must contain explicit origins in production")
            if self.api_docs_enabled is True:
                raise ValueError("API docs must be disabled in production")

    @property
    def docs_enabled(self) -> bool:
        return self.api_docs_enabled if self.api_docs_enabled is not None else self.environment != "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_runtime()
    return settings


settings = get_settings()
