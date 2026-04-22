"""private battle map change votes

Revision ID: 20260422_0006
Revises: 20260422_0005
Create Date: 2026-04-22 19:35:00
"""

from collections.abc import Sequence
from typing import Optional

import sqlalchemy as sa
from alembic import op

revision: str = "20260422_0006"
down_revision: Optional[str] = "20260422_0005"
branch_labels: Optional[Sequence[str]] = None
depends_on: Optional[Sequence[str]] = None


def upgrade() -> None:
    op.add_column(
        "battles",
        sa.Column("left_map_change_requested", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "battles",
        sa.Column("right_map_change_requested", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("battles", "right_map_change_requested")
    op.drop_column("battles", "left_map_change_requested")
