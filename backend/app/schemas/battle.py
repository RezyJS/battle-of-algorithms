from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

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
    map_config: Optional[dict[str, Any]] = None
    started_at: Optional[datetime] = None
    updated_at: datetime


class PrivateBattleListItem(BaseModel):
    id: int
    title: str
    status: BattleStatus
    left_player_id: Optional[int] = None
    right_player_id: Optional[int] = None
    left_player_name: Optional[str] = None
    left_player_username: Optional[str] = None
    right_player_name: Optional[str] = None
    right_player_username: Optional[str] = None
    left_ready: bool
    right_ready: bool
    left_code_confirmed: bool
    right_code_confirmed: bool
    left_map_change_requested: bool
    right_map_change_requested: bool
    map_revision: int
    has_result: bool
    winner_player_id: Optional[int] = None
    winner_slot: Optional[str] = None
    result_reason: Optional[str] = None
    result_scores: Optional[list[int]] = None
    finished_at: Optional[datetime] = None
    current_user_slot: str
    updated_at: datetime


class PrivateBattleResponse(BaseModel):
    id: int
    title: str
    status: BattleStatus
    left_player_id: Optional[int] = None
    right_player_id: Optional[int] = None
    left_player_name: Optional[str] = None
    left_player_username: Optional[str] = None
    right_player_name: Optional[str] = None
    right_player_username: Optional[str] = None
    left_ready: bool
    right_ready: bool
    left_code_confirmed: bool
    right_code_confirmed: bool
    left_map_change_requested: bool
    right_map_change_requested: bool
    map_revision: int
    current_user_slot: str
    current_user_code: str
    can_view_battle: bool
    has_result: bool
    winner_player_id: Optional[int] = None
    winner_slot: Optional[str] = None
    result_reason: Optional[str] = None
    result_scores: Optional[list[int]] = None
    left_code: Optional[str] = None
    right_code: Optional[str] = None
    map_config: Optional[dict[str, Any]] = None
    created_at: datetime
    finished_at: Optional[datetime] = None
    updated_at: datetime


class PrivateBattleUserOption(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None


class SetActiveBattleRequest(BaseModel):
    left_player_id: int
    right_player_id: int
    moderator_user_id: int
    map_config: Optional[dict[str, Any]] = None


class UpdateActiveBattleConfigRequest(BaseModel):
    moderator_user_id: int
    map_config: dict[str, Any]


class CreatePrivateBattleRequest(BaseModel):
    inviter_user_id: int
    opponent_username: str


class UpdatePrivateBattleCodeRequest(BaseModel):
    user_id: int
    code: str


class PrivateBattleActorRequest(BaseModel):
    user_id: int


class SavePrivateBattleResultRequest(BaseModel):
    user_id: int
    winner: Optional[int] = None
    reason: str
    scores: list[int]


class BattleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: BattleStatus
    left_player_id: Optional[int] = None
    right_player_id: Optional[int] = None
    left_submission_id: Optional[int] = None
    right_submission_id: Optional[int] = None
    map_config: Optional[dict[str, Any]] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_at: datetime
