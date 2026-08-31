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

# Day 8 Progress

## Completed

- Created EDA script
- Loaded the processed dataset
- Performed basic statistical analysis
- Checked missing values
- Checked duplicate records
- Analyzed categorical variables
- Analyzed demand by category, region, weather, and seasonality
- Analyzed price, discount, and promotion
- Performed correlation analysis
- Created initial EDA visualizations

## Next Step

- Complete detailed EDA
- Identify important features
- Perform feature engineering
- Prepare data for machine learning

# Day 9 Progress

## Completed

- Continued exploratory data analysis.
- Analyzed price and demand.
- Analyzed competitor pricing.
- Created Price Difference feature.
- Analyzed discounts and demand.
- Analyzed promotions and demand.
- Analyzed category and demand.
- Analyzed region and demand.
- Analyzed seasonality and demand.
- Analyzed inventory and demand.
- Performed correlation analysis.
- Created EDA visualizations.
- Identified candidate features for demand prediction.

## Target Variable

Demand

## Next Step

- Finalize feature engineering.
- Prepare the dataset for machine learning.
- Split the dataset into training and testing sets.

# Day 10 Progress

## Completed

- Created feature engineering script.
- Loaded the processed dataset.
- Converted Date into datetime format.
- Created Year feature.
- Created Month feature.
- Created Day feature.
- Created DayOfWeek feature.
- Created Price Difference feature.
- Created Price Ratio feature.
- Encoded categorical variables.
- Created ML-ready dataset.

## Output

ML-ready dataset:

data/processed/ml_ready_data.csv

## Next Step

Prepare the ML-ready dataset for model training and create the first demand prediction model.

# Day 12 Progress

## Completed

- Evaluated the initial Random Forest model.
- Investigated potential target leakage.
- Created a second model excluding Units Sold.
- Compared Model A and Model B.
- Evaluated both models using MAE, RMSE, and R².
- Analyzed feature importance.
- Selected a model for further development.

## Key Learning

Model performance should be evaluated not only by numerical accuracy but also by whether the input features would realistically be available when making future demand predictions.

## Next Step

Develop the demand prediction functionality and integrate the trained model with the PricePilot AI backend.

# Day 13 Progress

## Objective

Develop the initial demand prediction functionality using the trained machine learning model.

## Completed

- Created prediction script.
- Loaded the trained Random Forest model.
- Loaded the ML-ready dataset.
- Prepared input features.
- Generated a demand prediction.
- Tested the prediction process successfully.

## Model Used

Random Forest Regressor.

## Model File

models/demand_model.pkl

## Prediction Input

The prediction script uses the processed ML-ready dataset as input.

## Output

The system generates a predicted demand value for the selected input record.

## Next Step

Integrate the demand prediction model with the PricePilot AI backend API.

# Day 14 Progress

## Objective

Integrate the trained demand prediction model with the FastAPI backend.

## Completed

- Loaded the trained Random Forest model.
- Integrated the model with FastAPI.
- Created the `/api/predict` endpoint.
- Loaded the ML-ready dataset.
- Implemented input row selection.
- Generated demand predictions through the API.
- Tested the prediction endpoint using Swagger UI.

## API Endpoint

POST /api/predict

## Model

Random Forest Regressor

## Model File

models/demand_model.pkl

## Testing

The prediction endpoint was tested using FastAPI Swagger UI.

## Next Step

Develop a proper prediction input structure and integrate the prediction functionality with the frontend.