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

# Day 15 Progress – Milestone 2

## Objective

Begin the Dynamic Pricing Optimization module using the demand prediction model and business pricing factors.

## Work Completed

- Started Milestone 2 development.
- Designed the pricing optimization logic.
- Created the `pricing_optimizer.py` module.
- Considered predicted demand, current price, competitor pricing and inventory level.
- Implemented an initial price recommendation function.
- Tested the pricing logic with multiple scenarios.

## Pricing Factors

The pricing recommendation considers:

1. Predicted Demand
2. Current Price
3. Competitor Price
4. Inventory Level
5. Discount
6. Promotion

## Initial Pricing Logic

- High demand and low inventory can increase the recommended price.
- Low demand and high inventory can decrease the recommended price.
- A price significantly higher than the competitor price can be adjusted.

## Outcome

An initial dynamic pricing recommendation module was created and tested successfully.

## Next Step

Integrate the pricing optimization module with the trained demand prediction model and FastAPI backend.

# Day 16 Progress – Milestone 2

## Objective

Integrate the trained demand prediction model with the dynamic pricing optimization module.

## Work Completed

- Loaded the trained Random Forest demand prediction model.
- Loaded the ML-ready dataset.
- Prepared the input features.
- Generated predicted demand for a sample product.
- Integrated predicted demand with the pricing optimization logic.
- Considered current price, competitor price and inventory level.
- Generated a recommended price.

## System Flow

Data
↓
Demand Prediction Model
↓
Predicted Demand
↓
Pricing Optimizer
↓
Recommended Price

## Outcome

The demand prediction model and pricing optimization module were successfully connected to create an initial end-to-end dynamic pricing pipeline.

## Next Step

Integrate the complete demand prediction and pricing recommendation pipeline with the FastAPI backend.

# Day 17 Progress – Milestone 2

## Objective

Integrate the dynamic pricing optimization module with the FastAPI backend.

## Work Completed

- Integrated the demand prediction model with FastAPI.
- Integrated the pricing optimization module with FastAPI.
- Created the `/api/recommend-price` endpoint.
- Added validation for the row ID.
- Retrieved current price, competitor price and inventory level.
- Generated predicted demand using the trained Random Forest model.
- Generated a recommended price using the pricing optimization logic.
- Tested the API using FastAPI Swagger documentation.

## API Endpoint

### POST /api/recommend-price

The endpoint returns:

- Current Price
- Competitor Price
- Inventory Level
- Predicted Demand
- Recommended Price

## System Flow

Product Data
↓
Demand Prediction Model
↓
Predicted Demand
↓
Pricing Optimization
↓
Recommended Price
↓
FastAPI Response

## Outcome

The dynamic pricing pipeline was successfully integrated with FastAPI and tested through the Swagger interface.

## Next Step

Improve the pricing recommendation system and introduce a structured API input model for real-time product pricing requests.

# Day 18 Progress – Milestone 2

## Objective

Develop a real-time pricing recommendation API using FastAPI.

## Work Completed

- Created the PricingRequest model using Pydantic.
- Created the `/api/pricing` endpoint.
- Added current price as an input.
- Added competitor price as an input.
- Added inventory level as an input.
- Added predicted demand as an input.
- Integrated the pricing optimization logic.
- Added pricing action classification.
- Tested the API using Swagger UI.

## Input

The API accepts:

- Current Price
- Competitor Price
- Inventory Level
- Predicted Demand

## Output

The API provides:

- Recommended Price
- Pricing Action

## Pricing Actions

- Increase Price
- Decrease Price
- Maintain Price

## Testing

Three pricing scenarios were tested:

1. High demand + low inventory → Increase Price
2. Low demand + high inventory → Decrease Price
3. Normal demand + inventory → Maintain Price

## Outcome

The real-time pricing recommendation API was successfully developed and tested using FastAPI Swagger.

## Next Step

Connect the Random Forest demand prediction model directly to the pricing API.


# Day 20 Progress – Model Optimization and Milestone 2

## Objective

