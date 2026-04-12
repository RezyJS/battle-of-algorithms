"""battle submission links

Revision ID: 20260412_0002
Revises: 20260412_0001
Create Date: 2026-04-12 15:56:00
"""

from collections.abc import Sequence
from typing import Optional

import sqlalchemy as sa
from alembic import op

revision: str = "20260412_0002"
down_revision: Optional[str] = "20260412_0001"
branch_labels: Optional[Sequence[str]] = None
depends_on: Optional[Sequence[str]] = None


def upgrade() -> None:
    op.add_column("battles", sa.Column("left_submission_id", sa.Integer(), nullable=True))
    op.add_column("battles", sa.Column("right_submission_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_battles_left_submission_id",
        "battles",
        "code_submissions",
        ["left_submission_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_battles_right_submission_id",
        "battles",
        "code_submissions",
        ["right_submission_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_battles_right_submission_id", "battles", type_="foreignkey")
    op.drop_constraint("fk_battles_left_submission_id", "battles", type_="foreignkey")
    op.drop_column("battles", "right_submission_id")
    op.drop_column("battles", "left_submission_id")
