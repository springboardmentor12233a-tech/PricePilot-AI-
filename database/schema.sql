-- PricePilot AI Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS pricepilot_db;

-- Select database
USE pricepilot_db;


-- Products table
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL
);


-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    store_id VARCHAR(50) PRIMARY KEY,
    region VARCHAR(100) NOT NULL
);


-- Pricing table
CREATE TABLE IF NOT EXISTS pricing (
    pricing_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50),
    store_id VARCHAR(50),
    date DATE,
    price DECIMAL(10,2),
    discount INT,
    promotion INT,
    competitor_pricing DECIMAL(10,2),

    FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    FOREIGN KEY (store_id)
        REFERENCES stores(store_id)
);


-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    sales_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50),
    store_id VARCHAR(50),
    date DATE,
    units_sold INT,
    demand INT,

    FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    FOREIGN KEY (store_id)
        REFERENCES stores(store_id)
);


-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50),
    store_id VARCHAR(50),
    date DATE,
    inventory_level INT,
    units_ordered INT,

    FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    FOREIGN KEY (store_id)
        REFERENCES stores(store_id)
);