"""Add account token tables.

Revision ID: 20260910_account_tokens
Revises: 20260910_refresh_tokens
"""

from alembic import op
import sqlalchemy as sa

revision = "20260910_account_tokens"
down_revision = "20260910_refresh_tokens"
branch_labels = None
depends_on = None


def _create_token_table(table_name: str) -> None:
    op.create_table(
        table_name,
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(f"ix_{table_name}_user_id", table_name, ["user_id"])
    op.create_index(f"ix_{table_name}_expires_at", table_name, ["expires_at"])


def upgrade() -> None:
    _create_token_table("email_verification_tokens")
    _create_token_table("password_reset_tokens")


def downgrade() -> None:
    op.drop_index("ix_password_reset_tokens_expires_at", table_name="password_reset_tokens")
    op.drop_index("ix_password_reset_tokens_user_id", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")

    op.drop_index("ix_email_verification_tokens_expires_at", table_name="email_verification_tokens")
    op.drop_index("ix_email_verification_tokens_user_id", table_name="email_verification_tokens")
    op.drop_table("email_verification_tokens")
