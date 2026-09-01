# Temporal Anomaly Resolution

## Observation

`discounts_history.csv` contains 3,746,744 rows and a `date` column ranging from 2022-08-28 to 2045-12-31. The reference `sales.csv` ranges through 2024-09-26. The anomaly report identified 314,913 records after that reference endpoint (8.405%).

| Period | Record count | Percentage |
|---|---:|---:|
| Through 2024-09-26 | 3,431,831 | 91.595% |
| After 2024-09-26 | 314,913 | 8.405% |
| 2025 onward | 233,374 | 6.229% |

## Investigation

- The raw schema is 9 columns including the export index `Unnamed: 0`; the business fields include item, store, document, promotion prices, and `number_disc_day`.
- Post-reference rows contain 313 distinct promotion documents, 2283 items, and 4 stores.
- The post-reference dates have a highly regular annual pattern through 2045. The `number_disc_day` field is strongly aligned with calendar progression, including values around 8,766 on 2045-12-31.
- The post-reference block has 200,224 rows where before-promotion and promotion-time prices are equal, and 237,790 missing promotion codes.
- No sales records occur on post-reference dates. The future records have 0 exact date/item/store keys overlapping historical discount keys, but no matching sales dates; therefore they are not evidenced as realized historical sales activity.
- No reliable transformation can infer a corrected historical date.

## Interpretation

The strongest data-supported explanation is that the block contains future/planned or synthetic continuation records, not genuine historical observations. The regular yearly repetition, limited document/item combinations, and calendar-like day counter support this interpretation. The dataset alone cannot distinguish operational planned promotions from generated synthetic continuation with absolute certainty.

## Decision

Use option D: retain the post-reference records in `future_discounts_history.csv`, while using only records through 2024-09-26 in the historical `cleaned_discounts_history.csv`. No dates were changed and no records were destroyed.

This is appropriate for PricePilot because historical pricing or demand analysis must align discount observations with the observed sales period. Mixing the future block into historical training could expose models to information unavailable at the time of historical sales and would create temporal leakage. The separate file may be used later only for explicitly future/planned promotion analysis.

## Validation

- Historical processed dataset: 3,431,831 rows; minimum 2022-08-28; maximum 2024-09-26; records outside cutoff: 0.
- Future/planned dataset: 314,913 rows; minimum 2024-09-27; maximum 2045-12-31; records outside cutoff: 314913.
- Raw SHA-256 before/after: `ef0fdc89e778db71fc8ce5a1736742c9d5b36af9793af7d9654750de3cc868c4` / `ef0fdc89e778db71fc8ce5a1736742c9d5b36af9793af7d9654750de3cc868c4`; unchanged: **yes**.
- Historical duplicate rows: 0; historical duplicate date/item/store keys: 0.
- Date parsing completed without invalid values.

## Limitation

The source does not contain an explicit status field such as planned/actual, so the future/planned interpretation remains evidence-based rather than proven by source metadata. The separation is therefore reversible and preserves the full raw evidence.
