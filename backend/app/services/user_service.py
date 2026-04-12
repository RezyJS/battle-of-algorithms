from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import SyncUserRequest


def sync_user_profile(db: Session, payload: SyncUserRequest) -> User:
    user = db.scalar(
        select(User).where(User.keycloak_user_id == payload.keycloak_user_id)
    )

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
        user.username = payload.username
        user.email = payload.email
        user.display_name = payload.display_name
        user.is_active = True

    db.commit()
    db.refresh(user)

    return user
