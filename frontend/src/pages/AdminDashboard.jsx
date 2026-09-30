import React, { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const API_BASE_URL = "http://127.0.0.1:8000";

// Dataset values are in GBP
const GBP_TO_INR = 126.9;

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =========================================
  // LOAD DATA
  // =========================================

  useEffect(() => {
    fetchAdminData();
  }, []);


  // =========================================
  // FORMAT INR
  // =========================================

  const formatINR = (value) => {
    const inrValue =
      Number(value || 0) * GBP_TO_INR;

    return inrValue.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  };


  // =========================================
  // FORMAT PRODUCT NAME
  // Example:
  // 3 WICK CHRISTMAS BRIAR CANDLE
  // →
  // 3 Wick Christmas Briar Candle
  // =========================================

  const formatProductName = (name) => {
    if (!name) {
      return "Product";
    }

    return name
      .toLowerCase()
      .split(" ")
      .map((word) => {

        if (!word) {
          return "";
        }

        return (
          word.charAt(0).toUpperCase() +
          word.slice(1)
        );

      })
      .join(" ");
  };


  // =========================================
  // FETCH ADMIN DATA
  // =========================================

  const fetchAdminData = async () => {

    try {

      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("access_token");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };


      // =====================================
      // KPI SUMMARY
      // =====================================

      const summaryResponse = await fetch(
        `${API_BASE_URL}/kpi/summary`,
        {
          method: "GET",
          headers,
        }
      );

      if (!summaryResponse.ok) {

        throw new Error(
          "Failed to fetch admin KPI data"
        );

      }

      const summaryData =
        await summaryResponse.json();


      // =====================================
      // TOP PRODUCTS
      // =====================================

      const productsResponse = await fetch(
        `${API_BASE_URL}/kpi/top-products`,
        {
          method: "GET",
          headers,
        }
      );

      if (!productsResponse.ok) {

        throw new Error(
          "Failed to fetch product data"
        );

      }

      const productsData =
        await productsResponse.json();


      // =====================================
      // CATEGORY REVENUE
      // =====================================

      const categoryResponse = await fetch(
        `${API_BASE_URL}/kpi/category-revenue`,
        {
          method: "GET",
          headers,
        }
      );

      if (!categoryResponse.ok) {

        throw new Error(
          "Failed to fetch category revenue"
        );

      }

      const categoryData =
        await categoryResponse.json();


      // =====================================
      // SET DATA
      // =====================================

      setSummary(summaryData);
      setTopProducts(productsData);
      setCategoryRevenue(categoryData);

    }

    catch (err) {

      console.error(
        "Admin dashboard error:",
        err
      );

      setError(err.message);

    }

    finally {

      setLoading(false);

    }

  };


  // =========================================
  // TOP PRODUCTS CHART DATA
  // =========================================

  const topProductChartData = topProducts
    .slice(0, 5)
    .map((product) => ({

      name: formatProductName(
        product.product_name
      ),

      revenue:
        Number(product.revenue || 0) *
        GBP_TO_INR,

    }));


  // =========================================
  // CATEGORY REVENUE CHART DATA
  // =========================================

  const categoryChartData = categoryRevenue
    .slice(0, 6)
    .map((category) => ({

      name: category.category_name,

      revenue:
        Number(category.revenue || 0) *
        GBP_TO_INR,

    }));


  // =========================================
  // DISTINCT CATEGORY COLORS
  // =========================================

  const PIE_COLORS = [

    "#6366F1", // Indigo

    "#22C55E", // Green

    "#F59E0B", // Amber

    "#EF4444", // Red

    "#06B6D4", // Cyan

    "#A855F7", // Purple

    "#F97316", // Orange

    "#14B8A6", // Teal

  ];


  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (

      <div className="dashboard">

        <h2>
          Admin Dashboard
        </h2>

        <p>
          Loading dashboard data...
        </p>

      </div>

    );

  }


  // =========================================
  // ERROR
  // =========================================

  if (error) {

    return (

      <div className="dashboard">

        <h2>
          Admin Dashboard
        </h2>

        <div className="placeholder-page">

          <h3>
            Unable to load dashboard
          </h3>

          <p>
            {error}
          </p>

          <button
            className="primary-button"
            onClick={fetchAdminData}
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  // =========================================
  // DASHBOARD
  // =========================================

  return (

    <div className="dashboard">


      {/* =====================================
          HEADER
      ===================================== */}

      <section className="welcome-section">

        <div>

          <h2>
            Admin Dashboard
          </h2>

          <p>
            Monitor overall PricePilot business
            performance and system data.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={fetchAdminData}
        >
          Refresh Data
        </button>

      </section>



      {/* =====================================
          KPI CARDS
      ===================================== */}

      <section className="kpi-grid">


        {/* TOTAL REVENUE */}

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
            ₹{formatINR(
              summary?.total_revenue
            )}
          </h3>


          <p>
            Overall revenue
          </p>

        </div>



        {/* TOTAL SALES */}

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
              summary?.total_sales || 0
            ).toLocaleString("en-IN")}

          </h3>


          <p>
            Sales transactions
          </p>

        </div>



        {/* TOTAL PRODUCTS */}

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
              summary?.total_products || 0
            ).toLocaleString("en-IN")}

          </h3>


          <p>
            Products in system
          </p>

        </div>



        {/* UNIQUE ORDERS */}

        <div className="kpi-card">

          <div className="kpi-header">

            <span>
              Unique Orders
            </span>

            <div className="kpi-icon aov">
              #
            </div>

          </div>


          <h3>

            {Number(
              summary?.unique_orders || 0
            ).toLocaleString("en-IN")}

          </h3>


          <p>
            Unique invoices
          </p>

        </div>

      </section>



      {/* =====================================
          ADMIN ANALYTICS CHARTS
      ===================================== */}

      <section className="dashboard-grid">


        {/* =====================================
            TOP PRODUCTS BAR CHART
        ===================================== */}

        <div className="dashboard-card">


          <div className="card-heading">

            <div>

              <h3>
                Top Products
              </h3>

              <p>
                Highest revenue products
              </p>

            </div>

          </div>



          <div
            style={{
              width: "100%",
              height: "340px",
              marginTop: "10px",
            }}
          >


            {topProductChartData.length === 0 ? (

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: "14px",
                }}
              >

                No product data available.

              </div>

            ) : (


              <ResponsiveContainer
                width="100%"
                height="100%"
              >


                <BarChart
                  data={topProductChartData}

                  barCategoryGap="40%"

                  margin={{
                    top: 20,
                    right: 25,
                    left: 20,
                    bottom: 20,
                  }}
                >


                  {/* X AXIS */}

                  <XAxis
                    dataKey="name"
                    interval={0}
                    height={75}

                    tick={{
                      fontSize: 10,
                      fontWeight: 500,
                    }}

                    tickFormatter={(value) => {

                      const words =
                        value.split(" ");

                      if (
                        words.length <= 2
                      ) {

                        return value;

                      }

                      const midpoint =
                        Math.ceil(
                          words.length / 2
                        );

                      return [

                        words
                          .slice(
                            0,
                            midpoint
                          )
                          .join(" "),

                        words
                          .slice(midpoint)
                          .join(" "),

                      ];

                    }}
                  />


                  {/* Y AXIS */}

                  <YAxis

                    tick={{
                      fontSize: 12,
                    }}

                    tickFormatter={(value) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }

                  />


                  {/* TOOLTIP */}

                  <Tooltip

                    contentStyle={{
                      fontSize: "13px",
                      borderRadius: "8px",
                    }}

                    labelStyle={{
                      fontSize: "13px",
                      fontWeight: "600",
                    }}

                    formatter={(value) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }

                  />


                  {/* BAR */}

                  <Bar

                    dataKey="revenue"

                    name="Revenue"

                    barSize={26}

                    fill="#6366F1"

                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}

                  />


                </BarChart>

              </ResponsiveContainer>

            )}

          </div>

        </div>



        {/* =====================================
            CATEGORY REVENUE DONUT CHART
        ===================================== */}

        <div className="dashboard-card">


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



          <div
            style={{
              width: "100%",
              height: "340px",
              marginTop: "10px",
            }}
          >


            {categoryChartData.length === 0 ? (

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: "14px",
                }}
              >

                No category data available.

              </div>

            ) : (


              <ResponsiveContainer
                width="100%"
                height="100%"
              >


                <PieChart>


                  <Pie

                    data={categoryChartData}

                    dataKey="revenue"

                    nameKey="name"

                    cx="50%"

                    cy="43%"

                    innerRadius={65}

                    outerRadius={105}

                    paddingAngle={4}

                  >


                    {categoryChartData.map(
                      (entry, index) => (

                        <Cell
                          key={`category-${index}`}

                          fill={
                            PIE_COLORS[
                              index %
                              PIE_COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>



                  {/* TOOLTIP */}

                  <Tooltip

                    contentStyle={{
                      fontSize: "13px",
                      borderRadius: "8px",
                    }}

                    formatter={(value) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }

                  />



                  {/* LEGEND */}

                  <Legend

                    verticalAlign="bottom"

                    height={55}

                    wrapperStyle={{
                      fontSize: "13px",
                    }}

                  />


                </PieChart>

              </ResponsiveContainer>

            )}

          </div>

        </div>


      </section>

    </div>

  );
}

export default AdminDashboard;