To optimize the demand forecasting model using GridSearchCV and identify the best-performing machine learning model for PricePilot AI.

## Dataset

- Dataset: Retail Store Inventory and Demand Forecasting
- Records: 76,000
- Features used for training: 29
- Target: Demand
- Training records: 60,800
- Testing records: 15,200

## Model Optimization

GridSearchCV with 3-fold cross-validation was used to tune the machine learning models.

The following models were evaluated:

- Random Forest Regressor
- Gradient Boosting Regressor

## Random Forest Results

MAE: 12.69

RMSE: 16.91

R² Score: 0.8706

## Gradient Boosting Results

Best Parameters:

- Learning Rate: 0.1
- Max Depth: 5
- Number of Estimators: 200

MAE: 12.25

RMSE: 16.05

R² Score: 0.8833

## Best Model

Gradient Boosting Regressor was selected as the final demand forecasting model because it achieved:

- Lowest MAE
- Lowest RMSE
- Highest R² score

The final model achieved an R² score of 0.8833.

## Model Output

The optimized model was saved as:

models/best_demand_model.pkl

## Milestone 2 Backend

The backend is being developed to provide:

- Forecasted demand
- Inventory level
- Current price
- Competitor price
- Recommended price
- Pricing action

## External LLM

Groq will be integrated as the external LLM to generate AI-based explanations and business insights from the forecasting and pricing results.

## Outcome

GridSearchCV successfully identified Gradient Boosting as the best-performing model for demand forecasting.

## Next Steps

- Replace the previous demand model with the optimized Gradient Boosting model.
- Integrate the optimized model with the FastAPI backend.
- Display forecasted demand and inventory.
- Complete the pricing recommendation workflow.
- Integrate Groq for AI-generated business insights.

# Day 21 Progress – Optimized Model Integration

## Objective

To integrate the optimized demand forecasting model into the FastAPI backend and provide forecast and pricing information through a single API.

## Work Completed

- Integrated the optimized Gradient Boosting model.
- Loaded `best_demand_model.pkl`.
- Created the `/api/forecast-pricing` endpoint.
- Integrated demand forecasting with the pricing optimizer.
- Added forecasted demand to the API response.
- Added inventory level to the API response.
- Added current price and competitor price.
- Added recommended price.
- Added pricing action.

## Best Model

Model: Gradient Boosting Regressor

Best Parameters:

- Learning Rate: 0.1
- Max Depth: 5
- Number of Estimators: 200

Performance:

- MAE: 12.25
- RMSE: 16.05
- R² Score: 0.8833

## API Testing

Endpoint:

POST `/api/forecast-pricing`

Test Result:

- Forecasted Demand: 109.8
- Inventory Level: 195
- Current Price: 72.72
- Competitor Price: 85.73
- Recommended Price: 72.72
- Action: Maintain Price

## Outcome

The optimized Gradient Boosting model was successfully integrated with the FastAPI backend. The API can now provide forecasted demand, inventory information, pricing information and pricing recommendations in a single response.

## Next Steps

- Integrate Groq as an external LLM.
- Generate AI-based business insights from forecast and pricing results.
- Further improve the backend for Milestone 2.

# Day 22 Progress – Groq AI Integration

## Objective

To integrate Groq as an external Large Language Model (LLM) to generate AI-based business insights from demand forecasting and pricing results.

## Work Completed

- Installed Groq and python-dotenv.
- Configured the Groq API key using environment variables.
- Created `backend/groq_service.py`.
- Integrated Groq with PricePilot AI.
- Tested Groq independently.
- Created the `/api/ai-insight` FastAPI endpoint.
- Connected ML forecasting results with the Groq LLM.

## Groq Model

Model used:

`openai/gpt-oss-20b`

## AI Inputs

The Groq service receives:

- Forecasted Demand
- Inventory Level
- Current Price
- Competitor Price
- Recommended Price
- Pricing Action

## AI Output

Groq generates a concise business insight explaining:

- Demand situation
- Inventory situation
- Price comparison
- Reason for the recommended pricing action

## Test Result

Forecasted Demand: 109.8

