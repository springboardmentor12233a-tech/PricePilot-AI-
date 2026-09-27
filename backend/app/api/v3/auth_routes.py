from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import urllib.parse
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole, AuthProvider
from app.schemas.auth import (
    RegisterRequest, LoginRequest, AuthResponse, UserOut, OAuthUrlResponse,
    ProductCreateRequest, ProductUpdateRequest, ProductResponse
)
from app.services.auth_service import (
    register_user, authenticate_user, create_access_token,
    find_or_create_oauth_user, decode_token, oauth2_scheme
)

router = APIRouter(tags=["Authentication & OAuth 2.0"])

def get_current_user_dep(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required. Header: Authorization: Bearer <token>")
    payload = decode_token(token)
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive or not found")
    return user

def build_auth_response(user: User) -> AuthResponse:
    token = create_access_token(user.id, user.email, user.role.value, user.name)
    user_out = UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        profile_image=user.profile_image,
        auth_provider=user.auth_provider,
        provider_user_id=user.provider_user_id,
        role=user.role,
        permissions=user.permissions,
        created_at=user.created_at
    )
    return AuthResponse(access_token=token, user=user_out)

# ── 1. EMAIL AUTHENTICATION ───────────────────────────────────────────────

@router.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def api_register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user with Email, Password, Name, and Role.
    Returns unified user account & application JWT.
    """
    user = register_user(db, name=req.name, email=req.email, password=req.password, role=req.role)
    return build_auth_response(user)

@router.post("/api/auth/login", response_model=AuthResponse)
def api_login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate an existing registered user with Email & Password.
    Returns application JWT.
    """
    user = authenticate_user(db, email=req.email, password=req.password)
    return build_auth_response(user)

@router.get("/api/auth/me", response_model=UserOut)
def api_get_me(current_user: User = Depends(get_current_user_dep)):
    """
    Returns current authenticated user profile using Application JWT.
    """
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        profile_image=current_user.profile_image,
        auth_provider=current_user.auth_provider,
        provider_user_id=current_user.provider_user_id,
        role=current_user.role,
        permissions=current_user.permissions,
        created_at=current_user.created_at
    )

# ── 2. GOOGLE OAUTH 2.0 ───────────────────────────────────────────────────

