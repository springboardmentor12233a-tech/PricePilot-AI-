# PricePilot AI --- Frontend

> AI-powered Dynamic Pricing Optimization & Revenue Intelligence
> Platform

PricePilot AI is a modern web application for intelligent pricing,
demand forecasting, competitor intelligence, revenue optimization, and
pricing analytics.

This repository contains the **frontend application** built with React
and Vite. It communicates with the PricePilot AI FastAPI backend through
REST APIs.

------------------------------------------------------------------------

## Features

-   Authentication and protected routes
-   Organization-aware application
-   Product catalog and category management
-   Inventory management
-   Competitor management
-   Competitor product matching
-   Competitor price monitoring
-   Price comparison
-   Pricing prediction
-   Pricing recommendations
-   Demand forecasting
-   Revenue optimization
-   Pricing analytics
-   Executive dashboard
-   Responsive mobile/tablet/desktop UI
-   Accessibility-focused UX
-   Privacy Policy, Terms of Service, and Cookie Policy
-   Cookie consent and preference management
-   Data-minimization and transparent UX principles

------------------------------------------------------------------------

## Application Routes

  Module                 Route
  ---------------------- -------------------------
  Login                  `/login`
  Dashboard              `/dashboard`
  Products               `/products`
  Categories             `/categories`
  Inventory              `/inventory`
  Competitors            `/competitors`
  Demand Forecasting     `/forecasting`
  Pricing Intelligence   `/pricing`
  Revenue Optimization   `/revenue-optimization`
  Pricing Analytics      `/pricing-analytics`
  Profile                `/profile`
  Privacy Policy         `/privacy-policy`
  Terms of Service       `/terms-of-service`
  Cookie Policy          `/cookie-policy`

------------------------------------------------------------------------

## Technology Stack

### Frontend

-   React 19
-   Vite
-   JavaScript / JSX
-   React Router
-   Tailwind CSS
-   Axios
-   Recharts
-   Lucide React
-   Motion

### Backend Integration

-   FastAPI
-   REST APIs
-   PostgreSQL
-   SQLAlchemy
-   Server-side ML inference

The frontend does not execute the XGBoost model directly in the browser.
ML inference is performed by the backend.

------------------------------------------------------------------------

## Architecture

``` text
Browser
   |
   v
React Application
   |
   +-- Components
   +-- Layouts
   +-- Feature Modules
   +-- Hooks
   +-- Utilities
   |
   v
Axios API Client
   |
   v
FastAPI Backend
   |
   +-- Authentication
   +-- Products
   +-- Inventory
   +-- Competitors
   +-- Pricing
   +-- Forecasting
   +-- Analytics
   |
   v
PostgreSQL + ML Services
```

The frontend is organized around business domains so that features can
evolve independently while sharing common UI, layouts, services, and
utilities.

------------------------------------------------------------------------

## Project Structure

``` text
frontend/
|
+-- public/
|   +-- favicon.svg
|   +-- favicon-16x16.png
|   +-- favicon-32x32.png
|   +-- apple-touch-icon.png
|
+-- src/
|   |
|   +-- components/
|   |   +-- Global UI components
|   |
|   +-- hooks/
|   |   +-- Global custom hooks
|   |
|   +-- layouts/
|   |   +-- DashboardLayout
|   |   +-- Sidebar
|   |   +-- Other layouts
|   |
|   +-- utils/
|   |   +-- Global utilities
|   |
|   +-- features/
|       |
|       +-- authentication/
|       +-- dashboard/
|       +-- products/
|       +-- competitors/
|       +-- forecasting/
|       +-- pricing/
|       +-- revenue-optimization/
|       +-- pricing-analytics/
|       +-- legal/
|
+-- index.html
+-- package.json
+-- vite.config.*
+-- .env.example
+-- .gitignore
+-- README.md
```

Feature-specific business logic should remain inside the relevant
`features/` directory.

------------------------------------------------------------------------

## API Integration

Configure the FastAPI backend through an environment variable:

