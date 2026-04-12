from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import get_settings
from app.schemas.user import SyncUserRequest, UserResponse
from app.services.user_service import sync_user_profile

router = APIRouter()
settings = get_settings()


@router.post("/sync-user", response_model=UserResponse, summary="Sync user profile")
def sync_user(
    payload: SyncUserRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> UserResponse:
    if x_internal_api_secret != settings.internal_api_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API secret",
        )

    user = sync_user_profile(db, payload)
    return UserResponse.model_validate(user)
