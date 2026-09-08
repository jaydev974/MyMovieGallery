"""Add movie library and social workflow tables.

Revision ID: 20260906_library_workflows
Revises: 20260905_initial_schema
"""

from __future__ import annotations

import uuid
from datetime import date

import sqlalchemy as sa
from alembic import op

revision = "20260906_library_workflows"
down_revision = "20260905_initial_schema"
branch_labels = None
depends_on = None

MOVIES = [
    ("Inception", 2010, ["science fiction", "action", "thriller"], "A thief enters dreams to steal secrets and plant an idea."),
    ("The Dark Knight", 2008, ["action", "crime", "drama"], "A masked hero faces a criminal mastermind who creates chaos in Gotham."),
    ("Interstellar", 2014, ["science fiction", "drama", "adventure"], "Explorers travel through a wormhole to find a future for humanity."),
    ("The Matrix", 1999, ["science fiction", "action", "thriller"], "A hacker discovers that reality is an artificial simulation and joins a rebellion."),
    ("Blade Runner 2049", 2017, ["science fiction", "drama", "mystery"], "A young blade runner uncovers a secret that leads him to a former officer."),
    ("Arrival", 2016, ["science fiction", "drama", "mystery"], "A linguist works with visitors from space to understand their language and purpose."),
    ("The Lord of the Rings", 2001, ["fantasy", "adventure", "drama"], "A fellowship begins a dangerous journey to destroy a powerful ring."),
    ("The Martian", 2015, ["science fiction", "adventure", "drama"], "An astronaut stranded on Mars uses science and ingenuity to survive."),
    ("Mad Max Fury Road", 2015, ["action", "adventure", "science fiction"], "Survivors race across a wasteland while escaping a ruthless tyrant."),
    ("Dune", 2021, ["science fiction", "adventure", "drama"], "A gifted heir travels to a dangerous desert world and becomes part of a vast struggle."),
    ("Parasite", 2019, ["thriller", "drama", "comedy"], "A struggling family becomes entangled with a wealthy household through a dangerous scheme."),
    ("The Grand Budapest Hotel", 2014, ["comedy", "drama", "adventure"], "A concierge and his lobby boy become involved in a stolen painting and an inheritance dispute."),
]


def upgrade() -> None:
    uuid_type = sa.Uuid()

    op.create_table(
        "movie_genres",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("movie_id", uuid_type, sa.ForeignKey("movies.id"), nullable=False),
        sa.Column("genre_name", sa.String(length=80), nullable=False),
        sa.UniqueConstraint("movie_id", "genre_name", name="uq_movie_genres_movie_name"),
    )
    op.create_table(
        "ratings",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("user_id", uuid_type, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("movie_id", uuid_type, sa.ForeignKey("movies.id"), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=40), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("score >= 1 AND score <= 10", name="ck_ratings_score_range"),
        sa.UniqueConstraint("user_id", "movie_id", name="uq_ratings_user_movie"),
    )
    op.create_table(
        "reviews",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("user_id", uuid_type, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("movie_id", uuid_type, sa.ForeignKey("movies.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="published"),
        sa.Column("spoiler_flag", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_spoiler", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("like_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comment_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "movie_id", name="uq_reviews_user_movie"),
    )
    op.create_table(
        "favorites",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("user_id", uuid_type, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("movie_id", uuid_type, sa.ForeignKey("movies.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.UniqueConstraint("user_id", "movie_id", name="uq_favorites_user_movie"),
    )
    op.create_table(
        "watch_history",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("user_id", uuid_type, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("movie_id", uuid_type, sa.ForeignKey("movies.id"), nullable=False),
        sa.Column("watched_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
    )
    op.create_table(
        "watchlist",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("user_id", uuid_type, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False, server_default="My Watchlist"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.UniqueConstraint("user_id", "name", name="uq_watchlist_user_name"),
    )
    op.create_table(
        "watchlist_items",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("watchlist_id", uuid_type, sa.ForeignKey("watchlist.id"), nullable=False),
        sa.Column("movie_id", uuid_type, sa.ForeignKey("movies.id"), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("added_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.UniqueConstraint("watchlist_id", "movie_id", name="uq_watchlist_items_watchlist_movie"),
    )

    movie_rows = []
    genre_rows = []
    for title, year, genres, overview in MOVIES:
        movie_id = uuid.uuid4()
        movie_rows.append(
            {
                "id": movie_id,
                "title": title,
                "slug": title.casefold().replace(" ", "-").replace("'", ""),
                "overview": overview,
                "release_date": date(year, 1, 1),
                "status": "released",
                "vote_average": 8.0,
                "vote_count": 1,
            }
        )
        genre_rows.extend({"id": uuid.uuid4(), "movie_id": movie_id, "genre_name": genre} for genre in genres)

    op.bulk_insert(
        sa.table(
            "movies",
            sa.column("id", uuid_type),
            sa.column("title", sa.String),
            sa.column("slug", sa.String),
            sa.column("overview", sa.Text),
            sa.column("release_date", sa.Date),
            sa.column("status", sa.String),
            sa.column("vote_average", sa.Numeric),
            sa.column("vote_count", sa.BigInteger),
        ),
        movie_rows,
    )
    op.bulk_insert(
        sa.table(
            "movie_genres",
            sa.column("id", uuid_type),
            sa.column("movie_id", uuid_type),
            sa.column("genre_name", sa.String),
        ),
        genre_rows,
    )


def downgrade() -> None:
    op.drop_table("watchlist_items")
    op.drop_table("watchlist")
    op.drop_table("watch_history")
    op.drop_table("favorites")
    op.drop_table("reviews")
    op.drop_table("ratings")
    op.drop_table("movie_genres")
