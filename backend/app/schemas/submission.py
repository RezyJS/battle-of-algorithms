from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import SubmissionStatus


class SubmissionListItem(BaseModel):
    id: int
    user_id: int
    username: str
    display_name: Optional[str] = None
    battle_id: Optional[int] = None
    code: str
    language: str
    status: SubmissionStatus
    version: int
    moderation_comment: Optional[str] = None
    submitted_at: Optional[datetime] = None
    moderated_at: Optional[datetime] = None
    moderated_by: Optional[int] = None
    moderator_username: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ModerationSubmissionPage(BaseModel):
    items: list[SubmissionListItem]
    total: int
    page: int
    page_size: int


class UpdateSubmissionStatusRequest(BaseModel):
    status: SubmissionStatus
    moderator_user_id: int
    comment: Optional[str] = None


class UpsertOwnSubmissionRequest(BaseModel):
    user_id: int
    code: str
    language: str = "javascript"


class SubmissionReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    submission_id: int
    action: str
    comment: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    battle_id: Optional[int] = None
    code: str
    language: str
    status: SubmissionStatus
    submitted_at: Optional[datetime] = None
    moderated_at: Optional[datetime] = None
    moderated_by: Optional[int] = None
    moderation_comment: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime


class OwnSubmissionResponse(BaseModel):
    submission: Optional[SubmissionResponse] = None
