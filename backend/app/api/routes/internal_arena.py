from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import get_settings
from app.schemas.battle import (
    ActiveBattleResponse,
    ArenaUserOption,
    BattleResponse,
    SetActiveBattleRequest,
)
from app.services.battle_service import (
    clear_active_battle,
    get_active_battle,
    list_arena_users,
    set_active_battle,
)

router = APIRouter()
settings = get_settings()


class ClearActiveBattleRequest(BaseModel):
    moderator_user_id: int


def validate_internal_secret(secret: str) -> None:
    if secret != settings.internal_api_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API secret",
        )


@router.get("/active-battle", response_model=Optional[ActiveBattleResponse])
def read_active_battle(
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> Optional[ActiveBattleResponse]:
    validate_internal_secret(x_internal_api_secret)
    return get_active_battle(db)


@router.get("/users", response_model=list[ArenaUserOption])
def read_arena_users(
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> list[ArenaUserOption]:
    validate_internal_secret(x_internal_api_secret)
    return list_arena_users(db)


@router.post("/active-battle", response_model=BattleResponse)
def write_active_battle(
    payload: SetActiveBattleRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> BattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        battle = set_active_battle(db, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return BattleResponse.model_validate(battle)


@router.post("/active-battle/clear")
def remove_active_battle(
    payload: ClearActiveBattleRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> dict[str, bool]:
    validate_internal_secret(x_internal_api_secret)
    clear_active_battle(db, payload.moderator_user_id)
    return {"ok": True}
