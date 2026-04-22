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
    CreatePrivateBattleRequest,
    PrivateBattleActorRequest,
    SetActiveBattleRequest,
    PrivateBattleListItem,
    PrivateBattleResponse,
    PrivateBattleUserOption,
    SavePrivateBattleResultRequest,
    UpdateActiveBattleConfigRequest,
    UpdatePrivateBattleCodeRequest,
)
from app.services.battle_service import (
    clear_active_battle,
    create_private_battle,
    get_active_battle,
    get_private_battle_for_user,
    list_arena_users,
    list_private_battles_for_user,
    list_private_battle_users,
    mark_private_battle_ready,
    confirm_private_battle_code,
    reroll_private_battle_map,
    save_private_battle_result,
    set_active_battle,
    update_private_battle_code,
    update_active_battle_config,
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


@router.post("/active-battle/config", response_model=BattleResponse)
def write_active_battle_config(
    payload: UpdateActiveBattleConfigRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> BattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        battle = update_active_battle_config(db, payload)
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


@router.get("/private-battles", response_model=list[PrivateBattleListItem])
def read_private_battles(
    user_id: int,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> list[PrivateBattleListItem]:
    validate_internal_secret(x_internal_api_secret)
    return list_private_battles_for_user(db, user_id)


@router.get("/private-battle-users", response_model=list[PrivateBattleUserOption])
def read_private_battle_users(
    user_id: int,
    query: str = "",
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> list[PrivateBattleUserOption]:
    validate_internal_secret(x_internal_api_secret)
    return list_private_battle_users(db, user_id, query)


@router.get("/private-battles/{battle_id}", response_model=PrivateBattleResponse)
def read_private_battle(
    battle_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> PrivateBattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        return get_private_battle_for_user(db, battle_id, user_id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


@router.post("/private-battles", response_model=PrivateBattleResponse)
def write_private_battle(
    payload: CreatePrivateBattleRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> PrivateBattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        return create_private_battle(db, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post("/private-battles/{battle_id}/code", response_model=PrivateBattleResponse)
def save_private_battle_code(
    battle_id: int,
    payload: UpdatePrivateBattleCodeRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> PrivateBattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        return update_private_battle_code(db, battle_id, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post("/private-battles/{battle_id}/confirm-code", response_model=PrivateBattleResponse)
def confirm_private_battle_code_route(
    battle_id: int,
    payload: PrivateBattleActorRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> PrivateBattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        return confirm_private_battle_code(db, battle_id, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post("/private-battles/{battle_id}/reroll-map", response_model=PrivateBattleResponse)
def reroll_private_battle_map_route(
    battle_id: int,
    payload: PrivateBattleActorRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> PrivateBattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        return reroll_private_battle_map(db, battle_id, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post("/private-battles/{battle_id}/ready", response_model=PrivateBattleResponse)
def ready_private_battle(
    battle_id: int,
    payload: PrivateBattleActorRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> PrivateBattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        return mark_private_battle_ready(db, battle_id, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post("/private-battles/{battle_id}/result", response_model=PrivateBattleResponse)
def write_private_battle_result(
    battle_id: int,
    payload: SavePrivateBattleResultRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> PrivateBattleResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        return save_private_battle_result(db, battle_id, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
