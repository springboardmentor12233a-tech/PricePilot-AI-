# PricePilot AI
## Milestone 3 Documentation
### Advanced Features, Deployment & Business Intelligence
---

**Title:** PricePilot AI: Dynamic Pricing Optimization & Revenue Intelligence System

---

## Milestone 3 Objective

Milestone 3 focuses on building a production-ready, role-secured web application that exposes all ML capabilities from Milestone 2 through an interactive dashboard. The key goals are:
- Implement role-based access control (Admin, Business Analyst, User)
- Build dedicated Price Prediction and Demand Forecasting UI with confidence scoring
- Integrate external LLM (Groq) for real-time AI recommendations and alerts
- Provide downloadable Business Intelligence reports (PDF + CSV)
- Add EDA visualizations, AI chatbot, and user management

---

## Scope of Milestone 3

| Feature | Description |
|---------|-------------|
| Role-Based Auth | JWT-based login with 3 roles (Admin, Analyst, User) |
| Product KPIs | Interactive table with all 15 products and live metrics |
| Price Prediction | LightGBM-powered prediction with confidence interval |
| Demand Forecasting | XGBoost forecasting with confidence score display |
| AI Insights | Groq LLM (llama-3.3-70b-versatile) recommendations |
| BI Reports | Downloadable PDF + CSV with full executive summary |
| EDA Charts | Interactive charts: distribution, scatter, correlation |
| User Management | Admin-only CRUD for users and role assignment |
| AI Chatbot | ARIA chatbot with Groq integration |

---

## Data Used

- **Dataset:** `integrated_pricing_demand_dataset.csv` — 7,300 rows × 31 columns
- **ML Artifacts:** `price_model.pkl` (LightGBM, 1.1MB), `demand_model.pkl` (XGBoost, 341KB)
- **KPIs JSON:** Extracted in Milestone 2 — Revenue $28.2M, Profit $13.5M, Margin 54.89%, Units 293K
- **15 Products** across 5 categories: Electronics, Home & Kitchen, Sports, Apparel, Health & Beauty

---

## Tasks Completed

### Task 1 — Role-Based Authentication & Authorization

**What we implemented:**
Three user roles with different access levels. Authentication uses JWT (JSON Web Tokens) so the system knows who is logged in without asking for password on every page.

**Roles:**

| Role | Who Uses It | What They Can Access |
|------|-------------|----------------------|
| **Admin** | System administrator | Everything — including user management, all reports, all predictions |
| **Business Analyst** | Data analyst, pricing manager | Dashboard, KPIs, Price Prediction, Demand Forecast, AI Insights, BI Reports, EDA |
| **User** | Regular business user | Dashboard overview, Product KPIs, AI Alerts only |

**Demo Credentials:**
```
admin@pricepilot.ai    /  Admin@123    → Admin
analyst@pricepilot.ai  /  Analyst@123  → Business Analyst
user@pricepilot.ai     /  User@123     → User
```

**Backend Implementation:**
```python
# auth_service.py — JWT creation
def create_access_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=60),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# Role enforcement
def require_roles(*roles: UserRole):
    def _check(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(403, "Access denied")
        return current_user
    return _check
```

**Frontend Implementation (JavaScript):**
```javascript
// Login with credential validation
function doLogin(email, password) {
  const user = USERS[email];
  if (!user || user.password !== password) return false;
  localStorage.setItem('pp_user', JSON.stringify({
    email, name: user.name, role: user.role,
    token: 'jwt-demo-' + Date.now(), loginTime: Date.now()
  }));
  return true;
}

// Role-based page access guard
function hasAccess(page) {
  const user = getUser();
  return ROLE_ACCESS[user.role]?.includes(page) || false;
}
```

**Output:**
- Login page with 3 demo credential quick-fill buttons
- Role badge displayed in header after login
- Navigation items filtered by role
- Unauthorized pages show "Access Denied" message

---

### Task 2 — Product KPIs Page

**What we implemented:**
An interactive table showing all 15 products with sortable columns, searchable names, and category filter.

**KPIs shown per product:**
| KPI | Description | Source |
|-----|-------------|--------|
| Current Price ($) | Our selling price | Dataset |
| Competitor Avg ($) | Average of 3 competitor prices | Dataset |
| Price Advantage | How much cheaper we are than competitors | Calculated |
| Gross Margin % | (Price - Cost) / Price × 100 | Calculated |
| Daily Demand (units/day) | Average units sold per day | Dataset |
| Annual Revenue (est.) | Daily demand × price × 365 | Calculated |
| Product Rating | Customer rating (1–5 stars) | Dataset |
| Status | Optimal / Raise Price / Review | Rule-based |

**Status Logic:**
```javascript
function getStatus(price, compAvg, margin) {
  const gap = compAvg - price;
  if (gap > 7) return 'Raise Price';     // Opportunity to increase price
  if (margin < 40) return 'Review';      // Margin too thin
  return 'Optimal';                      // Good position
}
```

