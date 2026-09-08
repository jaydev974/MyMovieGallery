"""Add editable profile fields.

Revision ID: 20260907_user_profile
Revises: 20260907_review_likes
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260907_user_profile"
down_revision = "20260907_review_likes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("location", sa.String(length=180), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "location")
    op.drop_column("users", "bio")