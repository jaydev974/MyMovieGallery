# MyMovieGallery

MyMovieGallery is a cinematic React + TypeScript movie-tracking experience. The current release includes a responsive gallery, dashboard, watchlist, reviews, analytics, recommendations, themes, authentication flows, and persisted demo state in the browser.

Run the backend locally after installing `backend/requirements.txt`:

```bash
cd backend
uvicorn app.main:app --reload
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the complete Vercel, Netlify, Render, and GitHub setup instructions.

## Docker

With Docker Desktop running, start the frontend, backend, and PostgreSQL database together:

```bash
docker compose up --build
```

Open `http://localhost:8080` for the app and `http://localhost:8000/health` for the API. Stop the stack with `docker compose down`; add `-v` only when you also want to delete the database volume.

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
