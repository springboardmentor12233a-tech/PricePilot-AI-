import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";
const GBP_TO_INR = 126.9;
function AIInsights() {
  const { user } = useAuth();

  const [kpis, setKpis] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // FETCH BUSINESS DATA
  // ============================================================

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [kpiResponse, productResponse] = await Promise.all([
  fetch(`${API_BASE_URL}/kpi/summary`, {
    headers,
  }),

  fetch(`${API_BASE_URL}/kpi/top-products`, {
    headers,
  }),
]);

      if (!kpiResponse.ok) {
        throw new Error("Unable to load KPI data");
      }

      if (!productResponse.ok) {
        throw new Error("Unable to load product data");
      }

      const kpiData = await kpiResponse.json();
      const productData = await productResponse.json();

      setKpis(kpiData);

      setProducts(
        Array.isArray(productData)
          ? productData
          : []
      );
    } catch (err) {
      console.error("Business Data Error:", err);

      setError(
        err.message ||
          "Unable to load business data"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORMAT PRODUCT NAME
  // ============================================================

  const formatProductName = (name) => {
    if (!name) {
      return "Unknown Product";
    }

    return String(name)
      .toLowerCase()
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

  // ============================================================
  // NUMBER HELPER
  // ============================================================

  const getNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  // ============================================================
  // PRODUCT QUANTITY
  // ============================================================

  const getProductQuantity = (product) => {
    return getNumber(
      product.quantity ??
        product.total_quantity ??
        product.units_sold
    );
  };

  // ============================================================
  // TOP QUANTITY PRODUCTS
  // ============================================================

  const topQuantityProducts = [...products]
    .sort(
      (a, b) =>
        getProductQuantity(b) -
        getProductQuantity(a)
    )
    .slice(0, 5);

  // ============================================================
  // BUSINESS RECOMMENDATIONS
  // ============================================================

  const generateRecommendations = () => {
    const recommendations = [];

    if (products.length === 0) {
      return recommendations;
    }

    const topQuantityProduct =
      topQuantityProducts[0];

    // Recommendation 1
    if (topQuantityProduct) {
      recommendations.push({
        title:
          "Monitor high-demand products",

        description:
          `${formatProductName(
            topQuantityProduct.product_name ||
              topQuantityProduct.name
          )} shows strong quantity performance in the available product data. Monitor inventory availability and demand for this product.`,

        priority: "High",
      });
    }

    // Recommendation 2
    if (
      kpis?.average_order_value &&
      getNumber(kpis.average_order_value) > 0
    ) {
      recommendations.push({
        title:
          "Monitor average order value",

        description:
          `The current average order value is £${getNumber(
            kpis.average_order_value
          ).toLocaleString("en-GB", {
            minimumFractionDigits: 2,
          })}. Track changes in order value alongside overall sales performance.`,

        priority: "Medium",
      });
    }

    // Recommendation 3
    if (products.length > 1) {
      recommendations.push({
        title:
          "Review product performance",

        description:
          "Compare product-level quantity and revenue information to identify products that require additional attention.",

        priority: "Medium",
      });
    }

    // Recommendation 4
    recommendations.push({
      title:
        "Use pricing and demand together",

      description:
        "Review recommended pricing together with predicted demand before making pricing decisions. PricePilot pricing results are model-based estimates.",

      priority: "Medium",
    });

    // Recommendation 5
    recommendations.push({
      title:
        "Monitor competitor pricing",

      description:
        "Compare product prices with competitor prices when evaluating pricing decisions and market position.",

      priority: "Low",
    });

    return recommendations.slice(0, 5);
  };

  // ============================================================
  // KEY FACTORS
  // ============================================================

  const keyFactors = [
    {
      name: "Price",
      importance: "High",
      reason:
        "Pricing directly affects the pricing scenarios evaluated by PricePilot.",
    },

    {
      name: "Demand",
      importance: "High",
      reason:
        "Demand information helps evaluate how products may perform under different pricing conditions.",
    },

    {
      name: "Sales",
      importance: "Medium",
      reason:
        "Historical sales information provides context for evaluating product performance.",
    },

    {
      name: "Competition",
      importance: "Medium",
      reason:
        "Competitor pricing provides additional context when evaluating market position.",
    },
  ];

  const recommendations =
    generateRecommendations();

  // ============================================================
  // PRIORITY STYLE
  // ============================================================

  const getPriorityStyle = (priority) => {
    const value = String(
      priority || "Medium"
    ).toLowerCase();

    if (value === "high") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (value === "low") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  };

  // ============================================================
  // IMPORTANCE STYLE
  // ============================================================

  const getImportanceStyle = (importance) => {
    const value = String(
      importance || "Medium"
    ).toLowerCase();

    if (value === "high") {
      return {
        background: "#eef2ff",
        color: "#4338ca",
      };
    }

    if (value === "low") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="dashboard">

        <section className="dashboard-card">

          <div
            style={{
              textAlign: "center",
              padding: "60px",
            }}
          >

            <h2>
              Loading Business Insights...
            </h2>

            <p>
              Fetching business performance
              and product analytics.
            </p>

          </div>

        </section>

      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="dashboard">

      

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <section className="dashboard-card">

          <div
            style={{
              padding: "15px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#991b1b",
            }}
          >

            <strong>
              Error:
            </strong>{" "}

            {error}

          </div>

        </section>
      )}

      {/* ======================================================
    BUSINESS OVERVIEW
====================================================== */}

<section className="dashboard-card">

  <div className="card-heading">

    <div>

      <h3>
        Business Overview
      </h3>

      <p>
        Key business performance indicators
        from the PricePilot dashboard.
      </p>

    </div>

  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px",
      marginTop: "20px",
    }}
  >

    {/* TOTAL REVENUE */}

    <div className="kpi-card">

      <span>
        Total Revenue
      </span>

      <h3>
        ₹ 
        {(Number(
          kpis?.total_revenue || 0)*GBP_TO_INR
        ).toLocaleString("en-GB", {
          minimumFractionDigits: 2,
        })}
      </h3>

    </div>


    {/* TOTAL SALES */}

    <div className="kpi-card">

      <span>
        Total Sales
      </span>

      <h3>
        {Number(
          kpis?.total_sales || 0
        ).toLocaleString("en-IN")}
      </h3>

    </div>


    {/* TOTAL PRODUCTS */}

    <div className="kpi-card">

      <span>
        Total Products
      </span>

      <h3>
        {Number(
          kpis?.total_products || 0
        ).toLocaleString("en-IN")}
      </h3>

    </div>


    {/* UNIQUE ORDERS */}

    <div className="kpi-card">

      <span>
        Unique Orders
      </span>

      <h3>
        {Number(
          kpis?.unique_orders || 0
        ).toLocaleString("en-IN")}
      </h3>

    </div>

  </div>

