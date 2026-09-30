# PricePilot AI — Production Frontend Application

Welcome to the **PricePilot AI** Frontend Application. This modern, production-grade Next.js (App Router) dashboard provides merchandisers, revenue managers, and retail analysts with autonomous pricing recommendations, multi-horizon demand forecasts, revenue optimization curves, internal digital-channel benchmarks, and generative merchandising insights.

---

## 🏗️ Architecture Overview

The system operates via a strict decoupling of ML models and client interfaces:

```
User (Browser)
   │
   ▼ HTTP (Fetch Client /api/*)
Next.js Frontend (Port 3000)
   │
   ▼ REST API
FastAPI Backend (Port 8000)
   │
   ▼
PricePilot Analytics & ML Engines:
  ├── Random Forest Price Clearing Engine (models/price)
  ├── LightGBM Autoregressive Demand Forecaster (models/demand)
  ├── Coupled Expected Revenue Maximizer (models/revenue)
  ├── Internal Digital Benchmark & Category Peer Dispersion (models/competitor)
  └── Google Gemini GenAI Merchandising Insights (with Offline Fallback)
```

> **Data Integrity Notice**:
> Online benchmarks are sourced from `online.csv` and strictly designated as **"Internal Digital-Channel Benchmark"** (e-commerce sister store) and never misrepresented as external competitor crawlers.

---

## 📦 Prerequisites

- **Node.js**: v18.17.0+ or v20+ (tested on Node v24)
- **npm**: v9+ (or pnpm / yarn)
- **Python**: 3.10+ (for the FastAPI backend in `backend/`)

---

## 🚀 Quick Start Guide

### 1. Configure Environment Variables

In `frontend/`, create `.env.local` (or copy from `.env.example`):

```bash
cp .env.example .env.local
```

Content:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The frontend will run locally on [http://localhost:3000](http://localhost:3000).

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 🌐 Available Pages & Features

| Route | Page Name | Primary Features | Connected Backend API |
| :--- | :--- | :--- | :--- |
| `/dashboard` (or `/`) | **Executive Dashboard** | Realized revenue, unit volumes, avg reference vs recommended prices, benchmark distribution, opportunity breakdown | `GET /api/dashboard/summary` |
| `/pricing` | **Pricing Engine** | Reference price, model clearing price, recommended target, alignment scores, candidate price grid chart & table | `GET /api/pricing` |
| `/demand` | **Demand Forecast** | 7, 14, and 30-day forecast horizon selector, trend classification, historical comparison, daily trajectory chart | `GET /api/demand` |
| `/revenue` | **Revenue Optimization** | Reference vs Clearing vs Revenue-Optimal comparison, revenue curve chart across prices, candidate revenue table | `GET /api/revenue` |
| `/competitor` | **Market & Benchmark** | Internal digital benchmark (online.csv), cross-store dispersion, category peer percentiles, opportunity signals | `GET /api/competitor` |
| `/insights` | **AI Merchandising Insights** | Executive summary, pricing rationale, demand elasticity, risk safeguards, actionable checklist (Gemini live/offline) | `GET /api/insights` |

---

## 🔌 API Client (`frontend/lib/api.ts`)

All communication is routed through a single typed API client:

```typescript
import { api } from '@/lib/api';

// Example: Fetch pricing recommendation
const pricing = await api.getPricingRecommendation({
  item_id: '293375605257',
  store_id: 1,
});

// Example: Fetch multi-horizon demand
const demand = await api.getDemandForecast({
  item_id: '293375605257',
  store_id: 1,
  horizon: 14,
});
```

### Robust Error & Status Handling
- **Backend Disconnect**: Automatically alerts user if backend on port 8000 is unreachable without crashing.
- **Offline Fallback**: Displays honest offline badges when deterministic heuristic engine runs instead of live Gemini.
- **Data Validation**: Handles 422, 404, and 500 responses with clear user-friendly guidance.
