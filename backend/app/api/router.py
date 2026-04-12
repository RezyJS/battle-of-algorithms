from fastapi import APIRouter

from app.api.routes import (
    health,
    internal_arena,
    internal_auth,
    internal_moderation,
    internal_submission,
    protected,
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(
    protected.router,
    prefix="/protected",
    tags=["protected"],
)
api_router.include_router(
    internal_auth.router,
    prefix="/internal/auth",
    tags=["internal-auth"],
)
api_router.include_router(
    internal_moderation.router,
    prefix="/internal/moderation",
    tags=["internal-moderation"],
)
api_router.include_router(
    internal_submission.router,
    prefix="/internal/submissions",
    tags=["internal-submissions"],
)
api_router.include_router(
    internal_arena.router,
    prefix="/internal/arena",
    tags=["internal-arena"],
)
