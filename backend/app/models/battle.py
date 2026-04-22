from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import BattleStatus
from app.models.mixins import TimestampMixin


class Battle(TimestampMixin, Base):
    __tablename__ = "battles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    battle_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="arena",
        server_default="arena",
    )
    status: Mapped[BattleStatus] = mapped_column(
        Enum(
            BattleStatus,
            name="battle_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=BattleStatus.DRAFT,
        server_default=BattleStatus.DRAFT.value,
    )
    left_player_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    right_player_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    left_submission_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("code_submissions.id", ondelete="SET NULL"),
        nullable=True,
    )
    right_submission_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("code_submissions.id", ondelete="SET NULL"),
        nullable=True,
    )
    left_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    right_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    left_ready: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    right_ready: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    left_code_confirmed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    right_code_confirmed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    left_map_change_requested: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    right_map_change_requested: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    map_revision: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )
    winner_player_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    result_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result_scores: Mapped[Optional[list[int]]] = mapped_column(JSON, nullable=True)
    map_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    left_player = relationship(
        "User",
        foreign_keys=[left_player_id],
        back_populates="left_battles",
    )
    right_player = relationship(
        "User",
        foreign_keys=[right_player_id],
        back_populates="right_battles",
    )
    left_submission = relationship(
        "CodeSubmission",
        foreign_keys=[left_submission_id],
    )
    right_submission = relationship(
        "CodeSubmission",
        foreign_keys=[right_submission_id],
    )
    creator = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="created_battles",
    )
    winner_player = relationship(
        "User",
        foreign_keys=[winner_player_id],
    )
    submissions = relationship(
        "CodeSubmission",
        foreign_keys="CodeSubmission.battle_id",
        back_populates="battle",
    )
