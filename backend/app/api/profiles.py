from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_optional_current_user
from app.db.session import get_db
from app.library import MovieResponse, _movie_response, _user_library
from app.models import User

router = APIRouter(prefix="/api/users", tags=["profiles"])


class PublicProfileResponse(BaseModel):
    id: uuid.UUID
    username: str
    name: str
    bio: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    is_private: bool
    is_owner: bool = False
    restricted: bool = False
    watched: list[MovieResponse] = Field(default_factory=list)
    favorites: list[MovieResponse] = Field(default_factory=list)
    rated: list[MovieResponse] = Field(default_factory=list)


async def _profile_or_404(username: str, session: AsyncSession) -> User:
    profile = await session.scalar(select(User).where(User.username == username.casefold(), User.deleted_at.is_(None)))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return profile


@router.get("/{username}", response_model=PublicProfileResponse)
async def get_user_profile(
    username: str,
    session: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_optional_current_user),
) -> PublicProfileResponse:
    profile = await _profile_or_404(username, session)
    is_owner = viewer is not None and viewer.id == profile.id
    restricted = profile.is_private and not is_owner
    response = PublicProfileResponse(id=profile.id, username=profile.username, name=profile.full_name or profile.username, avatar_url=profile.avatar_url, is_private=profile.is_private, is_owner=is_owner, restricted=restricted)
    if restricted:
        return response
    response.bio, response.location = profile.bio, profile.location
    watched, favorites, rated = await _user_library(profile.id, session)
    response.watched = [await _movie_response(session, movie) for movie in watched]
    response.favorites = [await _movie_response(session, movie) for movie in favorites]
    response.rated = [await _movie_response(session, movie) for movie in rated]
    return response


@router.get("/{username}/watched", response_model=list[MovieResponse])
async def get_user_watched(
    username: str,
    session: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_optional_current_user),
) -> list[MovieResponse]:
    profile = await _profile_or_404(username, session)
    if profile.is_private and (viewer is None or viewer.id != profile.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is private")
    watched, _, _ = await _user_library(profile.id, session)
    return [await _movie_response(session, movie) for movie in watched]
