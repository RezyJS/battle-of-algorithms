from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import BattleStatus


class ArenaUserOption(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    approved_submission_id: Optional[int] = None
    approved_submission_version: Optional[int] = None


class ActiveBattleResponse(BaseModel):
    id: int
    title: str
    status: BattleStatus
    left_player_id: Optional[int] = None
    right_player_id: Optional[int] = None
    left_submission_id: Optional[int] = None
    right_submission_id: Optional[int] = None
    left_player_name: Optional[str] = None
    right_player_name: Optional[str] = None
    left_submission_version: Optional[int] = None
    right_submission_version: Optional[int] = None
    left_code: Optional[str] = None
    right_code: Optional[str] = None
    started_at: Optional[datetime] = None
    updated_at: datetime


class SetActiveBattleRequest(BaseModel):
    left_player_id: int
    right_player_id: int
    moderator_user_id: int


class BattleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: BattleStatus
    left_player_id: Optional[int] = None
    right_player_id: Optional[int] = None
    left_submission_id: Optional[int] = None
    right_submission_id: Optional[int] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_at: datetime