``` env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Authentication

``` text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/token
GET  /api/v1/auth/me
```

### Users

``` text
GET /api/v1/users/
GET /api/v1/users/{user_id}
PUT /api/v1/users/{user_id}
```

### Organizations

``` text
GET  /api/v1/organizations/
POST /api/v1/organizations/
GET  /api/v1/organizations/{org_id}
POST /api/v1/organizations/{org_id}/members
```

### Categories

``` text
POST /api/v1/categories/
GET  /api/v1/categories/organization/{org_id}
```

### Products

``` text
POST   /api/v1/products/
GET    /api/v1/products/organization/{org_id}
GET    /api/v1/products/{product_id}
PUT    /api/v1/products/{product_id}
DELETE /api/v1/products/{product_id}
POST   /api/v1/products/{product_id}/variants
GET    /api/v1/products/{product_id}/inventory
PUT    /api/v1/products/{product_id}/inventory
```

### Competitors

``` text
POST /api/v1/competitors/
GET  /api/v1/competitors/organization/{org_id}
PUT  /api/v1/competitors/{competitor_id}
POST /api/v1/competitors/match
POST /api/v1/competitors/prices
GET  /api/v1/competitors/product/{product_id}/prices
```

### Pricing

``` text
POST /api/v1/pricing/predict
POST /api/v1/pricing/recommendations
POST /api/v1/pricing/recommendations/{recommendation_id}/apply
GET  /api/v1/pricing/history/{product_id}
```

### Sales

``` text
POST /api/v1/sales/
GET  /api/v1/sales/analytics/{organization_id}
```

### AI

``` text
POST /api/v2/ai/gemini
POST /api/v2/ai/grok
POST /api/v2/ai/predict
```

### System

``` text
GET /
GET /health
```

------------------------------------------------------------------------

## Installation

### Prerequisites

-   Node.js 22+
-   npm
-   Git
-   Running PricePilot AI FastAPI backend for API-dependent
    functionality

Check versions:

``` bash
node -v
npm -v
```

Clone the repository:

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd PRICEPILOT_AI/frontend
```

Install dependencies:

``` bash
npm install
```

------------------------------------------------------------------------

## Environment Configuration

Create a local environment file from `.env.example`.

Example:

``` env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For production:

``` env
VITE_API_BASE_URL=https://your-api-domain.example
```

Never place database passwords, JWT secrets, private API keys, or other
server secrets in `VITE_*` variables because Vite exposes them to
browser code.

------------------------------------------------------------------------

## Running Locally

Start the frontend:

``` bash
npm run dev
```

The development server is configured for:

``` text
http://localhost:3000
```

Start the backend separately and verify:

``` text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/health
```

------------------------------------------------------------------------

## Production Build

Build:

``` bash
npm run build
```

Preview:

``` bash
npm run preview
```

The production output is generated in:

``` text
dist/
```

------------------------------------------------------------------------

## Responsive Design

The interface is designed for:

### Mobile

``` text
320px
360px
375px
390px
414px
480px
```

### Tablet

``` text
768px
820px
912px
1024px
```

### Desktop

``` text
1280px
1366px
1440px
1536px
1920px
2560px
```

Responsive behavior includes:

-   Mobile navigation drawer
-   Responsive sidebar
-   Flexible grids
-   Responsive forms
-   Scrollable data tables where necessary
-   Responsive Recharts visualizations
-   Mobile-friendly dialogs
-   Touch-friendly controls
-   Responsive legal pages
-   No intentional page-level horizontal overflow

------------------------------------------------------------------------

## Security

The frontend follows security-conscious practices including:

-   No hardcoded secrets
-   No passwords in frontend storage
-   No private API credentials in source code
-   Protected routes
-   Centralized API communication
-   Controlled API error presentation
-   No unnecessary sensitive logging
-   Avoidance of unsafe HTML injection
-   Client-side validation for user experience
-   Duplicate-submission prevention
-   Environment-based API configuration
-   Safe external links where applicable

The backend remains authoritative for:

-   Authentication
-   Authorization
-   Organization isolation
-   Role-based access control
-   Server-side validation
-   Rate limiting
-   CORS
-   Security headers
-   TLS
-   Database security
-   Audit logging

Frontend permission checks are UX controls, not security boundaries.

------------------------------------------------------------------------

## Privacy and Consent

The frontend includes:

``` text
/privacy-policy
/terms-of-service
/cookie-policy
```

It also provides cookie-consent and preference controls where
applicable.

The privacy UX follows data-minimization principles:

-   Collect only information required by the feature
-   Avoid unnecessary tracking
-   Keep optional consent separate from required service terms
-   Avoid preselected marketing consent
-   Provide transparent legal links
-   Allow cookie preferences to be revisited

These pages and UI controls do not by themselves establish legal
compliance. Final legal documents should reflect the actual business,
data-processing practices, jurisdictions, vendors, retention rules, and
applicable law.

------------------------------------------------------------------------

## Accessibility

Accessibility considerations include:

-   Semantic HTML
-   Keyboard navigation
-   Visible focus indicators
-   Form labels
-   Accessible dialogs
-   Appropriate ARIA usage
-   Responsive typography
-   Color contrast
-   Non-color status indicators
-   Reduced-motion support where appropriate
-   Touch-friendly controls

The target is WCAG 2.2 AA-level accessibility practices where
applicable.

------------------------------------------------------------------------

## Performance and Scalability

The frontend is designed to work with a horizontally scalable backend.

``` text
                CDN
                 |
                 v
          React Frontend
                 |
               HTTPS
                 |
                 v
          Load Balancer
                 |
       +---------+---------+
       |         |         |
       v         v         v
    FastAPI   FastAPI   FastAPI
       |         |         |
       +---------+---------+
                 |
            Redis/Cache
                 |
             PostgreSQL
                 |
           ML Inference
