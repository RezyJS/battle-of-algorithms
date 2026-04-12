from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import get_settings
from app.schemas.submission import (
    SubmissionListItem,
    SubmissionResponse,
    UpdateSubmissionStatusRequest,
)
from app.services.submission_service import (
    list_submissions_for_moderation,
    update_submission_status,
)

router = APIRouter()
settings = get_settings()


def validate_internal_secret(secret: str) -> None:
    if secret != settings.internal_api_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API secret",
        )


@router.get("/submissions", response_model=list[SubmissionListItem])
def list_submissions(
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> list[SubmissionListItem]:
    validate_internal_secret(x_internal_api_secret)
    return list_submissions_for_moderation(db)


@router.post("/submissions/{submission_id}/status", response_model=SubmissionResponse)
def update_status(
    submission_id: int,
    payload: UpdateSubmissionStatusRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> SubmissionResponse:
    validate_internal_secret(x_internal_api_secret)

    try:
        submission = update_submission_status(db, submission_id, payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return SubmissionResponse.model_validate(submission)
