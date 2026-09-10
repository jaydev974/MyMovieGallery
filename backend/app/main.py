import json
import time
import uuid
from datetime import timedelta
from functools import lru_cache
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.status import HTTP_413_REQUEST_ENTITY_TOO_LARGE

from app.api.metadata import router as metadata_router
from app.api.profiles import router as profiles_router
from app.api.recommendations import router as personalized_recommendations_router
from app.auth import REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_EXPIRE_DAYS, router as auth_router
from app.config import settings
from app.db.session import engine
from app.library import router as library_router
from app.logging_config import configure_logging
from app.observability import record_db_query, record_http_request, render_prometheus_metrics
from app.rate_limit import limiter
from app.recommendations import RecommendationModel

configure_logging(settings.environment)

import structlog

logger = structlog.get_logger("mymoviegallery.api")

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://www.omdbapi.com; font-src 'self' data:",
}
_AUTH_REMEMBER_ME_COOKIE_NAME = "mmg-auth-remember-me"
_AUTH_COOKIE_PATHS = {
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/logout",
    "/api/auth/password-reset/confirm",
}

app = FastAPI(
    title="MyMovieGallery API",
    version=settings.app_version,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(GZipMiddleware, minimum_size=1_000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
app.include_router(auth_router)
app.include_router(library_router)
app.include_router(profiles_router)
app.include_router(metadata_router)
app.include_router(personalized_recommendations_router)


def _normalized_route_path(request: Request) -> str:
    route = request.scope.get("route")
    path = getattr(route, "path_format", None) or getattr(route, "path", None)
    return path or request.url.path


def _cookie_kwargs(remember_me: bool) -> dict[str, object]:
    is_production = settings.environment == "production"
    kwargs: dict[str, object] = {
        "httponly": True,
        "secure": is_production,
        "samesite": "none" if is_production else "lax",
        "path": "/",
    }
    if remember_me:
        kwargs["max_age"] = int(timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS).total_seconds())
    return kwargs


def _extract_cookie_value(set_cookie_header: str | None, cookie_name: str) -> str | None:
    if not set_cookie_header:
        return None
    prefix = f"{cookie_name}="
    if not set_cookie_header.startswith(prefix):
        return None
    return set_cookie_header[len(prefix) :].split(";", 1)[0]


async def _capture_json_body(request: Request) -> dict[str, Any] | None:
    body = await request.body()

    async def receive() -> dict[str, object]:
        return {"type": "http.request", "body": body, "more_body": False}

    request._receive = receive  # type: ignore[attr-defined]
    if not body:
        return None
    try:
        parsed = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    started = time.perf_counter()

    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > settings.request_max_body_bytes:
        response = JSONResponse(status_code=HTTP_413_REQUEST_ENTITY_TOO_LARGE, content={"detail": "Request body too large"})
        response.headers["X-Request-ID"] = request_id
        for name, value in _SECURITY_HEADERS.items():
            response.headers.setdefault(name, value)
        if settings.environment == "production":
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        logger.warning("request rejected: body too large", request_id=request_id, path=request.url.path, content_length=content_length)
        record_http_request(request.method, request.url.path, response.status_code, time.perf_counter() - started)
        return response

    remember_me: bool | None = None
    clear_remember_me_cookie = False
    if request.method == "POST" and request.url.path in {"/api/auth/login", "/api/auth/register"}:
        payload = await _capture_json_body(request)
        remember_me = bool(payload.get("remember_me", False)) if payload is not None else False
    elif request.method == "POST" and request.url.path == "/api/auth/refresh":
        remember_me = request.cookies.get(_AUTH_REMEMBER_ME_COOKIE_NAME) == "1"
    elif request.method == "POST" and request.url.path in {
        "/api/auth/logout",
        "/api/auth/password-reset/confirm",
    }:
        clear_remember_me_cookie = True

    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled request error", request_id=request_id, path=request.url.path)
        response = JSONResponse(status_code=500, content={"detail": "Internal server error"})

    if request.url.path in _AUTH_COOKIE_PATHS:
        if remember_me is not None:
            refresh_cookie = _extract_cookie_value(response.headers.get("set-cookie"), REFRESH_TOKEN_COOKIE_NAME)
            if refresh_cookie is not None:
                response.set_cookie(
                    _AUTH_REMEMBER_ME_COOKIE_NAME,
                    "1" if remember_me else "0",
                    **_cookie_kwargs(remember_me),
                )
                response.set_cookie(
                    REFRESH_TOKEN_COOKIE_NAME,
                    refresh_cookie,
                    **_cookie_kwargs(remember_me),
                )
        if clear_remember_me_cookie:
            response.delete_cookie(_AUTH_REMEMBER_ME_COOKIE_NAME, path="/")

    response.headers["X-Request-ID"] = request_id
    for name, value in _SECURITY_HEADERS.items():
        response.headers.setdefault(name, value)
    if settings.environment == "production":
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    duration_seconds = time.perf_counter() - started
    normalized_path = _normalized_route_path(request)
    record_http_request(request.method, normalized_path, response.status_code, duration_seconds)
    logger.info(
        "request complete",
        request_id=request_id,
        path=normalized_path,
        status_code=response.status_code,
        duration_ms=round(duration_seconds * 1000, 2),
    )
    return response


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await engine.dispose()


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "mymoviegallery-api"}


@app.get("/ready", tags=["system"])
async def readiness_check() -> dict[str, str]:
    started = time.perf_counter()
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        logger.exception("readiness check failed")
        record_db_query("readiness", time.perf_counter() - started, success=False)
        return JSONResponse(status_code=503, content={"status": "not_ready", "service": "mymoviegallery-api"})
    record_db_query("readiness", time.perf_counter() - started, success=True)
    return {"status": "ready", "service": "mymoviegallery-api"}


@app.get("/metrics", include_in_schema=False)
async def metrics() -> Response:
    return Response(render_prometheus_metrics(), media_type="text/plain; version=0.0.4; charset=utf-8")


@lru_cache(maxsize=1)
def get_recommendation_model() -> RecommendationModel:
    return RecommendationModel()


@app.get("/api/recommendations", tags=["recommendations"])
@limiter.limit("30/minute")
async def recommendations(
    request: Request,
    title: str = Query(..., min_length=1, description="Title from the trained movie catalog"),
    limit: int = Query(5, ge=1, le=20),
) -> dict[str, object]:
    try:
        model = get_recommendation_model()
        return {"source": title, "model": "tfidf_content_similarity", "results": model.recommend(title, limit)}
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
