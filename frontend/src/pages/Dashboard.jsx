import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

// Dataset prices are in GBP.
// Convert all price/revenue values to INR for the UI.
const GBP_TO_INR = 126.9;

function Dashboard() {

  // ============================================================
  // STATE
  // ============================================================

  const [kpi, setKpi] = useState(null);

  const [topProducts, setTopProducts] = useState([]);

  const [categoryRevenue, setCategoryRevenue] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ============================================================
  // FETCH DASHBOARD DATA
  // ============================================================

  useEffect(() => {

    const fetchDashboardData = async () => {

      try {

        setLoading(true);
        setError("");

        const token = localStorage.getItem(
          "access_token"
        );

        const headers = {
          Authorization: `Bearer ${token}`,
        };


        // ======================================================
        // KPI SUMMARY
        // ======================================================

        const kpiResponse = await fetch(
          `${API_BASE_URL}/kpi/summary`,
          {
            headers,
          }
        );

        if (!kpiResponse.ok) {
          throw new Error(
            "Failed to load KPI data"
          );
        }

        const kpiData =
          await kpiResponse.json();


        // ======================================================
        // TOP PRODUCTS
        // ======================================================

        const productsResponse = await fetch(
          `${API_BASE_URL}/kpi/top-products`,
          {
            headers,
          }
        );

        if (!productsResponse.ok) {
          throw new Error(
            "Failed to load product data"
          );
        }

        const productsData =
          await productsResponse.json();


        // ======================================================
        // CATEGORY REVENUE
        // ======================================================

        const categoryResponse = await fetch(
          `${API_BASE_URL}/kpi/category-revenue`,
          {
            headers,
          }
        );

        if (!categoryResponse.ok) {
          throw new Error(
            "Failed to load category revenue"
          );
        }

        const categoryData =
          await categoryResponse.json();


        // ======================================================
        // SET STATE
        // ======================================================

        setKpi(kpiData);

        setTopProducts(
          Array.isArray(productsData)
            ? productsData
            : []
        );

        setCategoryRevenue(
          Array.isArray(categoryData)
            ? categoryData
            : []
        );

      } catch (err) {

        console.error(err);

        setError(
          "Unable to load dashboard data."
        );

      } finally {

        setLoading(false);

      }

    };


    fetchDashboardData();

  }, []);


  // ============================================================
  // FORMAT INR
  // ============================================================

  const formatINR = (value) => {

    const number = Number(value || 0);

    if (!Number.isFinite(number)) {
      return "₹0.00";
    }

    return `₹${(
      number * GBP_TO_INR
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  };


  // ============================================================
  // CATEGORY REVENUE PROCESSING
  // ============================================================

  const processedCategoryRevenue =
    categoryRevenue
      .map((item) => {

        const revenue = Number(
          item.revenue ??
          item.total_revenue ??
          item.category_revenue ??
          0
        );

        return {
          name:
            item.category_name ??
            item.category ??
            item.name ??
            "Other",

          revenue:
            Number.isFinite(revenue)
              ? revenue
              : 0,
        };

      })
      .filter(
        (item) => item.revenue > 0
      );


  const totalCategoryRevenue =
    processedCategoryRevenue.reduce(
      (total, item) =>
        total + item.revenue,
      0
    );


  // ============================================================
  // PIE CHART
  // ============================================================

  const getCategoryPieStyle = () => {

    if (
      processedCategoryRevenue.length === 0 ||
      totalCategoryRevenue <= 0
    ) {

      return {
        background:
          "#e5e7eb",
      };

    }


    let currentAngle = 0;

    const segments =
      processedCategoryRevenue.map(
        (item, index) => {

          const percentage =
            (item.revenue /
              totalCategoryRevenue) *
            100;

          const startAngle =
            currentAngle;

          const endAngle =
            currentAngle +
            (percentage * 3.6);

          currentAngle =
            endAngle;

          const colors = [
            "#4f46e5",
            "#06b6d4",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#ec4899",
            "#14b8a6",
            "#f97316",
            "#6366f1",
          ];

          return `${colors[index % colors.length]} ${startAngle}deg ${endAngle}deg`;

        }
      );


    return {
      background: `conic-gradient(${segments.join(
        ", "
      )})`,
    };

  };


  // ============================================================
  // CATEGORY COLORS
  // ============================================================

  const categoryColors = [
    "#4f46e5",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
  ];


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="dashboard">

        <h2>
          Loading dashboard...
        </h2>

      </div>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (

      <div className="dashboard">

        <h2>
          Dashboard
        </h2>

        <p>
          {error}
        </p>

      </div>

    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="dashboard">


      {/* ======================================================
          WELCOME
      ====================================================== */}

      <section className="welcome-section">

        <div>

          <h2>
            Welcome back 👋
          </h2>

          <p>
            Here's an overview of your business
            performance and pricing intelligence.
          </p>

        </div>


        <button className="primary-button">

          + New Analysis

        </button>

      </section>



      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <section className="kpi-grid">


        {/* ====================================================
            TOTAL REVENUE
        ==================================================== */}

        <div className="kpi-card">

          <div className="kpi-header">

            <span>
              Total Revenue
            </span>

            <div className="kpi-icon revenue">
              ₹
            </div>

          </div>


          <h3>

            {formatINR(
              kpi?.total_revenue
            )}

          </h3>


          <p>
            From sales data
          </p>

        </div>



        {/* ====================================================
            TOTAL SALES
        ==================================================== */}

        <div className="kpi-card">

          <div className="kpi-header">

            <span>
              Total Sales
            </span>

            <div className="kpi-icon orders">
              ▤
            </div>

          </div>


          <h3>

            {Number(
              kpi?.total_sales || 0
            ).toLocaleString("en-IN")}

          </h3>


          <p>
            Sales transactions
          </p>

        </div>



        {/* ====================================================
            TOTAL PRODUCTS
        ==================================================== */}

        <div className="kpi-card">

          <div className="kpi-header">

            <span>
              Total Products
            </span>

            <div className="kpi-icon customers">
              ●
            </div>

          </div>


          <h3>

            {Number(
              kpi?.total_products || 0
            ).toLocaleString("en-IN")}

          </h3>


          <p>
            Products in database
          </p>

        </div>



        {/* ====================================================
            AVERAGE ORDER VALUE
        ==================================================== */}

        <div className="kpi-card">

          <div className="kpi-header">

            <span>
              Average Order Value
            </span>

            <div className="kpi-icon aov">
              ₹
            </div>

          </div>


          <h3>

            {formatINR(
              kpi?.average_order_value
            )}

          </h3>


          <p>
            Average revenue per order
          </p>

        </div>


      </section>



      {/* ======================================================
          CATEGORY REVENUE + DEMAND FORECAST
      ====================================================== */}

      <section className="dashboard-grid">


        {/* ====================================================
            CATEGORY REVENUE
        ==================================================== */}

        <div className="dashboard-card large-card">

          <div className="card-heading">

            <div>

              <h3>
                Category Revenue
              </h3>

              <p>
                Revenue distribution by category
              </p>

            </div>

          </div>


          {processedCategoryRevenue.length === 0 ? (

            <div className="revenue-data">

              <p>
                No category revenue data available.
              </p>

            </div>

          ) : (

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                gap: "30px",
                padding: "20px 10px",
                flexWrap: "wrap",
              }}
            >


              {/* ==================================================
                  DONUT CHART
              ================================================== */}

              <div
                style={{
                  width: "220px",
                  height: "220px",
                  borderRadius: "50%",
                  position: "relative",
                  flexShrink: 0,
                  ...getCategoryPieStyle(),
                }}
              >

                {/* INNER CIRCLE */}

                <div
                  style={{
                    position: "absolute",
                    width: "120px",
                    height: "120px",
                    background: "#ffffff",
                    borderRadius: "50%",
                    top: "50%",
                    left: "50%",
                    transform:
                      "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >

                  <strong
                    style={{
                      fontSize: "15px",
                    }}
                  >
                    Total
                  </strong>

                  <span
                    style={{
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    Revenue
                  </span>

                </div>

              </div>



              {/* ==================================================
                  LEGEND
              ================================================== */}

              <div
                style={{
                  flex: 1,
                  minWidth: "220px",
                }}
              >

                {processedCategoryRevenue.map(
                  (item, index) => {

                    const percentage =
                      totalCategoryRevenue > 0
                        ? (
                            item.revenue /
                            totalCategoryRevenue
                          ) * 100
                        : 0;


                    return (

                      <div
                        key={item.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          gap: "12px",
                          padding:
                            "9px 0",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            minWidth: 0,
                          }}
                        >

                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius:
                                "50%",
                              background:
                                categoryColors[
                                  index %
                                  categoryColors.length
                                ],
                              flexShrink: 0,
                            }}
                          />

                          <span
                            style={{
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {item.name}
                          </span>

                        </div>


                        <div
                          style={{
                            textAlign:
                              "right",
                            flexShrink: 0,
                          }}
                        >

                          <strong>
                            {formatINR(
                              item.revenue
                            )}
                          </strong>

                          <small
                            style={{
                              display:
                                "block",
                              color:
                                "#64748b",
                              marginTop:
                                "2px",
                            }}
                          >
                            {percentage.toFixed(
                              1
                            )}
                            %
                          </small>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            </div>

          )}

        </div>



        {/* ====================================================
            DEMAND FORECAST
        ==================================================== */}

        <div className="dashboard-card">

          <div className="card-heading">

            <div>

              <h3>
                Demand Forecast
              </h3>

              <p>
                Upcoming demand prediction
              </p>

            </div>

          </div>


          <div className="forecast-number">

            <strong>

              {Number(
                kpi?.total_units_sold || 0
              ).toLocaleString(
                "en-IN"
              )}

            </strong>

            <span>
              Total units sold
            </span>

          </div>


          <button className="secondary-button">

            View Forecast

          </button>

        </div>


      </section>



      {/* ======================================================
          BOTTOM SECTION
      ====================================================== */}

      <section className="dashboard-grid">


        {/* ====================================================
            TOP PRODUCTS
        ==================================================== */}

        <div className="dashboard-card">

          <div className="card-heading">

            <div>

              <h3>
                Top Products
              </h3>

              <p>
                Products by revenue
              </p>

            </div>

          </div>


          <div className="product-list">

            {topProducts.length === 0 ? (

              <p>
                No product sales data available.
              </p>

            ) : (

              topProducts
                .slice(0, 5)
                .map(
                  (product, index) => (

                    <div
                      className="product-row"
                      key={
                        product.product_id ??
                        product.product_code ??
                        index
                      }
                    >

                      <div className="product-rank">

                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}

                      </div>


                      <div className="product-info">

                        <strong>

                          {product.product_name}

                        </strong>


                        <span>

                          {Number(
                            product.units_sold ||
                            0
                          ).toLocaleString(
                            "en-IN"
                          )}

                          {" "}
                          units sold

                        </span>

                      </div>


                      <strong>

                        {formatINR(
                          product.revenue
                        )}

                      </strong>

                    </div>

                  )
                )

            )}

          </div>

        </div>



        {/* ====================================================
            AI INSIGHTS
        ==================================================== */}

        <div className="dashboard-card">

          <div className="card-heading">

            <div>

              <h3>
                AI Insights
              </h3>

              <p>
                Latest business recommendations
              </p>

            </div>


            <span className="ai-badge">
              AI
            </span>

          </div>



          <div className="insight warning">

            <div className="insight-icon">
              !
            </div>


            <div>

              <strong>
                Pricing opportunity
              </strong>

              <p>
                Review current pricing
                using PricePilot analysis.
              </p>

            </div>

          </div>



          <div className="insight success">

            <div className="insight-icon">
              ✓
            </div>


            <div>

              <strong>
                Demand opportunity
              </strong>

              <p>
                Use demand forecasting to
                identify upcoming opportunities.
              </p>

            </div>

          </div>



          <button className="secondary-button">

            View AI Recommendations

          </button>

        </div>


      </section>


    </div>

  );

}

export default Dashboard;