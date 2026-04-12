from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import get_settings
from app.schemas.submission import (
    OwnSubmissionResponse,
    SubmissionResponse,
    UpsertOwnSubmissionRequest,
)
from app.services.submission_service import (
    get_latest_user_submission,
    save_user_submission_draft,
    submit_user_submission,
)

router = APIRouter()
settings = get_settings()


def validate_internal_secret(secret: str) -> None:
    if secret != settings.internal_api_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API secret",
        )


@router.get("/me", response_model=OwnSubmissionResponse)
def get_my_submission(
    user_id: int = Query(...),
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> OwnSubmissionResponse:
    validate_internal_secret(x_internal_api_secret)
    submission = get_latest_user_submission(db, user_id)
    return OwnSubmissionResponse(
        submission=(
            SubmissionResponse.model_validate(submission)
            if submission is not None
            else None
        )
    )


@router.put("/me/draft", response_model=SubmissionResponse)
def save_my_draft(
    payload: UpsertOwnSubmissionRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> SubmissionResponse:
    validate_internal_secret(x_internal_api_secret)
    submission = save_user_submission_draft(db, payload)
    return SubmissionResponse.model_validate(submission)


@router.post("/me/submit", response_model=SubmissionResponse)
def submit_my_code(
    payload: UpsertOwnSubmissionRequest,
    db: Session = Depends(get_db),
    x_internal_api_secret: str = Header(default=""),
) -> SubmissionResponse:
    validate_internal_secret(x_internal_api_secret)
    submission = submit_user_submission(db, payload)
    return SubmissionResponse.model_validate(submission)
