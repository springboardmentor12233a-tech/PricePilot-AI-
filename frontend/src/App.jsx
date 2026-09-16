import { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [kpis, setKpis] = useState(null);
  const [priceResult, setPriceResult] = useState(null);
  const [competitorResult, setCompetitorResult] = useState(null);
  const [forecastResult, setForecastResult] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  const [question, setQuestion] = useState(
    "Why is this price recommended?"
  );

  const [askedQuestion, setAskedQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // User inputs
  const [productId, setProductId] = useState("P001");
  const [currentPrice, setCurrentPrice] = useState(100);
  const [costPerUnit, setCostPerUnit] = useState(50);
  const [minPrice, setMinPrice] = useState(80);
  const [maxPrice, setMaxPrice] = useState(120);
  const [competitorPrice, setCompetitorPrice] = useState(105);

  // --------------------------------------------------
  // GET MONTH NAME
  // --------------------------------------------------

  const getMonthName = (value) => {
    if (!value) {
      return "";
    }

    const text = String(value);

    // Handles values such as:
    // 2010-12
    // 2010-12-01
    // 2010/12
    const match = text.match(/^\d{4}[-/]?(\d{1,2})/);

    if (match) {
      const monthNumber = Number(match[1]);

      if (monthNumber >= 1 && monthNumber <= 12) {
        const date = new Date(2000, monthNumber - 1, 1);

        return date.toLocaleString("en-US", {
          month: "short",
        });
      }
    }

    // Handles numeric month values
    const numericValue = Number(value);

    if (
      Number.isInteger(numericValue) &&
      numericValue >= 1 &&
      numericValue <= 12
    ) {
      const date = new Date(2000, numericValue - 1, 1);

      return date.toLocaleString("en-US", {
        month: "short",
      });
    }

    // Final fallback
    const date = new Date(value);

    if (!isNaN(date.getTime())) {
      return date.toLocaleString("en-US", {
        month: "short",
      });
    }

    return text;
  };

  // --------------------------------------------------
  // LOAD DASHBOARD
  // --------------------------------------------------

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const kpiResponse = await axios.get(
        `${API_URL}/dashboard/kpis`
      );

      setKpis(kpiResponse.data);

      const revenueResponse = await axios.get(
        `${API_URL}/kpis/monthly-revenue`
      );

      const revenueData = revenueResponse.data;

      let revenueList = [];

      if (Array.isArray(revenueData)) {
        revenueList = revenueData;
      } else if (Array.isArray(revenueData?.data)) {
        revenueList = revenueData.data;
      } else if (
        Array.isArray(revenueData?.monthly_revenue)
      ) {
        revenueList = revenueData.monthly_revenue;
      }

      const formattedRevenue = revenueList.map(
        (item) => {
          const monthValue =
            item.month ??
            item.Month ??
            item.date ??
            item.Date ??
            "";

          return {
            month: getMonthName(monthValue),

            revenue: Number(
              item.revenue ??
                item.Revenue ??
                item.total_revenue ??
                item.Total_Revenue ??
                0
            ),
          };
        }
      );

      setMonthlyRevenue(formattedRevenue);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // PRICE OPTIMIZATION
  // --------------------------------------------------

  const optimizePrice = async () => {
    try {
      setLoading(true);
      setError("");

      const requestData = {
        Product_ID: productId,

        current_price: Number(currentPrice),
        cost_per_unit: Number(costPerUnit),
        min_price: Number(minPrice),
        max_price: Number(maxPrice),
        number_of_prices: 10,

        Base_Sales: 30000,
        Marketing_Campaign: "No Campaign",
        Marketing_Effect: 0,

        Seasonal_Trend: "Stable",
        Seasonal_Effect: 0,

        Discount: 0,
        Competitor_Price: Number(competitorPrice),

        Stock_Availability: 100,
        Public_Holiday: 0,

        Year: 2025,
        Month: 9,
        Day: 15,
        DayOfWeek: 1,

        competitor_prices: [
          Number(competitorPrice),
          110,
          98,
          115,
        ],
      };

      const response = await axios.post(
        `${API_URL}/pricing-recommendation`,
        requestData
      );

      setPriceResult(response.data);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Price optimization failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // COMPETITOR ANALYSIS
  // --------------------------------------------------

  const analyzeCompetitors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/competitor-analysis`,
        {
          product_id: productId,

          current_price: Number(currentPrice),

          competitor_prices: [
            Number(competitorPrice),
            110,
            98,
            115,
          ],
        }
      );

      setCompetitorResult(response.data);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Competitor analysis failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // DEMAND FORECAST
  // --------------------------------------------------

  const forecastDemand = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/forecast-weekly-demand`,
        {
          item_id: "FOODS_1_001",
          dept_id: "FOODS_1",
          cat_id: "FOODS",

          avg_price: 3.00,
          min_price: 2.50,
          max_price: 3.50,

          sales_lag_1: 8,
          sales_lag_2: 7,
          sales_lag_4: 6,
          rolling_sales_4: 7,

          price_change: 0,
          price_change_pct: 0,

          month: 9,
          year: 2015,
          week_of_year: 37,
          quarter: 3,

          has_event: 0,
          snap: 0,

          forecast_weeks: 4,
        }
      );

      setForecastResult(response.data);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Demand forecast request failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // AI CHATBOT
  // --------------------------------------------------

  const askAI = async () => {
    try {
      setLoading(true);
      setError("");

      const currentQuestion = question.trim();

      if (!currentQuestion) {
        setError("Please enter a question.");
        setLoading(false);
        return;
      }

      setAskedQuestion(currentQuestion);

      const businessData = {
        total_revenue:
          kpis?.total_revenue,

        total_orders:
          kpis?.total_orders,

        average_order_value:
          kpis?.average_order_value,

        product_id:
          priceResult?.product_id ||
          productId,

        current_price:
          priceResult?.current_price ||
          Number(currentPrice),

        recommended_price:
          priceResult?.recommended_price,

        price_change_percentage:
          priceResult?.price_change_percentage,

        predicted_demand:
          priceResult?.predicted_demand,

        expected_revenue:
          priceResult?.expected_revenue,

        expected_profit:
          priceResult?.expected_profit,

        profit_improvement_percentage:
          priceResult?.profit_improvement_percentage,

        market_position:
          competitorResult?.market_position,

        competitor_recommendation:
          competitorResult?.recommendation,

        question: currentQuestion,
      };

      const response = await axios.post(
        `${API_URL}/llm/business-insights`,
        businessData
      );

      setAiAnswer(
        typeof response.data === "string"
          ? response.data
          : response.data?.answer ||
              response.data?.response ||
              JSON.stringify(
                response.data,
                null,
                2
              )
      );

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "AI assistant request failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FORECAST CHART DATA
  // --------------------------------------------------

  const forecastChart =
    forecastResult?.weekly_forecast?.map(
      (item) => ({
        week: `Week ${item.week}`,
        demand: Number(
          item.predicted_demand
        ),
      })
    ) || [];

  // --------------------------------------------------
  // REVENUE CHART DATA
  // --------------------------------------------------

  const revenueChart =
    monthlyRevenue.map((item) => ({
      month: item.month,
      revenue: Number(item.revenue),
    }));

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div>
          <h1>PricePilot AI</h1>

          <p>
            Dynamic Pricing & Revenue Intelligence
          </p>
        </div>

        <div className="ai-badge">
          ● AI Powered
        </div>

      </header>

      <main className="container">

        {/* ERROR */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* BUSINESS OVERVIEW */}

        <section>

          <div className="section-header">

            <div>
              <h2>Business Overview</h2>

              <p>
                Key business performance metrics
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={loadDashboard}
            >
              {loading
                ? "Loading..."
                : "Load Dashboard"}
            </button>

          </div>

          <div className="kpi-grid">

            <KpiCard
              title="Total Revenue"
              value={
                kpis
                  ? `£${Number(
                      kpis.total_revenue
                    ).toLocaleString()}`
                  : "--"
              }
            />

            <KpiCard
              title="Total Orders"
              value={
                kpis
                  ? Number(
                      kpis.total_orders
                    ).toLocaleString()
                  : "--"
              }
            />

            <KpiCard
              title="Quantity Sold"
              value={
                kpis
                  ? Number(
                      kpis.total_quantity
                    ).toLocaleString()
                  : "--"
              }
            />

            <KpiCard
              title="Average Order Value"
              value={
                kpis
                  ? `£${Number(
                      kpis.average_order_value
                    ).toLocaleString()}`
                  : "--"
              }
            />

          </div>

        </section>

        {/* PRICE OPTIMIZATION */}

        <section className="card">

          <div className="section-header">

            <div>

              <h2>
                AI Price Optimization
              </h2>

              <p>
                Find a suitable price using the
                trained demand model and pricing
                simulation.
              </p>

            </div>

          </div>

          <div className="simple-form">

            <Input
              label="Product ID"
              value={productId}
              onChange={setProductId}
            />

            <Input
              label="Current Price (£)"
              type="number"
              value={currentPrice}
              onChange={setCurrentPrice}
            />

            <Input
              label="Cost Per Unit (£)"
              type="number"
              value={costPerUnit}
              onChange={setCostPerUnit}
            />

            <Input
              label="Minimum Price (£)"
              type="number"
              value={minPrice}
              onChange={setMinPrice}
            />

            <Input
              label="Maximum Price (£)"
              type="number"
              value={maxPrice}
              onChange={setMaxPrice}
            />

            <Input
              label="Competitor Price (£)"
              type="number"
              value={competitorPrice}
              onChange={setCompetitorPrice}
            />

          </div>

          <button
            className="primary-button"
            onClick={optimizePrice}
            disabled={loading}
          >
            {loading
              ? "Optimizing..."
              : "Optimize Price"}
          </button>

          {priceResult && (
            <div className="result-area">

              <h3>
                Pricing Recommendation
              </h3>

              <div className="result-grid">

                <ResultCard
                  title="Current Price"
                  value={`£${priceResult.current_price}`}
                />

                <ResultCard
                  title="Recommended Price"
                  value={`£${priceResult.recommended_price}`}
                  highlight
                />

                <ResultCard
                  title="Predicted Demand"
                  value={Number(
                    priceResult.predicted_demand
                  ).toLocaleString()}
                />

                <ResultCard
                  title="Expected Revenue"
                  value={`£${Number(
                    priceResult.expected_revenue
                  ).toLocaleString()}`}
                />

                <ResultCard
                  title="Expected Profit"
                  value={`£${Number(
                    priceResult.expected_profit
                  ).toLocaleString()}`}
                  highlight
                />

                <ResultCard
                  title="Profit Improvement"
                  value={`${priceResult.profit_improvement_percentage}%`}
                />

              </div>

            </div>
          )}

        </section>

        {/* DEMAND FORECAST + COMPETITOR */}

        <div className="two-column">

          {/* DEMAND FORECAST */}

          <section className="card forecast-card">

            <h2>Demand Forecast</h2>

            <p>
              Forecast future demand using the
              M5 demand forecasting model.
            </p>

            <button
              className="primary-button"
              onClick={forecastDemand}
              disabled={loading}
            >
              {loading
                ? "Generating..."
                : "Generate Forecast"}
            </button>

            <div className="chart forecast-chart">

              {forecastChart.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={forecastChart}
                    margin={{
                      top: 35,
                      right: 20,
                      left: 10,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="week"
                    />

                    <YAxis
                      domain={["auto", "auto"]}
                    />

                    <Tooltip
                      formatter={(value) => [
                        Number(value).toFixed(2),
                        "Predicted Demand",
                      ]}
                    />

                    <Line
                      type="monotone"
                      dataKey="demand"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8 }}
                      label={{
                        position: "top",
                        formatter: (value) =>
                          Number(value).toFixed(2),
                      }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <div className="empty-chart">
                  Click "Generate Forecast" to view
                  predicted demand.
                </div>

              )}

            </div>

            {forecastResult && (
              <div className="forecast-summary">

                <div>
                  <strong>
                    28-Day Forecast
                  </strong>

                  <span>
                    {Number(
                      forecastResult.forecasted_demand
                    ).toFixed(2)}
                  </span>
                </div>

                <div>
                  <strong>
                    Weekly Demand
                  </strong>

                  <span>
                    {Number(
                      forecastResult.predicted_weekly_demand
                    ).toFixed(2)}
                  </span>
                </div>

                <div>
                  <strong>
                    Trend
                  </strong>

                  <span>
                    {forecastResult.trend}
                  </span>
                </div>

              </div>
            )}

          </section>

          {/* COMPETITOR ANALYSIS */}

          <section className="card">

            <h2>Competitor Analysis</h2>

            <p>
              Compare your current price with
              competitor prices.
            </p>

            <div className="competitor-summary">

              <div>
                <span>
                  Your Price
                </span>

                <strong>
                  £{currentPrice}
                </strong>
              </div>

              <div>
                <span>
                  Competitor Price
                </span>

                <strong>
                  £{competitorPrice}
                </strong>
              </div>

            </div>

            <button
              className="primary-button"
              onClick={analyzeCompetitors}
              disabled={loading}
            >
              Analyze Market
            </button>

            {competitorResult && (
              <div className="result-area">

                <ResultCard
                  title="Average Competitor Price"
                  value={`£${competitorResult.average_competitor_price}`}
                />

                <ResultCard
                  title="Market Position"
                  value={
                    competitorResult.market_position
                  }
                  highlight
                />

                <p className="recommendation">
                  {competitorResult.recommendation}
                </p>

              </div>
            )}

          </section>

        </div>

        {/* REVENUE TREND */}

        <section className="card">

          <h2>Revenue Trend</h2>

          <p>
            Monthly revenue from the business
            dataset.
          </p>

          <div className="chart large">

            {revenueChart.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={revenueChart}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 60,
                    bottom: 60,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
  dataKey="month"
  interval={0}
  tickLine={true}
  axisLine={true}
  height={50}
  tick={({ x, y, index }) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return (
      <text
        x={x}
        y={y + 15}
        textAnchor="middle"
        fill="#374151"
        fontSize={12}
      >
        {months[index % 12]}
      </text>
    );
  }}
/>

                  <YAxis
                    tick={{
                      fontSize: 12,
                      fill: "#374151",
                    }}
                    tickFormatter={(value) =>
                      `£${Number(
                        value
                      ).toLocaleString()}`
                    }
                    label={{
                      value: "Revenue (£)",
                      angle: -90,
                      position: "insideLeft",
                      offset: -40,
                    }}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `£${Number(
                        value
                      ).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <div className="empty-chart">
                Click "Load Dashboard" to load
                revenue data.
              </div>

            )}

          </div>

        </section>

        {/* AI CHATBOT */}

        <section className="card chatbot">

          <div>

            <h2>
              PricePilot AI Assistant
            </h2>

            <p>
              Ask questions about pricing,
              demand, competitors, revenue
              and profit.
            </p>

          </div>

          <div className="chat-box">

            {aiAnswer ? (

              <div className="conversation">

                <div className="user-question">

                  <strong>
                    You
                  </strong>

                  <p>
                    {askedQuestion}
                  </p>

                </div>

                <div className="ai-message">

                  <strong>
                    PricePilot AI
                  </strong>

                  <p>
                    {aiAnswer}
                  </p>

                </div>

              </div>

            ) : (

              <div className="chat-placeholder">

                Try asking:

                <br />

                "Why is this price recommended?"

              </div>

            )}

          </div>

          <div className="chat-input">

            <input
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Ask about price, demand or profit..."
            />

            <button
              className="primary-button"
              onClick={askAI}
              disabled={loading}
            >
              {loading
                ? "Thinking..."
                : "Ask AI"}
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

// --------------------------------------------------
// KPI CARD
// --------------------------------------------------

function KpiCard({ title, value }) {
  return (
    <div className="kpi-card">

      <p>{title}</p>

      <h2>{value}</h2>

    </div>
  );
}

// --------------------------------------------------
// INPUT
// --------------------------------------------------

function Input({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div className="input-group">

      <label>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

    </div>
  );
}

// --------------------------------------------------
// RESULT CARD
// --------------------------------------------------

function ResultCard({
  title,
  value,
  highlight = false,
}) {
  return (
    <div
      className={`result-card ${
        highlight ? "highlight" : ""
      }`}
    >

      <p>
        {title}
      </p>

      <h3>
        {value}
      </h3>

    </div>
  );
}

// --------------------------------------------------
// CSS
// --------------------------------------------------

const css = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #f5f7fb;
  color: #172033;
}

button,
input {
  font-family: inherit;
}

.app {
  min-height: 100vh;
}

.header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 22px 5%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  color: #111827;
}

.header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.ai-badge {
  background: #eef2ff;
  color: #4f46e5;
  padding: 10px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
}

.container {
  width: 90%;
  max-width: 1400px;
  margin: 30px auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.section-header h2,
.card h2 {
  margin: 0;
  font-size: 21px;
}

.section-header p,
.card > p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}

.kpi-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.04);
}

.kpi-card p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.kpi-card h2 {
  margin: 12px 0 0;
  font-size: 26px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.04);
}

.simple-form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 20px;
}

.input-group label {
  display: block;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 7px;
  color: #374151;
}

.input-group input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.primary-button {
  border: none;
  background: #4f46e5;
  color: white;
  padding: 12px 20px;
  border-radius: 9px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 18px;
}

.primary-button:hover {
  background: #4338ca;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  border: 1px solid #4f46e5;
  background: white;
  color: #4f46e5;
  padding: 10px 18px;
  border-radius: 9px;
  font-weight: bold;
  cursor: pointer;
}

.result-area {
  margin-top: 25px;
  background: #f8faff;
  border: 1px solid #e0e7ff;
  padding: 20px;
  border-radius: 12px;
}

.result-area h3 {
  margin-top: 0;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.result-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 15px;
}

.result-card.highlight {
  border: 2px solid #6366f1;
}

.result-card p {
  color: #6b7280;
  font-size: 12px;
  margin: 0;
}

.result-card h3 {
  margin: 8px 0 0;
  font-size: 19px;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
}

.chart {
  height: 280px;
  margin-top: 25px;
}

.forecast-chart {
  height: 330px;
  margin-top: 25px;
  width: 100%;
}

.forecast-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 20px;
  width: 100%;
}

.forecast-summary > div {
  background: #f8f9ff;
  border: 1px solid #e0e7ff;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
}

.forecast-summary strong {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  white-space: nowrap;
}

.forecast-summary span {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #4f46e5;
}

.chart.large {
  height: 350px;
  margin-top: 20px;
  width: 100%;
}

.empty-chart {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #9ca3af;
  text-align: center;
}

.competitor-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 25px;
}

.competitor-summary div {
  background: #f8fafc;
  border-radius: 10px;
  padding: 18px;
}

.competitor-summary span {
  display: block;
  color: #6b7280;
  font-size: 13px;
}

.competitor-summary strong {
  display: block;
  font-size: 22px;
  margin-top: 8px;
}

.recommendation {
  color: #4338ca;
  font-weight: bold;
  margin-bottom: 0;
}

.chatbot {
  margin-bottom: 50px;
}

.chat-box {
  min-height: 180px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  margin-top: 20px;
}

.conversation {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-question {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 15px;
}

.user-question strong {
  color: #374151;
  font-size: 13px;
}

.user-question p {
  margin: 8px 0 0;
  color: #172033;
  line-height: 1.5;
}

.ai-message {
  background: #eef2ff;
  border-radius: 10px;
  padding: 16px;
  line-height: 1.6;
}

.ai-message strong {
  color: #4f46e5;
}

.ai-message p {
  margin: 8px 0 0;
  white-space: pre-wrap;
  color: #172033;
}

.chat-placeholder {
  text-align: center;
  color: #9ca3af;
  padding-top: 55px;
}

.chat-input {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.chat-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 9px;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 12px 15px;
  border-radius: 9px;
  margin-bottom: 20px;
}

@media (max-width: 900px) {

  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .simple-form {
    grid-template-columns: 1fr 1fr;
  }

  .two-column {
    grid-template-columns: 1fr;
  }

  .result-grid {
    grid-template-columns: 1fr 1fr;
  }

  .forecast-summary {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {

  .kpi-grid,
  .simple-form,
  .result-grid {
    grid-template-columns: 1fr;
  }

  .forecast-summary {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .chat-input {
    flex-direction: column;
  }
}
`;

const styleElement = document.createElement("style");

styleElement.innerHTML = css;

if (
  !document.head.querySelector(
    "style[data-pricepilot]"
  )
) {
  styleElement.setAttribute(
    "data-pricepilot",
    "true"
  );

  document.head.appendChild(styleElement);
}

export default App;