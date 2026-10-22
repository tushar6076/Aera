"""add password reset codes

Revision ID: 6d1a2b3c4e5f
Revises: e267a34f13d5
Create Date: 2026-10-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6d1a2b3c4e5f"
down_revision: Union[str, Sequence[str], None] = "e267a34f13d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_codes",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("password_reset_codes")
