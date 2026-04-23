from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.battle import Battle
from app.models.code_submission import CodeSubmission
from app.models.enums import BattleStatus, SubmissionStatus
from app.models.user import User


NOW = datetime.now(timezone.utc)

SEED_USERS = [
    {
        "keycloak_user_id": "seed:dev-user",
        "username": "dev-user",
        "email": None,
        "display_name": "Dev User",
    },
    {
        "keycloak_user_id": "seed:dev-moderator",
        "username": "dev-moderator",
        "email": None,
        "display_name": "Dev Moderator",
    },
    {
        "keycloak_user_id": "seed:dev-admin",
        "username": "dev-admin",
        "email": None,
        "display_name": "Dev Admin",
    },
    {
        "keycloak_user_id": "seed:alpha",
        "username": "alpha-runner",
        "email": None,
        "display_name": "Alpha Runner",
    },
    {
        "keycloak_user_id": "seed:beta",
        "username": "beta-miner",
        "email": None,
        "display_name": "Beta Miner",
    },
    {
        "keycloak_user_id": "seed:gamma",
        "username": "gamma-scout",
        "email": None,
        "display_name": "Gamma Scout",
    },
    {
        "keycloak_user_id": "seed:delta",
        "username": "delta-rush",
        "email": None,
        "display_name": "Delta Rush",
    },
    {
        "keycloak_user_id": "seed:epsilon",
        "username": "epsilon-loop",
        "email": None,
        "display_name": "Epsilon Loop",
    },
]


def code_template(strategy: str) -> str:
    return f"""const strategy = "{strategy}";

for (let turn = 0; turn < 300; turn++) {{
  if (operator.hasExited()) break;

  if (strategy === "right-bias" && operator.lookRight()) {{
    operator.moveRight();
    continue;
  }}

  if (strategy === "down-bias" && operator.lookDown()) {{
    operator.moveDown();
    continue;
  }}

  if (operator.lookUp()) {{
    operator.moveUp();
    continue;
  }}

  if (operator.lookLeft()) {{
    operator.moveLeft();
    continue;
  }}

  operator.wait();
}}"""


STATIC_MAP_CONFIG = {
    "gameMode": "race",
    "mapType": "static",
    "width": 8,
    "height": 6,
    "grid": [
        ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
        ["wall", "empty", "empty", "empty", "wall", "key1", "exit", "wall"],
        ["wall", "empty", "wall", "empty", "wall", "empty", "empty", "wall"],
        ["wall", "spawn1", "wall", "empty", "empty", "empty", "wall", "wall"],
        ["wall", "empty", "empty", "empty", "wall", "spawn2", "key2", "wall"],
        ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
    ],
    "spawn1": {"x": 1, "y": 3},
    "spawn2": {"x": 5, "y": 4},
}

PRIVATE_MAP_CONFIG = {
    "gameMode": "duel",
    "mapType": "random",
    "width": 9,
    "height": 7,
    "grid": [
        ["empty", "empty", "wall", "empty", "empty", "empty", "wall", "key1", "empty"],
        ["wall", "empty", "wall", "empty", "wall", "empty", "wall", "empty", "empty"],
        ["wall", "empty", "empty", "empty", "wall", "empty", "empty", "empty", "wall"],
        ["wall", "wall", "wall", "empty", "empty", "empty", "wall", "empty", "wall"],
        ["spawn1", "empty", "empty", "empty", "wall", "empty", "wall", "empty", "key2"],
        ["wall", "empty", "wall", "empty", "wall", "empty", "empty", "empty", "wall"],
        ["wall", "empty", "wall", "empty", "empty", "empty", "wall", "spawn2", "exit"],
    ],
    "spawn1": {"x": 0, "y": 4},
    "spawn2": {"x": 7, "y": 6},
}


