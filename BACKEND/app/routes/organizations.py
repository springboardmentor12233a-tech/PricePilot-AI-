import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user
from app.database.database import get_db
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationMemberAdd,
    OrganizationMemberResponse,
    OrganizationResponse,
)
from app.services.organization_service import (
    add_organization_member,
    create_organization,
    get_organization,
    get_user_organizations,
)

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_org(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Create a new organization."""
    return create_organization(db, org_in, current_user.id)


@router.get("/", response_model=list[OrganizationResponse])
def get_my_orgs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """List all organizations the user belongs to."""
    return get_user_organizations(db, current_user.id)


@router.get("/{org_id}", response_model=OrganizationResponse)
def get_org_by_id(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Retrieve single organization details."""
    return get_organization(db, org_id)


@router.post("/{org_id}/members", response_model=OrganizationMemberResponse, status_code=status.HTTP_201_CREATED)
def add_member(
    org_id: uuid.UUID,
    member_in: OrganizationMemberAdd,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Add a member to an organization."""
    return add_organization_member(db, org_id, member_in)
