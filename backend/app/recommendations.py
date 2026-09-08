from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
from sklearn.metrics.pairwise import cosine_similarity

MODEL_PATH = Path(__file__).resolve().parents[1] / "artifacts" / "recommender.joblib"
DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "movies.json"


class RecommendationModel:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        if not model_path.exists():
            raise FileNotFoundError(
                f"Trained model not found at {model_path}. Run 'python scripts/train_recommender.py'."
            )
        self.model: dict[str, Any] = joblib.load(model_path)
        self.movies: list[dict[str, Any]] = self.model["movies"]
        self.matrix = self.model["matrix"]
        self.title_to_index = {
            movie["title"].casefold(): index for index, movie in enumerate(self.movies)
        }

    def recommend(self, title: str, limit: int = 5) -> list[dict[str, Any]]:
        index = self.title_to_index.get(title.casefold())
        if index is None:
            raise ValueError(f"Movie '{title}' was not found in the trained catalog")

        scores = cosine_similarity(self.matrix[index], self.matrix).flatten()
        ranked_indexes = scores.argsort()[::-1]
        recommendations: list[dict[str, Any]] = []
        for candidate_index in ranked_indexes:
            if candidate_index == index:
                continue
            movie = self.movies[candidate_index]
            recommendations.append(
                {
                    **movie,
                    "score": round(float(scores[candidate_index]), 4),
                    "reason": self._reason(self.movies[index], movie),
                }
            )
            if len(recommendations) >= limit:
                break
        return recommendations

    @staticmethod
    def _reason(source: dict[str, Any], candidate: dict[str, Any]) -> str:
        overlap = sorted(set(source["genres"]) & set(candidate["genres"]))
        if overlap:
            return f"Shares {', '.join(overlap[:2])} themes with {source['title']}"
        return "Similar plot language and themes"


def load_training_movies() -> list[dict[str, Any]]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))
