from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import SyncUserRequest


def sync_user_profile(db: Session, payload: SyncUserRequest) -> User:
    user = db.scalar(
        select(User).where(User.keycloak_user_id == payload.keycloak_user_id)
    )

    if user is None:
        conflict_conditions = [User.username == payload.username]

        if payload.email:
            conflict_conditions.append(User.email == payload.email)

        user = db.scalar(select(User).where(or_(*conflict_conditions)))

    if user is None:
        user = User(
            keycloak_user_id=payload.keycloak_user_id,
            username=payload.username,
            email=payload.email,
            display_name=payload.display_name,
            is_active=True,
        )
        db.add(user)
    else:
        user.keycloak_user_id = payload.keycloak_user_id
        user.username = payload.username
        user.email = payload.email
        user.display_name = payload.display_name
        user.is_active = True

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise

    db.refresh(user)

    return user
