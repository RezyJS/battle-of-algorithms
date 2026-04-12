from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import SubmissionStatus
from app.models.mixins import TimestampMixin


class CodeSubmission(TimestampMixin, Base):
    __tablename__ = "code_submissions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    battle_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("battles.id", ondelete="SET NULL"),
        nullable=True,
    )
    code: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(Text, nullable=False, default="javascript")
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(
            SubmissionStatus,
            name="submission_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=SubmissionStatus.DRAFT,
        server_default=SubmissionStatus.DRAFT.value,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    moderated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    moderated_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    moderation_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="submissions",
    )
    battle = relationship(
        "Battle",
        foreign_keys=[battle_id],
        back_populates="submissions",
    )
    moderator = relationship(
        "User",
        foreign_keys=[moderated_by],
        back_populates="moderated_submissions",
    )
    reviews = relationship("SubmissionReview", back_populates="submission")