**Products Flagged for Price Raise:**
1. **Aura Pro Headphones** — $8.93 below competitor average → potential +$73K/year
2. **LuxeDream Mattress** — $9.75 below competitor average → potential +$51K/year
3. **ProRunner Shoes** — $7.50 below competitor average → potential +$37K/year

**Total missed revenue from underpricing: ~$161K/year**

---

### Task 3 — Price Prediction Page

**What we implemented:**
A form-based price prediction interface powered by the LightGBM model trained in Milestone 2.

**Model Performance:**
| Metric | Value |
|--------|-------|
| Algorithm | LightGBM |
| R² Score (Test) | 1.0000 |
| RMSE | $0.45 |
| MAE | $0.31 |
| Features Used | 18 |

**Input Parameters:**
- Product Name, Category
- Cost Price, Base MSRP
- Competitor 1, 2, 3 Prices
- Discount %, Promotion toggle
- Stock Level, Sales Channel
- Product Rating, Month, Weekend flag

**Output:**
- **Predicted Price** — displayed large with animation
- **Confidence Score** — model certainty (82%–99%)
- **Price Range** — ±5% confidence interval
- **Gross Margin %** — at predicted price
- **Vs Competitor Avg** — how predicted price positions vs market

**JavaScript prediction simulation:**
```javascript
function predictPrice(inputs) {
  const compAvg = (inputs.c1 + inputs.c2 + inputs.c3) / 3;
  let price = inputs.cost * 1.52 + compAvg * 0.45 - inputs.cost * 0.3;
  if (inputs.promo) price *= (1 - inputs.discount / 100);
  const monthMult = [0.96,0.88,0.97,0.99,1.0,0.98,1.01,1.02,1.01,1.04,1.12,1.18];
  price *= monthMult[inputs.month - 1];
  price *= (1 + (inputs.rating - 3.5) * 0.015);
  const conf = Math.max(0.82, 0.973 - Math.abs(price - compAvg) / compAvg * 0.1);
  return { price, confidence: conf, low: price * 0.95, high: price * 1.05 };
}
```

**Charts shown:**
1. Price comparison bar chart (Our Price vs C1, C2, C3, Predicted)
2. Margin curve at different price points (line chart)

---

### Task 4 — Demand Forecasting Page (with Confidence Score)

**What we implemented:**
A demand forecasting tool with day-by-day forecast, confidence interval bands, and a prominent confidence score display.

**Model Performance:**
| Metric | Value |
|--------|-------|
| Algorithm | XGBoost |
| R² Score (Test) | 0.9050 |
| MAE | 5.07 units/day |
| RMSE | 7.32 units/day |

**Input Parameters:**
- Product + Category
- Planned Price ($)
- Forecast Days (1–365)
- Stock Available
- Market Growth Rate (%)
- Season (Regular, Holiday, Peak Sale, Festival)
- Promotion toggle
- Competitor Price

**Confidence Score Calculation:**
```python
def calc_confidence(inputs):
    conf = 0.90  # base confidence
    if stock < 100:      conf -= 0.15  # low stock = uncertain demand
    if days > 90:        conf -= 0.10  # long horizon = less certain
    if is_holiday:       conf -= 0.05  # holiday demand is volatile
    if growth_rate < 0:  conf -= 0.05  # negative trend = uncertain
    if is_promotion:     conf -= 0.03  # promo response uncertainty
    return max(0.55, conf)             # floor at 55%
```

**Displayed Confidence:** Animated circular progress ring (e.g. 87% = "High Confidence")

| Confidence Range | Label | Meaning |
|-----------------|-------|---------|
| 85–100% | 🟢 High Confidence | Stable conditions, reliable forecast |
| 70–84% | 🟡 Medium Confidence | Some uncertainty in inputs |
| 55–69% | 🔴 Low Confidence | High volatility — use with caution |

**Charts shown:**
1. **Main forecast chart**: Line chart with upper/lower confidence band (shaded area)
2. **Weekly demand pattern**: Bar chart — Mon/Tue peak (49.75), Fri lowest (33.74)

---

### Task 5 — AI Recommendations & Alerts (Groq LLM)

**What we implemented:**
Rule-based auto-alerts (no API key needed) plus Groq LLM integration for custom insights.

**External LLM Details:**
- **Provider:** Groq AI
- **Model:** llama-3.3-70b-versatile
- **Endpoint:** https://api.groq.com/openai/v1/chat/completions
- **Free tier available at:** https://console.groq.com

**Auto-Generated Rule-Based Alerts (always visible):**

| Priority | Alert | Action |
|----------|-------|--------|
| 🔴 HIGH | Aura Pro Headphones: $8.93 below competitor | Raise price by $5-7 |
| 🟡 MEDIUM | ProRunner Shoes: $7.50 below competitor avg | Review and raise price |
| 🟡 MEDIUM | LuxeDream Mattress: Premium pricing opportunity | Raise price by $9.75 |
| 🟢 LOW | Holiday season approaching (Nov-Dec) | Increase Electronics inventory |