</section>

      {/* ======================================================
    BUSINESS RECOMMENDATIONS
====================================================== */}

<section className="dashboard-card">

  <div className="card-heading">

    <div>
      <h3>
        ✦ Business Recommendations
      </h3>

      <p>
        Recommendations derived from
        PricePilot's available analytics.
      </p>
    </div>

  </div>

  {recommendations.length === 0 ? (

    <div
      style={{
        marginTop: "20px",
        padding: "20px",
        background: "#f8fafc",
        borderRadius: "10px",
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      Not enough product data is
      available to generate recommendations.
    </div>

  ) : (

    <div
      style={{
        display: "grid",
        gap: "12px",
        marginTop: "20px",
      }}
    >

      {recommendations.map(
        (recommendation, index) => {

          const priority =
            recommendation.priority || "Medium";

          return (

            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "42px 1fr auto",
                columnGap: "14px",
                alignItems: "start",
                padding: "16px 18px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#ffffff",
                boxSizing: "border-box",
              }}
            >

              {/* ICON */}

              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  color: "#1e3a8a",
                }}
              >
                ✦
              </div>


              {/* CONTENT */}

              <div
                style={{
                  minWidth: 0,
                  textAlign: "left",
                }}
              >

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    lineHeight: "1.4",
                    color: "#0f172a",
                    marginTop: "2px",
                  }}
                >
                  {index + 1}.{" "}
                  {recommendation.title}
                </div>

                <p
                  style={{
                    margin: "6px 0 0 0",
                    padding: 0,
                    color: "#64748b",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    textAlign: "left",
                  }}
                >
                  {recommendation.description}
                </p>

              </div>


              {/* PRIORITY */}

              <span
                style={{
                  padding: "5px 11px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  marginTop: "2px",
                  ...getPriorityStyle(priority),
                }}
              >
                {priority}
              </span>

            </div>

          );
        }
      )}

    </div>

  )}

</section>

      {/* ======================================================
          KEY FACTORS
      ====================================================== */}

      <section className="dashboard-card">

        <div className="card-heading">

          <div>

            <h3
              style={{
                fontSize: "16px",
              }}
            >
              📊 Key Factors
            </h3>

            <p
              style={{
                fontSize: "13px",
              }}
            >
              Important factors used when
              evaluating business decisions.
            </p>

          </div>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            marginTop: "18px",
          }}
        >

          {keyFactors.map(
            (factor, index) => (

              <div
                key={index}
                style={{
                  padding: "15px",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background:
                    "#ffffff",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "10px",
                    marginBottom:
                      "8px",
                  }}
                >

                  <strong
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {factor.name}
                  </strong>

                  <span
                    style={{
                      padding:
                        "3px 9px",
                      borderRadius:
                        "20px",
                      fontSize:
                        "10px",
                      fontWeight:
                        "600",
                      ...getImportanceStyle(
                        factor.importance
                      ),
                    }}
                  >
                    {factor.importance}
                  </span>

                </div>

                <p
                  style={{
                    margin: "0",
                    color: "#64748b",
                    lineHeight: "1.5",
                    fontSize: "12px",
                  }}
                >
                  {factor.reason}
                </p>

              </div>

            )
          )}

        </div>

      </section>

    </div>
  );
}

export default AIInsights;