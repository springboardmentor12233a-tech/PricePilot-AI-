from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    product_name: str
    category: str
    region: str
    current_price: float
    competitor_price: float
    stock_availability: float


class ProductUpdate(BaseModel):
    product_name: str
    category: str
    region: str
    current_price: float
    competitor_price: float
    stock_availability: float


class ProductResponse(BaseModel):
    id: int
    product_name: str
    category: str
    region: str
    current_price: float
    competitor_price: float
    stock_availability: float

    class Config:
        from_attributes = True