```

Frontend performance practices include:

-   Route-level lazy loading where appropriate
-   Avoidance of duplicate API requests
-   Responsive chart rendering
-   Loading and empty states
-   Controlled request frequency
-   Pagination readiness
-   Large-table considerations
-   Efficient component rendering
-   Avoidance of unnecessary browser-side ML execution

### 1000+ concurrent users

The frontend is intended to be compatible with a production architecture
targeting 1000+ concurrent users.

This is **not a claim that 1000+ users have been load-tested**.

Actual capacity depends on the complete infrastructure, including
FastAPI workers, PostgreSQL, caching, ML inference, networking, load
balancing, and deployment configuration.

------------------------------------------------------------------------

## Error Handling

The application should handle:

``` text
400
401
403
404
422
429
500
502
503
Network timeout
```

User-facing errors should be understandable.

Internal details such as database errors, stack traces, file paths, or
server internals should not be exposed to normal users.

------------------------------------------------------------------------

## Pricing and AI Transparency

PricePilot AI provides AI-assisted decision support.

The interface distinguishes between:

``` text
Prediction
Forecast
Recommendation
Historical Observation
Actual Revenue
Estimated Revenue
Estimated Gross Profit
Model Evaluation Metric
```

AI outputs should not be represented as guaranteed business outcomes.

Examples:

``` text
Predicted Demand
Estimated Revenue
Recommended Price
Estimated Gross Profit
```

Model evaluation metrics such as R² should not be presented as live
prediction confidence.

------------------------------------------------------------------------

## Testing Checklist

### Authentication

-   [ ] Register
-   [ ] Login
-   [ ] Logout
-   [ ] Protected routes
-   [ ] Unauthorized handling

### Products

-   [ ] Create product
-   [ ] View products
-   [ ] Edit product
-   [ ] Delete product
-   [ ] Categories
-   [ ] Inventory

### Competitors

-   [ ] Create competitor
-   [ ] Edit competitor
-   [ ] Match competitor product
-   [ ] Add competitor price
-   [ ] View price history

### Pricing

-   [ ] Price prediction
-   [ ] Pricing recommendation
-   [ ] Apply recommendation
-   [ ] Pricing history

### Forecasting

-   [ ] Product selection
-   [ ] Forecast controls
-   [ ] Demand prediction
-   [ ] Trend display
-   [ ] Forecast visualization

### Revenue

-   [ ] Scenario inputs
-   [ ] Expected revenue
-   [ ] Expected gross profit
-   [ ] Gross margin
-   [ ] Recommendation comparison

### Analytics

-   [ ] Pricing analytics
-   [ ] Product analysis
-   [ ] Competitor analysis
-   [ ] Revenue analysis
-   [ ] Export/print where supported

### Responsive UI

-   [ ] 320px
-   [ ] 375px
-   [ ] 414px
-   [ ] 768px
-   [ ] 1024px
-   [ ] 1280px
-   [ ] 1440px
-   [ ] 1920px

### Privacy and accessibility

-   [ ] Privacy Policy
-   [ ] Terms of Service
-   [ ] Cookie Policy
-   [ ] Cookie Preferences
-   [ ] Keyboard navigation
-   [ ] Focus states
-   [ ] Color contrast
-   [ ] Mobile accessibility
-   [ ] No unnecessary tracking
-   [ ] No unnecessary personal data collection

------------------------------------------------------------------------

## Development Guidelines

Keep global UI inside:

``` text
src/components/
```

Keep business-domain code inside:

``` text
src/features/
```

Example:

``` text
features/
└── pricing/
    ├── components/
    ├── hooks/
    ├── services/
    └── utils/
