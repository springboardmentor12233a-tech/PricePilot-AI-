from fastapi.middleware.cors import CORSMiddleware
from backend.audit import create_audit_log
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_permission
)

from backend.permissions import Permission
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from backend.database import get_db
from backend.models import User, AuditLog, Product
from backend.schemas import (
    UserCreate,
    UserResponse,
    ProductCreate,
    ProductUpdate,
    ProductResponse
)
from backend.prediction import predict_demand
from pydantic import BaseModel
class PredictionInput(BaseModel):
    Category: str
    Region: str
    Sales_Channel: str
    Season: str
    Price_Position: str

    Price: float
    Discount_Percentage: float
    Marketing_Spend: float
    Website_Visits: float
    Search_Interest: float
    Competitor_Price: float
    Stock_Availability: float
    Customer_Rating: float
    Return_Rate: float
    Holiday_Flag: int
    Promotion_Flag: int
    New_Product_Flag: int
    Delivery_Days: float
    Month: int

from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
app = FastAPI(
    title="PricePilot AI API",
    description="AI-powered dynamic pricing and revenue intelligence API",
    version="1.0.0"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {
        "message": "PricePilot AI API is running",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/database-test")
def database_test(db: Session = Depends(get_db)):
    return {
        "database": "connected",
        "test_result": 1
    }


@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        (User.username == user.username) |
        (User.email == user.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="CUSTOMER",
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    create_audit_log(
    db=db,
    username=new_user.username,
    role=new_user.role,
    action="User registered",
    target=f"User ID {new_user.id}",
    old_value=None,
    new_value=f"Created user with role {new_user.role}"
)
    return new_user

@app.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.username == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    if not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Inactive user"
        )

    access_token = create_access_token(
        username=user.username,
        role=user.role
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user

@app.get("/pricing")
def pricing_data(
    current_user: User = Depends(
        require_permission(Permission.PRICING_VIEW)
    )
):
    return {
        "message": "Pricing data access granted",
        "user": current_user.username,
        "role": current_user.role
    }

@app.get("/users", response_model=list[UserResponse])
def get_users(
    current_user: User = Depends(
        require_permission(Permission.USERS_VIEW)
    ),
    db: Session = Depends(get_db)
):
    return db.query(User).all()
@app.get("/audit-logs")
def get_audit_logs(
    current_user: User = Depends(
        require_permission(Permission.AUDIT_LOGS_VIEW)
    ),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(
        AuditLog.id.desc()
    ).all()

@app.get("/dashboard")
def dashboard_data(
    current_user: User = Depends(
        require_permission(Permission.PRICING_VIEW)
    )
):
    return {
    "total_revenue": 7386335.29,
    "total_demand": 297694,
    "average_revenue_per_unit": 24.81,
    "highest_revenue_category": "Grocery",
    "highest_revenue_region": "Central",
    "highest_revenue_channel": "Website",
    "pricing_strategy": {
        "maintain_competitive_range": 27,
        "review_price_competitiveness": 9,
        "evaluate_price_increase": 4
    }
}
@app.post("/predict")
def predict(
    input_data: PredictionInput,
    current_user: User = Depends(
        require_permission(Permission.PRICING_VIEW)
    )
):
    data = input_data.model_dump()

    if data["Competitor_Price"] == 0:
        raise HTTPException(
            status_code=400,
            detail="Competitor_Price must be greater than 0"
        )

    data["Price_Difference"] = round(
        data["Price"] - data["Competitor_Price"], 2
    )

    data["Price_Ratio"] = round(
        data["Price"] / data["Competitor_Price"], 4
    )

    prediction = predict_demand(data)

    return {
        "prediction": prediction,
        "user": current_user.username,
        "role": current_user.role
    }
@app.get(
    "/products",
    response_model=list[ProductResponse]
)
def get_products(
    current_user: User = Depends(
        require_permission(Permission.PRODUCTS_VIEW)
    ),
    db: Session = Depends(get_db)
):
    return db.query(Product).order_by(
        Product.id.desc()
    ).all()


@app.get(
    "/products/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    current_user: User = Depends(
        require_permission(Permission.PRODUCTS_VIEW)
    ),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


@app.post(
    "/products",
    response_model=ProductResponse
)
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(
        require_permission(Permission.PRODUCTS_UPDATE)
    ),
    db: Session = Depends(get_db)
):
    if product_data.current_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Current price must be greater than 0"
        )

    if product_data.competitor_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Competitor price must be greater than 0"
        )

    if product_data.stock_availability < 0:
        raise HTTPException(
            status_code=400,
            detail="Stock availability cannot be negative"
        )

    product = Product(
        product_name=product_data.product_name,
        category=product_data.category,
        region=product_data.region,
        current_price=product_data.current_price,
        competitor_price=product_data.competitor_price,
        stock_availability=product_data.stock_availability
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    create_audit_log(
        db=db,
        username=current_user.username,
        role=current_user.role,
        action="Product created",
        target=f"Product ID {product.id}",
        old_value=None,
        new_value=product.product_name
    )

    return product


@app.put(
    "/products/{product_id}",
    response_model=ProductResponse
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(
        require_permission(Permission.PRODUCTS_UPDATE)
    ),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product_data.current_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Current price must be greater than 0"
        )

    if product_data.competitor_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Competitor price must be greater than 0"
        )

    if product_data.stock_availability < 0:
        raise HTTPException(
            status_code=400,
            detail="Stock availability cannot be negative"
        )

    old_value = (
        f"{product.product_name} | "
        f"Price: {product.current_price} | "
        f"Competitor: {product.competitor_price} | "
        f"Stock: {product.stock_availability}"
    )

    product.product_name = product_data.product_name
    product.category = product_data.category
    product.region = product_data.region
    product.current_price = product_data.current_price
    product.competitor_price = product_data.competitor_price
    product.stock_availability = product_data.stock_availability

    db.commit()
    db.refresh(product)

    new_value = (
        f"{product.product_name} | "
        f"Price: {product.current_price} | "
        f"Competitor: {product.competitor_price} | "
        f"Stock: {product.stock_availability}"
    )

    create_audit_log(
        db=db,
        username=current_user.username,
        role=current_user.role,
        action="Product updated",
        target=f"Product ID {product.id}",
        old_value=old_value,
        new_value=new_value
    )

    return product


@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_user: User = Depends(
        require_permission(Permission.PRODUCTS_UPDATE)
    ),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    old_value = (
        f"{product.product_name} | "
        f"Price: {product.current_price}"
    )

    product_name = product.product_name

    db.delete(product)
    db.commit()

    create_audit_log(
        db=db,
        username=current_user.username,
        role=current_user.role,
        action="Product deleted",
        target=f"Product ID {product_id}",
        old_value=old_value,
        new_value=f"Deleted {product_name}"
    )

    return {
        "message": "Product deleted successfully",
        "product_id": product_id
    }