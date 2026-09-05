# MyMovieGallery

## How to use, run, and change the project

This guide describes the current project as implemented. The application is a React, TypeScript, and Vite movie gallery. The frontend currently uses local mock movie data, so it can be run without the backend or a database.

## 1. Prerequisites

- Node.js 20 or newer
- npm
- Optional: Python 3.11 or newer and PostgreSQL 17 for backend database work

Check the installed versions:

```powershell
node --version
npm --version
python --version
```

## 2. Run the frontend

Open PowerShell in the project root:

```powershell
cd D:\Projects\MyMovieGallery
npm install
npm run dev
```

Open the local URL shown by Vite, normally `http://localhost:5173`.

Useful frontend commands:

```powershell
npm run build    # Type-check and create a production build
npm run lint     # Run Oxlint
npm run preview  # Preview the production build locally
```

The frontend uses mock data from `src/utils/mockData.ts`. No API server is currently required for the visible application.

## 3. Optional backend setup

The backend contains SQLAlchemy models, an asynchronous database session, Alembic migrations, and seed data. It does not currently provide the frontend API routes needed to replace the mock data.

Create and activate a virtual environment:

```powershell
cd D:\Projects\MyMovieGallery\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create a PostgreSQL database:

```powershell
createdb mymoviegallery
```

The default connection is:

```text
postgresql+asyncpg://postgres:postgres@localhost:5432/mymoviegallery
```

It is configured in `backend/app/db/session.py`. Update that file if the local PostgreSQL username, password, host, port, or database differs.

Run the migration:

```powershell
alembic upgrade head
```

Run the backend only after an ASGI application has been added to `backend/app/main.py`:

```powershell
uvicorn app.main:app --reload
```

## 4. How to use the application

1. Start the frontend with `npm run dev`.
2. Open the Vite URL in a browser.
3. Use the navigation to explore the dashboard, gallery, search, recommendations, watchlist, reviews, analytics, profile, and settings pages.
4. Use the theme controls in the application settings or navigation where available.
5. Movie changes currently live in browser state and mock data. They are not persisted to a production database yet.

## 5. How to make common changes

### Change movie content

Edit `src/utils/mockData.ts`. Add or update movie fields using the `Movie` type in `src/types/index.ts`.

### Change a page

Pages are in `src/pages/`. Route registration is in `src/routes/AppRoutes.tsx`.

### Change shared navigation or layout

- `src/components/navigation/Navbar.tsx`
- `src/components/navigation/Sidebar.tsx`
- `src/layouts/AppLayout.tsx`
- `src/layouts/RootLayout.tsx`

### Change reusable movie UI

- `src/components/ui/MovieCard.tsx`
- `src/components/ui/MovieCarousel.tsx`
- `src/components/ui/RatingStars.tsx`
- `src/components/ui/StatCard.tsx`

### Change colors and themes

- Global styles: `src/styles/globals.css`
- Application-wide styles: `src/App.css` and `src/index.css`
- Theme definitions: `src/themes/themes.ts`
- Theme state: `src/store/themeStore.ts`

### Change state behavior

The Zustand stores are in `src/store/`:

- `authStore.ts` for authentication state
- `movieStore.ts` for movie, watchlist, rating, and review state
- `themeStore.ts` for themes
- `toastStore.ts` for notifications

### Add an API later

1. Add FastAPI routes under `backend/app/`.
2. Add request and response schemas.
3. Keep database access in repository or service modules.
4. Add a frontend API client and replace mock-data reads incrementally.
5. Add loading, error, and empty states to affected pages.
6. Configure the frontend API base URL with a Vite environment variable.

## 6. Recommended change workflow

```powershell
cd D:\Projects\MyMovieGallery
npm run lint
npm run build
```

After a UI change, refresh the browser and check both desktop and mobile widths. Before committing, review the changed files and confirm that unrelated files were not modified.

## 7. Troubleshooting

### `npm` or `node` is not recognized

Install Node.js, restart PowerShell, and rerun `node --version`.

### Port 5173 is already in use

Vite will normally select another port and print it. Open the URL printed in the terminal.

### PowerShell blocks virtual environment activation

Run PowerShell as your user and use:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then activate the environment again.

### PostgreSQL connection fails

Confirm PostgreSQL is running, the database exists, and the values in `backend/app/db/session.py` match the local credentials.

## Project structure at a glance

```text
src/
  components/   reusable UI and navigation
  layouts/      page shells
  pages/        route-level screens
  routes/       route definitions
  store/        Zustand state
  styles/       global styling
  themes/       theme definitions
  types/        shared TypeScript types
  utils/        formatters and mock data
backend/
  app/          database models and session setup
  alembic/      migration configuration and versions
```
