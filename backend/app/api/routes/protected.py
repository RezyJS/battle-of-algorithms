from fastapi import APIRouter

router = APIRouter()


@router.get("", summary="Protected placeholder endpoint")
def protected_placeholder() -> dict[str, str]:
    return {"status": "protected-placeholder"}
