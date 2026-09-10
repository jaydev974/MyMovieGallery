from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable
from uuid import UUID

import joblib
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Recommendation

MODEL_PATH = Path(__file__).resolve().parents[1] / "artifacts" / "recommender.joblib"
DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "movies.json"
PERSONALIZED_MODEL_VERSION = "personalized-content-v1"
CACHE_TTL = timedelta(hours=6)


@dataclass(frozen=True)
class MovieProfile:
    """Metadata used by the recommender, independent of persistence details."""

    id: UUID
    title: str
    genres: tuple[str, ...] = ()
    overview: str = ""
    director: str | None = None
    cast: tuple[str, ...] = ()
    keywords: tuple[str, ...] = ()
    popularity: float = 0.0
    is_featured: bool = False


@dataclass(frozen=True)
class PreferenceSignal:
    movie_id: UUID
    weight: float
    source: str


@dataclass(frozen=True)
class PersonalizedRecommendation:
    movie_id: UUID
    score: float
    reasons: tuple[str, ...]
    genre_overlap: tuple[str, ...]


class RecommendationModel:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        if not model_path.exists():
            raise FileNotFoundError(
                f"Trained model not found at {model_path}. Run 'python scripts/train_recommender.py'."
            )
        self.model: dict[str, Any] = joblib.load(model_path)
        self.movies: list[dict[str, Any]] = self.model["movies"]
        self.matrix = self.model["matrix"]
        self.vectorizer = self.model["vectorizer"]
        self.title_to_index = {movie["title"].casefold(): index for index, movie in enumerate(self.movies)}

    def recommend(self, title: str, limit: int = 5) -> list[dict[str, Any]]:
        """Preserve the existing anonymous movie-to-movie recommendation API."""
        index = self.title_to_index.get(title.casefold())
        if index is None:
            raise ValueError(f"Movie '{title}' was not found in the trained catalog")
        scores = cosine_similarity(self.matrix[index], self.matrix).flatten()
        recommendations: list[dict[str, Any]] = []
        for candidate_index in scores.argsort()[::-1]:
            if candidate_index == index:
                continue
            movie = self.movies[candidate_index]
            recommendations.append({**movie, "score": round(float(scores[candidate_index]), 4), "reason": self._reason(self.movies[index], movie)})
            if len(recommendations) >= limit:
                break
        return recommendations

    def recommend_for_preferences(
        self,
        movies: Iterable[MovieProfile],
        preferences: Iterable[PreferenceSignal],
        excluded_movie_ids: set[UUID],
        limit: int,
    ) -> list[PersonalizedRecommendation]:
        """Rank catalog movies from a weighted, explainable user taste vector."""
        catalog = list(movies)
        profile_by_id = {movie.id: movie for movie in catalog}
        usable_signals = [signal for signal in preferences if signal.movie_id in profile_by_id and signal.weight > 0]
        if not usable_signals:
            return self.popular_fallback(catalog, excluded_movie_ids, limit)

        matrix = self.vectorizer.transform([self._document(movie) for movie in catalog])
        index_by_id = {movie.id: index for index, movie in enumerate(catalog)}
        source_indexes = [index_by_id[signal.movie_id] for signal in usable_signals]
        weights = np.array([signal.weight for signal in usable_signals], dtype=float)
        user_vector: csr_matrix = csr_matrix(matrix[source_indexes].multiply(weights[:, np.newaxis]).sum(axis=0))
        scores = cosine_similarity(user_vector, matrix).flatten()

        source_ids = {signal.movie_id for signal in usable_signals}
        source_profiles = [(profile_by_id[signal.movie_id], signal.weight, signal.source) for signal in usable_signals]
        candidates = [(index, float(scores[index])) for index, movie in enumerate(catalog) if movie.id not in excluded_movie_ids and movie.id not in source_ids and scores[index] > 0]
        candidates.sort(key=lambda candidate: candidate[1], reverse=True)
        return self._diversify(catalog, candidates, source_profiles, limit)

    @staticmethod
    def _document(movie: MovieProfile) -> str:
        # Repeating genre tokens preserves useful genre signal when an overview is sparse.
        genres = " ".join((*movie.genres, *movie.genres))
        return " ".join(part for part in (movie.title, genres, movie.overview, movie.director or "", " ".join(movie.cast), " ".join(movie.keywords)) if part)

    def _diversify(self, catalog: list[MovieProfile], candidates: list[tuple[int, float]], source_profiles: list[tuple[MovieProfile, float, str]], limit: int) -> list[PersonalizedRecommendation]:
        results: list[PersonalizedRecommendation] = []
        genre_counts: dict[str, int] = {}
        director_counts: dict[str, int] = {}
        for index, score in candidates:
            candidate = catalog[index]
            primary_genre = candidate.genres[0].casefold() if candidate.genres else ""
            director = (candidate.director or "").casefold()
            if primary_genre and genre_counts.get(primary_genre, 0) >= 3:
                continue
            if director and director_counts.get(director, 0) >= 2:
                continue
            best_source, _, source_kind = max(source_profiles, key=lambda source: self._pair_score(source[0], candidate) * source[1])
            overlap = tuple(sorted(set(best_source.genres) & set(candidate.genres)))
            results.append(PersonalizedRecommendation(movie_id=candidate.id, score=round(score, 4), reasons=tuple(self._personalized_reasons(best_source, candidate, overlap, source_kind)), genre_overlap=overlap))
            if primary_genre:
                genre_counts[primary_genre] = genre_counts.get(primary_genre, 0) + 1
            if director:
                director_counts[director] = director_counts.get(director, 0) + 1
            if len(results) >= limit:
                break
        return results

    def _pair_score(self, source: MovieProfile, candidate: MovieProfile) -> float:
        vectors = self.vectorizer.transform([self._document(source), self._document(candidate)])
        return float(cosine_similarity(vectors[0], vectors[1])[0][0])

    @staticmethod
    def _personalized_reasons(source: MovieProfile, candidate: MovieProfile, overlap: tuple[str, ...], source_kind: str) -> list[str]:
        source_label = {"favorite": "favorited", "rating": "rated", "watchlist": "saved to your watchlist"}.get(source_kind, "watched")
        reasons = [f"Because you {source_label} {source.title}"]
        if overlap:
            reasons.append(f"Matches your interest in {', '.join(overlap[:2])}")
        elif source.director and source.director == candidate.director:
            reasons.append(f"Also directed by {candidate.director}")
        else:
            reasons.append("Similar themes and story language")
        return reasons

    @staticmethod
    @staticmethod
    def popular_fallback(catalog: list[MovieProfile], excluded_movie_ids: set[UUID], limit: int) -> list[PersonalizedRecommendation]:
        candidates = sorted((movie for movie in catalog if movie.id not in excluded_movie_ids), key=lambda movie: (movie.is_featured, movie.popularity), reverse=True)
        results: list[PersonalizedRecommendation] = []
        genre_counts: dict[str, int] = {}
        for movie in candidates:
            primary_genre = movie.genres[0].casefold() if movie.genres else ""
            if primary_genre and genre_counts.get(primary_genre, 0) >= 3:
                continue
            reason = "Featured for new members" if movie.is_featured else "Popular with MyMovieGallery viewers"
            results.append(PersonalizedRecommendation(movie_id=movie.id, score=round(min(1.0, max(0.0, movie.popularity / 100)), 4), reasons=(reason,), genre_overlap=()))
            if primary_genre:
                genre_counts[primary_genre] = genre_counts.get(primary_genre, 0) + 1
            if len(results) >= limit:
                break
        return results

    @staticmethod
    def _reason(source: dict[str, Any], candidate: dict[str, Any]) -> str:
        overlap = sorted(set(source["genres"]) & set(candidate["genres"]))
        return f"Shares {', '.join(overlap[:2])} themes with {source['title']}" if overlap else "Similar plot language and themes"


@lru_cache(maxsize=1)
def get_recommendation_model() -> RecommendationModel:
    return RecommendationModel()


async def invalidate_user_recommendations(session: AsyncSession, user_id: UUID) -> None:
    """Called in the same transaction as library preference changes."""
    await session.execute(delete(Recommendation).where(Recommendation.user_id == user_id, Recommendation.model_version == PERSONALIZED_MODEL_VERSION))


def cache_is_fresh(created_at: datetime) -> bool:
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return created_at >= datetime.now(timezone.utc) - CACHE_TTL


def serialize_reasons(reasons: tuple[str, ...]) -> str:
    return json.dumps(list(reasons))


def deserialize_reasons(value: str | None) -> tuple[str, ...]:
    try:
        decoded = json.loads(value or "[]")
        return tuple(item for item in decoded if isinstance(item, str))
    except json.JSONDecodeError:
        return ()


def load_training_movies() -> list[dict[str, Any]]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))
