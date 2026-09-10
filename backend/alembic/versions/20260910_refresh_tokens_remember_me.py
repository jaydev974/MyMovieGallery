"""Add remember_me to refresh tokens.

Revision ID: 20260910_refresh_tokens_remember_me
Revises: 20260910_refresh_tokens
"""

from alembic import op
import sqlalchemy as sa

revision = "20260910_refresh_tokens_remember_me"
down_revision = "20260910_refresh_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "refresh_tokens",
        sa.Column("remember_me", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index("ix_refresh_tokens_remember_me", "refresh_tokens", ["remember_me"])


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_remember_me", table_name="refresh_tokens")
    op.drop_column("refresh_tokens", "remember_me")
