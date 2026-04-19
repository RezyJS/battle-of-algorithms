from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import and_, select, update
from sqlalchemy.orm import Session, aliased

from app.models.audit_log import AuditLog
from app.models.battle import Battle
from app.models.code_submission import CodeSubmission
from app.models.enums import BattleStatus
from app.models.enums import SubmissionStatus
from app.models.user import User
from app.schemas.battle import ActiveBattleResponse, ArenaUserOption, SetActiveBattleRequest
from app.schemas.battle import UpdateActiveBattleConfigRequest


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
        .where(Battle.status == BattleStatus.ACTIVE)
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
        left_player_name=(left_user.display_name or left_user.username) if left_user else None,
        right_player_name=(right_user.display_name or right_user.username) if right_user else None,
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
        .where(Battle.status == BattleStatus.ACTIVE)
        .values(status=BattleStatus.FINISHED, finished_at=datetime.now(timezone.utc))
    )

    left_user = next(user for user in players if user.id == payload.left_player_id)
    right_user = next(user for user in players if user.id == payload.right_player_id)

    battle = Battle(
        title=f"{left_user.display_name or left_user.username} vs {right_user.display_name or right_user.username}",
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
        .where(Battle.status == BattleStatus.ACTIVE)
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
        select(Battle).where(Battle.status == BattleStatus.ACTIVE)
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