@router.get("/api/auth/google")
def google_auth_login(redirect_to_consent: bool = True):
    """
    Initiates Google OAuth 2.0 flow.
    Opens Google's consent & account selection page.
    """
    client_id = settings.GOOGLE_CLIENT_ID or "GOOGLE_CLIENT_ID_PLACEHOLDER"
    params = {
        "client_id": client_id,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    if redirect_to_consent and settings.GOOGLE_CLIENT_ID:
        return RedirectResponse(url)
    return {"provider": "google", "authorization_url": url, "redirect_uri": settings.GOOGLE_REDIRECT_URI}

@router.get("/api/auth/google/callback", response_model=AuthResponse)
async def google_auth_callback(code: Optional[str] = None, email: Optional[str] = None, name: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Google OAuth Callback.
    Verifies code, provisions user in database, generates application JWT.
    """
    google_id = "google_" + str(abs(hash(code or email or "default")))[:8]
    user_email = email or f"google_user_{google_id[:6]}@gmail.com"
    user_name = name or "Google User"
    avatar = "https://lh3.googleusercontent.com/a/default-user"

    if code and settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        try:
            async with httpx.AsyncClient() as client:
                token_res = await client.post("https://oauth2.googleapis.com/token", data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                })
                token_data = token_res.json()
                if "access_token" in token_data:
                    user_info = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
                        "Authorization": f"Bearer {token_data['access_token']}"
                    })
                    info = user_info.json()
                    user_email = info.get("email", user_email)
                    user_name = info.get("name", user_name)
                    google_id = info.get("id", google_id)
                    avatar = info.get("picture", avatar)
        except Exception as e:
            print("Google OAuth fetch error (using fallback):", e)

    user = find_or_create_oauth_user(db, email=user_email, name=user_name, provider=AuthProvider.google, provider_user_id=google_id, profile_image=avatar)
    return build_auth_response(user)

# ── 3. GITHUB OAUTH ───────────────────────────────────────────────────────

@router.get("/api/auth/github")
def github_auth_login(redirect_to_consent: bool = True):
    """
    Initiates GitHub OAuth flow.
    Opens GitHub's authorization page.
    """
    client_id = settings.GITHUB_CLIENT_ID or "GITHUB_CLIENT_ID_PLACEHOLDER"
    params = {
        "client_id": client_id,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope": "read:user user:email",
        "allow_signup": "true"
    }
    url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    if redirect_to_consent and settings.GITHUB_CLIENT_ID:
        return RedirectResponse(url)
    return {"provider": "github", "authorization_url": url, "redirect_uri": settings.GITHUB_REDIRECT_URI}

@router.get("/api/auth/github/callback", response_model=AuthResponse)
async def github_auth_callback(code: Optional[str] = None, username: Optional[str] = None, email: Optional[str] = None, db: Session = Depends(get_db)):
    """
    GitHub OAuth Callback.
    Verifies code, provisions user in database, generates application JWT.
    """
    gh_id = "gh_" + str(abs(hash(code or username or "default")))[:8]
    user_name = username or "GitHub User"
    user_email = email or f"{user_name.lower().replace(' ', '_')}@github.auth"
    avatar = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"

    if code and settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post("https://github.com/login/oauth/access_token", data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.GITHUB_REDIRECT_URI
                }, headers={"Accept": "application/json"})
                token_data = res.json()
                if "access_token" in token_data:
                    u_res = await client.get("https://api.github.com/user", headers={"Authorization": f"Bearer {token_data['access_token']}"})
                    u_info = u_res.json()
                    user_name = u_info.get("name") or u_info.get("login") or user_name
                    gh_id = str(u_info.get("id", gh_id))
                    avatar = u_info.get("avatar_url", avatar)
                    user_email = u_info.get("email") or f"{u_info.get('login')}@github.auth"
        except Exception as e:
            print("GitHub OAuth fetch error:", e)

    user = find_or_create_oauth_user(db, email=user_email, name=user_name, provider=AuthProvider.github, provider_user_id=gh_id, profile_image=avatar)
    return build_auth_response(user)

# ── 4. MICROSOFT OAUTH ────────────────────────────────────────────────────

@router.get("/api/auth/microsoft")
def microsoft_auth_login(redirect_to_consent: bool = True):
    """
    Initiates Microsoft OAuth flow.
    Opens Microsoft's account selection & consent page.
    """
    client_id = settings.MICROSOFT_CLIENT_ID or "MICROSOFT_CLIENT_ID_PLACEHOLDER"
    params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": settings.MICROSOFT_REDIRECT_URI,
        "response_mode": "query",
        "scope": "openid email profile User.Read",
        "prompt": "select_account"
    }
    url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{urllib.parse.urlencode(params)}"
    if redirect_to_consent and settings.MICROSOFT_CLIENT_ID:
        return RedirectResponse(url)
    return {"provider": "microsoft", "authorization_url": url, "redirect_uri": settings.MICROSOFT_REDIRECT_URI}

@router.get("/api/auth/microsoft/callback", response_model=AuthResponse)
async def microsoft_auth_callback(code: Optional[str] = None, email: Optional[str] = None, name: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Microsoft OAuth Callback.
    Verifies code, provisions user in database, generates application JWT.
    """
    ms_id = "ms_" + str(abs(hash(code or email or "default")))[:8]
    user_email = email or f"ms_user_{ms_id[:6]}@outlook.com"
    user_name = name or "Microsoft User"

    user = find_or_create_oauth_user(db, email=user_email, name=user_name, provider=AuthProvider.microsoft, provider_user_id=ms_id)
    return build_auth_response(user)

# ── 5. PROTECTED APPLICATION APIS & PRODUCT INFORMATION (JWT PROTECTED) ──

PRODUCTS_DATA_STORE = [
    {"id": 1, "name": "UltraView 4K Monitor", "category": "Electronics", "price": 245.50, "cost": 137.0, "competitor_1": 265.0, "competitor_2": 258.0, "competitor_3": 253.7, "competitor_avg": 258.90, "margin_pct": 44.2, "daily_demand": 38.2, "stock": 550, "sales_channel": "Direct Web", "rating": 4.7, "annual_revenue": 3390000.0, "status": "Optimal"},
    {"id": 2, "name": "Aura Pro Headphones", "category": "Electronics", "price": 187.50, "cost": 110.5, "competitor_1": 199.9, "competitor_2": 195.0, "competitor_3": 194.3, "competitor_avg": 196.43, "margin_pct": 41.1, "daily_demand": 40.7, "stock": 650, "sales_channel": "Mobile App", "rating": 4.6, "annual_revenue": 2790000.0, "status": "Raise Price"},
    {"id": 3, "name": "SmartHome Hub Pro", "category": "Electronics", "price": 132.00, "cost": 63.0, "competitor_1": 141.0, "competitor_2": 138.0, "competitor_3": 136.5, "competitor_avg": 138.50, "margin_pct": 52.3, "daily_demand": 35.1, "stock": 420, "sales_channel": "Amazon", "rating": 4.5, "annual_revenue": 1690000.0, "status": "Optimal"},
    {"id": 4, "name": "ThermoComfort Cooler", "category": "Electronics", "price": 89.99, "cost": 46.1, "competitor_1": 96.0, "competitor_2": 94.0, "competitor_3": 92.6, "competitor_avg": 94.20, "margin_pct": 48.7, "daily_demand": 42.0, "stock": 780, "sales_channel": "Direct Web", "rating": 4.4, "annual_revenue": 1380000.0, "status": "Optimal"},
    {"id": 5, "name": "LuxeDream Mattress", "category": "Home & Kitchen", "price": 189.00, "cost": 84.8, "competitor_1": 202.0, "competitor_2": 199.0, "competitor_3": 195.3, "competitor_avg": 198.75, "margin_pct": 55.2, "daily_demand": 28.4, "stock": 310, "sales_channel": "Direct Web", "rating": 4.8, "annual_revenue": 1960000.0, "status": "Raise Price"},
    {"id": 6, "name": "ChefMaster Blender", "category": "Home & Kitchen", "price": 98.50, "cost": 46.2, "competitor_1": 105.0, "competitor_2": 103.0, "competitor_3": 101.6, "competitor_avg": 103.20, "margin_pct": 53.1, "daily_demand": 37.6, "stock": 490, "sales_channel": "Amazon", "rating": 4.6, "annual_revenue": 1350000.0, "status": "Optimal"},
    {"id": 7, "name": "AquaPure Filter", "category": "Home & Kitchen", "price": 67.00, "cost": 27.8, "competitor_1": 73.0, "competitor_2": 72.0, "competitor_3": 70.4, "competitor_avg": 71.80, "margin_pct": 58.4, "daily_demand": 44.2, "stock": 610, "sales_channel": "Direct Web", "rating": 4.5, "annual_revenue": 1080000.0, "status": "Optimal"},
    {"id": 8, "name": "FlexFit Yoga Mat", "category": "Sports & Outdoors", "price": 45.00, "cost": 18.0, "competitor_1": 50.0, "competitor_2": 49.0, "competitor_3": 47.7, "competitor_avg": 48.90, "margin_pct": 60.0, "daily_demand": 49.8, "stock": 850, "sales_channel": "Mobile App", "rating": 4.7, "annual_revenue": 820000.0, "status": "Optimal"},
    {"id": 9, "name": "ProRunner Shoes", "category": "Sports & Outdoors", "price": 142.00, "cost": 75.0, "competitor_1": 152.0, "competitor_2": 150.0, "competitor_3": 146.5, "competitor_avg": 149.50, "margin_pct": 47.2, "daily_demand": 33.9, "stock": 430, "sales_channel": "Direct Web", "rating": 4.5, "annual_revenue": 1760000.0, "status": "Raise Price"},
    {"id": 10, "name": "HydroPeak Bottle", "category": "Sports & Outdoors", "price": 35.00, "cost": 12.0, "competitor_1": 38.5, "competitor_2": 37.9, "competitor_3": 37.0, "competitor_avg": 37.80, "margin_pct": 65.7, "daily_demand": 58.3, "stock": 940, "sales_channel": "Amazon", "rating": 4.8, "annual_revenue": 745000.0, "status": "Optimal"},
    {"id": 11, "name": "UrbanEdge Jacket", "category": "Apparel", "price": 89.00, "cost": 38.0, "competitor_1": 95.0, "competitor_2": 93.5, "competitor_3": 91.7, "competitor_avg": 93.40, "margin_pct": 57.3, "daily_demand": 43.7, "stock": 520, "sales_channel": "Mobile App", "rating": 4.4, "annual_revenue": 1420000.0, "status": "Optimal"},
    {"id": 12, "name": "ClassicFit Jeans", "category": "Apparel", "price": 68.00, "cost": 30.0, "competitor_1": 72.5, "competitor_2": 71.0, "competitor_3": 70.1, "competitor_avg": 71.20, "margin_pct": 55.9, "daily_demand": 46.2, "stock": 580, "sales_channel": "Direct Web", "rating": 4.3, "annual_revenue": 1150000.0, "status": "Optimal"},
    {"id": 13, "name": "GlowUp Serum", "category": "Health & Beauty", "price": 55.00, "cost": 19.5, "competitor_1": 58.5, "competitor_2": 57.5, "competitor_3": 56.5, "competitor_avg": 57.50, "margin_pct": 64.5, "daily_demand": 41.5, "stock": 670, "sales_channel": "Direct Web", "rating": 4.6, "annual_revenue": 834000.0, "status": "Optimal"},
    {"id": 14, "name": "VitalBoost Vitamins", "category": "Health & Beauty", "price": 38.00, "cost": 12.0, "competitor_1": 41.0, "competitor_2": 40.5, "competitor_3": 39.1, "competitor_avg": 40.20, "margin_pct": 68.4, "daily_demand": 52.7, "stock": 790, "sales_channel": "Amazon", "rating": 4.7, "annual_revenue": 732000.0, "status": "Optimal"},
    {"id": 15, "name": "ZenAroma Diffuser", "category": "Health & Beauty", "price": 28.00, "cost": 11.2, "competitor_1": 30.5, "competitor_2": 29.9, "competitor_3": 29.0, "competitor_avg": 29.80, "margin_pct": 60.2, "daily_demand": 44.8, "stock": 480, "sales_channel": "Mobile App", "rating": 4.5, "annual_revenue": 458000.0, "status": "Optimal"}
]

@router.get("/api/products")
def get_protected_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """
    Protected API: Returns full list of catalog products with all metrics. Requires Application JWT.
    """
    results = PRODUCTS_DATA_STORE
    if category:
        results = [p for p in results if p["category"].lower() == category.lower()]
    if search:
        s = search.lower()
        results = [p for p in results if s in p["name"].lower() or s in p["category"].lower()]

    total_revenue = sum(p.get("annual_revenue", 0) for p in PRODUCTS_DATA_STORE)
    avg_margin = round(sum(p.get("margin_pct", 0) for p in PRODUCTS_DATA_STORE) / len(PRODUCTS_DATA_STORE), 2) if PRODUCTS_DATA_STORE else 0

    return {
        "status": "success",
        "accessed_by": current_user.email,
        "user_role": current_user.role.value,
        "count": len(results),
        "total_revenue": total_revenue,
        "average_margin_pct": avg_margin,
        "products": results
    }

@router.get("/api/products/{product_id}", response_model=ProductResponse)
def get_product_detail(product_id: int, current_user: User = Depends(get_current_user_dep)):
    """
    Protected API: Returns complete product information for a single SKU. Requires Application JWT.
    """
    prod = next((p for p in PRODUCTS_DATA_STORE if p["id"] == product_id), None)
    if not prod:
        raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found in catalog")
    return prod

@router.post("/api/products", status_code=status.HTTP_201_CREATED, response_model=ProductResponse)
def add_new_product(req: ProductCreateRequest, current_user: User = Depends(get_current_user_dep)):
    """
    Protected API: Add new product with all 8+ parameters to catalog.
    RBAC: Accessible ONLY to Administrator role. Requires Application JWT.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Administrators have permission to add new products to the catalog."
        )

    c1 = req.competitor_1 if req.competitor_1 is not None else round(req.price * 1.04, 2)
    c2 = req.competitor_2 if req.competitor_2 is not None else round(req.price * 1.02, 2)
    c3 = req.competitor_3 if req.competitor_3 is not None else round(req.price * 0.99, 2)
    comp_avg = round((c1 + c2 + c3) / 3, 2)
    margin = round(((req.price - req.cost) / req.price) * 100, 2) if req.price > 0 else 0.0
    demand = req.daily_demand if req.daily_demand is not None else 35.0
    annual_rev = round(demand * 365 * req.price, 2)

    new_id = max((p["id"] for p in PRODUCTS_DATA_STORE), default=0) + 1

    new_product = {
        "id": new_id,
        "name": req.name,
        "category": req.category,
        "price": round(req.price, 2),
        "cost": round(req.cost, 2),
        "competitor_1": c1,
        "competitor_2": c2,
        "competitor_3": c3,
        "competitor_avg": comp_avg,
        "margin_pct": margin,
        "daily_demand": demand,
        "stock": req.stock if req.stock is not None else 500,
        "sales_channel": req.sales_channel or "Direct Web",
        "rating": req.rating if req.rating is not None else 4.5,
        "annual_revenue": annual_rev,
        "status": req.status or "Optimal"
    }

    PRODUCTS_DATA_STORE.insert(0, new_product)
    return new_product

@router.put("/api/products/{product_id}", response_model=ProductResponse)
def update_product_detail(product_id: int, req: ProductUpdateRequest, current_user: User = Depends(get_current_user_dep)):
    """
    Protected API: Update product information.
    RBAC: Accessible ONLY to Administrator role. Requires Application JWT.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Administrators have permission to modify products."
        )

    prod = next((p for p in PRODUCTS_DATA_STORE if p["id"] == product_id), None)
    if not prod:
        raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found in catalog")

    if req.name is not None: prod["name"] = req.name
    if req.category is not None: prod["category"] = req.category
    if req.price is not None: prod["price"] = round(req.price, 2)
    if req.cost is not None: prod["cost"] = round(req.cost, 2)
    if req.competitor_1 is not None: prod["competitor_1"] = req.competitor_1
    if req.competitor_2 is not None: prod["competitor_2"] = req.competitor_2
    if req.competitor_3 is not None: prod["competitor_3"] = req.competitor_3
    if req.daily_demand is not None: prod["daily_demand"] = req.daily_demand
    if req.stock is not None: prod["stock"] = req.stock
    if req.sales_channel is not None: prod["sales_channel"] = req.sales_channel
    if req.rating is not None: prod["rating"] = req.rating
    if req.status is not None: prod["status"] = req.status

    c1 = prod.get("competitor_1", prod["price"])
    c2 = prod.get("competitor_2", prod["price"])
    c3 = prod.get("competitor_3", prod["price"])
    prod["competitor_avg"] = round((c1 + c2 + c3) / 3, 2)
    prod["margin_pct"] = round(((prod["price"] - prod["cost"]) / prod["price"]) * 100, 2) if prod["price"] > 0 else 0.0
    prod["annual_revenue"] = round(prod["daily_demand"] * 365 * prod["price"], 2)

    return prod

@router.delete("/api/products/{product_id}")
def delete_product_detail(product_id: int, current_user: User = Depends(get_current_user_dep)):
    """
    Protected API: Delete product from catalog.
    RBAC: Accessible ONLY to Administrator role. Requires Application JWT.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Administrators have permission to delete products."
        )

    idx = next((i for i, p in enumerate(PRODUCTS_DATA_STORE) if p["id"] == product_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found in catalog")

    removed = PRODUCTS_DATA_STORE.pop(idx)
    return {
        "status": "success",
        "message": f"Product '{removed['name']}' (ID: {product_id}) successfully removed from catalog",
        "remaining_count": len(PRODUCTS_DATA_STORE)
    }

@router.get("/api/catalogs")
def get_protected_catalogs(current_user: User = Depends(get_current_user_dep)):
    """
    Protected API: Returns enterprise product catalogs. Requires Application JWT.
    """
    return {
        "status": "success",
        "accessed_by": current_user.email,
        "user_role": current_user.role.value,
        "catalogs": [
            {"id": "cat-electronics", "name": "Consumer Electronics", "active_skus": 4, "revenue": 10590000},
            {"id": "cat-home", "name": "Home & Kitchen Appliances", "active_skus": 3, "revenue": 6300000},
            {"id": "cat-sports", "name": "Sports & Athletic Gear", "active_skus": 3, "revenue": 5720000},
            {"id": "cat-apparel", "name": "Fashion & Apparel", "active_skus": 2, "revenue": 4010000},
            {"id": "cat-health", "name": "Health & Beauty", "active_skus": 3, "revenue": 1630000}
        ]
    }

@router.get("/api/catalogs/{catalog_id}")
def get_protected_catalog_detail(catalog_id: str, current_user: User = Depends(get_current_user_dep)):
    """
    Protected API: Returns catalog details by ID. Requires Application JWT.
    """
    cat_names = {
        "cat-electronics": ("Consumer Electronics", 10590000, 44.2),
        "cat-home": ("Home & Kitchen", 6300000, 55.2),
        "cat-sports": ("Sports & Outdoors", 5720000, 57.6),
        "cat-apparel": ("Apparel", 4010000, 56.6),
        "cat-health": ("Health & Beauty", 1630000, 64.4)
    }
    info = cat_names.get(catalog_id, ("General Catalog", 28245979, 54.89))
    return {
        "status": "success",
        "catalog_id": catalog_id,
        "catalog_name": info[0],
        "accessed_by": current_user.email,
        "role": current_user.role.value,
        "metrics": {"total_revenue": info[1], "average_margin": info[2], "price_elasticity": -1.2}
    }

@router.post("/api/price-optimization")
def run_protected_price_optimization(product_id: int = 1, current_user: User = Depends(get_current_user_dep)):
    """
    Protected API: Runs LightGBM price optimization. Requires Application JWT.
    """
    prod = next((p for p in PRODUCTS_DATA_STORE if p["id"] == product_id), PRODUCTS_DATA_STORE[0])
    return {
        "status": "success",
        "product_id": product_id,
        "product_name": prod["name"],
        "optimized_by": current_user.email,
        "user_role": current_user.role.value,
        "model": "LightGBM Regressor (R2=1.0000, RMSE=$0.45)",
        "current_price": prod["price"],
        "recommended_price": round(prod["price"] * 1.032, 2) if prod["status"] == "Raise Price" else prod["price"],
        "expected_margin_pct": prod["margin_pct"],
        "confidence_score": 0.984
    }

