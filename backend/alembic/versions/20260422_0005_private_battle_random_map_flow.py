"""private battle random map flow

Revision ID: 20260422_0005
Revises: 20260422_0004
Create Date: 2026-04-22 19:10:00
"""

from collections.abc import Sequence
from typing import Optional

import sqlalchemy as sa
from alembic import op

revision: str = "20260422_0005"
down_revision: Optional[str] = "20260422_0004"
branch_labels: Optional[Sequence[str]] = None
depends_on: Optional[Sequence[str]] = None


def upgrade() -> None:
    op.add_column(
        "battles",
        sa.Column("left_code_confirmed", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "battles",
        sa.Column("right_code_confirmed", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "battles",
        sa.Column("map_revision", sa.Integer(), nullable=False, server_default="1"),
    )


def downgrade() -> None:
    op.drop_column("battles", "map_revision")
    op.drop_column("battles", "right_code_confirmed")
    op.drop_column("battles", "left_code_confirmed")