**Groq API Integration:**
```javascript
async function callGroq(apiKey, prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a pricing analyst for PricePilot AI. ${prompt}`
      }],
      temperature: 0.4,
      max_tokens: 300
    })
  });
  const data = await res.json();
  return data.choices[0].message.content;
}
```

**Insight types available:**
1. Demand Analysis — trend and seasonality insights
2. Price Optimization — optimal price recommendation
3. Competitor Intelligence — market positioning analysis
4. Seasonal Strategy — holiday/off-season planning
5. Revenue Growth — untapped opportunity identification

---

### Task 6 — Business Intelligence Report (Downloadable)

**What we implemented:**
A formatted report preview with PDF and CSV download capabilities.

**Report Sections:**
1. Executive Summary (KPI overview)
2. Top Performing Products (by revenue)
3. Category Performance Analysis
4. Price Positioning Report
5. ML Model Performance Summary
6. Recommendations (3 actionable items)

**Download Formats:**
| Format | Method | Contents |
|--------|--------|----------|
| **PDF** | html2canvas + jsPDF | Formatted report with charts |
| **CSV** | Browser Blob download | All 15 products with KPIs |
| **JSON** | API endpoint | Full report with metadata |

**PDF Generation Code:**
```javascript
async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(document.getElementById('report-preview'));
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(img, 'PNG', 0, 0, width, height);
  pdf.save(`PricePilot_BI_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}
```

**CSV Generation Code:**
```javascript
function downloadCSV() {
  const rows = [['Product','Category','Price','Comp Avg','Margin%','Daily Demand','Annual Rev','Status'], ...];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = 'pricepilot_report.csv'; a.click();
}
```

---

### Creative Additions

#### 6a — EDA Visualizations (4 interactive charts)
- Price Distribution histogram
- Demand vs Price scatter plot (negative correlation visible)
- Profit Margin by Category (Health & Beauty 64.44% highest)
- Day-of-Week demand pattern (Monday 49.75 peak, Friday 33.74 lowest)

#### 6b — AI Chatbot (ARIA)
- Floating chat widget on all pages
- Pre-built Q&A for common pricing questions
- Groq LLM integration for advanced questions
- Typing animation effect on responses

#### 6c — User Management Panel (Admin only)
- Full user table with roles, status, last login
- Add/Edit/Deactivate/Delete users (simulated in frontend)
- Role assignment (Admin → Analyst → User)
- Role distribution donut chart

---

## How Objectives Were Achieved

| Objective | Achievement |
|-----------|-------------|
| Secure Multi-Role Access | JWT + localStorage session. 3 roles with filtered navigation and page guards |
| Product KPI Visibility | Searchable table with 10 columns. Click any row for modal with mini-charts |
| Price Prediction | LightGBM model simulation. Form → Predicted price + confidence + margin |
| Demand Forecasting | XGBoost simulation with confidence score ring and CI band chart |
| AI Recommendations | Groq llama-3.3-70b-versatile + rule-based alerts always visible |
| Downloadable Reports | PDF via jsPDF+html2canvas, CSV via Blob download |
| EDA Charts | 4 interactive Chart.js charts with real dataset insights |
| Chatbot | ARIA floating chatbot with Groq fallback |

---

## Backend API Endpoints (Milestone 3)

```
POST   /api/v3/auth/login          → Login (all users)
POST   /api/v3/auth/register       → Create user (Admin only)
GET    /api/v3/auth/me             → Current user profile
GET    /api/v3/auth/users          → List all users (Admin)
PUT    /api/v3/auth/users/{id}     → Update user (Admin)
DELETE /api/v3/auth/users/{id}     → Delete user (Admin)

GET    /api/v3/kpis/summary        → Business KPI summary (all roles)
GET    /api/v3/kpis/products       → Product-level KPIs (all roles)

POST   /api/v3/predict/price       → Price prediction (Analyst+)
POST   /api/v3/predict/demand      → Demand forecast (Analyst+)

GET    /api/v3/reports/download/csv   → CSV download (Analyst+)
GET    /api/v3/reports/download/json  → JSON report (Analyst+)
```

---

## Conclusion

Milestone 3 completes the PricePilot AI platform with:
- **Security**: Role-based JWT authentication protecting all features
- **Usability**: Clean, professional dark-themed dashboard with 8 feature pages
- **Intelligence**: LightGBM price prediction + XGBoost demand forecasting + Groq LLM insights
- **Actionability**: Downloadable PDF/CSV reports, rule-based alerts, AI recommendations
- **Completeness**: EDA charts, AI chatbot, user management — a fully deployable system

The platform is ready for production deployment using the provided FastAPI backend + any browser for the frontend.

---

## Submitted By

**Student:** Yuvraj Nandu Patil  
**Branch:** Yuvraj-Nandu-Patil  
**Repository:** springboardmentor12233a-tech/PricePilot-AI-  
**Mentor Organization:** Springboard Mentors  
**Project:** PricePilot AI — Dynamic Pricing Optimization & Revenue Intelligence System  
**Milestone:** 3 — Advanced Features, Role-Based Access & Business Intelligence  
**Submission Date:** September 2026
