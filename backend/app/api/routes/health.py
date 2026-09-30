"""
PricePilot AI — Health Route
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Returns application health status, version, and server timestamp."""
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
