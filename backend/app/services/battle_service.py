from __future__ import annotations

from datetime import datetime, timezone
import random
from collections import deque
from typing import Any

from sqlalchemy import and_, or_, select, update
from sqlalchemy.orm import Session, aliased

from app.models.audit_log import AuditLog
from app.models.battle import Battle
from app.models.code_submission import CodeSubmission
from app.models.enums import BattleStatus, SubmissionStatus
from app.models.user import User
from app.schemas.battle import (
    ActiveBattleResponse,
    ArenaUserOption,
    CreatePrivateBattleRequest,
    PrivateBattleActorRequest,
    PrivateBattleListItem,
    PrivateBattleResponse,
    PrivateBattleUserOption,
    SavePrivateBattleResultRequest,
    SetActiveBattleRequest,
    UpdateActiveBattleConfigRequest,
    UpdatePrivateBattleCodeRequest,
)

ARENA_BATTLE_TYPE = "arena"
PRIVATE_BATTLE_TYPE = "private"
PRIVATE_BATTLE_WIDTH_OPTIONS = (9, 11, 13)
PRIVATE_BATTLE_HEIGHT_OPTIONS = (7, 9, 11)


def _generate_private_battle_map_config() -> dict[str, Any]:
    width = random.choice(PRIVATE_BATTLE_WIDTH_OPTIONS)
    height = random.choice(PRIVATE_BATTLE_HEIGHT_OPTIONS)
    grid = [["wall" for _ in range(width)] for _ in range(height)]
    visited = [[False for _ in range(width)] for _ in range(height)]
    directions = ((0, -2), (0, 2), (-2, 0), (2, 0))

    def shuffle(items: tuple[tuple[int, int], ...]) -> list[tuple[int, int]]:
        result = list(items)
        random.shuffle(result)
        return result

    def carve(x: int, y: int) -> None:
        visited[y][x] = True
        grid[y][x] = "empty"

        for dx, dy in shuffle(directions):
            nx = x + dx
            ny = y + dy
            if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx]:
                grid[y + dy // 2][x + dx // 2] = "empty"
                carve(nx, ny)

    def neighbors_count(x: int, y: int) -> int:
        values = []
        if y - 1 >= 0:
            values.append(grid[y - 1][x])
        if y + 1 < height:
            values.append(grid[y + 1][x])
        if x - 1 >= 0:
            values.append(grid[y][x - 1])
        if x + 1 < width:
            values.append(grid[y][x + 1])
        return sum(1 for value in values if value == "empty")

    def reachable(spawns: list[dict[str, int]], targets: list[dict[str, int]]) -> bool:
        for spawn in spawns:
            queue: deque[tuple[int, int]] = deque([(spawn["x"], spawn["y"])])
            seen = {(spawn["x"], spawn["y"])}
            while queue:
                x, y = queue.popleft()
                for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                    nx = x + dx
                    ny = y + dy
                    if not (0 <= nx < width and 0 <= ny < height):
                        continue
                    if (nx, ny) in seen or grid[ny][nx] == "wall":
                        continue
                    seen.add((nx, ny))
                    queue.append((nx, ny))
            if any((target["x"], target["y"]) not in seen for target in targets):
                return False
        return True

    carve(0, 0)

    for y in range(1, height - 1):
        for x in range(1, width - 1):
            if grid[y][x] == "wall" and random.random() < 0.3:
                neighbors = neighbors_count(x, y)
                if 2 <= neighbors <= 3:
                    grid[y][x] = "empty"

    empty_cells = [
        {"x": x, "y": y}
        for y in range(height)
        for x in range(width)
        if grid[y][x] == "empty"
    ]

    def pick_random(cells: list[dict[str, int]]) -> dict[str, int]:
        return random.choice(cells)

    def distance(a: dict[str, int], b: dict[str, int]) -> int:
        return abs(a["x"] - b["x"]) + abs(a["y"] - b["y"])

    attempts = 0
    spawn1 = spawn2 = key1 = key2 = exit_point = {"x": 0, "y": 0}
    while attempts < 100:
        attempts += 1
        spawn1 = pick_random(empty_cells)
        far_cells = [
            cell for cell in empty_cells if distance(cell, spawn1) >= (width + height) // 3
        ]
        available_spawns = far_cells or [
            cell for cell in empty_cells if cell != spawn1
        ]
        spawn2 = pick_random(available_spawns)

        used = {f'{spawn1["x"]},{spawn1["y"]}', f'{spawn2["x"]},{spawn2["y"]}'}
        available = [cell for cell in empty_cells if f'{cell["x"]},{cell["y"]}' not in used]
        key1 = pick_random(available)
        used.add(f'{key1["x"]},{key1["y"]}')
        available = [cell for cell in available if f'{cell["x"]},{cell["y"]}' not in used]
        key2 = pick_random(available)
        used.add(f'{key2["x"]},{key2["y"]}')
        available = [cell for cell in available if f'{cell["x"]},{cell["y"]}' not in used]
        exit_point = pick_random(available)

        if reachable([spawn1, spawn2], [key1, key2, exit_point]):
            break

    grid[key1["y"]][key1["x"]] = "key1"
    grid[key2["y"]][key2["x"]] = "key2"
    grid[exit_point["y"]][exit_point["x"]] = "exit"

    return {
        "gameMode": "duel",
        "mapType": "random",
        "width": width,
        "height": height,
        "grid": grid,
        "spawn1": spawn1,
        "spawn2": spawn2,
    }


def _display_name(user: User | None) -> str | None:
    if user is None:
        return None

    return user.display_name or user.username


def _get_private_battle_for_user(db: Session, battle_id: int, user_id: int) -> Battle:
    battle = db.scalar(
        select(Battle).where(
            Battle.id == battle_id,
            Battle.battle_type == PRIVATE_BATTLE_TYPE,
            or_(Battle.left_player_id == user_id, Battle.right_player_id == user_id),
        )
    )

    if battle is None:
        raise ValueError("Private battle not found")

    return battle


def _resolve_slot(battle: Battle, user_id: int) -> str:
    if battle.left_player_id == user_id:
        return "left"
    if battle.right_player_id == user_id:
        return "right"
    raise ValueError("User is not a participant in this battle")


def _is_private_battle_locked(battle: Battle) -> bool:
    return battle.left_ready and battle.right_ready


def _private_battle_response(
    battle: Battle,
    current_user_id: int,
    left_user: User | None,
    right_user: User | None,
) -> PrivateBattleResponse:
    current_user_slot = _resolve_slot(battle, current_user_id)
    can_view_battle = _is_private_battle_locked(battle)

    current_user_code = (
        battle.left_code if current_user_slot == "left" else battle.right_code
    ) or ""

    return PrivateBattleResponse(
        id=battle.id,
        title=battle.title,
        status=battle.status,
        left_player_id=battle.left_player_id,
        right_player_id=battle.right_player_id,
        left_player_name=_display_name(left_user),
        left_player_username=left_user.username if left_user else None,
        right_player_name=_display_name(right_user),
        right_player_username=right_user.username if right_user else None,
        left_ready=battle.left_ready,
        right_ready=battle.right_ready,
        left_code_confirmed=battle.left_code_confirmed,
        right_code_confirmed=battle.right_code_confirmed,
        left_map_change_requested=battle.left_map_change_requested,
        right_map_change_requested=battle.right_map_change_requested,
        map_revision=battle.map_revision,
        current_user_slot=current_user_slot,
        current_user_code=current_user_code,
        can_view_battle=can_view_battle,
        has_result=battle.result_reason is not None,
        winner_player_id=battle.winner_player_id,
        winner_slot=(
            "left"
            if battle.winner_player_id is not None
            and battle.winner_player_id == battle.left_player_id
            else "right"
            if battle.winner_player_id is not None
            and battle.winner_player_id == battle.right_player_id
            else None
        ),
        result_reason=battle.result_reason,
        result_scores=battle.result_scores,
        left_code=battle.left_code if can_view_battle else None,
        right_code=battle.right_code if can_view_battle else None,
        map_config=battle.map_config,
        created_at=battle.created_at,
        finished_at=battle.finished_at,
        updated_at=battle.updated_at,
    )


def list_arena_users(db: Session) -> list[ArenaUserOption]:
    approved_submission = aliased(CodeSubmission)

    rows = db.execute(
        select(User, approved_submission)
        .where(User.is_active.is_(True))
        .outerjoin(
            approved_submission,
            and_(
                approved_submission.user_id == User.id,
                approved_submission.status == SubmissionStatus.APPROVED,
                approved_submission.id
                == (
                    select(CodeSubmission.id)
                    .where(
                        and_(
                            CodeSubmission.user_id == User.id,
                            CodeSubmission.status == SubmissionStatus.APPROVED,
                        )
                    )
                    .order_by(CodeSubmission.version.desc(), CodeSubmission.id.desc())
                    .limit(1)
                    .scalar_subquery()
                ),
            ),
        )
        .order_by(User.display_name.asc().nulls_last(), User.username.asc())
    ).all()

    return [
        ArenaUserOption(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            approved_submission_id=submission.id if submission else None,
            approved_submission_version=submission.version if submission else None,
        )
        for user, submission in rows
    ]


def get_active_battle(db: Session) -> ActiveBattleResponse | None:
    left_player = aliased(User)
    right_player = aliased(User)
    left_submission = aliased(CodeSubmission)
    right_submission = aliased(CodeSubmission)

    row = db.execute(
        select(Battle, left_player, right_player, left_submission, right_submission)
        .outerjoin(left_player, Battle.left_player_id == left_player.id)
        .outerjoin(right_player, Battle.right_player_id == right_player.id)
        .outerjoin(left_submission, Battle.left_submission_id == left_submission.id)
        .outerjoin(right_submission, Battle.right_submission_id == right_submission.id)
        .where(
            Battle.status == BattleStatus.ACTIVE,
            Battle.battle_type == ARENA_BATTLE_TYPE,
        )
        .order_by(Battle.updated_at.desc(), Battle.id.desc())
        .limit(1)
    ).first()

    if row is None:
        return None

    battle, left_user, right_user, left_code_submission, right_code_submission = row
    return ActiveBattleResponse(
        id=battle.id,
        title=battle.title,
        status=battle.status,
        left_player_id=battle.left_player_id,
        right_player_id=battle.right_player_id,
        left_submission_id=battle.left_submission_id,
        right_submission_id=battle.right_submission_id,
        left_player_name=_display_name(left_user),
        right_player_name=_display_name(right_user),
        left_submission_version=left_code_submission.version if left_code_submission else None,
        right_submission_version=right_code_submission.version if right_code_submission else None,
        left_code=left_code_submission.code if left_code_submission else None,
        right_code=right_code_submission.code if right_code_submission else None,
        map_config=battle.map_config,
        started_at=battle.started_at,
        updated_at=battle.updated_at,
    )


def get_latest_approved_submission(db: Session, user_id: int) -> CodeSubmission | None:
    return db.scalar(
        select(CodeSubmission)
        .where(
            and_(
                CodeSubmission.user_id == user_id,
                CodeSubmission.status == SubmissionStatus.APPROVED,
            )
        )
        .order_by(CodeSubmission.version.desc(), CodeSubmission.id.desc())
        .limit(1)
    )


def set_active_battle(
    db: Session,
    payload: SetActiveBattleRequest,
) -> Battle:
    if payload.left_player_id == payload.right_player_id:
        raise ValueError("Players must be different")

    players = db.scalars(
        select(User).where(User.id.in_([payload.left_player_id, payload.right_player_id]))
    ).all()

    if len(players) != 2:
        raise ValueError("Players not found")

    left_submission = get_latest_approved_submission(db, payload.left_player_id)
    right_submission = get_latest_approved_submission(db, payload.right_player_id)

    if left_submission is None or right_submission is None:
        raise ValueError("Both players must have approved submissions")

    db.execute(
        update(Battle)
        .where(
            Battle.status == BattleStatus.ACTIVE,
            Battle.battle_type == ARENA_BATTLE_TYPE,
        )
        .values(status=BattleStatus.FINISHED, finished_at=datetime.now(timezone.utc))
    )

    left_user = next(user for user in players if user.id == payload.left_player_id)
    right_user = next(user for user in players if user.id == payload.right_player_id)

    battle = Battle(
        title=f"{_display_name(left_user)} vs {_display_name(right_user)}",
        battle_type=ARENA_BATTLE_TYPE,
        status=BattleStatus.ACTIVE,
        left_player_id=payload.left_player_id,
        right_player_id=payload.right_player_id,
        left_submission_id=left_submission.id,
        right_submission_id=right_submission.id,
        map_config=payload.map_config,
        started_at=datetime.now(timezone.utc),
        created_by=payload.moderator_user_id,
    )
    db.add(battle)
    db.flush()

    db.add(
        AuditLog(
            action="active_battle_set",
            entity_type="battle",
            entity_id=str(battle.id),
            payload={
                "left_player_id": payload.left_player_id,
                "right_player_id": payload.right_player_id,
                "left_submission_id": left_submission.id,
                "right_submission_id": right_submission.id,
                "map_config": payload.map_config,
            },
            actor_user_id=payload.moderator_user_id,
        )
    )

    db.commit()
    db.refresh(battle)

    return battle


def update_active_battle_config(
    db: Session,
    payload: UpdateActiveBattleConfigRequest,
) -> Battle:
    battle = db.scalar(
        select(Battle)
        .where(
            Battle.status == BattleStatus.ACTIVE,
            Battle.battle_type == ARENA_BATTLE_TYPE,
        )
        .order_by(Battle.updated_at.desc(), Battle.id.desc())
        .limit(1)
    )

    if battle is None:
        raise ValueError("Active battle not found")

    battle.map_config = payload.map_config

    db.add(
        AuditLog(
            action="active_battle_config_updated",
            entity_type="battle",
            entity_id=str(battle.id),
            payload=payload.map_config,
            actor_user_id=payload.moderator_user_id,
        )
    )

    db.commit()
    db.refresh(battle)

    return battle


def clear_active_battle(db: Session, moderator_user_id: int) -> None:
    active_battles = db.scalars(
        select(Battle).where(
            Battle.status == BattleStatus.ACTIVE,
            Battle.battle_type == ARENA_BATTLE_TYPE,
        )
    ).all()

    if not active_battles:
        return

    timestamp = datetime.now(timezone.utc)
    for battle in active_battles:
        battle.status = BattleStatus.FINISHED
        battle.finished_at = timestamp

        db.add(
            AuditLog(
                action="active_battle_cleared",
                entity_type="battle",
                entity_id=str(battle.id),
                payload=None,
                actor_user_id=moderator_user_id,
            )
        )

    db.commit()


def list_private_battles_for_user(
    db: Session,
    user_id: int,
) -> list[PrivateBattleListItem]:
    left_player = aliased(User)
    right_player = aliased(User)

    rows = db.execute(
        select(Battle, left_player, right_player)
        .outerjoin(left_player, Battle.left_player_id == left_player.id)
        .outerjoin(right_player, Battle.right_player_id == right_player.id)
        .where(
            Battle.battle_type == PRIVATE_BATTLE_TYPE,
            Battle.status != BattleStatus.FINISHED,
            or_(Battle.left_player_id == user_id, Battle.right_player_id == user_id),
        )
        .order_by(Battle.updated_at.desc(), Battle.id.desc())
    ).all()

    items: list[PrivateBattleListItem] = []
    for battle, left_user, right_user in rows:
        items.append(
            PrivateBattleListItem(
                id=battle.id,
                title=battle.title,
                status=battle.status,
                left_player_id=battle.left_player_id,
                right_player_id=battle.right_player_id,
                left_player_name=_display_name(left_user),
                left_player_username=left_user.username if left_user else None,
                right_player_name=_display_name(right_user),
                right_player_username=right_user.username if right_user else None,
                left_ready=battle.left_ready,
                right_ready=battle.right_ready,
                left_code_confirmed=battle.left_code_confirmed,
                right_code_confirmed=battle.right_code_confirmed,
                left_map_change_requested=battle.left_map_change_requested,
                right_map_change_requested=battle.right_map_change_requested,
                map_revision=battle.map_revision,
                has_result=battle.result_reason is not None,
                winner_player_id=battle.winner_player_id,
                winner_slot=(
                    "left"
                    if battle.winner_player_id is not None
                    and battle.winner_player_id == battle.left_player_id
                    else "right"
                    if battle.winner_player_id is not None
                    and battle.winner_player_id == battle.right_player_id
                    else None
                ),
                result_reason=battle.result_reason,
                result_scores=battle.result_scores,
                finished_at=battle.finished_at,
                current_user_slot=_resolve_slot(battle, user_id),
                updated_at=battle.updated_at,
            )
        )

    return items


def list_private_battle_users(
    db: Session,
    current_user_id: int,
    query: str | None = None,
) -> list[PrivateBattleUserOption]:
    statement = (
        select(User)
        .where(User.is_active.is_(True), User.id != current_user_id)
        .order_by(User.display_name.asc().nulls_last(), User.username.asc())
        .limit(12)
    )

    normalized_query = (query or "").strip().replace("@", "")
    if normalized_query:
        pattern = f"%{normalized_query}%"
        statement = (
            select(User)
            .where(
                User.is_active.is_(True),
                User.id != current_user_id,
                or_(
                    User.username.ilike(pattern),
                    User.display_name.ilike(pattern),
                ),
            )
            .order_by(User.display_name.asc().nulls_last(), User.username.asc())
            .limit(12)
        )

    users = db.scalars(statement).all()
    return [
        PrivateBattleUserOption(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
        )
        for user in users
    ]


def get_private_battle_for_user(
    db: Session,
    battle_id: int,
    user_id: int,
) -> PrivateBattleResponse:
    left_player = aliased(User)
    right_player = aliased(User)

    row = db.execute(
        select(Battle, left_player, right_player)
        .outerjoin(left_player, Battle.left_player_id == left_player.id)
        .outerjoin(right_player, Battle.right_player_id == right_player.id)
        .where(
            Battle.id == battle_id,
            Battle.battle_type == PRIVATE_BATTLE_TYPE,
            or_(Battle.left_player_id == user_id, Battle.right_player_id == user_id),
        )
        .limit(1)
    ).first()

    if row is None:
        raise ValueError("Private battle not found")

    battle, left_user, right_user = row
    return _private_battle_response(battle, user_id, left_user, right_user)


def create_private_battle(
    db: Session,
    payload: CreatePrivateBattleRequest,
) -> PrivateBattleResponse:
    inviter = db.get(User, payload.inviter_user_id)
    opponent = db.scalar(
        select(User).where(User.username == payload.opponent_username.strip())
    )

    if inviter is None or opponent is None:
        raise ValueError("Players not found")

    if inviter.id == opponent.id:
        raise ValueError("Opponent must be different")

    existing = db.scalar(
        select(Battle).where(
            Battle.battle_type == PRIVATE_BATTLE_TYPE,
            Battle.status == BattleStatus.DRAFT,
            or_(
                and_(
                    Battle.left_player_id == inviter.id,
                    Battle.right_player_id == opponent.id,
                ),
                and_(
                    Battle.left_player_id == opponent.id,
                    Battle.right_player_id == inviter.id,
                ),
            ),
        )
    )

    if existing is not None:
        raise ValueError("Open private battle already exists for these players")

    battle = Battle(
        title=f"{_display_name(inviter)} vs {_display_name(opponent)}",
        battle_type=PRIVATE_BATTLE_TYPE,
        status=BattleStatus.DRAFT,
        left_player_id=inviter.id,
        right_player_id=opponent.id,
        map_config=_generate_private_battle_map_config(),
        created_by=inviter.id,
    )
    db.add(battle)
    db.flush()

    db.add(
        AuditLog(
            action="private_battle_created",
            entity_type="battle",
            entity_id=str(battle.id),
            payload={
                "inviter_user_id": inviter.id,
                "opponent_user_id": opponent.id,
                "opponent_username": opponent.username,
            },
            actor_user_id=inviter.id,
        )
    )

    db.commit()
    db.refresh(battle)

    return _private_battle_response(battle, inviter.id, inviter, opponent)


def update_private_battle_code(
    db: Session,
    battle_id: int,
    payload: UpdatePrivateBattleCodeRequest,
) -> PrivateBattleResponse:
    battle = _get_private_battle_for_user(db, battle_id, payload.user_id)

    if _is_private_battle_locked(battle):
        raise ValueError("Private battle is locked after both players confirmed readiness")

    slot = _resolve_slot(battle, payload.user_id)

    if slot == "left":
        battle.left_code = payload.code
        battle.left_code_confirmed = False
    else:
        battle.right_code = payload.code
        battle.right_code_confirmed = False
    battle.left_ready = False
    battle.right_ready = False
    battle.left_map_change_requested = False
    battle.right_map_change_requested = False

    battle.status = (
        BattleStatus.SCHEDULED if battle.left_ready and battle.right_ready else BattleStatus.DRAFT
    )

    db.add(
        AuditLog(
            action="private_battle_code_saved",
            entity_type="battle",
            entity_id=str(battle.id),
            payload={"slot": slot},
            actor_user_id=payload.user_id,
        )
    )

    db.commit()
    db.refresh(battle)

    return get_private_battle_for_user(db, battle.id, payload.user_id)


def confirm_private_battle_code(
    db: Session,
    battle_id: int,
    payload: PrivateBattleActorRequest,
) -> PrivateBattleResponse:
    battle = _get_private_battle_for_user(db, battle_id, payload.user_id)

    if _is_private_battle_locked(battle):
        raise ValueError("Private battle is locked after both players confirmed readiness")

    slot = _resolve_slot(battle, payload.user_id)
    code = battle.left_code if slot == "left" else battle.right_code
    if not code or code.strip() == "":
        raise ValueError("Save code before confirmation")

    if slot == "left":
        battle.left_code_confirmed = True
        battle.left_ready = False
    else:
        battle.right_code_confirmed = True
        battle.right_ready = False
    battle.status = BattleStatus.DRAFT

    db.add(
        AuditLog(
            action="private_battle_code_confirmed",
            entity_type="battle",
            entity_id=str(battle.id),
            payload={"slot": slot},
            actor_user_id=payload.user_id,
        )
    )

    db.commit()
    db.refresh(battle)

    return get_private_battle_for_user(db, battle.id, payload.user_id)


def reroll_private_battle_map(
    db: Session,
    battle_id: int,
    payload: PrivateBattleActorRequest,
) -> PrivateBattleResponse:
    battle = _get_private_battle_for_user(db, battle_id, payload.user_id)

    if _is_private_battle_locked(battle):
        raise ValueError("Private battle is locked after both players confirmed readiness")

    slot = _resolve_slot(battle, payload.user_id)

    if slot == "left":
        battle.left_map_change_requested = True
    else:
        battle.right_map_change_requested = True

    if battle.left_map_change_requested and battle.right_map_change_requested:
        battle.map_config = _generate_private_battle_map_config()
        battle.map_revision = battle.map_revision + 1
        battle.left_ready = False
        battle.right_ready = False
        battle.left_map_change_requested = False
        battle.right_map_change_requested = False
        battle.status = BattleStatus.DRAFT

    db.add(
        AuditLog(
            action="private_battle_map_change_requested",
            entity_type="battle",
            entity_id=str(battle.id),
            payload={
                "slot": slot,
                "map_revision": battle.map_revision,
                "rerolled": not battle.left_map_change_requested and not battle.right_map_change_requested,
            },
            actor_user_id=payload.user_id,
        )
    )

    db.commit()
    db.refresh(battle)

    return get_private_battle_for_user(db, battle.id, payload.user_id)


def mark_private_battle_ready(
    db: Session,
    battle_id: int,
    payload: PrivateBattleActorRequest,
) -> PrivateBattleResponse:
    battle = _get_private_battle_for_user(db, battle_id, payload.user_id)

    if _is_private_battle_locked(battle):
        raise ValueError("Private battle is locked after both players confirmed readiness")

    slot = _resolve_slot(battle, payload.user_id)
    if slot == "left":
        if not battle.left_code_confirmed:
            raise ValueError("Confirm your code before marking ready")
        battle.left_ready = True
    else:
        if not battle.right_code_confirmed:
            raise ValueError("Confirm your code before marking ready")
        battle.right_ready = True

    if not battle.left_code or not battle.right_code:
        battle.status = BattleStatus.DRAFT
    else:
        battle.status = (
            BattleStatus.SCHEDULED if battle.left_ready and battle.right_ready else BattleStatus.DRAFT
        )

    db.add(
        AuditLog(
            action="private_battle_ready",
            entity_type="battle",
            entity_id=str(battle.id),
            payload={"slot": slot},
            actor_user_id=payload.user_id,
        )
    )

    db.commit()
    db.refresh(battle)

    return get_private_battle_for_user(db, battle.id, payload.user_id)


def save_private_battle_result(
    db: Session,
    battle_id: int,
    payload: SavePrivateBattleResultRequest,
) -> PrivateBattleResponse:
    battle = _get_private_battle_for_user(db, battle_id, payload.user_id)

    if not _is_private_battle_locked(battle):
        raise ValueError("Private battle result can be saved only after both players are ready")

    if payload.reason.strip() == "":
        raise ValueError("Battle result reason is required")

    if len(payload.scores) != 2:
        raise ValueError("Battle result scores must contain exactly two values")

    if battle.result_reason is not None:
        return get_private_battle_for_user(db, battle.id, payload.user_id)

    winner_player_id = None
    if payload.winner == 0:
        winner_player_id = battle.left_player_id
    elif payload.winner == 1:
        winner_player_id = battle.right_player_id
    elif payload.winner is not None:
        raise ValueError("Winner must be 0, 1 or null")

    battle.winner_player_id = winner_player_id
    battle.result_reason = payload.reason
    battle.result_scores = payload.scores
    battle.finished_at = datetime.now(timezone.utc)

    db.add(
        AuditLog(
            action="private_battle_result_saved",
            entity_type="battle",
            entity_id=str(battle.id),
            payload={
                "winner": payload.winner,
                "reason": payload.reason,
                "scores": payload.scores,
            },
            actor_user_id=payload.user_id,
        )
    )

    db.commit()
    db.refresh(battle)

    return get_private_battle_for_user(db, battle.id, payload.user_id)
