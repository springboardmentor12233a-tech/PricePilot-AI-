# Feature Engineering

## Objective

The objective of feature engineering is to transform the processed sales dataset into a format suitable for machine learning.

## Date Features

The Date column was converted into the following features:

- Year
- Month
- Day
- DayOfWeek

## Pricing Features

Two additional pricing features were created:

- Price Difference
- Price Ratio

### Price Difference

Price Difference is calculated as:

Price - Competitor Pricing

### Price Ratio

Price Ratio is calculated as:

Price / Competitor Pricing

## Categorical Encoding

The following categorical variables were encoded:

- Category
- Region
- Weather Condition
- Seasonality

One-hot encoding was used to convert categorical values into numerical features.

## Output

The feature-engineered dataset is saved as:

data/processed/ml_ready_data.csv