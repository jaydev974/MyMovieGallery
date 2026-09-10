# MyMovieGallery

MyMovieGallery is a cinematic React + TypeScript movie-tracking experience backed by FastAPI, PostgreSQL, and JWT authentication. The current release includes a responsive gallery, dashboard, watchlist, reviews, analytics, recommendations, themes, and authentication flows.

Run the services locally with Docker, or run each project separately.

### Separate development servers

Backend, from the repository root:

```bash
cd backend
copy .env.example .env
# Set DATABASE_URL, JWT_SECRET_KEY, and optionally OMDB_API_KEY in backend/.env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend, in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

For a separate frontend host, set `VITE_API_BASE_URL` in `frontend/.env` to the backend origin. When using the bundled Docker nginx proxy, leave it empty.

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Deployment

## Profiles and metadata

Accounts can be public or private. Public profiles are available at `/users/:username`; private profiles disclose no library activity to other visitors. Set `OMDB_API_KEY` in `backend/.env` for local development, or in the root `.env` used by Docker Compose, to enable the server-side `GET /api/metadata/omdb/search?query=...` metadata lookup. The key is intentionally never sent to the browser.

The focused API routers live in `backend/app/api/`:

- `profiles.py` owns public profile and watched-history access rules.
- `metadata.py` owns external movie metadata providers such as OMDb.

With the backend running, search from the app's Search page or call `GET http://localhost:8000/api/metadata/omdb/search?query=inception`. The endpoint forwards the query and `OMDB_API_KEY` to OMDb. Supply a JWT `Authorization: Bearer <token>` header when the viewer needs owner-only access to a private profile.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the complete Vercel, Netlify, Render, and GitHub setup instructions.

## Docker

With Docker Desktop running, start the frontend, backend, and PostgreSQL database together:

```bash
docker compose up --build -d
```

Open `http://localhost:8080` for the app and `http://localhost:8000/health` for the API. The frontend uses the API for authentication, movies, ratings, reviews, watchlist, favorites, and watched history. Stop the stack with `docker compose down`; add `-v` only when you also want to delete the database volume.

### Personalized recommendations

Authenticated users load private recommendations from `GET /api/recommendations/me?limit=20`. The backend trains TF-IDF vectors over catalog title, genres, overview, director, cast, and keywords, then weights completed watches by rating, favorite status, and recency. It excludes watched and unavailable movies, diversifies repeated genres/directors, caches results in the existing recommendations table, and invalidates that cache after library preference changes. New users receive featured/popular cold-start results and watchlist signals when available.

The Docker backend image runs `python scripts/train_recommender.py` during build. To retrain locally after catalog metadata changes, run it from `backend/`; no additional environment variable is needed. `OMDB_API_KEY` remains optional and is used only by the server-side metadata proxy.

For a production-style Docker deployment, copy `.env.production.example` to `.env.production`, replace every placeholder, then run:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

The production Compose file keeps PostgreSQL and FastAPI private, runs the API with Gunicorn workers, disables API documentation, and requires explicit database credentials, JWT secrets, allowed hosts, and CORS origins.

## License

MIT

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
