import uuid
from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    organization_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    slug: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    parent_id: uuid.UUID | None = None
    description: str | None = None
    is_active: bool | None = None


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    slug: str