SUBMISSION_BLUEPRINTS = [
    {
        "username": "dev-user",
        "entries": [
            {
                "version": 1,
                "status": SubmissionStatus.APPROVED,
                "strategy": "right-bias",
                "submitted_offset": 9,
                "moderated_offset": 8,
                "comment": "Первая стабильная версия для арены.",
                "moderator": "dev-moderator",
            },
            {
                "version": 2,
                "status": SubmissionStatus.DRAFT,
                "strategy": "down-bias",
                "submitted_offset": None,
                "moderated_offset": None,
                "comment": None,
                "moderator": None,
            },
        ],
    },
    {
        "username": "alpha-runner",
        "entries": [
            {
                "version": 1,
                "status": SubmissionStatus.APPROVED,
                "strategy": "right-bias",
                "submitted_offset": 10,
                "moderated_offset": 9,
                "comment": "Быстрый и аккуратный проход.",
                "moderator": "dev-admin",
            }
        ],
    },
    {
        "username": "beta-miner",
        "entries": [
            {
                "version": 1,
                "status": SubmissionStatus.RETURNED,
                "strategy": "loop-check",
                "submitted_offset": 7,
                "moderated_offset": 6,
                "comment": "Слишком много зависаний на тупиках.",
                "moderator": "dev-moderator",
            },
            {
                "version": 2,
                "status": SubmissionStatus.APPROVED,
                "strategy": "down-bias",
                "submitted_offset": 5,
                "moderated_offset": 4,
                "comment": "Исправил зацикливание, можно выпускать.",
                "moderator": "dev-admin",
            },
        ],
    },
    {
        "username": "gamma-scout",
        "entries": [
            {
                "version": 1,
                "status": SubmissionStatus.UNDER_REVIEW,
                "strategy": "scout-mode",
                "submitted_offset": 2,
                "moderated_offset": 1,
                "comment": "Смотрю поведение на длинных коридорах.",
                "moderator": "dev-moderator",
            }
        ],
    },
    {
        "username": "delta-rush",
        "entries": [
            {
                "version": 1,
                "status": SubmissionStatus.SUBMITTED,
                "strategy": "rush-mode",
                "submitted_offset": 1,
                "moderated_offset": None,
                "comment": None,
                "moderator": None,
            }
        ],
    },
    {
        "username": "epsilon-loop",
        "entries": [
            {
                "version": 1,
                "status": SubmissionStatus.REJECTED,
                "strategy": "loop-check",
                "submitted_offset": 12,
                "moderated_offset": 11,
                "comment": "Решение не проходит базовые сценарии.",
                "moderator": "dev-admin",
            }
        ],
    },
]


def get_or_create_user(session, payload: dict) -> User:
    user = session.scalar(select(User).where(User.username == payload["username"]))

    if user is None:
        user = User(**payload, is_active=True)
        session.add(user)
        session.flush()
        return user

    user.keycloak_user_id = payload["keycloak_user_id"]
    user.email = payload["email"]
    user.display_name = payload["display_name"]
    user.is_active = True
    session.flush()
    return user


def ensure_submission(
    session,
    *,
    user: User,
    version: int,
    status: SubmissionStatus,
    strategy: str,
    submitted_offset: int | None,
    moderated_offset: int | None,
    comment: str | None,
    moderator: User | None,
) -> CodeSubmission:
    existing = session.scalar(
        select(CodeSubmission).where(
            CodeSubmission.user_id == user.id,
            CodeSubmission.version == version,
        )
    )

    submitted_at = (
        NOW - timedelta(hours=submitted_offset) if submitted_offset is not None else None
    )
    moderated_at = (
        NOW - timedelta(hours=moderated_offset) if moderated_offset is not None else None
    )

    if existing is None:
        existing = CodeSubmission(
            user_id=user.id,
            version=version,
            language="javascript",
            code=code_template(strategy),
            status=status,
            submitted_at=submitted_at,
            moderated_at=moderated_at,
            moderated_by=moderator.id if moderator else None,
            moderation_comment=comment,
        )
        session.add(existing)
        session.flush()
        return existing

    existing.language = "javascript"
    existing.code = code_template(strategy)
    existing.status = status
    existing.submitted_at = submitted_at
    existing.moderated_at = moderated_at
    existing.moderated_by = moderator.id if moderator else None
    existing.moderation_comment = comment
    session.flush()
    return existing


def latest_submission(session, user: User, status: SubmissionStatus) -> CodeSubmission | None:
    return session.scalar(
        select(CodeSubmission)
        .where(CodeSubmission.user_id == user.id, CodeSubmission.status == status)
        .order_by(CodeSubmission.version.desc(), CodeSubmission.id.desc())
        .limit(1)
    )


def ensure_active_battle(
    session,
    *,
    moderator: User,
    left_user: User,
    right_user: User,
    left_submission: CodeSubmission,
    right_submission: CodeSubmission,
) -> Battle:
    active_battle = session.scalar(
        select(Battle)
        .where(
            Battle.status == BattleStatus.ACTIVE,
            Battle.battle_type == "arena",
        )
        .order_by(Battle.updated_at.desc(), Battle.id.desc())
        .limit(1)
    )

    if active_battle is None:
        active_battle = Battle(
            title=f"{left_user.display_name} vs {right_user.display_name}",
            battle_type="arena",
            status=BattleStatus.ACTIVE,
            created_by=moderator.id,
        )
        session.add(active_battle)

    active_battle.left_player_id = left_user.id
    active_battle.right_player_id = right_user.id
    active_battle.left_submission_id = left_submission.id
    active_battle.right_submission_id = right_submission.id
    active_battle.title = f"{left_user.display_name} vs {right_user.display_name}"
    active_battle.map_config = STATIC_MAP_CONFIG
    active_battle.started_at = active_battle.started_at or NOW - timedelta(hours=3)
    session.flush()
    return active_battle


