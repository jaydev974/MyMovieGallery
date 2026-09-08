"""Add review likes used by the review page.

Revision ID: 20260907_review_likes
Revises: 20260906_library_workflows
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260907_review_likes"
down_revision = "20260906_library_workflows"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "review_likes",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("review_id", sa.Uuid(), sa.ForeignKey("reviews.id"), nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.UniqueConstraint("review_id", "user_id", name="uq_review_likes_review_user"),
    )


def downgrade() -> None:
    op.drop_table("review_likes")