"""private battle rooms

Revision ID: 20260422_0003
Revises: 20260412_0002
Create Date: 2026-04-22 13:30:00
"""

from collections.abc import Sequence
from typing import Optional

import sqlalchemy as sa
from alembic import op

revision: str = "20260422_0003"
down_revision: Optional[str] = "20260412_0002"
branch_labels: Optional[Sequence[str]] = None
depends_on: Optional[Sequence[str]] = None


def upgrade() -> None:
    op.add_column(
        "battles",
        sa.Column(
            "battle_type",
            sa.String(length=32),
            nullable=False,
            server_default="arena",
        ),
    )
    op.add_column("battles", sa.Column("left_code", sa.Text(), nullable=True))
    op.add_column("battles", sa.Column("right_code", sa.Text(), nullable=True))
    op.add_column(
        "battles",
        sa.Column(
            "left_ready",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "battles",
        sa.Column(
            "right_ready",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.create_index("ix_battles_battle_type", "battles", ["battle_type"])


def downgrade() -> None:
    op.drop_index("ix_battles_battle_type", table_name="battles")
    op.drop_column("battles", "right_ready")
    op.drop_column("battles", "left_ready")
    op.drop_column("battles", "right_code")
    op.drop_column("battles", "left_code")
    op.drop_column("battles", "battle_type")
