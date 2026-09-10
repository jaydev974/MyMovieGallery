from __future__ import annotations

import json
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "movies.json"
ARTIFACT_PATH = ROOT / "artifacts" / "recommender.joblib"


def movie_document(movie: dict[str, object]) -> str:
    """Keep training features aligned with the personalized runtime model."""
    def text_list(key: str) -> str:
        value = movie.get(key, [])
        return " ".join(item for item in value if isinstance(item, str)) if isinstance(value, list) else ""

    genres = text_list("genres")
    return " ".join(
        part
        for part in (
            str(movie.get("title", "")),
            genres,
            genres,
            str(movie.get("overview", "")),
            str(movie.get("director", "")),
            text_list("cast"),
            text_list("keywords"),
        )
        if part
    )


def train() -> Path:
    movies = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    documents = [movie_document(movie) for movie in movies]
    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
    )
    matrix = vectorizer.fit_transform(documents)
    artifact = {
        "model_type": "tfidf_content_similarity",
        "model_version": "personalized-content-v1",
        "vectorizer": vectorizer,
        "matrix": matrix,
        "movies": movies,
    }
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, ARTIFACT_PATH)
    print(f"trained {len(movies)} movies with {matrix.shape[1]} features")
    print(f"saved model to {ARTIFACT_PATH}")
    return ARTIFACT_PATH


if __name__ == "__main__":
    train()
