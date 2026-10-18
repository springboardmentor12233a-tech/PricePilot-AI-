# Remaining Issues

These items remain unresolved or unverified.

## Access policy

- Define authorization for GET /api/v1/users, GET /api/v1/users/{id}, and PUT /api/v1/users/{id}. Current behavior permits broad user listing and cross-user profile changes; define self, organization-admin, and global-admin rules before narrowing these routes.
- Add refresh-token rotation, revocation, and logout behavior. Login issues refresh tokens, but no refresh lifecycle endpoint exists.

## Deployment and integrations

- Set production CORS_ORIGINS to a JSON list of approved frontend origins.
- Set production VITE_API_BASE_URL to the deployed backend origin; the current local file points to loopback.
- Retry xAI generation when the account has available credits or its spend limit is raised. The live call returned HTTP 403 for exhausted credits/spending limit.
- Verify against the deployment PostgreSQL database. Automated tests use SQLite; migrations were checked through history and offline SQL generation only.
- Run a dependency vulnerability scan; npm audit was not run.
- Add deployment configuration and CI checks if automatic deployment is intended; no manifest or workflow was found.
- Add database readiness reporting if orchestration needs readiness rather than the current liveness check.
