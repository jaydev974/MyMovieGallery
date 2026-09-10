from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.session import get_db
from app.library import MovieResponse, _movie_response
from app.models import Actor, Director, Favorite, Movie, MovieCast, MovieCrew, MovieGenre, MovieKeyword, Rating, Recommendation, WatchHistory, Watchlist, WatchlistItem, User
from app.recommendations import (
    PERSONALIZED_MODEL_VERSION,
    MovieProfile,
    PreferenceSignal,
    cache_is_fresh,
    deserialize_reasons,
    get_recommendation_model,
    invalidate_user_recommendations,
    serialize_reasons,
)

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])
MAX_CACHED_RECOMMENDATIONS = 50


class PersonalizedRecommendationResponse(BaseModel):
    movie: MovieResponse
    score: float
    confidence: int = Field(ge=0, le=100)
    reasons: list[str]
    genre_overlap: list[str]


class PersonalizedRecommendationsResponse(BaseModel):
    model: str = PERSONALIZED_MODEL_VERSION
    cold_start: bool
    results: list[PersonalizedRecommendationResponse]


async def _catalog_profiles(session: AsyncSession) -> tuple[dict[uuid.UUID, MovieProfile], dict[uuid.UUID, Movie]]:
    movies = {
        movie.id: movie
        for movie in await session.scalars(
            select(Movie).where(
                Movie.deleted_at.is_(None),
                Movie.status.not_in(("dropped", "deleted", "unavailable", "removed")),
            )
        )
    }
    movie_ids = set(movies)
    profiles: dict[uuid.UUID, MovieProfile] = {}
    genres: dict[uuid.UUID, list[str]] = {}
    keywords: dict[uuid.UUID, list[str]] = {}
    cast: dict[uuid.UUID, list[str]] = {}
    directors: dict[uuid.UUID, str] = {}
    for movie_id, genre in await session.execute(select(MovieGenre.movie_id, MovieGenre.genre_name).where(MovieGenre.movie_id.in_(movie_ids))):
        genres.setdefault(movie_id, []).append(genre)
    for movie_id, keyword in await session.execute(select(MovieKeyword.movie_id, MovieKeyword.keyword).where(MovieKeyword.movie_id.in_(movie_ids))):
        keywords.setdefault(movie_id, []).append(keyword)
    for movie_id, actor_name in await session.execute(
        select(MovieCast.movie_id, Actor.name).join(Actor, Actor.id == MovieCast.actor_id).where(MovieCast.movie_id.in_(movie_ids)).order_by(MovieCast.cast_order)
    ):
        cast.setdefault(movie_id, []).append(actor_name)
    for movie_id, director_name in await session.execute(
        select(MovieCrew.movie_id, Director.name).join(Director, Director.id == MovieCrew.director_id).where(MovieCrew.movie_id.in_(movie_ids), MovieCrew.director_id.is_not(None))
    ):
        directors.setdefault(movie_id, director_name)
    for movie_id, movie in movies.items():
        profiles[movie_id] = MovieProfile(
            id=movie_id,
            title=movie.title,
            genres=tuple(sorted(genres.get(movie_id, []))),
            overview=movie.overview or "",
            director=directors.get(movie_id),
            cast=tuple(cast.get(movie_id, [])),
            keywords=tuple(keywords.get(movie_id, [])),
            popularity=float(movie.popularity_score or movie.vote_average or 0),
            is_featured=movie.is_featured,
        )
    return profiles, movies


def _days_since(value: datetime) -> float:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return max(0.0, (datetime.now(timezone.utc) - value).total_seconds() / 86400)


