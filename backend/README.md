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

2. Update the `DATABASE_URL` in `app/db/session.py` if needed.

3. Run Alembic migrations:

   ```bash
   alembic upgrade head
   ```

4. Seed reference data:

   ```bash
   python -c "import asyncio; from app.db.session import AsyncSessionLocal; from app.seed_data import seed_reference_data; async def main():
       async with AsyncSessionLocal() as session:
           await seed_reference_data(session)
   asyncio.run(main())"
   ```

## Notes

This corresponds to the enterprise SaaS database specification you supplied and is ready for extension into repositories, services, schemas, and API routes.
