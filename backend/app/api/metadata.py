from __future__ import annotations

import time
from collections.abc import Mapping

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from app.config import settings

router = APIRouter(prefix="/api/metadata", tags=["metadata"])
_cache: dict[str, tuple[float, dict[str, object]]] = {}
_cache_ttl_seconds = 300


@router.get("/omdb/search")
async def omdb_search(query: str = Query(min_length=1, max_length=120)) -> dict[str, object]:
    """Search OMDb server-side so API keys cannot be exposed to the browser."""
    api_key = settings.omdb_api_key
    if not api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="OMDb metadata is not configured")
    try:
        cached = _cache.get(query.casefold())
        if cached and cached[0] > time.monotonic():
            return cached[1]
        async with httpx.AsyncClient(timeout=settings.omdb_timeout_seconds) as client:
            response = await client.get("https://www.omdbapi.com/", params={"apikey": api_key, "s": query, "type": "movie"})
            response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="OMDb is temporarily unavailable") from error
    payload = response.json()
    if not isinstance(payload, Mapping):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="OMDb returned an invalid response")
    if payload.get("Response") == "False":
        return {"results": []}
    results = payload.get("Search", [])
    if not isinstance(results, list):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="OMDb returned invalid search results")
    result = {"results": [{"imdb_id": item.get("imdbID"), "title": item.get("Title"), "year": item.get("Year"), "poster": item.get("Poster")} for item in results if isinstance(item, Mapping)]}
    _cache[query.casefold()] = (time.monotonic() + _cache_ttl_seconds, result)
    return result
