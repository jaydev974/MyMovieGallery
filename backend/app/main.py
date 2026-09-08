import os
from functools import lru_cache

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

# Load backend/.env for direct uvicorn runs; Docker Compose injects environment variables itself.
load_dotenv()

from app.auth import router as auth_router
from app.api.metadata import router as metadata_router
from app.api.profiles import router as profiles_router
from app.library import router as library_router
from app.recommendations import RecommendationModel

environment = os.getenv("ENVIRONMENT", "development").lower()
docs_enabled = os.getenv("API_DOCS_ENABLED", "true").lower() == "true"

app = FastAPI(
    title="MyMovieGallery API",
    version=os.getenv("APP_VERSION", "1.0.0"),
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

allowed_hosts = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

if environment == "production" and (not cors_origins or "*" in cors_origins):
    raise RuntimeError("CORS_ORIGINS must contain explicit origins in production")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)
app.include_router(auth_router)
app.include_router(library_router)
app.include_router(profiles_router)
app.include_router(metadata_router)


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "mymoviegallery-api"}


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