Inventory Level: 195

Current Price: 72.72

Competitor Price: 85.73

Recommended Price: 72.72

Action: Maintain Price

Groq successfully generated a business insight based on these values.

## Outcome

Groq was successfully integrated as an external LLM for PricePilot AI. The system can now combine machine learning predictions, pricing recommendations and AI-generated business insights.

## Next Steps

- Complete Milestone 2 backend integration.
- Improve API error handling.
- Connect database information with the backend.
- Prepare the final backend workflow.


# Day 23 Progress – Milestone 2 Backend Integration

## Objective

To complete the major backend integration of PricePilot AI by connecting demand forecasting, pricing recommendation, database connectivity and Groq-based AI insights.

## Work Completed

- Cleaned the pricing optimizer module.
- Integrated the optimized Gradient Boosting model.
- Integrated demand forecasting with pricing recommendation.
- Integrated Groq as an external LLM.
- Added AI-generated business insights.
- Added error handling for AI requests.
- Created a complete analysis API endpoint.
- Verified database connectivity.
- Tested the backend through FastAPI Swagger.

## Complete Backend Workflow

The current PricePilot AI workflow is:

Dataset
→ Data Preprocessing
→ Feature Engineering
→ Model Training
→ GridSearchCV
→ Best Model Selection
→ Demand Forecasting
→ Pricing Recommendation
→ Groq AI Insight

## Best Model

Model: Gradient Boosting Regressor

Best Parameters:

- Learning Rate: 0.1
- Max Depth: 5
- Number of Estimators: 200

Performance:

- MAE: 12.25
- RMSE: 16.05
- R² Score: 0.8833

## API Endpoints

### Health Check

GET `/api/health`

### Database Check

GET `/api/database`

### Forecast and Pricing

POST `/api/forecast-pricing`

### AI Insight

POST `/api/ai-insight`

### Complete Analysis

POST `/api/complete-analysis`

## Complete Analysis Output

The complete API provides:

- Forecasted demand
- Inventory level
- Current price
- Competitor price
- Recommended price
- Pricing action
- AI-generated business insight

## Outcome

The major backend components of PricePilot AI were successfully integrated. The backend can now combine machine learning demand forecasting, rule-based pricing recommendations, database connectivity and Groq-based AI business insights.

## Current Limitation

The current pricing recommendation uses rule-based pricing logic. The system is not yet a fully autonomous optimization engine.

The model also currently uses dataset rows as input for forecasting. A production implementation would require a proper input validation and preprocessing pipeline for new real-world data.

## Next Steps

- Improve model input preprocessing.
- Improve database integration.
- Add frontend/dashboard integration.
- Add API documentation.
- Perform complete system testing.

# Day 24 Progress – Frontend Dashboard Integration

## Objective

To create a simple frontend dashboard that displays the demand forecast, inventory information, pricing recommendation and Groq AI business insight generated by the PricePilot AI backend.

## Work Completed

- Created the frontend interface.
- Created `index.html`.
- Created `style.css`.
- Created `script.js`.
- Connected the frontend with the FastAPI backend.
- Added CORS configuration.
- Connected the frontend to `/api/complete-analysis`.
- Added dataset row selection.
- Displayed forecasted demand.
- Displayed inventory level.
- Displayed current price.
- Displayed competitor price.
- Displayed recommended price.
- Displayed pricing action.
- Displayed Groq AI business insight.

## Frontend Components

### Input

The user can provide a dataset row ID for analysis.

### Dashboard

The dashboard displays:

- Forecasted Demand
- Inventory Level
- Current Price
- Competitor Price
- Recommended Price
- Pricing Action

### AI Insight

The Groq LLM generates a business explanation based on the forecasting and pricing results.

## System Flow

Frontend
→ FastAPI
→ Demand Forecasting Model
→ Pricing Optimizer
→ Groq AI
→ Frontend Dashboard

## Outcome

The PricePilot AI frontend was successfully connected to the backend. The system can now display machine learning predictions, pricing recommendations and AI-generated business insights through a single dashboard.

## Next Steps

