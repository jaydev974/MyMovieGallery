# MyMovieGallery Deployment Guide

## Frontend deployment

The frontend is a Vite single-page application. It builds to `dist/` and includes route fallback configuration for client-side routes.

### Vercel

1. Push the repository to GitHub.
2. In Vercel, select **Add New Project** and import the repository.
3. Use `npm ci` as the install command, `npm run build` as the build command, and `dist` as the output directory.
4. Deploy. `vercel.json` keeps deep links such as `/dashboard` working.

### Netlify

1. In Netlify, select **Add new site > Import an existing project**.
2. Select the GitHub repository.
3. Use `npm run build` as the build command and `dist` as the publish directory.
4. Deploy. `public/_redirects` handles SPA route fallback.

## Backend deployment

The backend is a separate FastAPI service. It currently exposes `/health` and contains the PostgreSQL schema/migrations; the frontend does not call it yet.

### Render

1. Create a PostgreSQL instance in Render and copy its internal connection URL.
2. Create a Web Service from the same GitHub repository.
3. Set the root directory to `backend`, runtime to `Python 3`, build command to `pip install -r requirements.txt`, and start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add `DATABASE_URL` using the managed PostgreSQL URL.
5. Run `alembic upgrade head` from the `backend` directory before enabling API traffic.
6. Confirm `https://<service>.onrender.com/health` returns `{"status":"ok"}`.

Before connecting a production frontend, replace the localhost CORS origin in `backend/app/main.py` with the deployed frontend origin and move it to an environment variable.

## GitHub push

From the repository root:

```bash
git add .
git commit -m "Prepare MyMovieGallery for deployment"
git push origin main
```

The repository already has an `origin` remote configured. Never commit database passwords, API keys, `.env` files, or tokens. Add them through the hosting provider's environment-variable settings.

## Release checklist

- `npm run lint` passes.
- `npm run build` passes.
- The deployed root page loads.
- Direct navigation to `/login`, `/movies`, and `/settings` works after refresh.
- Backend `/health` responds successfully, if the backend is deployed.
- Production CORS allows only the deployed frontend origin.
- Database migrations have run before enabling API traffic.