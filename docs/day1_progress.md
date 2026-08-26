# Day 1 Progress

## Completed

- [x] Project folder created
- [x] Project structure created
- [x] Technology stack selected
- [x] Dataset selected
- [x] Dataset downloaded
- [x] Git repository initialized
- [x] GitHub repository created
- [x] README created
- [x] Initial architecture designed

## Pending

- [ ] Database setup
- [ ] Backend setup
- [ ] Frontend setup
- [ ] Authentication
- [ ] Product management
- [ ] Pricing dashboard
- [ ] Dataset preprocessing


# Day 2 Progress

## Dataset Preprocessing

- Loaded the raw dataset using Pandas
- Dataset shape: 76,000 rows and 16 columns
- Converted the Date column from string to datetime
- Checked the dataset data types
- Checked the date information
- Checked missing values
- Checked duplicate records

## Dataset Quality

- Missing values: 0
- Duplicate records: 0

## Important Features Identified

### Pricing
- Price
- Discount
- Competitor Pricing
- Promotion

### Sales
- Units Sold

### Demand
- Demand

### Inventory
- Inventory Level
- Units Ordered

### Product
- Product ID
- Category

### Location
- Store ID
- Region

### External Factors
- Date
- Weather Condition
- Seasonality
- Epidemic

# Day 3 Progress

## Completed

- Completed dataset validation
- Checked categorical values
- Checked numerical values
- Checked negative values
- Created processed dataset
- Created column mapping
- Designed initial MySQL database
- Designed product table
- Designed store table
- Designed pricing table
- Designed sales table
- Designed inventory table

## Dataset

Rows: 76,000
Columns: 16

## Output

Raw:
data/raw/sales_data.csv

Processed:
data/processed/clean_sales_data.csv

## Database

Database:
pricepilot_db

Initial tables:
- products
- stores
- pricing
- sales
- inventory

# Day 4 Progress

## MySQL Database Setup

Database:
pricepilot_db

## Tables Created

1. products
2. stores
3. pricing
4. sales
5. inventory

## Relationships

- Products → Pricing
- Products → Sales
- Products → Inventory
- Stores → Pricing
- Stores → Sales
- Stores → Inventory

## Status

- MySQL database created
- Tables created successfully
- Foreign keys configured
- Database schema documented

## Next Step

Connect the Python backend to MySQL and load the required
processed dataset records.

# Day 5 Progress

## MySQL-Python Integration

- Installed mysql-connector-python
- Created MySQL database connection module
- Connected Python to pricepilot_db
- Tested database connection
- Verified database tables from Python

## Database

Database: pricepilot_db

Tables:
- products
- stores
- pricing
- sales
- inventory

## Status

Python-to-MySQL connection: Completed

## Next Step

Load the processed dataset into the appropriate database tables.

# Day 6 Progress

## Backend Setup

- Installed FastAPI
- Installed Uvicorn
- Created FastAPI application
- Created root API endpoint
- Created health-check endpoint
- Created database health-check endpoint

## APIs

### GET /
Returns the PricePilot AI API welcome message.

### GET /api/health
Checks whether the backend service is running.

### GET /api/database
Checks the connection between FastAPI and MySQL.

## Database

Database: pricepilot_db

Status:
- Python → MySQL connection: Working
- FastAPI → MySQL connection: Working

## Next Step

Create APIs for products, pricing, sales and inventory data.