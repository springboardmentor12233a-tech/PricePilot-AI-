# Dataset Report
## sales.csv

### Dataset Dimensions
- Raw rows: 3,746,744
- Raw columns: 8
- Cleaned rows: 3,746,744
- Cleaned columns: 8

### Data Quality Assessment

#### Duplicate Row Analysis

**OBSERVATION:**
- Exact duplicate rows found: 0 (0.000% of 3,746,744 total rows)

**INTERPRETATION:**
- Exact duplicates may represent: legitimate repeated business transactions (e.g., multiple identical purchases), data entry errors, or unintended duplication.
- Without definitive evidence of errors, data preservation is the professionally appropriate decision to avoid information loss.

**DECISION:**
- Retained — insufficient evidence that duplicates are erroneous.

**SUMMARY:**
- Rows removed: 0
- Rows retained: 3,746,744
- Reasoning: Without clear identifier columns or business context indicating these are errors, duplicates are preserved to avoid data loss.

#### Missing Values (Top 10)

| Column | Count | Percentage |
|--------|------:|----------:|
| promo_type_code | 317,846 | 8.48% |

### Preprocessing Performed
- Removed unnamed/index columns
- Normalized column names to lower_snake_case
- Parsed date-like columns to datetime where possible
- Applied evidence-based duplicate handling (see Duplicate Row Analysis above)
- Preserved raw file without modification

### Data Type Summary
- float64: 3
- str: 2
- datetime64[us]: 1
- datetime64[ns]: 1
- int64: 1

### PricePilot Feature Coverage
- **Price data**: Yes
- **Sales/quantity data**: No
- **Temporal data**: Yes
- **Product identifiers**: Yes
- **Store identifiers**: Yes

### Suitability for PricePilot
- Use this dataset as supporting evidence for pricing, revenue, and demand analysis.
- Validate key fields (date, product ID, store ID) before integrating with other datasets.
- Review duplicate handling documentation above before downstream processing.