# PricePilot AI — Frontend

Next.js + Tailwind + Recharts frontend for the PricePilot AI dynamic pricing
and revenue intelligence platform.

## Setup

```bash
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at your FastAPI backend
npm run dev
```

Open http://localhost:3000. Every page works immediately on **demo data** even
with no backend running — once your FastAPI server responds on the routes
below, each page swaps live data in automatically (see the "API connected" /
"Demo data" pill in the top bar).

## Pages

| Route           | Page                                             |
|------------------|---------------------------------------------------|
| `/login`         | Auth                                               |
| `/`              | Executive dashboard (KPIs, revenue/units trend)    |
| `/pricing`       | Price prediction (current vs. optimal vs. competitor) |
| `/forecasting`   | Demand forecasting (6 horizons, confidence score)  |
| `/insights`      | AI insights & alerts feed + copilot chat           |
| `/reports`       | BI report generator                                |

## Backend contract

This frontend calls the following routes (`lib/api.js`). Point your FastAPI
app at these paths — or edit `lib/api.js` to match your actual routes, it's
the single file every page goes through.

```
POST /api/v1/auth/login            { email, password } -> { access_token }
GET  /api/v1/auth/me

GET  /api/v1/dashboard/kpis
GET  /api/v1/dashboard/sales-trend?range=90d
GET  /api/v1/products

GET  /api/v1/price/predict/{product_id}
GET  /api/v1/price/recommendations

POST /api/v1/forecast/demand               { product_id, horizon }
GET  /api/v1/forecast/demand/{id}/all-horizons

GET  /api/v1/competitor/{product_id}
POST /api/v1/revenue/simulate

GET  /api/v1/ai/insights
POST /api/v1/ai/ask                        { question }

POST /api/v1/reports/generate              { type, format, range }
GET  /api/v1/reports

GET  /health                               -> used only for the "API connected" status pill
```

## Design tokens

Primary teal `#0B6E5C`, gold accent `#C8922B` (price/revenue numbers), status
colors green/amber/red for demand trend + confidence. Defined in
`tailwind.config.js` — change there to re-theme everything at once.