async def _preference_signals(session: AsyncSession, user_id: uuid.UUID) -> tuple[list[PreferenceSignal], set[uuid.UUID], bool]:
    watched_rows = (await session.execute(select(WatchHistory).where(WatchHistory.user_id == user_id, WatchHistory.completed.is_(True)))).scalars().all()
    latest_watches: dict[uuid.UUID, WatchHistory] = {}
    for history in watched_rows:
        current = latest_watches.get(history.movie_id)
        if current is None or history.watched_at > current.watched_at:
            latest_watches[history.movie_id] = history
    favorite_ids = set(await session.scalars(select(Favorite.movie_id).where(Favorite.user_id == user_id)))
    ratings = {rating.movie_id: rating.score for rating in (await session.scalars(select(Rating).where(Rating.user_id == user_id))).all()}
    watchlist_ids = set(
        await session.scalars(
            select(WatchlistItem.movie_id).join(Watchlist).where(Watchlist.user_id == user_id)
        )
    )

    signals: list[PreferenceSignal] = []
    for movie_id, history in latest_watches.items():
        recency_weight = 0.75 * math.exp(-_days_since(history.watched_at) / 180)
        rating_weight = 0.35 + (ratings.get(movie_id, 5) / 5)
        favorite_weight = 0.75 if movie_id in favorite_ids else 0.0
        signals.append(PreferenceSignal(movie_id=movie_id, weight=(1 + recency_weight + favorite_weight) * rating_weight, source="watched"))
    for movie_id in favorite_ids - set(latest_watches):
        signals.append(PreferenceSignal(movie_id=movie_id, weight=1.75 * (0.35 + ratings.get(movie_id, 5) / 5), source="favorite"))
    for movie_id, score in ratings.items():
        if movie_id not in latest_watches and movie_id not in favorite_ids and score >= 5:
            signals.append(PreferenceSignal(movie_id=movie_id, weight=(score - 4) / 3, source="rating"))
    # A watchlist is only a cold-start input, so it cannot overwhelm actual viewing history.
    if not latest_watches:
        signals.extend(PreferenceSignal(movie_id=movie_id, weight=0.75, source="watchlist") for movie_id in watchlist_ids)
    return signals, set(latest_watches), not bool(latest_watches)


async def _response_for(movie: Movie, score: float, reasons: list[str], genre_overlap: list[str], session: AsyncSession) -> PersonalizedRecommendationResponse:
    return PersonalizedRecommendationResponse(
        movie=await _movie_response(session, movie),
        score=score,
        confidence=max(0, min(100, round(score * 100))),
        reasons=reasons or ["Selected for your library"],
        genre_overlap=genre_overlap,
    )


async def _cached_recommendations(session: AsyncSession, user_id: uuid.UUID, limit: int) -> list[PersonalizedRecommendationResponse] | None:
    rows = (
        await session.execute(
            select(Recommendation, Movie)
            .join(Movie, Movie.id == Recommendation.movie_id)
            .where(Recommendation.user_id == user_id, Recommendation.model_version == PERSONALIZED_MODEL_VERSION, Movie.deleted_at.is_(None))
            .order_by(Recommendation.score.desc())
        )
    ).all()
    if not rows or not cache_is_fresh(rows[0][0].created_at):
        return None
    return [
        await _response_for(movie, float(recommendation.score), list(deserialize_reasons(recommendation.reasons)), [], session)
        for recommendation, movie in rows[:limit]
    ]


@router.get("/me", response_model=PersonalizedRecommendationsResponse)
async def personalized_recommendations(
    limit: int = Query(default=20, ge=1, le=50),
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PersonalizedRecommendationsResponse:
    cached = await _cached_recommendations(session, user.id, limit)
    if cached is not None:
        has_watched = bool(await session.scalar(select(WatchHistory.id).where(WatchHistory.user_id == user.id, WatchHistory.completed.is_(True)).limit(1)))
        return PersonalizedRecommendationsResponse(cold_start=not has_watched, results=cached)

    profiles, movies = await _catalog_profiles(session)
    await invalidate_user_recommendations(session, user.id)
    signals, watched_movie_ids, cold_start = await _preference_signals(session, user.id)
    if not movies:
        return PersonalizedRecommendationsResponse(cold_start=cold_start, results=[])
    if signals:
        try:
            model = get_recommendation_model()
        except FileNotFoundError as error:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
        recommendations = model.recommend_for_preferences(profiles.values(), signals, watched_movie_ids, MAX_CACHED_RECOMMENDATIONS)
    else:
        recommendations = RecommendationModel.popular_fallback(list(profiles.values()), watched_movie_ids, MAX_CACHED_RECOMMENDATIONS)
    source = "popularity" if not signals else "content_based"
    for recommendation in recommendations:
        session.add(
            Recommendation(
                id=uuid.uuid4(),
                user_id=user.id,
                movie_id=recommendation.movie_id,
                source=source,
                score=recommendation.score,
                reasons=serialize_reasons(recommendation.reasons),
                model_version=PERSONALIZED_MODEL_VERSION,
            )
        )
    await session.commit()
    return PersonalizedRecommendationsResponse(
        cold_start=cold_start,
        results=[
            await _response_for(movies[recommendation.movie_id], recommendation.score, list(recommendation.reasons), list(recommendation.genre_overlap), session)
            for recommendation in recommendations[:limit]
        ],
    )
