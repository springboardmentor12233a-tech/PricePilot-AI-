import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

// External competitor dataset is in GBP.
// Using a fixed rate keeps the project/demo consistent.
const GBP_TO_INR = 125;

function CompetitorAnalysis() {
  // ============================================================
  // STATE
  // ============================================================

  const [products, setProducts] = useState([]);
  const [productCode, setProductCode] = useState("");

  const [result, setResult] = useState(null);

  const [productsLoading, setProductsLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [error, setError] = useState("");


  // ============================================================
  // LOAD PRODUCTS WHEN PAGE OPENS
  // ============================================================

  useEffect(() => {
    loadProducts();
  }, []);


  // ============================================================
  // LOAD ANALYSIS WHEN PRODUCT CHANGES
  // ============================================================

  useEffect(() => {
    if (productCode) {
      loadCompetitorAnalysis(productCode);
    }
  }, [productCode]);


  // ============================================================
  // LOAD ALL PRODUCTS
  // ============================================================

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

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

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load products"
        );
      }

      setProducts(data);

      // Automatically select first product
      if (data.length > 0) {
        setProductCode(data[0].product_code);
      }

    } catch (err) {
      console.error(err);

      setError(
        err.message || "Unable to load products"
      );

    } finally {
      setProductsLoading(false);
    }
  };


  // ============================================================
  // LOAD COMPETITOR ANALYSIS
  // ============================================================

  const loadCompetitorAnalysis = async (code) => {
    try {
      setAnalysisLoading(true);
      setError("");
      setResult(null);

      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/kpi/competitor-analysis/${code}`,
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to load competitor analysis"
        );
      }


      // ========================================================
      // CONVERT GBP → INR
      // ========================================================

      const convertedData = {
        ...data,

        // Your product price
        // converted too because the source dataset
        // is in GBP.

        current_price:
          Number(data.current_price || 0) *
          GBP_TO_INR,


        // Average competitor price

        average_competitor_price:
          Number(
            data.average_competitor_price || 0
          ) * GBP_TO_INR,


        // Lowest competitor price

        lowest_competitor_price:
          Number(
            data.lowest_competitor_price || 0
          ) * GBP_TO_INR,


        // Highest competitor price

        highest_competitor_price:
          Number(
            data.highest_competitor_price || 0
          ) * GBP_TO_INR,


        // Price difference

        price_difference:
          Number(
            data.price_difference || 0
          ) * GBP_TO_INR,


        // Competitor table

        competitors:
          (data.competitors || []).map(
            (competitor) => ({
              ...competitor,

              price:
                Number(
                  competitor.price || 0
                ) * GBP_TO_INR,
            })
          ),
      };


      setResult(convertedData);

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to perform competitor analysis"
      );

    } finally {
      setAnalysisLoading(false);
    }
  };


  // ============================================================
  // FORMAT INR
  // ============================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };


  // ============================================================
  // PRODUCTS LOADING
  // ============================================================

  if (productsLoading) {
    return (
      <div className="dashboard">

        <section className="dashboard-card">

          <h3>
            Loading Products...
          </h3>

          <p>
            Fetching available products for
            competitor analysis.
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
            No active products were found
            in the database.
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
          PRODUCT SELECTOR
      ====================================================== */}

      <section className="dashboard-card">

        <div className="card-heading">

          <div>

            <h3>
              Select Product
            </h3>

            <p>
              Select any active product to view
              its competitor pricing analysis.
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
            onChange={(e) => {
              setProductCode(e.target.value);
            }}
            disabled={analysisLoading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border:
                "1px solid #d1d5db",
              fontSize: "14px",
              background: "white",
              cursor: "pointer",
            }}
          >

            {products.map((product) => (

              <option
                key={product.product_code}
                value={product.product_code}
              >

                {product.product_code}
                {" - "}
                {product.name}

              </option>

            ))}

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
            active products available
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
            onClick={() => {
              if (productCode) {
                loadCompetitorAnalysis(
                  productCode
                );
              } else {
                loadProducts();
              }
            }}
            style={{
              marginTop: "20px",
            }}
          >
            Retry
          </button>

        </section>

      )}


      {/* ======================================================
          ANALYSIS LOADING
      ====================================================== */}

      {analysisLoading && (

        <section className="dashboard-card">

          <h3>
            Loading Competitor Analysis...
          </h3>

          <p>
            Fetching competitor prices for
            product{" "}
            <strong>
              {productCode}
            </strong>
            .
          </p>

        </section>

      )}


      {/* ======================================================
          RESULTS
      ====================================================== */}

      {!analysisLoading && result && (

        <>


          {/* ==================================================
              PRODUCT INFORMATION
          ================================================== */}

          <section className="dashboard-card">

            <div className="card-heading">

              <div>

                <h3>
                  Product
                </h3>

                <p>
                  Competitor pricing analysis
                  for the selected product.
                </p>

              </div>

            </div>


            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                borderRadius: "10px",
                background: "#f8fafc",
              }}
            >

              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "6px",
                }}
              >
                Product
              </div>


              <strong
                style={{
                  fontSize: "20px",
                }}
              >
                {result.product_name}
              </strong>


              <div
                style={{
                  marginTop: "6px",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                Product Code:{" "}
                {result.product_code}
              </div>

            </div>

          </section>


          {/* ==================================================
              KPI CARDS
          ================================================== */}

          <section className="kpi-grid">


            {/* YOUR PRICE */}

            <div className="kpi-card">

              <div className="kpi-header">

                <span>
                  Your Price
                </span>

                <div className="kpi-icon revenue">
                  ₹
                </div>

              </div>


              <h3>
                {formatCurrency(
                  result.current_price
                )}
              </h3>


              <p>
                Current product price
              </p>

            </div>


            {/* AVERAGE COMPETITOR */}

            <div className="kpi-card">

              <div className="kpi-header">

                <span>
                  Average Competitor
                </span>

                <div className="kpi-icon orders">
                  ₹
                </div>

              </div>


              <h3>
                {formatCurrency(
                  result.average_competitor_price
                )}
              </h3>


              <p>
                Average market price
              </p>

            </div>


            {/* LOWEST */}

            <div className="kpi-card">

              <div className="kpi-header">

                <span>
                  Lowest Competitor
                </span>

                <div className="kpi-icon customers">
                  ↓
                </div>

              </div>


              <h3>
                {formatCurrency(
                  result.lowest_competitor_price
                )}
              </h3>


              <p>
                Lowest observed price
              </p>

            </div>


            {/* HIGHEST */}

            <div className="kpi-card">

              <div className="kpi-header">

                <span>
                  Highest Competitor
                </span>

                <div className="kpi-icon aov">
                  ↑
                </div>

              </div>


              <h3>
                {formatCurrency(
                  result.highest_competitor_price
                )}
              </h3>


              <p>
                Highest observed price
              </p>

            </div>

          </section>


          {/* ==================================================
              MARKET POSITION
          ================================================== */}

          <section className="dashboard-card">

            <div className="card-heading">

              <div>

                <h3>
                  Market Position
                </h3>

                <p>
                  Comparison of your current
                  price with competitor prices.
                </p>

              </div>

            </div>


            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >


              {/* POSITION */}

              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                }}
              >

                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  Market Position
                </span>


                <strong
                  style={{
                    fontSize: "22px",
                  }}
                >
                  {result.position}
                </strong>

              </div>


              {/* PRICE DIFFERENCE */}

              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                }}
              >

                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  Price Difference
                </span>


                <strong
                  style={{
                    fontSize: "22px",
                  }}
                >

                  {result.price_difference > 0
                    ? "+"
                    : ""}

                  {formatCurrency(
                    result.price_difference
                  )}

                </strong>

              </div>


              {/* PRICE DIFFERENCE % */}

              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                }}
              >

                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  Price Difference %
                </span>


                <strong
                  style={{
                    fontSize: "22px",
                  }}
                >

                  {result.price_difference_percent > 0
                    ? "+"
                    : ""}

                  {Number(
                    result.price_difference_percent || 0
                  ).toFixed(2)}

                  %

                </strong>


                <span
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  Compared with average
                  competitor
                </span>

              </div>

            </div>

          </section>


          {/* ==================================================
              COMPETITOR COMPARISON TABLE
          ================================================== */}

          <section className="dashboard-card">

            <div className="card-heading">

              <div>

                <h3>
                  Competitor Price Comparison
                </h3>

                <p>
                  Detailed comparison between
                  your product price and competitor
                  prices.
                </p>

              </div>

            </div>


            <div
              style={{
                overflowX: "auto",
                marginTop: "20px",
              }}
            >

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >

                <thead>

                  <tr
                    style={{
                      borderBottom:
                        "1px solid #e5e7eb",
                      textAlign: "left",
                    }}
                  >

                    <th
                      style={{
                        padding:
                          "14px 12px",
                      }}
                    >
                      Competitor
                    </th>


                    <th
                      style={{
                        padding:
                          "14px 12px",
                      }}
                    >
                      Price (INR)
                    </th>


                    <th
                      style={{
                        padding:
                          "14px 12px",
                      }}
                    >
                      Difference
                    </th>


                    <th
                      style={{
                        padding:
                          "14px 12px",
                      }}
                    >
                      Difference %
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {result.competitors &&
                  result.competitors.length > 0 ? (

                    result.competitors.map(
                      (competitor, index) => {

                        const difference =
                          Number(
                            result.current_price
                          ) -
                          Number(
                            competitor.price
                          );


                        const differencePercent =
                          Number(
                            competitor.price
                          ) !== 0
                            ? (
                                difference /
                                Number(
                                  competitor.price
                                )
                              ) * 100
                            : 0;


                        return (

                          <tr
                            key={index}
                            style={{
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >

                            <td
                              style={{
                                padding:
                                  "14px 12px",
                                fontWeight:
                                  "600",
                              }}
                            >
                              {
                                competitor.competitor
                              }
                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 12px",
                              }}
                            >
                              {formatCurrency(
                                competitor.price
                              )}
                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 12px",
                              }}
                            >

                              {difference > 0
                                ? "+"
                                : ""}

                              {formatCurrency(
                                difference
                              )}

                            </td>


                            <td
                              style={{
                                padding:
                                  "14px 12px",
                              }}
                            >

                              {differencePercent > 0
                                ? "+"
                                : ""}

                              {differencePercent.toFixed(
                                2
                              )}

                              %

                            </td>

                          </tr>

                        );

                      }
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="4"
                        style={{
                          padding:
                            "20px",
                          textAlign:
                            "center",
                          color:
                            "#6b7280",
                        }}
                      >
                        No competitor prices
                        available for this
                        product.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </section>


          {/* ==================================================
              REFRESH
          ================================================== */}

          <section
            style={{
              marginTop: "20px",
              marginBottom: "30px",
            }}
          >

            <button
              className="primary-button"
              onClick={() =>
                loadCompetitorAnalysis(
                  productCode
                )
              }
              disabled={analysisLoading}
            >

              {analysisLoading
                ? "Refreshing..."
                : "Refresh Competitor Prices"}

            </button>

          </section>

        </>

      )}

    </div>
  );
}

export default CompetitorAnalysis;