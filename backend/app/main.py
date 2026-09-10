import logging
import time
import uuid
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.auth import router as auth_router
from app.api.metadata import router as metadata_router
from app.api.profiles import router as profiles_router
from app.api.recommendations import router as personalized_recommendations_router
from app.library import router as library_router
from app.recommendations import RecommendationModel
from app.config import settings
from app.db.session import engine
from sqlalchemy import text

logger = logging.getLogger("mymoviegallery.api")

app = FastAPI(
    title="MyMovieGallery API",
    version=settings.app_version,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)

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


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled request error", extra={"request_id": request_id, "path": request.url.path})
        response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
    response.headers["X-Request-ID"] = request_id
    logger.info("request complete", extra={"request_id": request_id, "path": request.url.path, "status_code": response.status_code, "duration_ms": round((time.perf_counter() - started) * 1000, 2)})
    return response


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "mymoviegallery-api"}


@app.get("/ready", tags=["system"])
async def readiness_check() -> dict[str, str]:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        logger.exception("readiness check failed")
        return JSONResponse(status_code=503, content={"status": "not_ready", "service": "mymoviegallery-api"})
    return {"status": "ready", "service": "mymoviegallery-api"}


@lru_cache(maxsize=1)
def get_recommendation_model() -> RecommendationModel:
    return RecommendationModel()


@app.get("/api/recommendations", tags=["recommendations"])
async def recommendations(
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
