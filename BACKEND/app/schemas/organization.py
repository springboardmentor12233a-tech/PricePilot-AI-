import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import OrganizationMemberRole


class OrganizationBase(BaseModel):
    name: str
    description: str | None = None
    website: str | None = None


class OrganizationCreate(OrganizationBase):
    slug: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    website: str | None = None
    is_active: bool | None = None


class OrganizationResponse(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    is_active: bool
    created_at: datetime


class OrganizationMemberAdd(BaseModel):
    user_id: uuid.UUID
    role: OrganizationMemberRole = OrganizationMemberRole.MEMBER


class OrganizationMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    role: OrganizationMemberRole
    joined_at: datetime
