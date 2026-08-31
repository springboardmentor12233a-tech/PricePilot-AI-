-- PricePilot AI — MVP schema
-- Models the retail_price.csv panel as three normalized tables instead of
-- one wide CSV. This is deliberately minimal: just enough structure to
-- support price prediction, demand forecasting, and competitor analysis
-- for the MVP. No Mongo, no auth tables yet (that's a separate step).

DROP TABLE IF EXISTS competitor_prices CASCADE;
DROP TABLE IF EXISTS monthly_metrics CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- One row per unique product. Attributes here are near-static
-- (they don't change month to month in the source data).
CREATE TABLE products (
    product_id          TEXT PRIMARY KEY,
    category            TEXT NOT NULL,
    name_length         INTEGER,
    description_length  INTEGER,
    photos_qty          INTEGER,
    weight_g            INTEGER,
    volume              INTEGER  -- inferred as package volume; unverified against a data dictionary
);

-- One row per product per month: the core panel used for price
-- prediction and demand forecasting.
CREATE TABLE monthly_metrics (
    id               SERIAL PRIMARY KEY,
    product_id       TEXT NOT NULL REFERENCES products(product_id),
    period_date      DATE NOT NULL,          -- always the 1st of the month
    qty_sold         INTEGER NOT NULL,
    total_price      NUMERIC(10, 2) NOT NULL,
    freight_price    NUMERIC(10, 2) NOT NULL,
    unit_price       NUMERIC(10, 2) NOT NULL,
    lag_unit_price   NUMERIC(10, 2),          -- previous period's unit price, already in source data
    product_score    NUMERIC(3, 1),
    customers        INTEGER,
    weekday_count    INTEGER,                 -- weekdays THAT MONTH, not a per-row flag
    weekend_count    INTEGER,
    holiday_count    INTEGER,
    s_metric         NUMERIC(10, 6),          -- meaning unconfirmed, see note in load script
    UNIQUE (product_id, period_date)
);
CREATE INDEX idx_monthly_metrics_product ON monthly_metrics(product_id);
CREATE INDEX idx_monthly_metrics_period ON monthly_metrics(period_date);

-- Unpivoted competitor data: comp_1/ps1/fp1, comp_2/ps2/fp2, comp_3/ps3/fp3
-- from the source CSV become 3 rows here instead of 9 columns. Makes
-- "average competitor price for this product over time" a plain GROUP BY
-- instead of a UNION of three column sets.
CREATE TABLE competitor_prices (
    id               SERIAL PRIMARY KEY,
    product_id       TEXT NOT NULL REFERENCES products(product_id),
    period_date      DATE NOT NULL,
    competitor_num   SMALLINT NOT NULL CHECK (competitor_num IN (1, 2, 3)),
    price            NUMERIC(10, 2) NOT NULL,
    score            NUMERIC(3, 1),
    freight_price    NUMERIC(10, 2),
    UNIQUE (product_id, period_date, competitor_num)
);
CREATE INDEX idx_competitor_prices_product ON competitor_prices(product_id);