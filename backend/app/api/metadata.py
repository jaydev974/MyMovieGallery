from __future__ import annotations

import os

import httpx
from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter(prefix="/api/metadata", tags=["metadata"])


@router.get("/omdb/search")
async def omdb_search(query: str = Query(min_length=1, max_length=120)) -> dict[str, object]:
    """Search OMDb server-side so API keys cannot be exposed to the browser."""
    api_key = os.getenv("OMDB_API_KEY")
    if not api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="OMDb metadata is not configured")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get("https://www.omdbapi.com/", params={"apikey": api_key, "s": query, "type": "movie"})
            response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="OMDb is temporarily unavailable") from error
    payload = response.json()
    if payload.get("Response") == "False":
        return {"results": []}
    return {"results": [{"imdb_id": item.get("imdbID"), "title": item.get("Title"), "year": item.get("Year"), "poster": item.get("Poster")} for item in payload.get("Search", [])]}
