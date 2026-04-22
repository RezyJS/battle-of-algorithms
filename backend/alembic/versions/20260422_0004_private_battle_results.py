"""private battle results

Revision ID: 20260422_0004
Revises: 20260422_0003
Create Date: 2026-04-22 18:10:00
"""

from collections.abc import Sequence
from typing import Optional

import sqlalchemy as sa
from alembic import op

revision: str = "20260422_0004"
down_revision: Optional[str] = "20260422_0003"
branch_labels: Optional[Sequence[str]] = None
depends_on: Optional[Sequence[str]] = None


def upgrade() -> None:
    op.add_column("battles", sa.Column("winner_player_id", sa.Integer(), nullable=True))
    op.add_column("battles", sa.Column("result_reason", sa.Text(), nullable=True))
    op.add_column("battles", sa.Column("result_scores", sa.JSON(), nullable=True))
    op.create_foreign_key(
        "fk_battles_winner_player_id",
        "battles",
        "users",
        ["winner_player_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_battles_winner_player_id", "battles", type_="foreignkey")
    op.drop_column("battles", "result_scores")
    op.drop_column("battles", "result_reason")
    op.drop_column("battles", "winner_player_id")
