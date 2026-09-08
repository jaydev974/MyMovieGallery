from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.session import get_db
from app.models import Favorite, Movie, MovieGenre, Rating, Review, ReviewLike, User, WatchHistory, Watchlist, WatchlistItem

router = APIRouter(prefix="/api", tags=["library"])


class MovieResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    year: int | None
    overview: str | None
    genres: list[str]
    status: str
    vote_average: float | None
    runtime_minutes: int | None


class RatingRequest(BaseModel):
    score: int = Field(ge=1, le=10)


class ReviewRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    body: str = Field(min_length=1, max_length=10000)
    is_spoiler: bool = False
    rating: int = Field(ge=1, le=10)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    movie_id: uuid.UUID
    user_id: uuid.UUID
    username: str
    title: str | None
    body: str
    rating: int
    is_spoiler: bool
    like_count: int
    created_at: datetime
    updated_at: datetime


class LibraryResponse(BaseModel):
    watchlist: list[MovieResponse]
    favorites: list[MovieResponse]
    watched: list[MovieResponse]
    rated: list[MovieResponse]


async def _movie_response(session: AsyncSession, movie: Movie) -> MovieResponse:
    genres = list(
        await session.scalars(
            select(MovieGenre.genre_name).where(MovieGenre.movie_id == movie.id).order_by(MovieGenre.genre_name)
        )
    )
    return MovieResponse(
        id=movie.id,
        title=movie.title,
        slug=movie.slug,
        year=movie.release_date.year if movie.release_date else None,
        overview=movie.overview,
        genres=genres,
        status=movie.status,
        vote_average=float(movie.vote_average) if movie.vote_average is not None else None,
        runtime_minutes=movie.runtime_minutes,
    )


async def _get_movie(movie_id: uuid.UUID, session: AsyncSession) -> Movie:
    movie = await session.scalar(select(Movie).where(Movie.id == movie_id, Movie.deleted_at.is_(None)))
    if movie is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    return movie


async def _get_watchlist(user_id: uuid.UUID, session: AsyncSession) -> Watchlist:
    watchlist = await session.scalar(
        select(Watchlist).where(Watchlist.user_id == user_id, Watchlist.name == "My Watchlist")
    )
    if watchlist is None:
        watchlist = Watchlist(id=uuid.uuid4(), user_id=user_id, name="My Watchlist")
        session.add(watchlist)
        await session.flush()
    return watchlist


@router.get("/movies", response_model=list[MovieResponse])
async def list_movies(
    search: str | None = Query(default=None, min_length=1),
    genre: str | None = Query(default=None, min_length=1),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_db),
) -> list[MovieResponse]:
    query = select(Movie).where(Movie.deleted_at.is_(None)).order_by(Movie.title).offset(offset).limit(limit)
    if search:
        query = query.where(Movie.title.ilike(f"%{search}%"))
    if genre:
        query = query.join(MovieGenre, MovieGenre.movie_id == Movie.id).where(MovieGenre.genre_name == genre)
    movies = list(await session.scalars(query))
    return [await _movie_response(session, movie) for movie in movies]


@router.get("/movies/{movie_id}", response_model=MovieResponse)
async def get_movie(movie_id: uuid.UUID, session: AsyncSession = Depends(get_db)) -> MovieResponse:
    return await _movie_response(session, await _get_movie(movie_id, session))


