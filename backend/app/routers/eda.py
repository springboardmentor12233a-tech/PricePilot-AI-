"""
Exploratory Data Analysis (EDA) Router.
Exposes portfolio category breakdowns, price gap distribution, and price vs quantity scatter data.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.models import User
from app.services.data_loader import get_eda_data
from app.services.auth import require_role

router = APIRouter(prefix="/api/eda", tags=["Exploratory Data Analysis"])


@router.get("/data", response_model=Dict[str, Any])
def get_exploratory_data(
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"])),
):
    """
    Returns authentic EDA metrics grounded in Dataset 1 electronics training snapshot:
    category revenue breakdown, price gap % distribution, and price vs quantity scatter points.
    """
    return get_eda_data()
