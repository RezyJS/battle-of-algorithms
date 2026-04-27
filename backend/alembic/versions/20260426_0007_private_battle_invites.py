"""private battle invites

Revision ID: 20260426_0007
Revises: 20260422_0006
Create Date: 2026-04-26 13:20:00
"""

from collections.abc import Sequence
from typing import Optional

import sqlalchemy as sa
from alembic import op

revision: str = "20260426_0007"
down_revision: Optional[str] = "20260422_0006"
branch_labels: Optional[Sequence[str]] = None
depends_on: Optional[Sequence[str]] = None


def upgrade() -> None:
    op.create_table(
        "private_battle_invites",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("inviter_user_id", sa.Integer(), nullable=False),
        sa.Column("opponent_user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="pending", nullable=False),
        sa.Column("battle_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["battle_id"], ["battles.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["inviter_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["opponent_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_private_battle_invites_battle_id",
        "private_battle_invites",
        ["battle_id"],
    )
    op.create_index(
        "ix_private_battle_invites_inviter_user_id",
        "private_battle_invites",
        ["inviter_user_id"],
    )
    op.create_index(
        "ix_private_battle_invites_opponent_user_id",
        "private_battle_invites",
        ["opponent_user_id"],
    )
    op.create_index(
        "ix_private_battle_invites_status",
        "private_battle_invites",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index("ix_private_battle_invites_status", table_name="private_battle_invites")
    op.drop_index("ix_private_battle_invites_opponent_user_id", table_name="private_battle_invites")
    op.drop_index("ix_private_battle_invites_inviter_user_id", table_name="private_battle_invites")
    op.drop_index("ix_private_battle_invites_battle_id", table_name="private_battle_invites")
    op.drop_table("private_battle_invites")
