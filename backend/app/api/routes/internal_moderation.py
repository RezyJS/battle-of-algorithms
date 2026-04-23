from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import get_settings
from app.models.enums import SubmissionStatus
from app.schemas.submission import (
    ModerationSubmissionPage,
    SubmissionListItem,
    SubmissionResponse,
    UpdateSubmissionStatusRequest,
)
from app.services.submission_service import (
    list_submissions_for_moderation,
    list_submissions_for_moderation_page,
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


@router.get("/submissions/page", response_model=ModerationSubmissionPage)
def list_submissions_page(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
    query: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    x_internal_api_secret: str = Header(default=""),
) -> ModerationSubmissionPage:
    validate_internal_secret(x_internal_api_secret)

    normalized_status: SubmissionStatus | None = None
    if status_filter and status_filter != "all":
        try:
            normalized_status = SubmissionStatus(status_filter)
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid submission status filter",
            ) from error

    items, total = list_submissions_for_moderation_page(
        db,
        page=page,
        page_size=page_size,
        status=normalized_status,
        query=query,
    )

    return ModerationSubmissionPage(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


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
