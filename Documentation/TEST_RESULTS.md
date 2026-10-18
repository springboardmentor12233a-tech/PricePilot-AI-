# Test Results

Date: 2026-10-19

## Post-repair verification

- Backend pytest: 19 passed, 11 warnings.
- Frontend lint: passed (TypeScript no-emit check).
- Frontend production build: passed; Vite transformed 2,747 modules.
- Frontend dependency tree: passed.
- Alembic history: passed with three ordered revisions.
- Alembic offline SQL generation: passed.
- Git diff whitespace check: passed.

Commands: backend tests used BACKEND/venv/Scripts/python.exe -B -m pytest -p no:cacheprovider; frontend checks used npm.cmd run lint, npm.cmd run build, and npm.cmd ls --depth=0; migrations used python -B -m alembic history --verbose and python -B -m alembic upgrade head --sql from BACKEND.

Backend tests use the in-memory SQLite fixture. Alembic was run offline; no live PostgreSQL database was contacted. The frontend build used local environment settings, so its compiled API URL is local-development configuration.

## Provider checks

- Gemini: the previous hard-coded model returned HTTP 404. The configured current Gemini model returned non-empty text after raising the minimal probe token limit.
- xAI: the Responses request shape and current Grok model were checked. Generation returned HTTP 403 because the account had exhausted its available credits or spending limit. Successful generation remains unverified.
- No provider key or account identifier is included here.

## Demand model

The fitted artifact produced finite predictions using 25 raw features and excludes Units Ordered. Evaluation on the chronological final 15% of unique dates (11,400 rows) measured R-squared 0.7861, MAE 14.7932, and RMSE 20.7713.
