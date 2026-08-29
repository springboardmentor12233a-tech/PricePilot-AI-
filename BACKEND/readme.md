# PricePilot AI — Backend

PricePilot AI is an AI-powered price tracking and prediction application.

This repository contains the backend service responsible for:

- Product management
- Price tracking
- Price history
- User management
- Price predictions
- Machine learning inference
- Database operations
- REST APIs
- Communication with external services

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming language |
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| MySQL | Relational database |
| SQLAlchemy | ORM and database interaction |
| PyMySQL | MySQL database driver |
| Pydantic | Data validation |
| Pydantic Settings | Configuration management |
| NumPy | Numerical computation |
| Pandas | Data processing |
| Scikit-learn | Machine learning |
| HTTPX | HTTP/API communication |
| Requests | External API requests |
| Pytest | Testing |
| Git/GitHub | Version control |

---

#  System Architecture

```text
                         ┌─────────────────────┐
                         │    React Frontend   │
                         │       + Vite        │
                         └──────────┬──────────┘
                                    │
                               HTTP / REST
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       FastAPI       │
                         │       Backend       │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌────────────┐     ┌────────────┐     ┌──────────────┐
          │   MySQL    │     │ ML Model   │     │ External APIs│
          │  Database  │     │            │     │              │
          └────────────┘     └────────────┘     └──────────────┘

# Folder Structure

BACKEND/
│
├── app/
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── security.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   └── database.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── price.py
│   │   └── prediction.py
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── prices.py
│   │   └── predictions.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── price.py
│   │   └── prediction.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── product_service.py
│   │   ├── price_service.py
│   │   └── ml_service.py
│   │
│   ├── __init__.py
│   └── main.py
│
├── tests/
│
├── .env
├── .gitignore
├── requirements.txt
└── README.md