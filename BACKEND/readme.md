# PricePilot AI — Backend API Documentation & User Guide

PricePilot AI is an AI-powered price tracking, competitor monitoring, and dynamic price prediction platform designed to optimize product pricing, maximize gross profit margins, and streamline inventory control.

This repository contains the full production-ready RESTful backend built with **FastAPI**, **SQLAlchemy**, and **Python**.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| **Python 3.13+** | Programming language |
| **FastAPI** | High-performance REST API framework |
| **Uvicorn** | ASGI server |
| **SQLAlchemy 2.0** | Relational ORM & database interface |
| **PostgreSQL / SQLite** | Database storage |
| **Alembic** | Database migrations engine |
| **Pydantic v2** | Data validation & schema serialization |
| **PyJWT (python-jose)** | JWT Authentication & security |
| **bcrypt** | Secure password hashing |
| **Pytest** | Automated test suite |

---

## 🏗️ System Architecture

```text
                        ┌────────────────────────┐
                        │     React Frontend     │
                        │    (Vite / Next.js)    │
                        └───────────┬────────────┘
                                    │
                               HTTP / REST
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend Application                     │
│                                (app/main.py)                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────┬───────────────┼───────────────┬───────────────┐
    ▼               ▼               ▼               ▼               ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐
│  Auth &  │  │ Catalog  │  │ Competitors  │  │  Pricing  │  │   Sales    │
│ Security │  │ Service  │  │   Tracker    │  │ AI Engine │  │ Analytics  │
└──────────┘  └──────────┘  └──────────────┘  └───────────┘  └────────────┘
    │               │               │               │               │
    └───────────────┴───────────────┼───────────────┴───────────────┘
                                    ▼
                        ┌────────────────────────┐
                        │  Relational Database   │
                        │ (PostgreSQL / SQLite)  │
                        └────────────────────────┘
```

---

## ⚙️ Quickstart & Local Setup

### 1. Environment Setup
Make sure you have Python 3.10+ installed.

```powershell
# Navigate to backend directory
cd c:\Infosys_project\PRICEPILOT_AI\BACKEND

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables Configuration (`.env`)
Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/pricepilot_db
SECRET_KEY=your_super_secret_jwt_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3. Run Database Migrations
```powershell
alembic upgrade head
```

### 4. Start Development Server
```powershell
uvicorn app.main:app --reload --port 8000
```
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 📚 Complete REST API Reference

All protected endpoints require the HTTP Header:
`Authorization: Bearer <ACCESS_TOKEN>`

---

### 🔑 1. Authentication & System Health

#### `GET /health`
- **Description**: Returns system health status.
- **Auth Required**: No
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "PricePilot AI Backend"
}
```

#### `POST /api/v1/auth/register`
- **Description**: Registers a new user account.
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "owner@pricepilot.ai",
  "password": "SecurePassword123!",
  "full_name": "Admin Owner"
}
```
- **Response**: `201 Created`
```json
{
  "id": "c0716e77-6c96-4052-a5e1-222c0888b9f3",
  "email": "owner@pricepilot.ai",
  "full_name": "Admin Owner",
  "is_active": true,
  "is_verified": false,
  "created_at": "2026-09-05T13:30:00Z"
}
```

#### `POST /api/v1/auth/login`
- **Description**: Authenticates user and returns JWT access & refresh tokens.
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "owner@pricepilot.ai",
  "password": "SecurePassword123!"
}
```
- **Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### `GET /api/v1/auth/me`
- **Description**: Returns profile details for the currently logged-in user.
- **Auth Required**: Yes (`Bearer Token`)
- **Response**: `200 OK`

---

### 👤 2. User Management (`/api/v1/users`)

#### `GET /api/v1/users`
- **Description**: List all registered users in the system.
- **Auth Required**: Yes

#### `GET /api/v1/users/{user_id}`
- **Description**: Get user details by UUID.
- **Auth Required**: Yes

#### `PUT /api/v1/users/{user_id}`
- **Description**: Update user profile information.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "full_name": "Chief Executive Owner",
  "is_active": true
}
```

---

### 🏢 3. Organization & Multi-Tenancy (`/api/v1/organizations`)

#### `POST /api/v1/organizations/`
- **Description**: Create a new organization. The creator is automatically assigned as `OWNER`.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "name": "Global Electro Corp",
  "description": "Electronics Retailer & Wholesale Distributor",
  "website": "https://electrocorp.com"
}
```
- **Response**: `201 Created`

#### `GET /api/v1/organizations/`
- **Description**: List all organizations that the current user belongs to.
- **Auth Required**: Yes

#### `GET /api/v1/organizations/{org_id}`
- **Description**: Fetch specific organization details.
- **Auth Required**: Yes

#### `POST /api/v1/organizations/{org_id}/members`
- **Description**: Add a new member to an organization.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "user_id": "user-uuid-here",
  "role": "admin"
}
```

---

### 🏷️ 4. Product Categories (`/api/v1/categories`)

#### `POST /api/v1/categories/`
- **Description**: Create a product category for an organization. Supports hierarchical parent categories.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "name": "Smartphones & Tablets",
  "organization_id": "org-uuid-here",
  "parent_id": null,
  "description": "Mobile Devices & Accessories"
}
```

#### `GET /api/v1/categories/organization/{org_id}`
- **Description**: List all categories belonging to an organization.
- **Auth Required**: Yes

---

### 📦 5. Products, Variants & Inventory (`/api/v1/products`)

