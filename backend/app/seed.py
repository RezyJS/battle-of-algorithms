from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.battle import Battle
from app.models.code_submission import CodeSubmission
from app.models.enums import BattleStatus, SubmissionStatus
from app.models.user import User


SEED_USERS = [
    {
        "keycloak_user_id": "seed:moderator",
        "username": "seed-moderator",
        "email": "seed-moderator@example.com",
        "display_name": "Seed Moderator",
    },
    {
        "keycloak_user_id": "seed:alice",
        "username": "seed-alice",
        "email": "seed-alice@example.com",
        "display_name": "Seed Alice",
    },
    {
        "keycloak_user_id": "seed:bob",
        "username": "seed-bob",
        "email": "seed-bob@example.com",
        "display_name": "Seed Bob",
    },
]

SEED_CODE = """for (let i = 0; i < 200; i++) {
  if (operator.hasExited()) break;

  if (operator.lookRight()) {
    operator.moveRight();
    continue;
  }

  if (operator.lookDown()) {
    operator.moveDown();
    continue;
  }

  operator.wait();
}"""


def get_or_create_user(session, payload: dict) -> User:
    user = session.scalar(select(User).where(User.username == payload["username"]))

    if user is None:
        user = User(**payload, is_active=True)
        session.add(user)
        session.flush()
        return user

    user.email = payload["email"]
    user.display_name = payload["display_name"]
    user.is_active = True
    session.flush()
    return user


def ensure_submission(session, user: User) -> CodeSubmission:
    existing = session.scalar(
        select(CodeSubmission)
        .where(CodeSubmission.user_id == user.id)
        .order_by(CodeSubmission.version.desc(), CodeSubmission.id.desc())
        .limit(1)
    )

    if existing is not None:
        return existing

    submission = CodeSubmission(
        user_id=user.id,
        code=SEED_CODE,
        language="javascript",
        status=SubmissionStatus.APPROVED,
        submitted_at=datetime.now(timezone.utc),
        moderated_at=datetime.now(timezone.utc),
        version=1,
    )
    session.add(submission)
    session.flush()
    return submission


def ensure_active_battle(session, moderator: User, left_user: User, right_user: User) -> Battle:
    active_battle = session.scalar(
        select(Battle)
        .where(Battle.status == BattleStatus.ACTIVE)
        .order_by(Battle.updated_at.desc(), Battle.id.desc())
        .limit(1)
    )

    if active_battle is not None:
        active_battle.left_player_id = left_user.id
        active_battle.right_player_id = right_user.id
        active_battle.title = f"{left_user.display_name} vs {right_user.display_name}"
        active_battle.started_at = active_battle.started_at or datetime.now(timezone.utc)
        session.flush()
        return active_battle

    battle = Battle(
        title=f"{left_user.display_name} vs {right_user.display_name}",
        status=BattleStatus.ACTIVE,
        left_player_id=left_user.id,
        right_player_id=right_user.id,
        started_at=datetime.now(timezone.utc),
        created_by=moderator.id,
    )
    session.add(battle)
    session.flush()
    return battle


def main() -> None:
    with SessionLocal() as session:
        moderator, alice, bob = [
            get_or_create_user(session, payload) for payload in SEED_USERS
        ]

        ensure_submission(session, alice)
        ensure_submission(session, bob)
        battle = ensure_active_battle(session, moderator, alice, bob)

        session.commit()

        print("seed users:", moderator.username, alice.username, bob.username)
        print("active battle:", battle.title)


if __name__ == "__main__":
    main()
