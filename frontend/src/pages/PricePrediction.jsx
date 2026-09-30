import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function PricePrediction() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const [selectedProductData, setSelectedProductData] = useState(null);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [predicting, setPredicting] = useState(false);

  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);

  const GBP_TO_INR = 126.9;

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
  // LOAD PRODUCTS WHEN CATEGORY CHANGES
  // ============================================================

  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      setSelectedProduct("");
      setSelectedProductData(null);
      setPrediction(null);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setError("");
        setPrediction(null);

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
        setSelectedProductData(null);
      } catch (error) {
        console.error(error);

        setProducts([]);
        setSelectedProduct("");
        setSelectedProductData(null);

        setError("No products available for this category.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  // ============================================================
  // PRODUCT SELECTION
  // ============================================================

  const handleProductChange = (event) => {
    const productCode = event.target.value;

    setSelectedProduct(productCode);
    setPrediction(null);
    setError("");

    const product = products.find(
      (item) =>
        String(item.product_code) ===
        String(productCode)
    );

    setSelectedProductData(product || null);
  };

  // ============================================================
  // PREDICT OPTIMAL PRICE
  // ============================================================

  const handlePredict = async () => {
    if (!selectedProduct) {
      return;
    }

    try {
      setPredicting(true);
      setError("");
      setPrediction(null);

      const response = await fetch(
        `${API_BASE_URL}/pricing/predict/${encodeURIComponent(
          selectedProduct
        )}`
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.detail ||
            "Prediction failed"
        );
      }

      const data = await response.json();

      console.log(
        "Prediction result:",
        data
      );

      setPrediction(data);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to predict price."
      );
    } finally {
      setPredicting(false);
    }
  };

  // ============================================================
  // PRICE FORMATTING
  // ============================================================

  const formatINR = (value) => {
    return `₹${(
      Number(value || 0) *
      GBP_TO_INR
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  // ============================================================
  // PRICE CHANGE
  // ============================================================

  const priceChange = Number(
    prediction?.price_change_percent || 0
  );

  const formattedPriceChange =
    `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(
      2
    )}%`;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="price-prediction-page">

      {/* ======================================================
          IMPORTANT:
          The duplicate internal "Price Prediction" page header
          has been removed.

          The main dashboard layout already displays:
          "Price Prediction"
      ====================================================== */}

      <div className="prediction-container">

        {/* ====================================================
            MAIN CARD
        ==================================================== */}

        <div className="prediction-card">

          {/* CARD HEADER */}

          <div className="prediction-card-header">

            <div className="prediction-icon">
              ₹
            </div>

            <div>

              <h2>
                Predict Product Price
              </h2>

              <p>
                Select a category and product to continue.
              </p>

            </div>

          </div>

          <div className="prediction-form">

            {/* ==================================================
                CATEGORY
            ================================================== */}

            <div className="prediction-field">

              <label>
                Category
              </label>

              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value
                  )
                }
              >

                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "Select a category"}
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.name}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* ==================================================
                PRODUCT
            ================================================== */}

            <div className="prediction-field">

              <label>
                Product Name
              </label>

              <select
                value={selectedProduct}
                onChange={
                  handleProductChange
                }
                disabled={
                  !selectedCategory ||
                  loadingProducts
                }
              >

                <option value="">
                  {loadingProducts
                    ? "Loading products..."
                    : !selectedCategory
                    ? "Select a category first"
                    : "Select a product"}
                </option>

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
                      {product.name}
                    </option>
                  )
                )}

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

            {selectedProductData && (
              <div className="selected-product">

                <div className="selected-product-header">

                  <span>
                    Selected Product
                  </span>

                  <span className="selected-check">
                    ✓
                  </span>

                </div>

                <div className="selected-product-details">

                  {/* CATEGORY */}

                  <div>

                    <span>
                      Category
                    </span>

                    <strong>
                      {selectedCategory}
                    </strong>

                  </div>

                  {/* PRODUCT */}

                  <div>

                    <span>
                      Product
                    </span>

                    <strong>
                      {
                        selectedProductData.name
                      }
                    </strong>

                  </div>

                  {/* CURRENT PRICE */}

                  <div>

                    <span>
                      Current Price
                    </span>

                    <strong>
                      {formatINR(
                        selectedProductData.price
                      )}
                    </strong>

                  </div>

                </div>

              </div>
            )}

            {/* ==================================================
                PREDICT BUTTON
            ================================================== */}

            <button
              className="primary-button"
              disabled={
                !selectedProduct ||
                predicting
              }
              onClick={handlePredict}
            >

              {predicting
                ? "Predicting..."
                : "Predict Optimal Price"}

              {!predicting && (
                <span>
                  →
                </span>
              )}

            </button>

            {/* ==================================================
                PREDICTION RESULT
            ================================================== */}

            {prediction && (
              <div className="selected-product prediction-output">

                <div className="selected-product-header">

                  <span>
                    Prediction Result
                  </span>

                  <span className="selected-check">
                    ✓
                  </span>

                </div>

                <div className="selected-product-details">

                  {/* CURRENT PRICE */}

                  <div>

                    <span>
                      Current Price
                    </span>

                    <strong>
                      {formatINR(
                        prediction.current_price
                      )}
                    </strong>

                  </div>

                  {/* OPTIMAL PRICE */}

                  <div>

                    <span>
                      Optimal Price
                    </span>

                    <strong className="optimal-price">
                      {formatINR(
                        prediction.recommended_price
                      )}
                    </strong>

                  </div>

                  {/* PRICE CHANGE */}

                  <div>

                    <span>
                      Price Change
                    </span>

                    <strong
                      className={
                        priceChange >= 0
                          ? "price-increase"
                          : "price-decrease"
                      }
                    >
                      {formattedPriceChange}
                    </strong>

                  </div>

                </div>

                {/* ==================================================
                    RECOMMENDATION
                ================================================== */}

                <div className="prediction-note">

                  <span>
                    Recommendation
                  </span>

                  <p>
                    {prediction.message}
                  </p>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default PricePrediction;