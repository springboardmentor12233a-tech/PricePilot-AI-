# Dataset Report
## catalog.csv

### Dataset Dimensions
- Raw rows: 219,810
- Raw columns: 8
- Cleaned rows: 219,810
- Cleaned columns: 8

### Data Quality Assessment

#### Duplicate Row Analysis

**OBSERVATION:**
- Exact duplicate rows found: 0 (0.000% of 219,810 total rows)

**INTERPRETATION:**
- Exact duplicates may represent: legitimate repeated business transactions (e.g., multiple identical purchases), data entry errors, or unintended duplication.
- Without definitive evidence of errors, data preservation is the professionally appropriate decision to avoid information loss.

**DECISION:**
- Retained — insufficient evidence that duplicates are erroneous.

**SUMMARY:**
- Rows removed: 0
- Rows retained: 219,810
- Reasoning: Without clear identifier columns or business context indicating these are errors, duplicates are preserved to avoid data loss.

#### Missing Values (Top 10)

| Column | Count | Percentage |
|--------|------:|----------:|
| fatness | 212,598 | 96.72% |
| item_type | 176,224 | 80.17% |
| weight_netto | 170,853 | 77.73% |
| weight_volume | 136,858 | 62.26% |

### Preprocessing Performed
- Removed unnamed/index columns
- Normalized column names to lower_snake_case
- Parsed date-like columns to datetime where possible
- Applied evidence-based duplicate handling (see Duplicate Row Analysis above)
- Preserved raw file without modification

### Data Type Summary
- str: 5
- float64: 3

### PricePilot Feature Coverage
- **Price data**: No
- **Sales/quantity data**: No
- **Temporal data**: No
- **Product identifiers**: Yes
- **Store identifiers**: No

### Suitability for PricePilot
- Use this dataset as supporting evidence for pricing, revenue, and demand analysis.
- Validate key fields (date, product ID, store ID) before integrating with other datasets.
- Review duplicate handling documentation above before downstream processing.