from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.models.audit_log import AuditLog
from app.models.code_submission import CodeSubmission
from app.models.enums import SubmissionStatus
from app.models.submission_review import SubmissionReview
from app.models.user import User
from app.schemas.submission import (
    SubmissionListItem,
    UpdateSubmissionStatusRequest,
    UpsertOwnSubmissionRequest,
)


def get_latest_user_submission(
    db: Session,
    user_id: int,
) -> CodeSubmission | None:
    return db.scalar(
        select(CodeSubmission)
        .where(CodeSubmission.user_id == user_id)
        .order_by(CodeSubmission.version.desc(), CodeSubmission.id.desc())
        .limit(1)
    )


def save_user_submission_draft(
    db: Session,
    payload: UpsertOwnSubmissionRequest,
) -> CodeSubmission:
    latest = get_latest_user_submission(db, payload.user_id)

    if latest is not None and latest.status == SubmissionStatus.DRAFT:
        latest.code = payload.code
        latest.language = payload.language
        db.commit()
        db.refresh(latest)
        return latest

    next_version = 1 if latest is None else latest.version + 1
    submission = CodeSubmission(
        user_id=payload.user_id,
        code=payload.code,
        language=payload.language,
        status=SubmissionStatus.DRAFT,
        version=next_version,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return submission


def submit_user_submission(
    db: Session,
    payload: UpsertOwnSubmissionRequest,
) -> CodeSubmission:
    timestamp = datetime.now(timezone.utc)
    latest = get_latest_user_submission(db, payload.user_id)

    if latest is not None and latest.status == SubmissionStatus.DRAFT:
        latest.code = payload.code
        latest.language = payload.language
        latest.status = SubmissionStatus.SUBMITTED
        latest.submitted_at = timestamp
        latest.moderated_at = None
        latest.moderated_by = None
        latest.moderation_comment = None
        db.commit()
        db.refresh(latest)
        return latest

    next_version = 1 if latest is None else latest.version + 1
    submission = CodeSubmission(
        user_id=payload.user_id,
        code=payload.code,
        language=payload.language,
        status=SubmissionStatus.SUBMITTED,
        submitted_at=timestamp,
        version=next_version,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return submission


def list_submissions_for_moderation(db: Session) -> list[SubmissionListItem]:
    moderator = aliased(User)
    rows = db.execute(
        select(CodeSubmission, User, moderator)
        .join(User, CodeSubmission.user_id == User.id)
        .outerjoin(moderator, CodeSubmission.moderated_by == moderator.id)
        .order_by(CodeSubmission.created_at.desc(), CodeSubmission.id.desc())
    ).all()

    return [
        SubmissionListItem(
            id=submission.id,
            user_id=author.id,
            username=author.username,
            display_name=author.display_name,
            battle_id=submission.battle_id,
            code=submission.code,
            language=submission.language,
            status=submission.status,
            version=submission.version,
            moderation_comment=submission.moderation_comment,
            submitted_at=submission.submitted_at,
            moderated_at=submission.moderated_at,
            moderated_by=submission.moderated_by,
            moderator_username=moderator_user.username if moderator_user else None,
            created_at=submission.created_at,
            updated_at=submission.updated_at,
        )
        for submission, author, moderator_user in rows
    ]


def update_submission_status(
    db: Session,
    submission_id: int,
    payload: UpdateSubmissionStatusRequest,
) -> CodeSubmission:
    submission = db.get(CodeSubmission, submission_id)

    if submission is None:
        raise ValueError("Submission not found")

    timestamp = datetime.now(timezone.utc)
    submission.status = payload.status
    submission.moderated_by = payload.moderator_user_id
    submission.moderated_at = timestamp
    submission.moderation_comment = payload.comment

    if payload.status.value == "submitted" and submission.submitted_at is None:
        submission.submitted_at = timestamp

    db.add(
        SubmissionReview(
            submission_id=submission.id,
            action=payload.status.value,
            comment=payload.comment,
            created_by=payload.moderator_user_id,
        )
    )
    db.add(
        AuditLog(
            action="submission_status_updated",
            entity_type="code_submission",
            entity_id=str(submission.id),
            payload={
                "status": payload.status.value,
                "comment": payload.comment,
                "moderator_user_id": payload.moderator_user_id,
            },
            actor_user_id=payload.moderator_user_id,
        )
    )

    db.commit()
    db.refresh(submission)

    return submission
