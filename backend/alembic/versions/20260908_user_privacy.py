"""Add account privacy.

Revision ID: 20260908_user_privacy
Revises: 20260907_user_profile
"""

from alembic import op
import sqlalchemy as sa

revision = "20260908_user_privacy"
down_revision = "20260907_user_profile"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_private", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("users", "is_private")