```

Avoid placing feature-specific business logic inside global components.

------------------------------------------------------------------------

## Git Workflow

Check changes:

``` bash
git status
```

Stage:

``` bash
git add .
```

Commit:

``` bash
git commit -m "feat: update frontend"
```

Push:

``` bash
git push origin main
```

Feature branch example:

``` bash
git checkout -b feature/pricing-analytics
```

Recommended commit style:

``` text
feat: add competitor price comparison
fix: resolve mobile sidebar overflow
refactor: improve pricing API service
docs: update frontend README
```

------------------------------------------------------------------------

## Deployment

Typical deployment flow:

``` text
GitHub
   |
   v
CI/CD
   |
   v
npm install
   |
   v
npm run build
   |
   v
dist/
   |
   v
CDN / Static Hosting
```

Configure the production API through:

``` env
VITE_API_BASE_URL=https://your-api-domain.example
```

Do not expose backend secrets in the frontend build.

------------------------------------------------------------------------

## Important Limitations

The frontend does not independently provide:

-   Database security
-   Backend authorization
-   Server-side validation
-   Rate limiting
-   DDoS protection
-   Database replication
-   Load balancing
-   Redis infrastructure
-   ML infrastructure scaling
-   Production TLS
-   Server-side security headers
-   Legal compliance certification

These require backend, infrastructure, operational, and/or legal
implementation.

------------------------------------------------------------------------

## Future Improvements

Potential future work:

-   Advanced frontend caching
-   Server-side pagination across all large datasets
-   Real-time competitor monitoring
-   WebSocket notifications
-   Advanced forecast visualization
-   Advanced pricing simulations
-   Explainability views
-   Role-specific dashboards
-   Audit-log UI
-   Notification center
-   Observability
-   Automated unit testing
-   End-to-end testing
-   Load testing
-   CI/CD automation
-   CDN optimization

------------------------------------------------------------------------

## License

Add the project's actual license before publishing.

Example:

``` text
MIT License
```

Do not claim a license unless the repository has actually been released
under that license.

------------------------------------------------------------------------

## Author

### Aditya Raj Pandey

B.Tech --- Computer Science & Engineering\
Specialization --- Artificial Intelligence & Machine Learning

Areas of interest:

-   Full Stack Development
-   Artificial Intelligence
-   Machine Learning
-   Data Science
-   Dynamic Pricing
-   Revenue Intelligence
-   Software Engineering

------------------------------------------------------------------------

## Project Status

PricePilot AI frontend includes:

-   Authentication
-   Product Management
-   Inventory
-   Competitor Intelligence
-   Pricing Intelligence
-   Demand Forecasting
-   Revenue Optimization
-   Pricing Analytics
-   Executive Dashboard
-   Responsive UI
-   Accessibility improvements
-   Privacy and consent UX
-   Production-oriented frontend hardening

The frontend depends on the corresponding FastAPI backend for live
business data, authentication, machine-learning inference, pricing
operations, and analytics.

------------------------------------------------------------------------

# PricePilot AI

**Dynamic Pricing Optimization & Revenue Intelligence System**

``` text
Analyze → Predict → Compare → Optimize → Decide
```
