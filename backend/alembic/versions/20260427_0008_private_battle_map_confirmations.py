"""private battle map confirmations

Revision ID: 20260427_0008
Revises: 20260426_0007
Create Date: 2026-04-27 13:20:00
"""

from collections.abc import Sequence
from typing import Optional

import sqlalchemy as sa
from alembic import op

revision: str = "20260427_0008"
down_revision: Optional[str] = "20260426_0007"
branch_labels: Optional[Sequence[str]] = None
depends_on: Optional[Sequence[str]] = None


def upgrade() -> None:
    op.add_column(
        "battles",
        sa.Column("left_map_confirmed", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "battles",
        sa.Column("right_map_confirmed", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("battles", "right_map_confirmed")
    op.drop_column("battles", "left_map_confirmed")
