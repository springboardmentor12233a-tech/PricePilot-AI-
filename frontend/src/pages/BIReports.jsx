import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";

const API_BASE_URL = "http://127.0.0.1:8000";
const GBP_TO_INR = 126.9;

function BIReports() {
  const [kpis, setKpis] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD REPORT DATA
  // ============================================================

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
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
      console.error("BI Report Error:", err);

      setError(
        err.message ||
          "Unable to load report data"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  // ============================================================
  // GET PRODUCT NAME
  // ============================================================

  const getProductName = (product) => {
    if (!product) {
      return "Unknown Product";
    }

    const name =
      product.product_name ||
      product.name ||
      product.description ||
      product.Description ||
      product.Product_Name ||
      product.Product ||
      product.product ||
      "";

    if (!name) {
      return "Unknown Product";
    }

    return String(name)
      .replace(/\s+,/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  };

  // ============================================================
  // GET PRODUCT QUANTITY
  // ============================================================

  const getProductQuantity = (product) => {
    return getNumber(
      product.quantity ??
        product.total_quantity ??
        product.units_sold
    );
  };

  // ============================================================
  // GET PRODUCT REVENUE
  // ============================================================

  const getProductRevenue = (product) => {
    return getNumber(
      product.revenue ??
        product.total_revenue ??
        product.sales
    );
  };

  // ============================================================
  // TOP PRODUCTS BY QUANTITY
  // ============================================================

  const topQuantityProducts = [...products]
    .sort(
      (a, b) =>
        getProductQuantity(b) -
        getProductQuantity(a)
    )
    .slice(0, 5);

  // ============================================================
  // TOP PRODUCTS BY REVENUE
  // ============================================================

  const topRevenueProducts = [...products]
    .sort(
      (a, b) =>
        getProductRevenue(b) -
        getProductRevenue(a)
    )
    .slice(0, 5);

  // ============================================================
  // KPI VALUES
  // ============================================================

  const totalRevenueGBP = getNumber(
    kpis?.total_revenue
  );

  const totalRevenueINR =
    totalRevenueGBP * GBP_TO_INR;

  const totalSales = getNumber(
    kpis?.total_sales
  );

  const totalProducts = getNumber(
    kpis?.total_products
  );

  const uniqueOrders = getNumber(
    kpis?.unique_orders
  );

  // ============================================================
  // BUSINESS INSIGHTS
  // ============================================================

  const generateBusinessInsights = () => {
    const insights = [];

    if (topQuantityProducts.length > 0) {
      const topProduct =
        topQuantityProducts[0];

      insights.push(
        `${getProductName(
          topProduct
        )} is among the highest-performing products by quantity sold.`
      );
    }

    if (totalRevenueINR > 0) {
      insights.push(
        `The business has generated approximately INR ${totalRevenueINR.toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )} in total revenue based on the available sales data.`
      );
    }

    if (totalProducts > 0) {
      insights.push(
        `The report covers ${totalProducts.toLocaleString(
          "en-IN"
        )} products in the available business data.`
      );
    }

    if (uniqueOrders > 0) {
      insights.push(
        `The available sales data contains ${uniqueOrders.toLocaleString(
          "en-IN"
        )} unique orders.`
      );
    }

    return insights;
  };

  // ============================================================
  // DOWNLOAD PDF REPORT
  // ============================================================

  const handleDownloadReport = () => {
    const doc = new jsPDF();

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    const margin = 18;

    const contentWidth =
      pageWidth - margin * 2;

    let y = 20;

    // ==========================================================
    // PDF HELPERS
    // ==========================================================

    const cleanText = (text) => {
      if (!text) {
        return "";
      }

      return String(text)
        .replace(/\s+,/g, ",")
        .replace(/\s+/g, " ")
        .trim();
    };

    const addFooter = () => {
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.text(
        "PricePilot AI | Dynamic Pricing & Revenue Intelligence System",
        margin,
        pageHeight - 10
      );
    };

    const newPage = () => {
      addFooter();

      doc.addPage();

      y = 20;
    };

    const checkPageBreak = (
      requiredSpace = 20
    ) => {
      if (
        y + requiredSpace >
        pageHeight - 20
      ) {
        newPage();
      }
    };

    const addWrappedText = (
      text,
      x,
      currentY,
      fontSize = 10,
      maxWidth = contentWidth,
      lineSpacing = 5.5
    ) => {
      doc.setFontSize(fontSize);

      const lines =
        doc.splitTextToSize(
          cleanText(text),
          maxWidth
        );

      doc.text(
        lines,
        x,
        currentY
      );

      return (
        currentY +
        lines.length * lineSpacing
      );
    };

    const addSectionTitle = (
      title
    ) => {
      checkPageBreak(25);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(14);

      doc.text(
        title,
        margin,
        y
      );

      y += 9;

      doc.setFont(
        "helvetica",
        "normal"
      );
    };

    const addSubTitle = (
      title
    ) => {
      checkPageBreak(18);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(11);

      doc.text(
        title,
        margin,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );
    };

    const addLine = (
      text,
      gap = 5.5
    ) => {
      checkPageBreak(12);

      y = addWrappedText(
        text,
        margin,
        y,
        10,
        contentWidth,
        gap
      );

      y += 2;
    };

    // ==========================================================
    // REPORT TITLE
    // ==========================================================

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(20);

    doc.text(
      "PRICEPILOT AI",
      margin,
      y
    );

    y += 9;

    doc.setFontSize(14);

    doc.text(
      "Business Intelligence Report",
      margin,
      y
    );

    y += 14;

    doc.setFont(
      "helvetica",
      "normal"
    );

    // ==========================================================
    // 1. BUSINESS OVERVIEW
    // ==========================================================

    addSectionTitle(
      "1. Business Overview"
    );

    addLine(
      `Total Revenue: INR ${totalRevenueINR.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`
    );

    addLine(
      `Total Sales: ${totalSales.toLocaleString(
        "en-IN"
      )}`
    );

    addLine(
      `Total Products: ${totalProducts.toLocaleString(
        "en-IN"
      )}`
    );

    addLine(
      `Unique Orders: ${uniqueOrders.toLocaleString(
        "en-IN"
      )}`
    );

    y += 5;

    // ==========================================================
    // 2. PRODUCT PERFORMANCE
    // ==========================================================

    addSectionTitle(
      "2. Product Performance"
    );

    // ----------------------------------------------------------
    // TOP PRODUCTS BY QUANTITY
    // ----------------------------------------------------------

    addSubTitle(
      "Top Products by Quantity"
    );

    if (
      topQuantityProducts.length === 0
    ) {
      addLine(
        "No product data available."
      );
    } else {
      topQuantityProducts.forEach(
        (product, index) => {
          const name =
            getProductName(product);

          const quantity =
            getProductQuantity(
              product
            );

          addLine(
            `${index + 1}. ${name} - ${quantity.toLocaleString(
              "en-IN"
            )} units`
          );
        }
      );
    }

    y += 3;

    // ----------------------------------------------------------
    // TOP PRODUCTS BY REVENUE
    // ----------------------------------------------------------

    addSubTitle(
      "Top Products by Revenue"
    );

    if (
      topRevenueProducts.length === 0
    ) {
      addLine(
        "No revenue data available."
      );
    } else {
      topRevenueProducts.forEach(
        (product, index) => {
          const name =
            getProductName(product);

          const revenueGBP =
            getProductRevenue(
              product
            );

          const revenueINR =
            revenueGBP *
            GBP_TO_INR;

          addLine(
            `${index + 1}. ${name} - INR ${revenueINR.toLocaleString(
              "en-IN",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}`
          );
        }
      );
    }

    y += 5;

    // ==========================================================
    // 3. BUSINESS INSIGHTS
    // ==========================================================

    addSectionTitle(
      "3. Business Insights"
    );

    const insights =
      generateBusinessInsights();

    if (insights.length === 0) {
      addLine(
        "No business insights are currently available."
      );
    } else {
      insights.forEach(
        (insight, index) => {
          addLine(
            `${index + 1}. ${cleanText(
              insight
            )}`
          );
        }
      );
    }

    y += 6;

    // ==========================================================
    // 4. REPORT SUMMARY
    // ==========================================================

    addSectionTitle(
      "4. Report Summary"
    );

    addLine(
      "This Business Intelligence Report combines PricePilot's business KPIs, product performance and key business insights into a single business-oriented view."
    );

    y += 8;

    // ==========================================================
    // FOOTER
    // ==========================================================

    addFooter();

    // ==========================================================
    // SAVE PDF
    // ==========================================================

    doc.save(
      "PricePilot_Business_Intelligence_Report.pdf"
    );
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
              Loading BI Report...
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
  // PAGE
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
              Key performance indicators from
              the PricePilot dashboard.
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
              {totalRevenueINR.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}
            </h3>

          </div>

          {/* TOTAL SALES */}

          <div className="kpi-card">

            <span>
              Total Sales
            </span>

            <h3>
              {totalSales.toLocaleString(
                "en-IN"
              )}
            </h3>

          </div>

          {/* TOTAL PRODUCTS */}

          <div className="kpi-card">

            <span>
              Total Products
            </span>

            <h3>
              {totalProducts.toLocaleString(
                "en-IN"
              )}
            </h3>

          </div>

          {/* UNIQUE ORDERS */}

          <div className="kpi-card">

            <span>
              Unique Orders
            </span>

            <h3>
              {uniqueOrders.toLocaleString(
                "en-IN"
              )}
            </h3>

          </div>

        </div>

      </section>

      {/* ======================================================
          PRODUCT PERFORMANCE
      ====================================================== */}

      <section className="dashboard-card">

        <div className="card-heading">

          <div>

            <h3>
              Product Performance
            </h3>

            <p>
              Products showing strong performance
              based on quantity and revenue.
            </p>

          </div>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "25px",
            marginTop: "20px",
          }}
        >

          {/* ==================================================
              TOP QUANTITY PRODUCTS
          ================================================== */}

          <div>

            <h4
              style={{
                marginBottom: "12px",
                fontSize: "14px",
              }}
            >
              Top Products by Quantity
            </h4>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >

              {topQuantityProducts.length ===
              0 ? (

                <p
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  No product data available.
                </p>

              ) : (

                topQuantityProducts.map(
                  (product, index) => (

                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "15px",
                        padding:
                          "12px 15px",
                        border:
                          "1px solid #e5e7eb",
                        borderRadius:
                          "8px",
                        background:
                          "#ffffff",
                      }}
                    >

                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        {index + 1}.{" "}
                        {getProductName(
                          product
                        )}
                      </span>

                      <strong
                        style={{
                          fontSize: "13px",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {getProductQuantity(
                          product
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                  )
                )

              )}

            </div>

          </div>

          {/* ==================================================
              TOP REVENUE PRODUCTS
          ================================================== */}

          <div>

            <h4
              style={{
                marginBottom: "12px",
                fontSize: "14px",
              }}
            >
              Top Products by Revenue
            </h4>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >

              {topRevenueProducts.length ===
              0 ? (

                <p
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  No revenue data available.
                </p>

              ) : (

                topRevenueProducts.map(
                  (product, index) => {

                    const revenueINR =
                      getProductRevenue(
                        product
                      ) *
                      GBP_TO_INR;

                    return (

                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "15px",
                          padding:
                            "12px 15px",
                          border:
                            "1px solid #e5e7eb",
                          borderRadius:
                            "8px",
                          background:
                            "#ffffff",
                        }}
                      >

                        <span
                          style={{
                            fontSize:
                              "13px",
                            fontWeight:
                              "600",
                          }}
                        >
                          {index + 1}.{" "}
                          {getProductName(
                            product
                          )}
                        </span>

                        <strong
                          style={{
                            fontSize:
                              "13px",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          ₹
                          {revenueINR.toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )}
                        </strong>

                      </div>

                    );
                  }
                )

              )}

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          BUSINESS INSIGHTS
      ====================================================== */}

      <section className="dashboard-card">

        <div className="card-heading">

          <div>

            <h3>
              Business Insights
            </h3>

            <p>
              Key observations generated from
              the available business analytics.
            </p>

          </div>

        </div>

        {/* ====================================================
            INSIGHTS
            LEFT ALIGNED
            NO INDIVIDUAL BOXES OR LINES
        ==================================================== */}

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "12px",
            width: "100%",
            textAlign: "left",
          }}
        >

          {generateBusinessInsights().length ===
          0 ? (

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              No business insights are currently
              available.
            </p>

          ) : (

            generateBusinessInsights().map(
              (insight, index) => (

                <div
                  key={index}
                  style={{
                    width: "100%",
                    padding: "4px 0",
                    margin: 0,
                    border: "none",
                    background: "transparent",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    color: "#374151",
                    textAlign: "left",
                  }}
                >

                  <strong
                    style={{
                      marginRight: "6px",
                    }}
                  >
                    {index + 1}.
                  </strong>

                  {insight}

                </div>

              )
            )

          )}

        </div>

      </section>

      {/* ======================================================
          REPORT SUMMARY
      ====================================================== */}

      <section className="dashboard-card">

        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background: "#f8fafc",
            border:
              "1px solid #e2e8f0",
          }}
        >

          <h3
            style={{
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            Report Summary
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#64748b",
              lineHeight: "1.6",
            }}
          >
            This Business Intelligence Report
            combines PricePilot's business KPIs,
            product performance and key business
            insights into a single
            business-oriented view.
          </p>

          {/* ==================================================
              DOWNLOAD BUTTON
          ================================================== */}

          <div
            style={{
              marginTop: "20px",
              paddingTop: "18px",
              borderTop:
                "1px solid #e2e8f0",
            }}
          >

            <button
              onClick={
                handleDownloadReport
              }
              style={{
                background:
                  "#4f46e5",
                color:
                  "#ffffff",
                border: "none",
                borderRadius:
                  "8px",
                padding:
                  "11px 18px",
                fontSize:
                  "13px",
                fontWeight:
                  "600",
                cursor:
                  "pointer",
              }}
            >
              📄 Download Report
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}

export default BIReports;