def ensure_private_battle(
    session,
    *,
    title: str,
    left_user: User,
    right_user: User,
    created_by: User,
    status: BattleStatus,
    left_code: str,
    right_code: str,
    left_code_confirmed: bool,
    right_code_confirmed: bool,
    left_ready: bool,
    right_ready: bool,
    left_map_change_requested: bool,
    right_map_change_requested: bool,
    map_revision: int,
    result_reason: str | None = None,
    result_scores: list[int] | None = None,
    winner_player: User | None = None,
) -> Battle:
    battle = session.scalar(
        select(Battle).where(Battle.title == title, Battle.battle_type == "private")
    )

    if battle is None:
        battle = Battle(
            title=title,
            battle_type="private",
            created_by=created_by.id,
        )
        session.add(battle)

    battle.status = status
    battle.left_player_id = left_user.id
    battle.right_player_id = right_user.id
    battle.left_code = left_code
    battle.right_code = right_code
    battle.left_code_confirmed = left_code_confirmed
    battle.right_code_confirmed = right_code_confirmed
    battle.left_ready = left_ready
    battle.right_ready = right_ready
    battle.left_map_change_requested = left_map_change_requested
    battle.right_map_change_requested = right_map_change_requested
    battle.map_revision = map_revision
    battle.map_config = PRIVATE_MAP_CONFIG
    battle.result_reason = result_reason
    battle.result_scores = result_scores
    battle.winner_player_id = winner_player.id if winner_player else None
    battle.started_at = battle.started_at or NOW - timedelta(hours=1)
    battle.finished_at = NOW - timedelta(minutes=20) if status == BattleStatus.FINISHED else None
    session.flush()
    return battle


def main() -> None:
    with SessionLocal() as session:
        users = {
            payload["username"]: get_or_create_user(session, payload) for payload in SEED_USERS
        }

        created_submissions: dict[tuple[str, int], CodeSubmission] = {}
        for blueprint in SUBMISSION_BLUEPRINTS:
            user = users[blueprint["username"]]
            for entry in blueprint["entries"]:
                submission = ensure_submission(
                    session,
                    user=user,
                    version=entry["version"],
                    status=entry["status"],
                    strategy=entry["strategy"],
                    submitted_offset=entry["submitted_offset"],
                    moderated_offset=entry["moderated_offset"],
                    comment=entry["comment"],
                    moderator=users[entry["moderator"]] if entry["moderator"] else None,
                )
                created_submissions[(user.username, entry["version"])] = submission

        ensure_active_battle(
            session,
            moderator=users["dev-admin"],
            left_user=users["alpha-runner"],
            right_user=users["beta-miner"],
            left_submission=latest_submission(
                session, users["alpha-runner"], SubmissionStatus.APPROVED
            ),
            right_submission=latest_submission(
                session, users["beta-miner"], SubmissionStatus.APPROVED
            ),
        )

        ensure_private_battle(
            session,
            title="Dev User vs Gamma Scout",
            left_user=users["dev-user"],
            right_user=users["gamma-scout"],
            created_by=users["dev-user"],
            status=BattleStatus.DRAFT,
            left_code=code_template("right-bias"),
            right_code=code_template("scout-mode"),
            left_code_confirmed=True,
            right_code_confirmed=False,
            left_ready=False,
            right_ready=False,
            left_map_change_requested=False,
            right_map_change_requested=True,
            map_revision=2,
        )

        ensure_private_battle(
            session,
            title="Dev User vs Delta Rush",
            left_user=users["delta-rush"],
            right_user=users["dev-user"],
            created_by=users["delta-rush"],
            status=BattleStatus.SCHEDULED,
            left_code=code_template("rush-mode"),
            right_code=code_template("down-bias"),
            left_code_confirmed=True,
            right_code_confirmed=True,
            left_ready=True,
            right_ready=False,
            left_map_change_requested=False,
            right_map_change_requested=False,
            map_revision=1,
        )

        ensure_private_battle(
            session,
            title="Alpha Runner vs Dev User",
            left_user=users["alpha-runner"],
            right_user=users["dev-user"],
            created_by=users["alpha-runner"],
            status=BattleStatus.FINISHED,
            left_code=code_template("right-bias"),
            right_code=code_template("down-bias"),
            left_code_confirmed=True,
            right_code_confirmed=True,
            left_ready=True,
            right_ready=True,
            left_map_change_requested=False,
            right_map_change_requested=False,
            map_revision=3,
            result_reason="Alpha Runner дошёл до выхода быстрее.",
            result_scores=[15, 11],
            winner_player=users["alpha-runner"],
        )

        session.commit()

        print("seed users:", ", ".join(sorted(users.keys())))
        print("seed submissions:", len(created_submissions))
        print("active arena battle:", "Alpha Runner vs Beta Miner")
        print("private battles: 3 (2 open + 1 finished)")


if __name__ == "__main__":
    main()
