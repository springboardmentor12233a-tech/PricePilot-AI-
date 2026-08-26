# PricePilot AI Database Design

## Entities

### Products
- product_id
- category

### Stores
- store_id
- region

### Pricing
- pricing_id
- product_id
- store_id
- date
- price
- discount
- promotion
- competitor_pricing

### Sales
- sales_id
- product_id
- store_id
- date
- units_sold
- demand

### Inventory
- inventory_id
- product_id
- store_id
- date
- inventory_level
- units_ordered

## Relationships

Products → Pricing
Products → Sales
Products → Inventory

Stores → Pricing
Stores → Sales
Stores → Inventory