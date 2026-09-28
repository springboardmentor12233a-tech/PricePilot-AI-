# PricePilot AI — Dynamic Pricing Intelligence Platform (Milestone 3)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![LightGBM](https://img.shields.io/badge/LightGBM-R%C2%B2%3D1.0000-green.svg)](https://lightgbm.readthedocs.io)
[![XGBoost](https://img.shields.io/badge/XGBoost-R%C2%B2%3D0.9050-blue.svg)](https://xgboost.readthedocs.io)
[![JWT Auth](https://img.shields.io/badge/JWT-RFC%207519-orange.svg)](https://jwt.io)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deploy%20Ready-black.svg?logo=vercel)](https://vercel.com)

PricePilot AI is an enterprise-grade dynamic pricing intelligence platform built for the AI & Data Science Capstone Project. It integrates state-of-the-art machine learning models (**LightGBM** and **XGBoost**) for real-time optimal price prediction, multi-horizon demand forecasting with uncertainty bounds, role-based access control (**RBAC**), and JWT-secured product information management.

---

## 📁 Project Directory Structure (Ready for GitHub & Vercel)

```text
PricePilot_AI_Milestone3/
├── index.html                                   # Root Dashboard Application (Vercel Entrypoint)
├── landing.html                                 # Public Portal Landing Page & Notice Board
├── vercel.json                                  # Vercel Production Deployment Configuration
├── README.md                                    # Complete Documentation & Deployment Guide
├── PricePilot_AI_Auth_Postman_Collection.json   # 21-Endpoint Postman Test Collection
├── test_postman_suite.py                        # Automated API Test Runner
├── RUN_LOCAL_DASHBOARD.bat                      # 1-Click Localhost Runner (Backend + Frontend)
├── RUN_API_TESTS.bat                            # 1-Click Automated API Test Suite
├── push_to_github.bat                           # 1-Click GitHub Repository Push Script
│
├── frontend/                                    # Frontend Source Files
│   ├── index.html                               # SPA Dashboard (Auth, KPIs, Models, Chatbot)
│   └── landing.html                             # Public Landing Page (Mahajyoti Style)
│
├── backend/                                     # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                              # FastAPI Application Factory & CORS
│   │   ├── api/v3/
│   │   │   ├── auth_routes.py                   # JWT Auth & Product Information CRUD
│   │   │   ├── prediction_routes.py             # ML Prediction Endpoints
│   │   │   └── report_routes.py                 # BI Export Endpoints (PDF, CSV, JSON)
│   │   ├── core/
│   │   │   ├── config.py                        # Environment Settings
│   │   │   └── database.py                      # SQLite & PostgreSQL Session Engine
│   │   ├── models/                              # SQLAlchemy ORM Models
│   │   ├── schemas/                             # Pydantic Request & Response Schemas
│   │   └── services/                            # Auth & Prediction Business Logic
│   └── requirements_m3.txt                      # Python Dependencies
│
└── ml/                                          # Trained Machine Learning Artifacts
    └── artifacts/
        ├── price_model.pkl                      # LightGBM Regressor (R² = 1.0000)
        └── demand_model.pkl                     # XGBoost Forecaster (R² = 0.9050)
```

---

## 🚀 1. How to Run & Test on Localhost

### Method A: One-Click Execution (Recommended)
Simply double-click **`RUN_LOCAL_DASHBOARD.bat`** on your Desktop.
- Automatically launches the **FastAPI backend** on `http://127.0.0.1:8000`.
- Automatically opens the **Public Portal Landing Page** (`landing.html`) in your default browser.
- Automatically opens the **App Dashboard** (`index.html`) in your default browser.

### Method B: Manual Command Line
1. Open PowerShell and navigate to the backend folder:
   ```powershell
   cd "C:\Users\jojo\OneDrive\Desktop\PricePilot_AI_Milestone3\backend"
   ```
2. Start the FastAPI backend:
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
3. Open `landing.html` or `index.html` in any web browser.
4. Access interactive Swagger API documentation at:
   👉 **http://127.0.0.1:8000/docs**

### Demo Login Credentials:
| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@pricepilot.ai` | `Admin@123` | Full Access: Add Products, Edit Catalog, User Mgmt, Models, BI |
| **Business Analyst** | `analyst@pricepilot.ai` | `Analyst@123` | Analytics: Price Optimization, Demand Forecast, BI Reports, EDA |
| **User** | `user@pricepilot.ai` | `User@123` | Viewer: Product KPIs & AI Insights |

---

## 🧪 2. How to Test with Postman & Automated Suite

### Run Automated Test Suite (1-Click):
Double-click **`RUN_API_TESTS.bat`** to execute 21 automated tests verifying:
- JWT Token Generation & Validation (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- Product Information Retrieval & Filtering (`/api/products`, `/api/products/{id}`)
- Product Information Addition (8+ Parameters, Admin-only)
- RBAC Security Guard (`403 Forbidden` verification on non-admin add attempts)
- Product Updates & Deletions (`PUT /api/products/1`, `DELETE /api/products/1`)
- Unauthorized Access Prevention (`401 Unauthorized` without JWT)
- Catalogs & Dynamic Price Optimization

### Import into Postman App:
1. Open **Postman** (Desktop or [web.postman.co](https://web.postman.co)).
2. Click **Import** (top left).
3. Select file:
   `PricePilot_AI_Auth_Postman_Collection.json`
4. Click **Run Collection** &mdash; all tests will execute and generate a visual test report.

---

## 🐙 3. How to Push the Complete Project to GitHub

1. Ensure you have your **GitHub Personal Access Token (PAT)** ready:
   *(GitHub &rarr; Settings &rarr; Developer Settings &rarr; Personal Access Tokens &rarr; Generate New Token with `repo` scope).*
2. Double-click **`push_to_github.bat`** on your Desktop.
3. When prompted, paste your GitHub PAT and press Enter.
4. The script automatically:
   - Stages and commits all root files, `index.html`, `landing.html`, `vercel.json`, and backend code.
   - Pushes to branch: **`Yuvraj-Nandu-Patil`**.
   - Pushes to branch: **`main`**.
5. View your repository online:
   👉 **https://github.com/springboardmentor12233a-tech/PricePilot-AI-**

---

## ⚡ 4. How to Deploy to Vercel (Ready in 60 Seconds)

The project is pre-configured with **`vercel.json`** for zero-configuration deployment!

### Option 1: Deploy via Vercel Web Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Select your repository: **`PricePilot-AI-`**.
4. In the Project Configuration:
   - **Framework Preset:** Other / None
   - **Root Directory:** `./` (or leave default root)
5. Click **"Deploy"**.
6. Within 30 seconds, Vercel will give you a live production URL (e.g., `https://pricepilot-ai.vercel.app`):
   - **`https://your-domain.vercel.app/`** &rarr; Official Public Landing Page
   - **`https://your-domain.vercel.app/app`** &rarr; App Dashboard & Login
   - **`https://your-domain.vercel.app/landing`** &rarr; Public Notice Board & Features

### Option 2: Deploy via Vercel CLI
If you have Vercel CLI installed:
```powershell
cd "C:\Users\jojo\OneDrive\Desktop\PricePilot_AI_Milestone3"
vercel --prod
```

---

## 🏆 Key Features Implemented in Milestone 3
1. **Public Portal Landing Page (`landing.html`):**
   - High-definition animated hero with background imagery and data-grid overlay.
   - Real-time typing animation for system capabilities.
   - Live marquee stats ticker ($28.2M revenue tracked, 99.9% accuracy).
   - Mahajyoti-style official Notice Board with categorized announcements.
   - Interactive contact form and Mumbai office location card.
2. **JWT Authentication (RFC 7519):**
   - Secure HMAC-SHA256 token issuance on email login & social OAuth (Google, GitHub, Microsoft).
   - Real-time token inspector modal showing decoded Header, Payload claims, and verified signature.
3. **Product Information Management (Admin Only):**
   - **Add New Product** with 8+ parameters: cost, MSRP, 3 competitor prices, demand, stock, channel, rating, and status.
   - Real-time live card preview with automatic margin and competitive gap calculation.
   - **Catalog Management Table** with inline edit modal and delete capability.
4. **ARIA Smart AI Copilot:**
   - 50+ domain knowledge triggers + Groq LLaMA-3.3-70B integration for intelligent pricing strategy answers.
   - Animated typing indicator and quick reply suggestion chips.
5. **Interactive Data Analytics:**
   - Real-time Chart.js visual analytics and multi-format BI export (PDF, CSV, JSON).
