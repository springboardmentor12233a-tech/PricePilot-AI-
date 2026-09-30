import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

// ============================================================
// API
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

// Online Retail dataset is in GBP
const GBP_TO_INR = 125;

function ProductAnalytics() {
  const { user } = useAuth();

  // ============================================================
  // STATE
  // ============================================================

  const [products, setProducts] = useState([]);
  const [productCode, setProductCode] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const [productsLoading, setProductsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // ROLE
  // ============================================================

  const rawRole = user?.role || "User";

  const userRole = rawRole
    .toLowerCase()
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      setError("");

      const token =
        localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/pricing/products`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log("PRODUCTS RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load products"
        );
      }

      setProducts(data);

      if (data.length > 0) {
        setProductCode(
          String(data[0].product_code)
        );
      }
    } catch (err) {
      console.error(
        "Products Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load products"
      );
    } finally {
      setProductsLoading(false);
    }
  };

  // ============================================================
  // LOAD ANALYTICS WHEN PRODUCT CHANGES
  // ============================================================

  useEffect(() => {
    if (productCode) {
      loadProductAnalytics(productCode);
    }
  }, [productCode]);

  // ============================================================
  // LOAD PRODUCT ANALYTICS
  // ============================================================

  const loadProductAnalytics = async (code) => {
    try {
      setAnalyticsLoading(true);
      setError("");
      setAnalytics(null);

      const token =
        localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/pricing/product-analytics/${code}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "===================================="
      );

      console.log(
        "PRODUCT ANALYTICS RESPONSE"
      );

      console.log(
        "===================================="
      );

      console.log(data);

      console.log(
        "MONTHLY SALES:",
        data.monthly_sales
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load product analytics"
        );
      }

      // ========================================================
      // MONTHLY SALES
      // ========================================================

      const monthlySales =
        Array.isArray(
          data.monthly_sales
        )
          ? data.monthly_sales
          : [];

      console.log(
        "MONTHLY SALES LENGTH:",
        monthlySales.length
      );

      // ========================================================
      // SALES TREND
      //
      // 1. Sort by actual backend month
      // 2. Keep latest 12 months
      // 3. Display Month 1 -> Month 12
      //
      // Actual dataset dates are NOT changed.
      // ========================================================

      const latest12Months =
        [...monthlySales]
          .sort((a, b) =>
            String(
              a.month || ""
            ).localeCompare(
              String(
                b.month || ""
              )
            )
          )
          .slice(-12);

      const salesTrend =
        latest12Months.map(
          (item, index) => ({
            month: item.month,

            // Display-only label
            label: `Month ${index + 1}`,

            units: Number(
              item.units_sold ?? 0
            ),

            units_sold: Number(
              item.units_sold ?? 0
            ),

            revenue: Number(
              item.revenue ?? 0
            ),
          })
        );

      console.log(
        "LATEST 12 MONTHS:",
        latest12Months
      );

      console.log(
        "SALES TREND:",
        salesTrend
      );

      console.log(
        "SALES TREND LENGTH:",
        salesTrend.length
      );

      // ========================================================
      // BASIC VALUES
      // ========================================================

      const totalUnitsSold =
        Number(
          data.total_units_sold ?? 0
        );

      const totalRevenue =
        Number(
          data.total_revenue ?? 0
        );

      const totalTransactions =
        Number(
          data.total_transactions ?? 0
        );

      const currentPrice =
        Number(
          data.current_price ?? 0
        );

      const averageSellingPrice =
        Number(
          data.average_selling_price ?? 0
        );

      const averageOrderValue =
        Number(
          data.average_order_value ?? 0
        );

      // ========================================================
      // AVERAGE UNITS PER ORDER
      // ========================================================

      const averageUnitsPerOrder =
        totalTransactions > 0
          ? totalUnitsSold /
            totalTransactions
          : 0;

      // ========================================================
      // SALES TREND DIRECTION
      // ========================================================

      let salesTrendDirection =
        "Stable";

      if (salesTrend.length >= 2) {
        const firstUnits =
          Number(
            salesTrend[0].units || 0
          );

        const lastUnits =
          Number(
            salesTrend[
              salesTrend.length - 1
            ].units || 0
          );

        if (
          lastUnits >
          firstUnits * 1.05
        ) {
          salesTrendDirection =
            "Increasing";
        } else if (
          lastUnits <
          firstUnits * 0.95
        ) {
          salesTrendDirection =
            "Decreasing";
        }
      }

      // ========================================================
      // CATEGORY
      // ========================================================

      const categoryRevenue =
        Number(
          data.category_revenue ??
            totalRevenue
        );

      const categoryShare =
        categoryRevenue > 0
          ? (totalRevenue /
              categoryRevenue) *
            100
          : 0;

      // ========================================================
      // CONVERT SALES DATA TO INR
      // ========================================================

      const convertedSalesTrend =
        salesTrend.map(
          (item) => ({
            ...item,

            revenue:
              item.revenue *
              GBP_TO_INR,

            units:
              item.units,
          })
        );

      // ========================================================
      // FINAL ANALYTICS OBJECT
      // ========================================================

      const convertedData = {
        ...data,

        // Product
        product_code:
          data.product_code,

        product_name:
          data.product_name,

        category:
          data.category ||
          "Other",

        // Currency
        current_price:
          currentPrice *
          GBP_TO_INR,

        product_revenue:
          totalRevenue *
          GBP_TO_INR,

        total_revenue:
          totalRevenue *
          GBP_TO_INR,

        average_selling_price:
          averageSellingPrice *
          GBP_TO_INR,

        average_order_value:
          averageOrderValue *
          GBP_TO_INR,

        category_revenue:
          categoryRevenue *
          GBP_TO_INR,

        // Units
        units_sold:
          totalUnitsSold,

        total_units_sold:
          totalUnitsSold,

        // Orders
        total_orders:
          totalTransactions,

        total_transactions:
          totalTransactions,

        // Calculated
        average_units_per_order:
          averageUnitsPerOrder,

        sales_trend_direction:
          salesTrendDirection,

        category_share:
          categoryShare,

        category_rank:
          data.category_rank ??
          null,

        // Latest 12 months
        sales_trend:
          convertedSalesTrend,

        // Keep original backend data
        monthly_sales:
          monthlySales,
      };

      console.log(
        "FINAL ANALYTICS OBJECT:",
        convertedData
      );

      console.log(
        "FINAL SALES TREND:",
        convertedData.sales_trend
      );

      setAnalytics(
        convertedData
      );
    } catch (err) {
      console.error(
        "Product Analytics Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load product analytics"
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ============================================================
  // CURRENCY FORMAT
  // ============================================================

  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ============================================================
  // NUMBER FORMAT
  // ============================================================

  const formatNumber = (value) => {
    return Number(
      value || 0
    ).toLocaleString(
      "en-IN"
    );
  };

  // ============================================================
  // MONTH LABEL
  // ============================================================

  const formatMonthLabel = (index) => {
    return `Month ${index + 1}`;
  };

  // ============================================================
  // MAX UNITS
  // ============================================================

  const getMaxUnits = () => {
    const trend =
      analytics?.sales_trend ||
      [];

    if (trend.length === 0) {
      return 1;
    }

    return Math.max(
      ...trend.map(
        (item) =>
          Number(
            item.units || 0
          )
      ),
      1
    );
  };

  // ============================================================
  // LOADING PRODUCTS
  // ============================================================

  if (productsLoading) {
    return (
      <div className="dashboard">

        <section className="dashboard-card">

          <h3>
            Loading Products...
          </h3>

          <p>
            Fetching products for
            product analytics.
          </p>

        </section>

      </div>
    );
  }

  // ============================================================
  // NO PRODUCTS
  // ============================================================

  if (products.length === 0) {
    return (
      <div className="dashboard">

        <section className="dashboard-card">

          <h3>
            No Products Available
          </h3>

          <p>
            No active products were found.
          </p>

          <button
            className="primary-button"
            onClick={loadProducts}
            style={{
              marginTop: "20px",
            }}
          >
            Reload Products
          </button>

        </section>

      </div>
    );
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <div className="dashboard">

      {/* ======================================================
          IMPORTANT:
          The duplicate "Product Analytics" welcome header
          has been removed.

          Your main Dashboard layout already displays:
          Product Analytics
      ====================================================== */}

      {/* ======================================================
          PRODUCT SELECTOR
      ====================================================== */}

      <section className="dashboard-card">

        <div className="card-heading">

          <div>

            <h3>
              Select Product
            </h3>

            <p>
              Choose a product to view
              its detailed performance.
            </p>

          </div>

        </div>

        <div
          style={{
            marginTop: "20px",
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            Product
          </label>

          <select
            value={productCode}
            onChange={(e) =>
              setProductCode(
                e.target.value
              )
            }
            disabled={
              analyticsLoading
            }
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border:
                "1px solid #d1d5db",
              fontSize: "14px",
              background: "white",
            }}
          >

            {products.map(
              (product) => (

                <option
                  key={
                    product.product_code
                  }
                  value={
                    product.product_code
                  }
                >
                  {
                    product.product_code
                  }{" "}
                  -{" "}
                  {product.name}
                </option>

              )
            )}

          </select>

          <div
            style={{
              marginTop: "8px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            {products.length.toLocaleString(
              "en-IN"
            )}{" "}
            products available
          </div>

        </div>

      </section>

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
            {error}
          </div>

          <button
            className="primary-button"
            onClick={() =>
              loadProductAnalytics(
                productCode
              )
            }
            style={{
              marginTop: "20px",
            }}
          >
            Retry
          </button>

        </section>
      )}

      {/* ======================================================
          LOADING ANALYTICS
      ====================================================== */}

      {analyticsLoading && (
        <section className="dashboard-card">

          <h3>
            Loading Product Analytics...
          </h3>

          <p>
            Analyzing sales and revenue
            for product{" "}
            <strong>
              {productCode}
            </strong>.
          </p>

        </section>
      )}

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {!analyticsLoading &&
        analytics && (
          <>

            {/* ==================================================
                PRODUCT INFORMATION
            ================================================== */}

            <section className="dashboard-card">

              <div className="card-heading">

                <div>

                  <h3>
                    {
                      analytics.product_name
                    }
                  </h3>

                  <p>
                    Product Code:{" "}
                    {
                      analytics.product_code
                    }

                    {" • "}

                    Category:{" "}
                    {
                      analytics.category ||
                      "Other"
                    }
                  </p>

                </div>

              </div>

            </section>

            {/* ==================================================
                PRODUCT KPIs
            ================================================== */}

            <section className="kpi-grid">

              {/* PRODUCT REVENUE */}

              <div className="kpi-card">

                <div className="kpi-header">

                  <span>
                    Product Revenue
                  </span>

                  <div className="kpi-icon revenue">
                    ₹
                  </div>

                </div>

                <h3>
                  {formatCurrency(
                    analytics.product_revenue
                  )}
                </h3>

                <p>
                  Total revenue generated
                </p>

              </div>

              {/* UNITS SOLD */}

              <div className="kpi-card">

                <div className="kpi-header">

                  <span>
                    Units Sold
                  </span>

                  <div className="kpi-icon customers">
                    ●
                  </div>

                </div>

                <h3>
                  {formatNumber(
                    analytics.units_sold
                  )}
                </h3>

                <p>
                  Total units sold
                </p>

              </div>

              {/* ORDERS */}

              <div className="kpi-card">

                <div className="kpi-header">

                  <span>
                    Orders
                  </span>

                  <div className="kpi-icon orders">
                    #
                  </div>

                </div>

                <h3>
                  {formatNumber(
                    analytics.total_orders
                  )}
                </h3>

                <p>
                  Number of orders
                </p>

              </div>

              {/* AVERAGE SELLING PRICE */}

              <div className="kpi-card">

                <div className="kpi-header">

                  <span>
                    Average Selling Price
                  </span>

                  <div className="kpi-icon aov">
                    ₹
                  </div>

                </div>

                <h3>
                  {formatCurrency(
                    analytics.average_selling_price
                  )}
                </h3>

                <p>
                  Average price per unit
                </p>

              </div>

            </section>

            {/* ==================================================
                SALES TREND
            ================================================== */}

            <section className="dashboard-card">

              <div className="card-heading">

                <div>

                  <h3>
                    Sales Trend
                  </h3>

                  <p>
                    Units sold across the latest
                    12 months of available sales data.
                  </p>

                </div>

                <div>
                  <strong>
                    {
                      analytics.sales_trend
                        ?.length || 0
                    }
                  </strong>{" "}
                  months
                </div>

              </div>

              {analytics.sales_trend &&
              analytics.sales_trend.length >
                0 ? (

                <div
                  style={{
                    marginTop: "30px",
                    display: "flex",
                    alignItems:
                      "flex-end",
                    gap: "18px",
                    height: "320px",
                    overflowX: "auto",
                    padding:
                      "20px 10px 20px",
                    borderTop:
                      "1px solid #e5e7eb",
                  }}
                >

                  {analytics.sales_trend.map(
                    (
                      item,
                      index
                    ) => {

                      const units =
                        Number(
                          item.units ??
                            0
                        );

                      const maxUnits =
                        getMaxUnits();

                      const height =
                        maxUnits > 0
                          ? (units /
                              maxUnits) *
                            220
                          : 4;

                      return (
                        <div
                          key={`${item.month}-${index}`}
                          style={{
                            minWidth:
                              "75px",
                            height:
                              "280px",
                            display:
                              "flex",
                            flexDirection:
                              "column",
                            justifyContent:
                              "flex-end",
                            alignItems:
                              "center",
                          }}
                        >

                          {/* VALUE */}

                          <span
                            style={{
                              fontSize:
                                "12px",
                              fontWeight:
                                "600",
                              marginBottom:
                                "8px",
                              color:
                                "#374151",
                            }}
                          >
                            {formatNumber(
                              units
                            )}
                          </span>

                          {/* BAR */}

                          <div
                            style={{
                              width:
                                "40px",
                              height:
                                `${Math.max(
                                  height,
                                  5
                                )}px`,
                              background:
                                "#2563eb",
                              borderRadius:
                                "6px 6px 0 0",
                              transition:
                                "height 0.3s ease",
                            }}
                          />

                          {/* X-AXIS LABEL */}

                          <span
                            style={{
                              marginTop:
                                "12px",
                              fontSize:
                                "11px",
                              color:
                                "#6b7280",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {formatMonthLabel(
                              index
                            )}
                          </span>

                        </div>
                      );
                    }
                  )}

                </div>

              ) : (

                <div
                  style={{
                    marginTop:
                      "20px",
                    padding:
                      "25px",
                    background:
                      "#f8fafc",
                    borderRadius:
                      "8px",
                    color:
                      "#6b7280",
                  }}
                >
                  No sales trend
                  data available.
                </div>

              )}

            </section>

            {/* ==================================================
                CATEGORY PERFORMANCE
            ================================================== */}

            <section className="dashboard-card">

              <div className="card-heading">

                <div>

                  <h3>
                    Category Performance
                  </h3>

                  <p>
                    Compare this product
                    with its category.
                  </p>

                </div>

              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >

                {/* CATEGORY */}

                <div
                  style={{
                    padding:
                      "20px",
                    background:
                      "#f8fafc",
                    borderRadius:
                      "10px",
                  }}
                >

                  <span
                    style={{
                      display:
                        "block",
                      color:
                        "#6b7280",
                      fontSize:
                        "13px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    Category
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "20px",
                    }}
                  >
                    {
                      analytics.category ||
                      "Other"
                    }
                  </strong>

                </div>

                {/* CATEGORY REVENUE */}

                <div
                  style={{
                    padding:
                      "20px",
                    background:
                      "#f8fafc",
                    borderRadius:
                      "10px",
                  }}
                >

                  <span
                    style={{
                      display:
                        "block",
                      color:
                        "#6b7280",
                      fontSize:
                        "13px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    Category Revenue
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "20px",
                    }}
                  >
                    {formatCurrency(
                      analytics.category_revenue
                    )}
                  </strong>

                </div>

                {/* PRODUCT SHARE */}

                <div
                  style={{
                    padding:
                      "20px",
                    background:
                      "#f8fafc",
                    borderRadius:
                      "10px",
                  }}
                >

                  <span
                    style={{
                      display:
                        "block",
                      color:
                        "#6b7280",
                      fontSize:
                        "13px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    Product Share
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "20px",
                    }}
                  >
                    {Number(
                      analytics.category_share ||
                        0
                    ).toFixed(
                      2
                    )}
                    %
                  </strong>

                </div>

                {/* CATEGORY RANK */}

                <div
                  style={{
                    padding:
                      "20px",
                    background:
                      "#f8fafc",
                    borderRadius:
                      "10px",
                  }}
                >

                  <span
                    style={{
                      display:
                        "block",
                      color:
                        "#6b7280",
                      fontSize:
                        "13px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    Category Rank
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "20px",
                    }}
                  >
                    #
                    {analytics.category_rank ||
                      "-"}
                  </strong>

                </div>

              </div>

            </section>

            {/* ==================================================
                PRODUCT PERFORMANCE
            ================================================== */}

            <section className="dashboard-card">

              <div className="card-heading">

                <div>

                  <h3>
                    Product Performance
                  </h3>

                  <p>
                    Key performance indicators
                    for the selected product.
                  </p>

                </div>

              </div>

              <div
                style={{
                  marginTop:
                    "20px",
                }}
              >

                {/* SALES TREND */}

                <div className="confidence">

                  <div className="confidence-top">

                    <span>
                      Sales Trend
                    </span>

                    <strong>
                      {
                        analytics.sales_trend_direction ||
                        "Stable"
                      }
                    </strong>

                  </div>

                </div>

                {/* AVERAGE UNITS PER ORDER */}

                <div className="confidence">

                  <div className="confidence-top">

                    <span>
                      Average Units per Order
                    </span>

                    <strong>
                      {Number(
                        analytics.average_units_per_order ||
                          0
                      ).toFixed(2)}
                    </strong>

                  </div>

                </div>

                {/* CURRENT PRICE */}

                <div className="confidence">

                  <div className="confidence-top">

                    <span>
                      Current Price
                    </span>

                    <strong>
                      {formatCurrency(
                        analytics.current_price
                      )}
                    </strong>

                  </div>

                </div>

                {/* TOTAL REVENUE */}

                <div className="confidence">

                  <div className="confidence-top">

                    <span>
                      Total Revenue
                    </span>

                    <strong>
                      {formatCurrency(
                        analytics.product_revenue
                      )}
                    </strong>

                  </div>

                </div>

              </div>

            </section>

            {/* ==================================================
                REFRESH
            ================================================== */}

            <section
              style={{
                marginTop:
                  "20px",
                marginBottom:
                  "30px",
              }}
            >

              <button
                className="primary-button"
                onClick={() =>
                  loadProductAnalytics(
                    productCode
                  )
                }
                disabled={
                  analyticsLoading
                }
              >
                {analyticsLoading
                  ? "Refreshing..."
                  : "Refresh Analytics"}
              </button>

            </section>

          </>
        )}

    </div>
  );
}

export default ProductAnalytics;