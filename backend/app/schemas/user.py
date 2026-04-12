from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class SyncUserRequest(BaseModel):
    keycloak_user_id: str
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    keycloak_user_id: str
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    is_active: bool
