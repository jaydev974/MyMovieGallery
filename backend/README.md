# MyMovieGallery Backend

This backend package contains the production-grade PostgreSQL architecture, SQLAlchemy 2.0 models, Alembic migration scaffolding, and seed data for the MyMovieGallery product.

## Included

- SQLAlchemy declarative models in `app/models.py`
- database session management in `app/db/session.py`
- base model in `app/db/base.py`
- Alembic migration baseline in `alembic/versions/20260905_initial_schema.py`
- seed references in `app/seed_data.py`
- architecture documentation in `docs/database_design.md`

## Quick start

1. Create the PostgreSQL 17 database:

   ```bash
   createdb mymoviegallery
   ```

2. Set the `DATABASE_URL` environment variable if the database is not local.

3. Run Alembic migrations:

   ```bash
   alembic upgrade head
   ```

4. Start the health-check API:

   ```bash
      uvicorn app.main:app --reload
   ```

## Notes

The schema is ready for extension into repositories, services, schemas, and API routes. The frontend currently uses local mock data until those API routes are implemented.