@router.post("/movies/{movie_id}/watchlist", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    movie_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MovieResponse:
    movie = await _get_movie(movie_id, session)
    watchlist = await _get_watchlist(user.id, session)
    existing = await session.scalar(
        select(WatchlistItem).where(WatchlistItem.watchlist_id == watchlist.id, WatchlistItem.movie_id == movie.id)
    )
    if existing is None:
        session.add(WatchlistItem(id=uuid.uuid4(), watchlist_id=watchlist.id, movie_id=movie.id))
        await session.commit()
    return await _movie_response(session, movie)


@router.delete("/movies/{movie_id}/watchlist")
async def remove_from_watchlist(
    movie_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    watchlist = await _get_watchlist(user.id, session)
    await session.execute(
        delete(WatchlistItem).where(WatchlistItem.watchlist_id == watchlist.id, WatchlistItem.movie_id == movie_id)
    )
    await session.commit()
    return {"removed": True}


@router.put("/movies/{movie_id}/rating")
async def rate_movie(
    movie_id: uuid.UUID,
    payload: RatingRequest,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, object]:
    await _get_movie(movie_id, session)
    rating = await session.scalar(select(Rating).where(Rating.user_id == user.id, Rating.movie_id == movie_id))
    if rating is None:
        rating = Rating(id=uuid.uuid4(), user_id=user.id, movie_id=movie_id, score=payload.score)
        session.add(rating)
    else:
        rating.score = payload.score
    await session.commit()
    return {"movie_id": movie_id, "score": payload.score}


@router.post("/movies/{movie_id}/favorite", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
async def favorite_movie(
    movie_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MovieResponse:
    movie = await _get_movie(movie_id, session)
    existing = await session.scalar(select(Favorite).where(Favorite.user_id == user.id, Favorite.movie_id == movie.id))
    if existing is None:
        session.add(Favorite(id=uuid.uuid4(), user_id=user.id, movie_id=movie.id))
        await session.commit()
    return await _movie_response(session, movie)


@router.delete("/movies/{movie_id}/favorite")
async def unfavorite_movie(
    movie_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    await _get_movie(movie_id, session)
    await session.execute(delete(Favorite).where(Favorite.user_id == user.id, Favorite.movie_id == movie_id))
    await session.commit()
    return {"removed": True}


@router.post("/movies/{movie_id}/watched", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
async def mark_movie_watched(
    movie_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MovieResponse:
    movie = await _get_movie(movie_id, session)
    session.add(
        WatchHistory(
            id=uuid.uuid4(),
            user_id=user.id,
            movie_id=movie.id,
            progress_percent=100,
            completed=True,
            duration_minutes=movie.runtime_minutes,
        )
    )
    await session.commit()
    return await _movie_response(session, movie)


@router.get("/library", response_model=LibraryResponse)
async def get_library(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LibraryResponse:
    watchlist = await _get_watchlist(user.id, session)
    watchlist_movies = list(
        await session.scalars(
            select(Movie).join(WatchlistItem, WatchlistItem.movie_id == Movie.id).where(WatchlistItem.watchlist_id == watchlist.id)
        )
    )
    favorite_movies = list(
        await session.scalars(select(Movie).join(Favorite, Favorite.movie_id == Movie.id).where(Favorite.user_id == user.id))
    )
    watched_movies = list(
        await session.scalars(
            select(Movie).join(WatchHistory, WatchHistory.movie_id == Movie.id).where(WatchHistory.user_id == user.id).distinct()
        )
    )
    rated_movies = list(
        await session.scalars(select(Movie).join(Rating, Rating.movie_id == Movie.id).where(Rating.user_id == user.id))
    )
    await session.commit()
    return LibraryResponse(
        watchlist=[await _movie_response(session, movie) for movie in watchlist_movies],
        favorites=[await _movie_response(session, movie) for movie in favorite_movies],
        watched=[await _movie_response(session, movie) for movie in watched_movies],
        rated=[await _movie_response(session, movie) for movie in rated_movies],
    )


@router.get("/reviews", response_model=list[ReviewResponse])
async def list_reviews(
    movie_id: uuid.UUID | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
) -> list[ReviewResponse]:
    query = (
        select(Review, User.username, Rating.score)
        .join(User, User.id == Review.user_id)
        .outerjoin(Rating, (Rating.user_id == Review.user_id) & (Rating.movie_id == Review.movie_id))
        .where(Review.deleted_at.is_(None), Review.status == "published")
        .order_by(Review.created_at.desc())
        .limit(limit)
    )
    if movie_id:
        query = query.where(Review.movie_id == movie_id)
    rows = (await session.execute(query)).all()
    return [
        ReviewResponse(
            id=review.id,
            movie_id=review.movie_id,
            user_id=review.user_id,
            username=username,
            title=review.title,
            body=review.body,
            rating=score or 0,
            is_spoiler=review.is_spoiler,
            like_count=review.like_count,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
        for review, username, score in rows
    ]


@router.post("/movies/{movie_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    movie_id: uuid.UUID,
    payload: ReviewRequest,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewResponse:
    await _get_movie(movie_id, session)
    existing = await session.scalar(
        select(Review).where(Review.user_id == user.id, Review.movie_id == movie_id, Review.deleted_at.is_(None))
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already reviewed this movie")
    review = Review(
        id=uuid.uuid4(),
        user_id=user.id,
        movie_id=movie_id,
        title=payload.title,
        body=payload.body,
        is_spoiler=payload.is_spoiler,
        spoiler_flag=payload.is_spoiler,
    )
    session.add(review)
    rating = await session.scalar(select(Rating).where(Rating.user_id == user.id, Rating.movie_id == movie_id))
    if rating is None:
        session.add(Rating(id=uuid.uuid4(), user_id=user.id, movie_id=movie_id, score=payload.rating))
    else:
        rating.score = payload.rating
    await session.commit()
    await session.refresh(review)
    return ReviewResponse(
        id=review.id,
        movie_id=review.movie_id,
        user_id=review.user_id,
        username=user.username,
        title=review.title,
        body=review.body,
        rating=payload.rating,
        is_spoiler=review.is_spoiler,
        like_count=review.like_count,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: uuid.UUID,
    payload: ReviewRequest,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewResponse:
    review = await session.scalar(
        select(Review).where(Review.id == review_id, Review.user_id == user.id, Review.deleted_at.is_(None))
    )
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    review.title = payload.title
    review.body = payload.body
    review.is_spoiler = payload.is_spoiler
    review.spoiler_flag = payload.is_spoiler
    rating = await session.scalar(select(Rating).where(Rating.user_id == user.id, Rating.movie_id == review.movie_id))
    if rating is None:
        session.add(Rating(id=uuid.uuid4(), user_id=user.id, movie_id=review.movie_id, score=payload.rating))
    else:
        rating.score = payload.rating
    await session.commit()
    await session.refresh(review)
    return ReviewResponse(
        id=review.id,
        movie_id=review.movie_id,
        user_id=review.user_id,
        username=user.username,
        title=review.title,
        body=review.body,
        rating=payload.rating,
        is_spoiler=review.is_spoiler,
        like_count=review.like_count,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    review = await session.scalar(
        select(Review).where(Review.id == review_id, Review.user_id == user.id, Review.deleted_at.is_(None))
    )
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    review.deleted_at = datetime.utcnow()
    await session.commit()
    return {"deleted": True}


@router.post("/reviews/{review_id}/like")
async def toggle_review_like(
    review_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool | int]:
    review = await session.scalar(select(Review).where(Review.id == review_id, Review.deleted_at.is_(None)))
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    like = await session.scalar(select(ReviewLike).where(ReviewLike.review_id == review_id, ReviewLike.user_id == user.id))
    if like is None:
        session.add(ReviewLike(id=uuid.uuid4(), review_id=review_id, user_id=user.id))
        review.like_count += 1
        liked = True
    else:
        await session.delete(like)
        review.like_count = max(0, review.like_count - 1)
        liked = False
    await session.commit()
    return {"liked": liked, "like_count": review.like_count}
