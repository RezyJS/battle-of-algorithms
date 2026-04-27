from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class PrivateBattleInvite(TimestampMixin, Base):
    __tablename__ = "private_battle_invites"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    inviter_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    opponent_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        server_default="pending",
        index=True,
    )
    battle_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("battles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    inviter = relationship("User", foreign_keys=[inviter_user_id])
    opponent = relationship("User", foreign_keys=[opponent_user_id])
    battle = relationship("Battle", foreign_keys=[battle_id])
