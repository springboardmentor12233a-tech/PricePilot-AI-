# Dataset Report
## amazon_sales_dataset.csv

### Dataset Dimensions
- Raw rows: 50,000
- Raw columns: 13
- Cleaned rows: 50,000
- Cleaned columns: 13

### Data Quality Assessment

#### Duplicate Row Analysis

**OBSERVATION:**
- Exact duplicate rows found: 0 (0.000% of 50,000 total rows)

**INTERPRETATION:**
- Exact duplicates may represent: legitimate repeated business transactions (e.g., multiple identical purchases), data entry errors, or unintended duplication.
- Without definitive evidence of errors, data preservation is the professionally appropriate decision to avoid information loss.

**DECISION:**
- Retained — insufficient evidence that duplicates are erroneous.

**SUMMARY:**
- Rows removed: 0
- Rows retained: 50,000
- Reasoning: Without clear identifier columns or business context indicating these are errors, duplicates are preserved to avoid data loss.

#### Missing Values (Top 10)

| Column | Count | Percentage |
|--------|------:|----------:|

### Preprocessing Performed
- Removed unnamed/index columns
- Normalized column names to lower_snake_case
- Parsed date-like columns to datetime where possible
- Applied evidence-based duplicate handling (see Duplicate Row Analysis above)
- Preserved raw file without modification

### Data Type Summary
- int64: 5
- float64: 4
- str: 3
- datetime64[us]: 1

### PricePilot Feature Coverage
- **Price data**: Yes
- **Sales/quantity data**: Yes
- **Temporal data**: Yes
- **Product identifiers**: Yes
- **Store identifiers**: No

### Suitability for PricePilot
- Use this dataset as supporting evidence for pricing, revenue, and demand analysis.
- Validate key fields (date, product ID, store ID) before integrating with other datasets.
- Review duplicate handling documentation above before downstream processing.