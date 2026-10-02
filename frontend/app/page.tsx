"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = "http://127.0.0.1:8000";

const money = (n: number) =>
  `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(n)}`;

const number = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(n);

const roles = {
  admin: {
    label: "Admin",
    username: "admin",
    password: "admin123",
  },
  analyst: {
    label: "Analyst",
    username: "analyst",
    password: "analyst123",
  },
};

type KPI = {
  total_revenue: number;
  total_units_sold: number;
  average_selling_price: number;
  total_profit: number;
  profit_margin: number;
  monthly: {
    month: string;
    revenue: number;
    profit: number;
    units_sold: number;
  }[];
  category: {
    category: string;
    revenue: number;
    units_sold: number;
  }[];
};

type Market = {
  avg_competitor_price: number;
  avg_our_price: number;
  avg_price_gap_pct: number;
  stockout_records: number;
  avg_closing_stock: number;
  active_promotions: number;
  promotion_total: number;

  competitors: {
    product_name: string;
    category: string;
    competitor_price: number;
    our_price: number;
    price_gap_pct: number;
  }[];

  market_daily: {
    date: string;
    market_demand_index: number;
    demand_growth_rate: number;
    inflation_rate: number;
    market_search_index: number;
  }[];

  promotions: {
    promotion_type: string;
    products: number;
    avg_discount: number;
  }[];

  seasonal: {
    event_date: string;
    event_name: string;
    expected_demand_multiplier: number;
  }[];
};

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);

  const [role, setRole] = useState<
    "admin" | "analyst" | "guest" | null
  >(null);

  const [selectedRole, setSelectedRole] =
    useState<"admin" | "analyst">("admin");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [section, setSection] = useState("dashboard");
  const [forecastRange, setForecastRange] = useState<7 | 14 | 30 | 90>(7);

  const [kpi, setKpi] = useState<KPI | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [modelResults, setModelResults] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    cost_price: "18000",
    competitor_price: "23000",
    discount_pct: "10",
    units_sold: "8",
    list_price: "26000",
    market_demand_index: "1.05",
    demand_growth_rate: "0.03",
    inflation_rate: "0.05",
    category: "Headphones",
    date: "2026-07-29",
  });

  const [prediction, setPrediction] =
    useState<number | null>(null);

  const [insight, setInsight] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/pricing/kpis`).then((r) => r.json()),
      fetch(`${API}/pricing/market`).then((r) => r.json()),
      fetch(`${API}/pricing/model`).then((r) => r.json()),
    ])
      .then(([k, m, mod]) => {
        setKpi(k);
        setMarket(m);
        setModelResults(mod.models || []);
      })
      .catch(() => {});
  }, []);

  const login = (e: React.FormEvent) => {
    e.preventDefault();

    const user = roles[selectedRole];

    if (
      username === user.username &&
      password === user.password
    ) {
      setRole(selectedRole);
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials.");
    }
  };

  const guestLogin = () => {
    setRole("guest");
    setLoggedIn(true);
    setSection("dashboard");
  };

  const logout = () => {
    setLoggedIn(false);
    setRole(null);
    setUsername("");
    setPassword("");
  };

  const predict = async () => {
    setLoading(true);
    setInsight("");

    try {
      const body = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [
          k,
          ["category", "date"].includes(k)
            ? v
            : Number(v),
        ])
      );

      const res = await fetch(
        `${API}/pricing/insight`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      setPrediction(data.predicted_price);
      setInsight(data.ai_insight || "");
    } catch {
      setInsight(
        "Unable to reach the pricing engine. Check that FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DOWNLOAD REPORT
     ========================= */

  const downloadReport = () => {
    const generatedDate =
      new Date().toLocaleString("en-IN");

    const competitorRows =
      market?.competitors
        ?.map(
          (c) => `
            <tr>
              <td>${c.product_name}</td>
              <td>${c.category}</td>
              <td>${money(c.our_price)}</td>
              <td>${money(c.competitor_price)}</td>
              <td>${c.price_gap_pct.toFixed(2)}%</td>
            </tr>
          `
        )
        .join("") || "";

    const categoryRows =
      kpi?.category
        ?.map(
          (c) => `
            <tr>
              <td>${c.category}</td>
              <td>${money(c.revenue)}</td>
              <td>${number(c.units_sold)}</td>
            </tr>
          `
        )
        .join("") || "";

    const modelRows =
      modelResults
        ?.map(
          (m) => `
            <tr>
              <td>${m.Model}</td>
              <td>${Number(m.MAE).toFixed(2)}</td>
              <td>${Number(m.RMSE).toFixed(2)}</td>
              <td>${Number(m.R2).toFixed(3)}</td>
            </tr>
          `
        )
        .join("") || "";

    const pricingSection =
      prediction !== null
        ? `
          <h2>AI Pricing Recommendation</h2>

          <div class="pricing-box">
            <div class="recommendation">
              ${money(prediction)}
            </div>

            <p><b>Category:</b> ${form.category}</p>
            <p><b>Cost Price:</b> ${money(
              Number(form.cost_price)
            )}</p>
            <p><b>Competitor Price:</b> ${money(
              Number(form.competitor_price)
            )}</p>
            <p><b>List Price:</b> ${money(
              Number(form.list_price)
            )}</p>
            <p><b>Discount:</b> ${
              form.discount_pct
            }%</p>
            <p><b>Units Sold:</b> ${
              form.units_sold
            }</p>
            <p><b>Demand Index:</b> ${
              form.market_demand_index
            }</p>
            <p><b>Demand Growth:</b> ${
              form.demand_growth_rate
            }</p>
            <p><b>Inflation Rate:</b> ${
              form.inflation_rate
            }</p>

            ${
              insight
                ? `
                  <div class="insight">
                    <b>AI Insight</b>
                    <p>${insight}</p>
                  </div>
                `
                : ""
            }
          </div>
        `
        : `
          <h2>AI Pricing Recommendation</h2>
          <p>No pricing recommendation has been generated yet.</p>
        `;

    const report = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<title>PricePilot AI Report</title>

<style>

* {
  box-sizing: border-box;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 40px;
  color: #172033;
  background: #ffffff;
  line-height: 1.5;
}

.container {
  max-width: 1100px;
  margin: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.logo {
  font-size: 30px;
  font-weight: 800;
  color: #172033;
}

.logo span {
  color: #2563eb;
}

.subtitle {
  color: #667085;
  margin-top: 4px;
}

.date {
  color: #667085;
  font-size: 13px;
}

h2 {
  color: #172033;
  margin-top: 35px;
  margin-bottom: 15px;
  border-bottom: 1px solid #d9e1ee;
  padding-bottom: 8px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.card {
  border: 1px solid #d9e1ee;
  border-radius: 10px;
  padding: 18px;
  background: #f8faff;
}

.card-title {
  color: #667085;
  font-size: 13px;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  margin-top: 8px;
  color: #172033;
}

.card-hint {
  font-size: 12px;
  color: #16a34a;
  margin-top: 5px;
}

.pricing-box {
  border: 1px solid #cdd9ed;
  border-radius: 10px;
  padding: 25px;
  background: #f8faff;
}

.recommendation {
  font-size: 36px;
  font-weight: 800;
  color: #2563eb;
  margin-bottom: 20px;
}

.insight {
  margin-top: 20px;
  padding: 18px;
  background: #eef4ff;
  border-left: 4px solid #2563eb;
  border-radius: 6px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th,
td {
  border: 1px solid #d9e1ee;
  padding: 10px 12px;
  text-align: left;
}

th {
  background: #eef4ff;
  color: #172033;
}

tr:nth-child(even) {
  background: #fafcff;
}

.summary {
  padding: 18px;
  background: #f8faff;
  border-radius: 10px;
  border: 1px solid #d9e1ee;
}

.footer {
  margin-top: 50px;
  padding-top: 15px;
  border-top: 1px solid #d9e1ee;
  color: #667085;
  font-size: 12px;
  text-align: center;
}

@media print {
  body {
    padding: 20px;
  }

  .cards {
    grid-template-columns: repeat(4, 1fr);
  }
}

</style>
</head>

<body>

<div class="container">

  <div class="header">

    <div>
      <div class="logo">
        PricePilot <span>AI</span>
      </div>

      <div class="subtitle">
        Pricing & Revenue Intelligence Report
      </div>
    </div>

    <div class="date">
      Generated: ${generatedDate}
    </div>

  </div>


  <h2>Executive Summary</h2>

  <div class="cards">

    <div class="card">
      <div class="card-title">
        Total Revenue
      </div>

      <div class="card-value">
        ${money(kpi?.total_revenue || 0)}
      </div>

      <div class="card-hint">
        Revenue generated
      </div>
    </div>


    <div class="card">
      <div class="card-title">
        Total Profit
      </div>

      <div class="card-value">
        ${money(kpi?.total_profit || 0)}
      </div>

      <div class="card-hint">
        ${kpi?.profit_margin || 0}% margin
      </div>
    </div>


    <div class="card">
      <div class="card-title">
        Units Sold
      </div>

      <div class="card-value">
        ${number(kpi?.total_units_sold || 0)}
      </div>

      <div class="card-hint">
        Historical sales volume
      </div>
    </div>


    <div class="card">
      <div class="card-title">
        Average Selling Price
      </div>

      <div class="card-value">
        ${money(kpi?.average_selling_price || 0)}
      </div>

      <div class="card-hint">
        Pricing benchmark
      </div>
    </div>

  </div>


  <h2>Business Overview</h2>

  <div class="summary">

    <p>
      <b>Total Revenue:</b>
      ${money(kpi?.total_revenue || 0)}
    </p>

    <p>
      <b>Total Profit:</b>
      ${money(kpi?.total_profit || 0)}
    </p>

    <p>
      <b>Profit Margin:</b>
      ${kpi?.profit_margin || 0}%
    </p>

    <p>
      <b>Total Units Sold:</b>
      ${number(kpi?.total_units_sold || 0)}
    </p>

    <p>
      <b>Average Selling Price:</b>
      ${money(kpi?.average_selling_price || 0)}
    </p>

  </div>


  ${pricingSection}


  <h2>Competitor Analysis</h2>

  <div class="summary">

    <p>
      <b>Our Average Price:</b>
      ${money(market?.avg_our_price || 0)}
    </p>

    <p>
      <b>Competitor Average Price:</b>
      ${money(
        market?.avg_competitor_price || 0
      )}
    </p>

    <p>
      <b>Average Price Gap:</b>
      ${market?.avg_price_gap_pct?.toFixed(2) || 0}%
    </p>

  </div>


  <table>

    <thead>

      <tr>
        <th>Product</th>
        <th>Category</th>
        <th>Our Price</th>
        <th>Competitor Price</th>
        <th>Price Gap</th>
      </tr>

    </thead>

    <tbody>

      ${competitorRows}

    </tbody>

  </table>


  <h2>Market Intelligence</h2>

  <div class="cards">

    <div class="card">

      <div class="card-title">
        Market Demand
      </div>

      <div class="card-value">
        ${
          market?.market_daily
            ?.at(-1)
            ?.market_demand_index?.toFixed(3) ||
          "-"
        }
      </div>

      <div class="card-hint">
        Latest demand index
      </div>

    </div>


    <div class="card">

      <div class="card-title">
        Average Closing Stock
      </div>

      <div class="card-value">
        ${number(
          market?.avg_closing_stock || 0
        )}
      </div>

      <div class="card-hint">
        Inventory position
      </div>

    </div>


    <div class="card">

      <div class="card-title">
        Active Promotions
      </div>

      <div class="card-value">
        ${market?.active_promotions || 0}/${
      market?.promotion_total || 0
    }
      </div>

      <div class="card-hint">
        Promotion records
      </div>

    </div>

  </div>


  <h2>Category Performance</h2>

  <table>

    <thead>

      <tr>
        <th>Category</th>
        <th>Revenue</th>
        <th>Units Sold</th>
      </tr>

    </thead>

    <tbody>

      ${categoryRows}

    </tbody>

  </table>


  <h2>Machine Learning Model Comparison</h2>

  <table>

    <thead>

      <tr>
        <th>Model</th>
        <th>MAE</th>
        <th>RMSE</th>
        <th>R²</th>
      </tr>

    </thead>

    <tbody>

      ${modelRows}

    </tbody>

  </table>


  <h2>Report Summary</h2>

  <div class="summary">

    <p>
      This report consolidates PricePilot AI's
      historical sales performance, competitor
      pricing information, market indicators,
      pricing recommendation and machine learning
      model evaluation.
    </p>

    <p>
      The pricing recommendation is generated
      using the trained price prediction model
      and the currently entered product and
      market parameters.
    </p>

  </div>


  <div class="footer">

    PricePilot AI — Pricing & Revenue Intelligence Platform

    <br />

    Generated from the current dashboard data.

  </div>

</div>

</body>
</html>
`;

    const blob = new Blob([report], {
      type: "text/html",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `PricePilot_AI_Report_${new Date()
        .toISOString()
        .slice(0, 10)}.html`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };


  if (!loggedIn) {
    return (
      <main className="login-shell">

        <div className="login-card">

          <div className="brand-large">
            PricePilot <span>AI</span>
          </div>

          <p className="muted center">
            Pricing & Revenue Intelligence Platform
          </p>

          <h1>Welcome back</h1>

          <p className="muted">
            Sign in to access the analytics platform.
          </p>

          <div className="role-switch">

            <button
              className={
                selectedRole === "admin"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedRole("admin")
              }
            >
              Admin
            </button>

            <button
              className={
                selectedRole === "analyst"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedRole("analyst")
              }
            >
              Analyst
            </button>

          </div>


          <form onSubmit={login}>

            <label>
              Username
            </label>

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter username"
            />


            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
            />


            {loginError && (
              <div className="error">
                {loginError}
              </div>
            )}


            <button className="primary wide">
              Sign In
            </button>

          </form>


          <div className="divider">
            <span>OR</span>
          </div>


          <button
            className="guest"
            onClick={guestLogin}
          >
            Continue as Guest
          </button>


          <div className="demo-box">

            <b>Demo Access</b>

            <span>
              Admin: admin / admin123
            </span>

            <span>
              Analyst: analyst / analyst123
            </span>

            <span>
              Guest: no credentials required
            </span>

          </div>

        </div>

      </main>
    );
  }


  const nav = [
    ["dashboard", "Dashboard"],
    ["competitor", "Competitor Analysis"],
    ["market", "Market Intelligence"],
    ["forecast", "Demand Forecasting"],
    ["pricing", "Pricing Strategy"],
    ["profitability", "Profitability"],
  ] as const;


  const categoryMax = Math.max(
    ...(kpi?.category.map(
      (x) => x.revenue
    ) || [1])
  );

  const demandHistory = market?.market_daily || [];
  const recentDemand = demandHistory.slice(-14);
  const latestDemand =
    recentDemand.at(-1)?.market_demand_index || 1;
  const avgGrowth =
    recentDemand.length > 0
      ? recentDemand.reduce(
          (sum, x) => sum + (x.demand_growth_rate || 0),
          0
        ) / recentDemand.length
      : 0;

  const demandMean =
    recentDemand.length > 0
      ? recentDemand.reduce(
          (sum, x) => sum + x.market_demand_index,
          0
        ) / recentDemand.length
      : latestDemand;

  const demandVariance =
    recentDemand.length > 0
      ? recentDemand.reduce(
          (sum, x) =>
            sum + Math.pow(x.market_demand_index - demandMean, 2),
          0
        ) / recentDemand.length
      : 0;

  const demandVolatility = Math.sqrt(demandVariance);
  const volatilityRatio =
    demandMean > 0 ? demandVolatility / demandMean : 0;

  const forecastConfidence = Math.round(
    Math.min(
      95,
      Math.max(
        65,
        94 -
          volatilityRatio * 180 -
          Math.max(0, forecastRange - 7) * 0.08
      )
    )
  );

  const forecastDemand = Math.max(
    0,
    latestDemand * Math.pow(1 + avgGrowth, forecastRange)
  );

  const forecastChange =
    latestDemand > 0
      ? ((forecastDemand - latestDemand) / latestDemand) * 100
      : 0;

  const forecastTrend =
    forecastChange > 2
      ? "Increasing"
      : forecastChange < -2
        ? "Decreasing"
        : "Stable";


  return (

    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">
          PricePilot <span>AI</span>
        </div>

        <p className="sidebar-sub">
          Revenue Intelligence
        </p>


        <nav>

          {nav.map(([id, label]) => (

            <button
              key={id}
              className={
                section === id
                  ? "nav-active"
                  : ""
              }
              onClick={() => setSection(id)}
            >
              {label}
            </button>

          ))}

        </nav>


        <div className="sidebar-bottom">

          <div className="status">
            <i />
            Analytics Online
          </div>


          <div className="user-chip">

            <b>
              {role === "guest"
                ? "Guest"
                : roles[
                    role as "admin" | "analyst"
                  ].label}
            </b>

            <span>
              {role === "guest"
                ? "View only"
                : username}
            </span>

          </div>


          <button
            className="logout"
            onClick={logout}
          >
            Sign out
          </button>

        </div>

      </aside>


      <main className="content">

        <header className="topbar">

          <div>

            <h1>
              {
                nav.find(
                  (x) => x[0] === section
                )?.[1]
              }
            </h1>

            <p>
              Pricing, competitor & revenue
              intelligence
            </p>

          </div>


          <div className="top-actions">

            <button
              className="report-btn"
              onClick={downloadReport}
            >
              ↓ Download Report
            </button>


            <div className="live">

              <i />

              Live Data

            </div>

          </div>

        </header>


        {section === "dashboard" && kpi && (

          <>

            <div className="cards">

              <Metric
                title="Total Revenue"
                value={money(
                  kpi.total_revenue
                )}
                hint="Revenue generated"
              />

              <Metric
                title="Total Profit"
                value={money(
                  kpi.total_profit
                )}
                hint={`${kpi.profit_margin}% profit margin`}
              />

              <Metric
                title="Units Sold"
                value={number(
                  kpi.total_units_sold
                )}
                hint="Historical sales volume"
              />

              <Metric
                title="Average Selling Price"
                value={money(
                  kpi.average_selling_price
                )}
                hint="Pricing benchmark"
              />

            </div>


            <div className="grid2">

              <Panel
                title="Revenue Trend"
                eyebrow="Revenue Analytics"
              >
                <Chart
                  data={kpi.monthly}
                  dataKey="revenue"
                  type="area"
                />
              </Panel>


              <Panel
                title="Profit Trend"
                eyebrow="Profitability Analytics"
              >
                <Chart
                  data={kpi.monthly}
                  dataKey="profit"
                  type="line"
                />
              </Panel>

            </div>


            <div className="section-title">

              <small>
                Category Performance
              </small>

              <h2>
                Revenue by Category
              </h2>

            </div>


            <div className="category-grid">

              {kpi.category.map((c) => (

                <div
                  className="category-card"
                  key={c.category}
                >

                  <div>

                    <b>{c.category}</b>

                    <span>
                      {number(c.units_sold)}
                      {" "}units
                    </span>

                  </div>


                  <strong>
                    {money(c.revenue)}
                  </strong>


                  <div className="bar">

                    <i
                      style={{
                        width: `${Math.max(
                          5,
                          (c.revenue /
                            categoryMax) *
                            100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          </>

        )}


        {section === "competitor" &&
          market && (

          <>

            <div className="cards three">

              <Metric
                title="Our Avg. Price"
                value={money(
                  market.avg_our_price
                )}
                hint="Historical selling price"
              />

              <Metric
                title="Competitor Avg. Price"
                value={money(
                  market.avg_competitor_price
                )}
                hint="Across competitor records"
              />

              <Metric
                title="Average Price Gap"
                value={`${market.avg_price_gap_pct.toFixed(
                  2
                )}%`}
                hint="Our price vs market"
              />

            </div>


            <Panel
              title="Competitive Pricing Analysis"
              eyebrow="Competitor Intelligence"
            >

              <div className="table-wrap">

                <table>

                  <thead>

                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Our Price</th>
                      <th>Competitor</th>
                      <th>Gap</th>
                    </tr>

                  </thead>


                  <tbody>

                    {market.competitors.map(
                      (c) => (

                        <tr
                          key={c.product_name}
                        >

                          <td>
                            {c.product_name}
                          </td>

                          <td>
                            {c.category}
                          </td>

                          <td>
                            {money(
                              c.our_price
                            )}
                          </td>

                          <td>
                            {money(
                              c.competitor_price
                            )}
                          </td>

                          <td
                            className={
                              c.price_gap_pct >
                              0
                                ? "red"
                                : "green"
                            }
                          >
                            {c.price_gap_pct.toFixed(
                              1
                            )}
                            %
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </Panel>

          </>

        )}


        {section === "market" &&
          market && (

          <>

            <div className="cards three">

              <Metric
                title="Market Demand"
                value={
                  market.market_daily.at(
                    -1
                  )?.market_demand_index?.toFixed(
                    3
                  ) || "-"
                }
                hint="Latest demand index"
              />

              <Metric
                title="Closing Stock"
                value={number(
                  market.avg_closing_stock
                )}
                hint="Average closing stock"
              />

              <Metric
                title="Active Promotions"
                value={`${market.active_promotions}/${market.promotion_total}`}
                hint="Promotion records active"
              />

            </div>


            <div className="grid2">

              <Panel
                title="Market Demand Index"
                eyebrow="Market Intelligence"
              >

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <LineChart
                    data={
                      market.market_daily
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="date"
                      hide
                    />

                    <YAxis />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="market_demand_index"
                      stroke="#5b9cff"
                      strokeWidth={3}
                      dot={false}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </Panel>


              <Panel
                title="Search Interest"
                eyebrow="Market Signals"
              >

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <BarChart
                    data={
                      market.market_daily
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="date"
                      hide
                    />

                    <YAxis />

                    <Tooltip />

                    <Bar
                      dataKey="market_search_index"
                      fill="#8b5cf6"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </Panel>

            </div>


            <Panel
              title="Promotions & Seasonal Signals"
              eyebrow="Demand Drivers"
            >

              <div className="signal-grid">

                {market.promotions.map(
                  (p) => (

                    <div
                      className="signal"
                      key={p.promotion_type}
                    >

                      <b>
                        {p.promotion_type}
                      </b>

                      <span>
                        {p.products} products ·{" "}
                        {p.avg_discount.toFixed(
                          1
                        )}
                        % avg discount
                      </span>

                    </div>

                  )
                )}


                {market.seasonal.map(
                  (e) => (

                    <div
                      className="signal"
                      key={`${e.event_name}-${e.event_date}`}
                    >

                      <b>
                        {e.event_name}
                      </b>

                      <span>
                        {e.event_date} ·{" "}
                        {
                          e.expected_demand_multiplier
                        }
                        × expected demand
                      </span>

                    </div>

                  )
                )}

              </div>

            </Panel>

          </>

        )}


        {section === "forecast" && market && (

          <>

            <div className="cards three">

              <Metric
                title="Current Demand"
                value={latestDemand.toFixed(2)}
                hint="Latest market demand index"
              />

              <Metric
                title="Forecast Demand"
                value={forecastDemand.toFixed(2)}
                hint={`${forecastChange >= 0 ? "+" : ""}${forecastChange.toFixed(1)}% expected change`}
              />

              <Metric
                title="Forecast Confidence"
                value={`${forecastConfidence}%`}
                hint="Based on recent demand stability"
              />

            </div>


            <Panel
              title="Demand Forecast"
              eyebrow="Predictive Analytics"
            >

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "24px"
              }}>

                <div>
                  <h3 style={{
                    margin: "0 0 6px",
                    color: "#ffffff",
                    fontSize: "18px"
                  }}>
                    Market Demand Forecast
                  </h3>

                  <p style={{
                    margin: 0,
                    color: "#91a3bf",
                    fontSize: "13px"
                  }}>
                    Forecast based on recent demand history and observed growth rate.
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap"
                }}>
                  {[7, 14, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() =>
                        setForecastRange(days as 7 | 14 | 30 | 90)
                      }
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "1px solid #31548c",
                        background:
                          forecastRange === days
                            ? "#31548c"
                            : "#111d35",
                        color: "#ffffff",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      {days}D
                    </button>
                  ))}
                </div>

              </div>


              <div className="grid2">

                <div style={{
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #263b5d",
                  background: "#0f1a2d"
                }}>

                  <small style={{
                    color: "#7186a7",
                    fontSize: "12px"
                  }}>
                    {forecastRange}-DAY FORECAST
                  </small>

                  <div style={{
                    marginTop: "10px",
                    fontSize: "42px",
                    fontWeight: 800,
                    color: "#ffffff"
                  }}>
                    {forecastDemand.toFixed(2)}
                  </div>

                  <div style={{
                    marginTop: "8px",
                    color:
                      forecastChange >= 0
                        ? "#22c55e"
                        : "#ef4444",
                    fontSize: "14px",
                    fontWeight: 600
                  }}>
                    {forecastChange >= 0 ? "↗" : "↘"}{" "}
                    {Math.abs(forecastChange).toFixed(1)}%
                    {" "}vs current demand
                  </div>

                  <div style={{
                    marginTop: "18px",
                    color: "#9fb1ce",
                    fontSize: "13px"
                  }}>
                    Trend: <strong style={{ color: "#ffffff" }}>
                      {forecastTrend}
                    </strong>
                  </div>

                </div>


                <div style={{
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #263b5d",
                  background: "#0f1a2d"
                }}>

                  <small style={{
                    color: "#7186a7",
                    fontSize: "12px"
                  }}>
                    FORECAST CONFIDENCE
                  </small>

                  <div style={{
                    marginTop: "12px",
                    fontSize: "36px",
                    fontWeight: 800,
                    color: "#ffffff"
                  }}>
                    {forecastConfidence}%
                  </div>

                  <div style={{
                    height: "10px",
                    marginTop: "14px",
                    background: "#1c2b43",
                    borderRadius: "999px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${forecastConfidence}%`,
                      height: "100%",
                      background: "#4f8cff",
                      borderRadius: "999px"
                    }} />
                  </div>

                  <p style={{
                    marginTop: "14px",
                    color: "#91a3bf",
                    fontSize: "12px",
                    lineHeight: 1.6
                  }}>
                    Confidence is estimated from recent demand stability
                    and is adjusted for the selected forecast horizon.
                  </p>

                </div>

              </div>

            </Panel>


            <Panel
              title="Recent Demand Trend"
              eyebrow="Historical Demand"
            >

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <LineChart data={recentDemand}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="market_demand_index"
                    stroke="#5b9cff"
                    strokeWidth={3}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </Panel>

          </>

        )}


        {section === "pricing" && (

          <>

            {role === "guest" ? (

              <div className="notice">

                Guest access is view-only.
                Sign in as Admin or Analyst
                to use the pricing engine.

              </div>

            ) : (

              <>

                <div className="pricing-layout">

                  <Panel
                    title="AI Price Recommendation"
                    eyebrow="Dynamic Pricing Engine"
                  >

                    <div className="form-grid">

                      {(
                        [
                          [
                            "cost_price",
                            "Cost Price",
                          ],
                          [
                            "competitor_price",
                            "Competitor Price",
                          ],
                          [
                            "discount_pct",
                            "Discount %",
                          ],
                          [
                            "units_sold",
                            "Units Sold",
                          ],
                          [
                            "list_price",
                            "List Price",
                          ],
                          [
                            "market_demand_index",
                            "Demand Index",
                          ],
                          [
                            "demand_growth_rate",
                            "Demand Growth",
                          ],
                          [
                            "inflation_rate",
                            "Inflation Rate",
                          ],
                        ] as const
                      ).map(
                        ([key, label]) => (

                          <div key={key}>

                            <label>
                              {label}
                            </label>

                            <input
                              value={
                                form[key]
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  [key]:
                                    e.target.value,
                                })
                              }
                            />

                          </div>

                        )
                      )}


                      <div>

                        <label>
                          Category
                        </label>

                        <select
                          value={
                            form.category
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,
                              category:
                                e.target.value,
                            })
                          }
                        >

                          {[
                            "Headphones",
                            "Laptops",
                            "Running Shoes",
                            "Smart Watches",
                            "Smartphones",
                          ].map((x) => (

                            <option key={x}>
                              {x}
                            </option>

                          ))}

                        </select>

                      </div>


                      <div>

                        <label>
                          Pricing Date
                        </label>

                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              date:
                                e.target.value,
                            })
                          }
                        />

                      </div>

                    </div>


                    <button
                      className="primary"
                      onClick={predict}
                    >
                      {loading
                        ? "Calculating..."
                        : "Generate Recommended Price"}
                    </button>

                  </Panel>


                  <div className="result-card">

                    <small>
                      Recommended Price
                    </small>

                    <strong>

                      {prediction === null
                        ? "--"
                        : money(prediction)}

                    </strong>

                    <span>

                      {prediction
                        ? "Model prediction from trained regression pipeline"
                        : "Enter inputs and generate a recommendation"}

                    </span>


                    {insight && (
                      <p>{insight}</p>
                    )}

                  </div>

                </div>


                <Panel
                  title="Model Comparison"
                  eyebrow="Machine Learning"
                >

                  <div className="table-wrap">

                    <table>

                      <thead>

                        <tr>
                          <th>Model</th>
                          <th>MAE</th>
                          <th>RMSE</th>
                          <th>R²</th>
                        </tr>

                      </thead>


                      <tbody>

                        {modelResults.map(
                          (m) => (

                            <tr
                              key={m.Model}
                            >

                              <td>
                                {m.Model}
                              </td>

                              <td>
                                {Number(
                                  m.MAE
                                ).toFixed(2)}
                              </td>

                              <td>
                                {Number(
                                  m.RMSE
                                ).toFixed(2)}
                              </td>

                              <td>
                                {Number(
                                  m.R2
                                ).toFixed(3)}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </Panel>

              </>

            )}

          </>

        )}


        {section === "profitability" &&
          kpi && (

          <>

            <div className="cards three">

              <Metric
                title="Revenue"
                value={money(
                  kpi.total_revenue
                )}
                hint="Historical sales"
              />

              <Metric
                title="Profit"
                value={money(
                  kpi.total_profit
                )}
                hint={`${kpi.profit_margin}% margin`}
              />

              <Metric
                title="Units"
                value={number(
                  kpi.total_units_sold
                )}
                hint="Total volume"
              />

            </div>


            <Panel
              title="Revenue vs Profit"
              eyebrow="Profitability Analytics"
            >

              <ResponsiveContainer
                width="100%"
                height={360}
              >

                <BarChart
                  data={kpi.monthly}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="month" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="revenue"
                    fill="#3b82f6"
                  />

                  <Bar
                    dataKey="profit"
                    fill="#22c55e"
                  />

                </BarChart>

              </ResponsiveContainer>

            </Panel>

          </>

        )}

      </main>

    </div>
  );
}


/* =========================
   METRIC
   ========================= */

function Metric({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (

    <div className="metric">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {hint}
      </small>

    </div>

  );
}


/* =========================
   PANEL
   ========================= */

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (

    <section className="panel">

      <small className="eyebrow">
        {eyebrow}
      </small>

      <h2>
        {title}
      </h2>

      {children}

    </section>

  );
}


/* =========================
   CHART
   ========================= */

function Chart({
  data,
  dataKey,
  type,
}: {
  data: any[];
  dataKey: string;
  type: "area" | "line";
}) {

  return (

    <ResponsiveContainer
      width="100%"
      height={300}
    >

      {type === "area" ? (

        <AreaChart data={data}>

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#4f8cff"
            fill="#4f8cff"
            fillOpacity={0.12}
            strokeWidth={3}
          />

        </AreaChart>

      ) : (

        <LineChart data={data}>

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#22c55e"
            strokeWidth={3}
          />

        </LineChart>

      )}

    </ResponsiveContainer>

  );
}