import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function DemandForecasting() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const [weeks, setWeeks] = useState("4");

  const [forecast, setForecast] = useState(null);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/pricing/categories`
        );

        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json();

        setCategories(data);
      } catch (error) {
        console.error(error);
        setError("Unable to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      setSelectedProduct("");
      setForecast(null);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/pricing/categories/${encodeURIComponent(
            selectedCategory
          )}/products`
        );

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();

        setProducts(data);
        setSelectedProduct("");
        setForecast(null);
      } catch (error) {
        console.error(error);

        setProducts([]);
        setSelectedProduct("");
        setForecast(null);

        setError("No products available for this category.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  // ============================================================
  // FORECAST
  // ============================================================

  const handleForecast = async () => {
    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    try {
      setLoadingForecast(true);
      setError("");
      setForecast(null);

      const response = await fetch(
        `${API_BASE_URL}/pricing/forecast/${encodeURIComponent(
          selectedProduct
        )}?weeks=${weeks}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to generate forecast."
        );
      }

      setForecast(data);
    } catch (error) {
      console.error(error);

      setError(
        error.message || "Unable to generate demand forecast."
      );
    } finally {
      setLoadingForecast(false);
    }
  };

  // ============================================================
  // SELECTED PRODUCT
  // ============================================================

  const selectedProductData = products.find(
    (product) => product.product_code === selectedProduct
  );

  // ============================================================
  // FORECAST DATA
  // ============================================================

  const forecastItems = forecast?.forecasts || [];

  const demandValues = forecastItems.map((item) =>
    Number(item.predicted_demand || 0)
  );

  const maxDemand =
    demandValues.length > 0
      ? Math.max(...demandValues)
      : 0;

  const totalDemand =
    forecast?.total_forecast_demand ??
    demandValues.reduce(
      (sum, value) => sum + value,
      0
    );

  const averageDemand =
    forecast?.average_weekly_demand ??
    (demandValues.length > 0
      ? totalDemand / demandValues.length
      : 0);

  const trend = forecast?.trend || "Stable";

  // ============================================================
  // TREND ICON
  // ============================================================

  const getTrendIcon = () => {
    if (trend === "Increasing") {
      return "↗";
    }

    if (trend === "Decreasing") {
      return "↘";
    }

    return "→";
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="price-prediction-page">

      {/* ======================================================
          IMPORTANT:
          The page-level "Demand Forecasting" header was removed.

          The main dashboard already displays:
          "Demand Forecast"

          Therefore we start directly with the forecast form.
      ====================================================== */}

      <div
        className="prediction-container"
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          gap: "24px",
          alignItems: "stretch",
        }}
      >

        {/* ====================================================
            FORECAST FORM
        ==================================================== */}

        <div
          className="prediction-card"
          style={{
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >

          {/* CARD HEADER */}

          <div className="prediction-card-header">

            <div className="prediction-icon">
              ↗
            </div>

            <div>
              <h2>
                Forecast Product Demand
              </h2>

              <p>
                Select a category and product to continue.
              </p>
            </div>

          </div>

          {/* FORM */}

          <div
            className="prediction-form"
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >

            {/* ==================================================
                CATEGORY
            ================================================== */}

            <div
              className="prediction-field"
              style={{
                width: "100%",
                textAlign: "left",
              }}
            >

              <label
                style={{
                  display: "block",
                  textAlign: "left",
                }}
              >
                Category
              </label>

              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value)
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                }}
              >

                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "Select a category"}
                </option>

                {categories.map((category) => (
                  <option
                    key={category.name}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}

              </select>

            </div>

            {/* ==================================================
                PRODUCT
            ================================================== */}

            <div
              className="prediction-field"
              style={{
                width: "100%",
                textAlign: "left",
              }}
            >

              <label
                style={{
                  display: "block",
                  textAlign: "left",
                }}
              >
                Product Name
              </label>

              <select
                value={selectedProduct}
                onChange={(e) =>
                  setSelectedProduct(e.target.value)
                }
                disabled={
                  !selectedCategory ||
                  loadingProducts
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                }}
              >

                <option value="">
                  {loadingProducts
                    ? "Loading products..."
                    : !selectedCategory
                    ? "Select a category first"
                    : "Select a product"}
                </option>

                {products.map((product) => (
                  <option
                    key={product.product_code}
                    value={product.product_code}
                  >
                    {product.name}
                  </option>
                ))}

              </select>

            </div>

            {/* ==================================================
                FORECAST PERIOD
            ================================================== */}

            <div
              className="prediction-field"
              style={{
                width: "100%",
                textAlign: "left",
              }}
            >

              <label
                style={{
                  display: "block",
                  textAlign: "left",
                }}
              >
                Forecast Period
              </label>

              <select
                value={weeks}
                onChange={(e) =>
                  setWeeks(e.target.value)
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                }}
              >

                <option value="1">
                  1 Week
                </option>

                <option value="2">
                  2 Weeks
                </option>

                <option value="4">
                  4 Weeks
                </option>

              </select>

            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="prediction-error">
                {error}
              </div>
            )}

            {/* ==================================================
                SELECTED PRODUCT
            ================================================== */}

            {selectedProduct && (

              <div
                className="selected-product"
                style={{
                  width: "100%",
                  textAlign: "left",
                }}
              >

                <div className="selected-product-header">

                  <span>
                    Selected Product
                  </span>

                  <span className="selected-check">
                    ✓
                  </span>

                </div>

                <div
                  className="selected-product-details"
                  style={{
                    textAlign: "left",
                  }}
                >

                  <div>

                    <span>
                      Category
                    </span>

                    <strong>
                      {selectedCategory}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Product
                    </span>

                    <strong>
                      {selectedProductData?.name}
                    </strong>

                  </div>

                </div>

              </div>

            )}

            {/* ==================================================
                BUTTON
            ================================================== */}

            <button
              className="primary-button"
              disabled={
                !selectedProduct ||
                loadingForecast
              }
              onClick={handleForecast}
            >

              {loadingForecast
                ? "Generating Forecast..."
                : "Forecast Demand"}

              <span>
                →
              </span>

            </button>

          </div>

        </div>

        {/* ======================================================
            FORECAST RESULT
        ====================================================== */}

        {forecast && (

          <div
            className="prediction-card"
            style={{
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              marginTop: "0",
            }}
          >

            {/* ==================================================
                RESULT HEADER
            ================================================== */}

            <div className="prediction-card-header">

              <div className="prediction-icon">
                ✓
              </div>

              <div>

                <h2>
                  Demand Forecast
                </h2>

                <p>
                  Forecast generated by the demand
                  prediction model.
                </p>

              </div>

            </div>

            {/* ==================================================
                FORECAST SUMMARY
            ================================================== */}

            <div
              className="selected-product"
              style={{
                width: "100%",
                textAlign: "left",
              }}
            >

              <div className="selected-product-header">

                <span>
                  Forecast Summary
                </span>

                <span className="selected-check">
                  ✓
                </span>

              </div>

              <div
                className="selected-product-details"
                style={{
                  gap: "30px",
                  textAlign: "left",
                }}
              >

                <div>

                  <span>
                    Product
                  </span>

                  <strong>
                    {selectedProductData?.name}
                  </strong>

                </div>

                <div>

                  <span>
                    Forecast Period
                  </span>

                  <strong>
                    {forecast.forecast_weeks}{" "}
                    {forecast.forecast_weeks === 1
                      ? "Week"
                      : "Weeks"}
                  </strong>

                </div>

              </div>

            </div>

            {/* ==================================================
                KPI CARDS
            ================================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "12px",
                marginTop: "20px",
                marginBottom: "25px",
              }}
            >

              {/* AVG */}

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #e8e8e8",
                  borderRadius: "12px",
                  background: "#fafafa",
                }}
              >

                <div
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    marginBottom: "7px",
                  }}
                >
                  Avg. Weekly Demand
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                  }}
                >
                  {Number(
                    averageDemand
                  ).toFixed(2)}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#999",
                    marginTop: "3px",
                  }}
                >
                  units / week
                </div>

              </div>

              {/* TOTAL */}

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #e8e8e8",
                  borderRadius: "12px",
                  background: "#fafafa",
                }}
              >

                <div
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    marginBottom: "7px",
                  }}
                >
                  Total Forecast
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                  }}
                >
                  {Number(
                    totalDemand
                  ).toFixed(2)}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#999",
                    marginTop: "3px",
                  }}
                >
                  units
                </div>

              </div>

              {/* TREND */}

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #e8e8e8",
                  borderRadius: "12px",
                  background: "#fafafa",
                }}
              >

                <div
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    marginBottom: "7px",
                  }}
                >
                  Demand Trend
                </div>

                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >

                  <span>
                    {getTrendIcon()}
                  </span>

                  {trend}

                </div>

              </div>

            </div>

            {/* ==================================================
                WEEKLY DEMAND CHART
            ================================================== */}

            <div
              style={{
                marginTop: "10px",
                padding: "22px",
                border: "1px solid #e8e8e8",
                borderRadius: "14px",
                background: "#fff",
              }}
            >

              <div
                style={{
                  marginBottom: "22px",
                }}
              >

                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                  }}
                >
                  Weekly Demand Forecast
                </h3>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "12px",
                    color: "#888",
                  }}
                >
                  Predicted demand for each upcoming week
                </p>

              </div>

              {/* ==================================================
                  BAR CHART
              ================================================== */}

              {forecastItems.length > 0 ? (

                <div
                  style={{
                    height: "270px",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-evenly",
                    gap: "20px",
                    padding: "20px 10px 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >

                  {forecastItems.map(
                    (item, index) => {

                      const demand =
                        Number(
                          item.predicted_demand || 0
                        );

                      const height =
                        maxDemand > 0
                          ? Math.max(
                              (demand / maxDemand) *
                                180,
                              8
                            )
                          : 8;

                      return (

                        <div
                          key={index}
                          style={{
                            flex: 1,
                            maxWidth: "90px",
                            height: "230px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            alignItems: "center",
                          }}
                        >

                          {/* BAR */}

                          <div
                            style={{
                              width: "50px",
                              height: `${height}px`,
                              background:
                                "linear-gradient(180deg, #2563eb, #60a5fa)",
                              borderRadius:
                                "8px 8px 3px 3px",
                              transition:
                                "height 0.4s ease",
                              boxShadow:
                                "0 4px 10px rgba(37, 99, 235, 0.15)",
                            }}
                          />

                          {/* WEEK LABEL */}

                          <div
                            style={{
                              marginTop: "10px",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#555",
                            }}
                          >
                            Week {index + 1}
                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

              ) : (

                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#888",
                  }}
                >
                  No forecast data available.
                </div>

              )}

            </div>

            {/* ==================================================
                WEEKLY BREAKDOWN
            ================================================== */}

            <div
              style={{
                marginTop: "24px",
              }}
            >

              <h3
                style={{
                  fontSize: "18px",
                  marginBottom: "15px",
                }}
              >
                Weekly Breakdown
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    forecastItems.length === 1
                      ? "1fr"
                      : "repeat(2, minmax(0, 1fr))",
                  gap: "12px",
                }}
              >

                {forecastItems.map(
                  (item, index) => {

                    const demand =
                      Number(
                        item.predicted_demand || 0
                      );

                    return (

                      <div
                        key={index}
                        style={{
                          border:
                            "1px solid #e8e8e8",
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          background: "#fafafa",
                        }}
                      >

                        <div>

                          <div
                            style={{
                              fontSize: "13px",
                              color: "#777",
                              marginBottom: "5px",
                            }}
                          >
                            Week {index + 1}
                          </div>

                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: "700",
                            }}
                          >
                            Predicted Demand
                          </div>

                        </div>

                        <div
                          style={{
                            textAlign: "right",
                          }}
                        >

                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: "700",
                            }}
                          >
                            {demand.toFixed(2)}
                          </div>

                          <div
                            style={{
                              fontSize: "11px",
                              color: "#999",
                            }}
                          >
                            units
                          </div>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            </div>

            {/* ==================================================
                EXPLANATION
            ================================================== */}

            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                background: "#f8faff",
                border: "1px solid #e5edff",
                borderRadius: "10px",
                fontSize: "12px",
                color: "#667085",
                lineHeight: "1.6",
              }}
            >

              <strong style={{ color: "#344054" }}>
                Forecast interpretation:
              </strong>{" "}
              The values shown represent the estimated number
              of units expected to be sold during each week.
              Values below 1 can occur when the selected
              product has very low historical sales.

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default DemandForecasting;