- Improve frontend design.
- Add charts and visual analytics.
- Improve API validation and error handling.
- Perform complete system testing.
- Prepare Milestone 2 documentation.


# Day 25 Progress – Complete System Testing

## Objective

To test the complete PricePilot AI system after integrating the frontend, FastAPI backend, demand forecasting model, pricing optimizer and Groq AI.

## System Tested

Frontend
→ FastAPI Backend
→ Gradient Boosting Model
→ Demand Forecast
→ Pricing Recommendation
→ Groq AI Insight
→ Frontend Dashboard

## Testing Performed

- Tested FastAPI backend startup.
- Tested frontend server.
- Tested complete analysis API.
- Tested dataset row-based analysis.
- Tested demand forecasting.
- Tested pricing recommendation.
- Tested competitor price comparison.
- Tested inventory display.
- Tested Groq AI insight generation.
- Tested frontend API integration.

## Test Cases

| Test Case | Input | Result |
|---|---|---|
| Dataset Row Test | 0 | Passed |
| Dataset Row Test | 10 | Passed |
| Dataset Row Test | 100 | Passed |
| Dataset Row Test | 500 | Passed |
| Dataset Row Test | 1000 | Passed |

## Complete Output

The system successfully displays:

- Forecasted Demand
- Inventory Level
- Current Price
- Competitor Price
- Recommended Price
- Pricing Action
- AI-generated Business Insight

## Outcome

The PricePilot AI frontend and backend were successfully integrated and tested. The system can perform demand forecasting, generate pricing recommendations and provide AI-based business insights through the dashboard.

## Next Step

- Improve frontend and backend error handling.
- Perform final API testing.
- Clean project files.
- Prepare final project documentation.


# Day 26 Progress – Final API Testing & Project Cleanup

## Objective

To perform final API testing, verify backend functionality, test error handling and clean the PricePilot AI project.

## APIs Tested

### 1. Health Check
Endpoint:
GET `/api/health`

Status:
Passed

### 2. Database Connection
Endpoint:
GET `/api/database`

Status:
Passed

### 3. Forecast and Pricing
Endpoint:
POST `/api/forecast-pricing`

Input:
```json
{
  "row_id": 0
}


# Day 27 Progress – Final Cleanup & Documentation

## Objective

To perform the final cleanup, API verification and documentation of the PricePilot AI project.

## Work Completed

- Verified FastAPI backend startup.
- Verified Swagger API documentation.
- Tested demand forecasting API.
- Tested pricing recommendation API.
- Tested Groq AI insight generation.
- Tested complete analysis API.
- Verified frontend and backend integration.
- Reviewed project structure.
- Reviewed Git status and ignored files.
- Updated final project documentation.

## Backend Verification

FastAPI Swagger:

`http://127.0.0.1:8000/docs`

The backend successfully returned responses with:

- Forecasted Demand
- Inventory Level
- Current Price
- Competitor Price
- Recommended Price
- Pricing Action
- AI-generated Business Insight

## Complete Analysis API

Endpoint:

`POST /api/complete-analysis`

Test Input:

```json
{
  "row_id": 0
}

# Day 28 Progress – Final System Testing

## Objective

To perform final end-to-end testing of the PricePilot AI system and verify the integration between the machine learning model, pricing recommendation engine, Groq AI service, FastAPI backend and frontend dashboard.

## Testing Performed

### Backend Testing

- Verified FastAPI server startup.
- Verified Swagger API documentation.
- Tested health check API.
- Tested database connection API.
- Tested demand forecasting and pricing API.
- Tested Groq AI insight API.
- Tested complete analysis API.

### Frontend Testing

- Verified frontend server.
- Verified connection between frontend and FastAPI backend.
- Tested dataset row analysis.
- Verified forecasted demand display.
- Verified inventory display.
- Verified current price display.
- Verified competitor price display.
- Verified recommended price display.
- Verified pricing action display.
- Verified Groq AI insight display.

## Complete Analysis Test

Endpoint:

`POST /api/complete-analysis`

Input:

```json
{
  "row_id": 0
}