#### `POST /api/v1/products/`
- **Description**: Create a new product. Automatically initializes a base inventory tracking record.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "name": "PricePilot Flagship Phone",
  "sku": "PHONE-PRO-MAX",
  "organization_id": "org-uuid-here",
  "category_id": "category-uuid-here",
  "brand": "PricePilot Mobile",
  "cost_price": "500.00",
  "base_price": "799.99",
  "currency": "INR"
}
```

#### `GET /api/v1/products/organization/{org_id}`
- **Description**: List organization products with optional category filter (`?category_id=...`) and text search (`?search=...`).
- **Auth Required**: Yes

#### `GET /api/v1/products/{product_id}`
- **Description**: Get single product details.
- **Auth Required**: Yes

#### `PUT /api/v1/products/{product_id}`
- **Description**: Update product information.
- **Auth Required**: Yes

#### `POST /api/v1/products/{product_id}/variants`
- **Description**: Add a variant (e.g., color, size, storage) to a product and create variant-level inventory.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "name": "256GB Midnight Black",
  "sku": "PHONE-PRO-MAX-256-BLK",
  "barcode": "8901234567890",
  "attributes": {
    "storage": "256GB",
    "color": "black"
  },
  "cost_price": "550.00",
  "price": "899.99"
}
```

#### `GET /api/v1/products/{product_id}/inventory`
- **Description**: Fetch inventory stock levels for a product or variant (`?variant_id=...`).
- **Auth Required**: Yes

#### `PUT /api/v1/products/{product_id}/inventory`
- **Description**: Update inventory stock quantity and reorder alert levels.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "quantity_on_hand": 100,
  "reserved_quantity": 0,
  "reorder_level": 15,
  "reorder_quantity": 50
}
```

#### `DELETE /api/v1/products/{product_id}`
- **Description**: Delete a product.
- **Auth Required**: Yes
- **Response**: `204 No Content`

---

### 🔍 6. Competitor Price Monitoring (`/api/v1/competitors`)

#### `POST /api/v1/competitors/`
- **Description**: Register a competitor company.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "name": "TechBazaar Online",
  "organization_id": "org-uuid-here",
  "website": "https://techbazaar.com"
}
```

#### `GET /api/v1/competitors/organization/{org_id}`
- **Description**: List registered competitors for an organization.
- **Auth Required**: Yes

#### `POST /api/v1/competitors/match`
- **Description**: Link a competitor's web listing to an internal product.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "competitor_id": "competitor-uuid-here",
  "product_id": "product-uuid-here",
  "name": "TechBazaar Flagship Phone listing",
  "url": "https://techbazaar.com/phone-listing",
  "match_confidence": "0.98"
}
```

#### `POST /api/v1/competitors/prices`
- **Description**: Log a competitor price observation (manual or web-scraped).
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "competitor_product_id": "comp-product-uuid-here",
  "price": "769.99",
  "currency": "INR",
  "availability": true
}
```

#### `GET /api/v1/competitors/product/{product_id}/prices`
- **Description**: Fetch all competitor price observation logs for a product.
- **Auth Required**: Yes

---

### 🤖 7. AI Dynamic Pricing Engine (`/api/v1/pricing`)

#### `POST /api/v1/pricing/predict`
- **Description**: Run AI / Rule-based dynamic price optimization. Evaluates cost price margin, competitor benchmark price, stock velocity, and inventory levels.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "product_id": "product-uuid-here",
  "variant_id": null,
  "target_margin_percent": 25.0
}
```
- **Response**: `200 OK`
```json
{
  "product_id": "product-uuid-here",
  "variant_id": null,
  "current_price": "799.99",
  "recommended_price": "754.59",
  "competitor_avg_price": "769.99",
  "demand_factor": "stable",
  "recommendation_reason": "Competitor undercut strategy (2% below avg competitor price 769.99)",
  "price_change_percentage": -5.68
}
```

#### `POST /api/v1/pricing/recommendations`
- **Description**: Save an AI price prediction as an actionable recommendation.
- **Auth Required**: Yes

#### `POST /api/v1/pricing/recommendations/{recommendation_id}/apply`
- **Description**: Apply an approved price recommendation to update product/variant price and record `PriceHistory`.
- **Auth Required**: Yes

#### `GET /api/v1/pricing/history/{product_id}`
- **Description**: Retrieve historical price changes and reason logs for a product.
- **Auth Required**: Yes

---

### 📊 8. Sales Transactions & Analytics (`/api/v1/sales`)

#### `POST /api/v1/sales/`
- **Description**: Record a completed sales transaction and automatically deduct stock from inventory.
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "organization_id": "org-uuid-here",
  "product_id": "product-uuid-here",
  "variant_id": null,
  "quantity": 5,
  "unit_price": "754.59"
}
```

#### `GET /api/v1/sales/analytics/{organization_id}`
- **Description**: Fetch revenue metrics, order count, total units sold, and Average Order Value (AOV).
- **Auth Required**: Yes
- **Response**: `200 OK`
```json
{
  "total_sales_count": 1,
  "total_revenue": "3772.95",
  "units_sold": 5,
  "average_order_value": "3772.95"
}
```

---

## 🧪 Running Automated Tests

The test suite validates authentication, user management, products, variants, inventory, competitor tracking, AI dynamic pricing engine, and sales analytics.

```powershell
c:\Infosys_project\PRICEPILOT_AI\BACKEND\venv\Scripts\python.exe -m pytest -v
```

### Test Result Summary:
- `35/35 Endpoints Passed (100% Success Rate)`
- `11/11 Pytest Test Suites Passed`