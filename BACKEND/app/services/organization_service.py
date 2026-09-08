import uuid
import re
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import OrganizationMemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.schemas.organization import OrganizationCreate, OrganizationMemberAdd


def slugify(text: str) -> str:
    """Generate URL-friendly slug from text."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text


def create_organization(db: Session, org_in: OrganizationCreate, user_id: uuid.UUID) -> Organization:
    """Create organization and add creator as owner."""
    slug = org_in.slug or slugify(org_in.name)

    # Ensure unique slug
    existing = db.query(Organization).filter(Organization.slug == slug).first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    org = Organization(
        name=org_in.name,
        slug=slug,
        description=org_in.description,
        website=org_in.website,
        is_active=True,
    )
    db.add(org)
    db.flush()

    # Add creator as OWNER
    member = OrganizationMember(
        organization_id=org.id,
        user_id=user_id,
        role=OrganizationMemberRole.OWNER,
    )
    db.add(member)
    db.commit()
    db.refresh(org)
    return org


def get_organization(db: Session, org_id: uuid.UUID) -> Organization:
    """Retrieve organization by ID."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org


def get_user_organizations(db: Session, user_id: uuid.UUID) -> list[Organization]:
    """Retrieve all organizations where user is a member."""
    memberships = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == user_id)
        .all()
    )
    org_ids = [m.organization_id for m in memberships]
    return db.query(Organization).filter(Organization.id.in_(org_ids)).all() if org_ids else []


def add_organization_member(
    db: Session, org_id: uuid.UUID, member_in: OrganizationMemberAdd
) -> OrganizationMember:
    """Add a new member to an organization."""
    # Check if membership already exists
    existing = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == member_in.user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this organization",
        )

    member = OrganizationMember(
        organization_id=org_id,
        user_id=member_in.user_id,
        role=member_in.role,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member
