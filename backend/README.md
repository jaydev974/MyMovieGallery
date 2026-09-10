# MyMovieGallery Backend

This backend package contains the SQLAlchemy 2.0 models, Alembic migrations, PostgreSQL runtime, and a trainable content-based recommendation service for MyMovieGallery.

## Included

- SQLAlchemy declarative models in `app/models.py`
- database session management in `app/db/session.py`
- base model in `app/db/base.py`
- Alembic migration baseline in `alembic/versions/20260905_initial_schema.py`
- seed references in `app/seed_data.py`
- personalized recommendation inference in `app/recommendations.py` and `app/api/recommendations.py`
- recommendation training data in `data/movies.json`
- recommendation trainer in `scripts/train_recommender.py`
- architecture documentation in `docs/database_design.md`

## Quick start

1. Start the PostgreSQL database and backend from the repository root:

   ```bash
   docker compose up -d db backend
   ```

2. Train or retrain the recommendation model:

   ```bash
   python scripts/train_recommender.py
   ```

3. Run Alembic migrations:

   ```bash
   alembic upgrade head
   ```

4. Query recommendations from the trained model:

   ```bash
   curl "http://localhost:8000/api/recommendations?title=Inception&limit=5"
   ```

## OMDb metadata search

1. Copy `.env.example` to `.env` inside `backend/` and set `OMDB_API_KEY` to your OMDb key.
2. Start the backend with `uvicorn app.main:app --reload`.
3. Search through the server-side proxy:

   ```bash
   curl "http://localhost:8000/api/metadata/omdb/search?query=Inception"
   ```

The frontend Search page calls the same endpoint. The OMDb key is added to the outbound request by the backend and is never exposed to the browser. For Docker Compose, set `OMDB_API_KEY` in the root `.env` file instead.

## Notes

The recommender is a lightweight, explainable content-based model. Training builds TF-IDF vectors from catalog title, genres, overview, director, cast, and keywords, then stores the vectorizer and matrix in `artifacts/recommender.joblib`. The protected `GET /api/recommendations/me?limit=20` endpoint builds a private taste vector from the authenticated user's completed watches, ratings, favorites, and watchlist. Higher ratings, favorites, and recent watches have more weight. Results exclude completed watches and unavailable/deleted catalog records, cap repeated genres/directors, and include human-readable reasons.

Users without completed history receive featured/popular catalog movies, with watchlist items used as a light cold-start taste signal when available. Personalized rows are cached for six hours in the existing `recommendations` table and invalidated when watchlist, favorite, watched, rating, or review-rating data changes. The endpoint derives identity only from the JWT; public profile routes do not expose recommendation rows.

If the model artifact is missing, cold-start popularity recommendations still work. A user with preference signals receives HTTP 503 with the training command in the error detail until the artifact is generated.

Retrain after catalog metadata changes from the `backend/` directory:

```bash
python scripts/train_recommender.py
```

Docker generates the artifact during the backend image build. For local development, `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, and `ALLOWED_HOSTS` are required; `OMDB_API_KEY` is optional and remains server-side for metadata enrichment.

For production, set `ENVIRONMENT=production`, provide an explicit `ALLOWED_HOSTS` and `CORS_ORIGINS`, use a long random database password, and run the backend behind Gunicorn using `docker-compose.production.yml`.

## Core API

All protected routes use `Authorization: Bearer <access_token>` from `/api/auth/login` or `/api/auth/register`.

- `GET /api/movies` and `GET /api/movies/{id}` - catalog reads with search, genre, pagination, and details
- `POST/DELETE /api/movies/{id}/watchlist` - manage the authenticated user's watchlist
- `POST/DELETE /api/movies/{id}/favorite` - manage favorites
- `PUT /api/movies/{id}/rating` - create or update a 1-10 rating
- `POST /api/movies/{id}/watched` - record completed viewing history
- `GET /api/library` - aggregate watchlist, favorites, watched, and rated movies
- `GET /api/reviews` - list published reviews
- `POST /api/movies/{id}/reviews` - create a review
- `PUT/DELETE /api/reviews/{id}` - update or soft-delete the authenticated user's review
