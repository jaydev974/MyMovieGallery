# MyMovieGallery Deployment Guide

## Frontend deployment

The frontend is a Vite single-page application. It builds to `dist/` and includes route fallback configuration for client-side routes.

### Vercel

1. Push the repository to GitHub.
2. In Vercel, select **Add New Project** and import the repository.
3. Set the root directory to `frontend`, use `npm ci` as the install command, `npm run build` as the build command, and `dist` as the output directory.
4. Add `VITE_API_BASE_URL` with the public backend origin, then deploy. `vercel.json` keeps deep links such as `/dashboard` working.

### Netlify

1. In Netlify, select **Add new site > Import an existing project**.
2. Select the GitHub repository.
3. Set the base directory to `frontend`, use `npm run build` as the build command, and `dist` as the publish directory.
4. Deploy. `public/_redirects` handles SPA route fallback.

## Backend deployment

The backend is a separate FastAPI service. It exposes `/health`, JWT authentication, movie catalog, library, rating, review, watchlist, favorite, and watched-history endpoints consumed by the frontend.

### Render

1. Create a PostgreSQL instance with your hosting provider and copy its internal connection URL.
2. Create a Web Service from the same GitHub repository.
3. Set the root directory to `backend`, runtime to `Python 3`, build command to `pip install -r requirements.txt`, and start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add `DATABASE_URL` using the managed PostgreSQL URL, using the `postgresql+asyncpg://` SQLAlchemy format.
5. Run `alembic upgrade head` from the `backend` directory before enabling API traffic.
6. Set `ENVIRONMENT=production`, `DEBUG=false`, explicit `ALLOWED_HOSTS`, `CORS_ORIGINS`, and a random `JWT_SECRET_KEY` of at least 32 characters.
7. Confirm `https://<service>.onrender.com/health` returns `{"status":"ok"}` and `/ready` returns a database-backed ready response.

Set `CORS_ORIGINS` to the deployed frontend origin and set `VITE_API_BASE_URL` to the deployed API origin before connecting a production frontend.

## Docker deployment

Install Docker Desktop, start it, then run from the repository root:

```bash
docker compose up --build -d
docker compose ps
```

The frontend is available at `http://localhost:8080`, the backend health endpoint at `http://localhost:8000/health`, and PostgreSQL is available only inside the Compose network. View logs with `docker compose logs -f`; stop containers with `docker compose down`.

For a server deployment, copy the repository to the server, install Docker Engine and the Compose plugin, change the default database password and CORS origin in the Compose environment, then run the same commands. Put HTTPS and a domain in front of the frontend container with a reverse proxy such as Caddy or Traefik.

### Production Compose

Use the production-specific environment file and Compose configuration:

```bash
cp .env.production.example .env.production
# Replace all placeholder values in .env.production.
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

The production configuration does not publish PostgreSQL or FastAPI ports, runs the API with Gunicorn, disables interactive API documentation, requires explicit CORS origins, and uses a non-root backend container. Terminate HTTPS at a managed load balancer or reverse proxy and forward traffic to the frontend on port 80.

## GitHub push

From the repository root:

```bash
git add .
git commit -m "Prepare MyMovieGallery for deployment"
git push origin main
```

The repository already has an `origin` remote configured. Never commit database passwords, API keys, `.env` files, or tokens. Add them through the hosting provider's environment-variable settings.

## Release checklist

- `cd frontend && npm run lint` passes.
- `cd frontend && npm run build` passes.
- The deployed root page loads.
- Direct navigation to `/login`, `/movies`, and `/settings` works after refresh.
- Backend `/health` responds successfully, if the backend is deployed.
- Production CORS allows only the deployed frontend origin.
- Database migrations have run before enabling API traffic.