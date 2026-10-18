# PricePilot AI Repository Audit Report

Date: 2026-10-19

## Scope and architecture

Reviewed the React/Vite frontend, FastAPI and SQLAlchemy backend, organization-scoped product/competitor/pricing/sales routes, authentication, Gemini and xAI integrations, XGBoost artifact, tests, dependencies, Alembic history, environment tracking, and project documentation.

The frontend calls the FastAPI backend. The backend uses SQLAlchemy and Alembic, external Gemini and xAI services, and a local demand model. The Streamlit tester loads the canonical artifact from ML_MODEL/model_training.

## Repairs

- Fixed the frontend production build command.
- Added configurable provider model defaults; Gemini settings are now consumed.
- Switched backend inference to a versioned copy of the fitted canonical artifact, validated estimator and preprocessor fit, removed fabricated predictions, returned artifact version metadata, and mapped model faults to safe 503 responses.
- Fixed competitor form fields to match the API and enforced product/competitor organization consistency.
- Restricted member creation to owners/admins and owner-role assignment to owners.
- Validated pricing margins and prices, variant ownership, required cost, currency-compatible competitor averages, and inventory failures.
- Validated positive sale quantity/prices, sale organization and variant ownership; inventory errors now abort the sale.
- Removed wildcard credentialed CORS and client-visible exception text.
- Matched frontend AI timeouts to provider timeouts and treat empty provider output as failure.
- Gated test-account autofill to development mode and explicitly configured credentials.
- Replaced import-time model inference with a fitted-artifact test and added tenant-boundary regressions.
- Pinned model runtime packages, added Alembic, corrected stale model claims, and added test results and remaining-issues documents.
- Staged FRONTEND/.env for removal from tracking while preserving the local file. Its inspected content was local API configuration and placeholder test values; no provider keys were present.

## Verified demand model

The canonical artifact and backend copy are fitted. The model predicts Demand, uses 25 raw features, excludes Units Ordered, and transforms one row to 63 columns. On the chronological final 15% of unique dates (11,400 records), R-squared is 0.7861, MAE is 14.7932, and RMSE is 20.7713. These are holdout metrics, not live confidence values or optimal-price predictions.

## Security and deployment

Production must provide CORS_ORIGINS as a JSON list of approved frontend origins and VITE_API_BASE_URL for the deployed backend. Local build verification used the local frontend environment.

User listing and profile endpoints still permit broad/cross-user access; define the global-admin, organization-admin, and self-service policy before narrowing them. Refresh tokens are issued without a refresh/rotation/revocation/logout lifecycle. A live PostgreSQL check, successful xAI generation with available credits, production-origin configuration, and dependency vulnerability scan remain unverified. No deployment manifest or CI workflow was found. The health endpoint is liveness-only.
