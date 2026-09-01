from pathlib import Path
import re
import textwrap

import pandas as pd
import nbformat as nbf

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / 'datasets' / 'raw'
PROCESSED_DIR = ROOT / 'datasets' / 'processed'
NOTEBOOK_DIR = ROOT / 'eda' / 'notebooks'
REPORT_DIR = ROOT / 'eda' / 'reports'

for d in [PROCESSED_DIR, NOTEBOOK_DIR, REPORT_DIR]:
    d.mkdir(parents=True, exist_ok=True)

RAW_FILES = sorted(RAW_DIR.glob('*.csv'))
if not RAW_FILES:
    raise FileNotFoundError(f'No raw CSV files found in {RAW_DIR}')


def stem_name(path: Path) -> str:
    return re.sub(r'[^a-z0-9]+', '_', path.stem.lower()).strip('_')


def read_df(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    df = df.loc[:, ~df.columns.astype(str).str.contains(r'^Unnamed: ', na=False)]
    return df


def inventory_table() -> pd.DataFrame:
    rows = []
    for p in RAW_FILES:
        df = read_df(p)
        price_cols = [c for c in df.columns if 'price' in c.lower()]
        sales_cols = [c for c in df.columns if any(k in c.lower() for k in ['quantity', 'qty', 'sales', 'revenue', 'total', 'sold'])]
        date_cols = [c for c in df.columns if 'date' in c.lower() or 'time' in c.lower()]
        id_cols = [c for c in df.columns if any(k in c.lower() for k in ['id', 'product', 'store', 'customer', 'order', 'transaction'])]
        low_name = p.name.lower()
        if any(k in low_name for k in ['sales', 'markdown', 'discount', 'price', 'actual', 'demand']):
            role = 'Retail pricing / demand / promotion analytics'
        elif any(k in low_name for k in ['amazon', 'ecommerce', 'online']):
            role = 'Ecommerce revenue / pricing / customer behavior'
        else:
            role = 'Catalog / metadata / reference'
        rows.append({
            'file_name': p.name,
            'file_format': p.suffix.lower().lstrip('.'),
            'rows': df.shape[0],
            'columns': df.shape[1],
            'date_columns': ', '.join(date_cols[:5]),
            'price_columns': ', '.join(price_cols[:5]),
            'sales_columns': ', '.join(sales_cols[:5]),
            'identifier_columns': ', '.join(id_cols[:5]),
            'potential_role': role,
        })
    return pd.DataFrame(rows).sort_values('file_name').reset_index(drop=True)


def generate_notebook(raw_path: Path):
    stem = stem_name(raw_path)
    nb = nbf.v4.new_notebook()
    cells = [
        nbf.v4.new_markdown_cell(f'# {raw_path.stem}\n\nDataset inspection, data quality assessment, and business-oriented EDA for the PricePilot AI preparation stage.\n\nThis notebook provides comprehensive exploratory analysis to support the PricePilot pricing intelligence project.'),
        
        nbf.v4.new_code_cell(textwrap.dedent(f'''
            import pandas as pd
            import numpy as np
            import matplotlib.pyplot as plt
            import seaborn as sns
            from pathlib import Path
            
            # Set visualization defaults
            sns.set_style("whitegrid")
            plt.rcParams['figure.figsize'] = (10, 5)
            
            # Find project root dynamically - works on any machine after cloning
            notebook_dir = Path.cwd()
            if 'eda' not in str(notebook_dir):
                notebook_dir = Path.cwd().parents[0]
            project_root = notebook_dir.parents[0] if (notebook_dir / 'notebooks').exists() else notebook_dir.parents[1]
            
            # Use standardized datasets/ path
            raw_dir = project_root / 'datasets' / 'raw'
            
            raw_path = raw_dir / '{raw_path.name}'
            df = pd.read_csv(raw_path, low_memory=False)
            df = df.loc[:, ~df.columns.astype(str).str.contains(r"^Unnamed: ", na=False)]
            print("=" * 60)
            print(f"Dataset: {raw_path.name}")
            print("=" * 60)
            print(f"Rows: {df.shape[0]:,}")
            print(f"Columns: {df.shape[1]}")
            print(f"\\nColumn names and types:")
            print(df.dtypes)
            print(f"\\nFile location: {raw_path}")
        ''')),
        
        nbf.v4.new_markdown_cell('## Data Quality Assessment'),
        
        nbf.v4.new_code_cell(textwrap.dedent('''
            # Missing values analysis
            missing = df.isna().sum().reset_index()
            missing.columns = ['column', 'missing_count']
            missing['missing_pct'] = (missing['missing_count'] / len(df) * 100).round(3)
            missing = missing[missing['missing_count'] > 0].sort_values('missing_pct', ascending=False)
            
            if not missing.empty:
                print("Missing Value Analysis (columns with missing values only):")
                display(missing)
            else:
                print("No missing values detected in the dataset.")
            
            # Duplicate analysis - EVIDENCE-BASED APPROACH
            exact_dupes = df.duplicated().sum()
            dupe_pct = (exact_dupes / len(df) * 100) if len(df) > 0 else 0
            print(f"\\nDuplicate Row Analysis:")
            print(f"- Exact duplicate rows: {exact_dupes:,} ({dupe_pct:.3f}%)")
            
            if exact_dupes > 0:
                print(f"\\n** OBSERVATION: **")
                print(f"Exact duplicates detected. These may represent:")
                print(f"  • Legitimate repeated business transactions (e.g., multiple purchases)")
                print(f"  • Data entry errors or accidental duplication")
                print(f"  • Repeated observations in the source system")
                print(f"\\n** DECISION: **")
                print(f"Exact duplicate records are RETAINED because there is insufficient evidence")
                print(f"to classify them as erroneous. In professional data handling, data preservation")
                print(f"takes priority over speculative deletion, especially in internship projects where")
                print(f"decisions must be evidence-based and defensible.")
            else:
                print(f"\\nNo exact duplicate rows found.")
        ''')),
        
        nbf.v4.new_markdown_cell('## Descriptive Statistics'),
        
        nbf.v4.new_code_cell(textwrap.dedent('''
            # Numeric column analysis
            numeric = df.select_dtypes(include=['number'])
            if not numeric.empty:
                print("Numeric Columns Summary Statistics:")
                display(numeric.describe().T)
            else:
                print("No numeric columns detected in this dataset.")
        ''')),
        
        nbf.v4.new_markdown_cell('## Key Business Metrics Analysis'),
        
        nbf.v4.new_code_cell(textwrap.dedent('''
            # Identify and analyze key business columns
            price_cols = [c for c in df.columns if 'price' in c.lower()]
            sales_cols = [c for c in df.columns if any(term in c.lower() for term in ['quantity', 'qty', 'sales', 'units', 'sold'])]
            revenue_cols = [c for c in df.columns if any(term in c.lower() for term in ['revenue', 'total', 'amount', 'value'])]
            discount_cols = [c for c in df.columns if any(term in c.lower() for term in ['discount', 'promo', 'markdown'])]
            cost_cols = [c for c in df.columns if any(term in c.lower() for term in ['cost', 'cogs'])]
            profit_cols = [c for c in df.columns if 'profit' in c.lower()]
            
            print("Identified Business-Relevant Columns:")
            if price_cols: print(f"  Price columns: {price_cols}")
            if sales_cols: print(f"  Sales/Quantity columns: {sales_cols}")
            if revenue_cols: print(f"  Revenue columns: {revenue_cols}")
            if discount_cols: print(f"  Discount/Promotion columns: {discount_cols}")
            if cost_cols: print(f"  Cost columns: {cost_cols}")
            if profit_cols: print(f"  Profit columns: {profit_cols}")
        ''')),
        
        nbf.v4.new_markdown_cell('## Distribution Analysis'),
        
        nbf.v4.new_code_cell(textwrap.dedent('''
            # Visualize distributions of key numeric columns
            key_cols = [c for c in df.columns if any(term in c.lower() for term in ['price', 'discount', 'quantity', 'qty', 'sales', 'revenue', 'profit', 'stock', 'cost'])]
            key_cols = list(dict.fromkeys(key_cols))
            
            for col in key_cols[:6]:  # Limit to first 6 columns
                if pd.api.types.is_numeric_dtype(df[col]):
                    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
                    
                    # Histogram with KDE
                    ax1.hist(df[col].dropna(), bins=40, edgecolor='black', alpha=0.7)
                    ax1.set_title(f'Distribution of {col}', fontsize=12, fontweight='bold')
                    ax1.set_xlabel(col)
                    ax1.set_ylabel('Frequency')
                    ax1.grid(axis='y', alpha=0.3)
                    
                    # Box plot for outlier detection
                    ax2.boxplot(df[col].dropna())
                    ax2.set_title(f'Box Plot of {col}', fontsize=12, fontweight='bold')
                    ax2.set_ylabel(col)
                    ax2.grid(axis='y', alpha=0.3)
                    
                    plt.tight_layout()
                    plt.show()
        ''')),
        
        nbf.v4.new_markdown_cell('## Temporal Analysis'),
        
        nbf.v4.new_code_cell(textwrap.dedent('''
            # Temporal analysis for date columns
            date_cols = [c for c in df.columns if 'date' in c.lower() or 'time' in c.lower()]
            
            if date_cols:
                print(f"Found {len(date_cols)} date column(s): {date_cols}\\n")
                
                for date_col in date_cols:
                    temp = df.copy()
                    temp[date_col] = pd.to_datetime(temp[date_col], errors='coerce')
                    
                    valid_dates = temp[date_col].notna().sum()
                    invalid_dates = temp[date_col].isna().sum()
                    
                    print(f"Column: {date_col}")
                    print(f"  Valid dates: {valid_dates:,}")
                    print(f"  Invalid/missing dates: {invalid_dates:,}")
                    
                    if valid_dates > 0:
                        print(f"  Date range: {temp[date_col].min()} to {temp[date_col].max()}")
                        
                        # Monthly distribution
                        temp_valid = temp[temp[date_col].notna()]
                        monthly = temp_valid.groupby(temp_valid[date_col].dt.to_period('M')).size().to_timestamp()
                        
                        plt.figure(figsize=(12, 4))
                        plt.plot(monthly.index, monthly.values, marker='o', linewidth=1.5, markersize=4)
                        plt.title(f'Monthly Record Distribution: {date_col}', fontsize=12, fontweight='bold')
                        plt.xlabel('Date')
                        plt.ylabel('Record Count')
                        plt.xticks(rotation=45)
                        plt.grid(axis='y', alpha=0.3)
                        plt.tight_layout()
                        plt.show()
                    print()
            else:
                print("No date columns detected in this dataset.")
        ''')),
        
        nbf.v4.new_markdown_cell('## Categorical Analysis'),
        
        nbf.v4.new_code_cell(textwrap.dedent('''
            # Analyze categorical columns (non-numeric, non-date)
            categorical = df.select_dtypes(include=['object']).columns.tolist()
            
            if categorical:
                print(f"Categorical Columns: {categorical}\\n")
                
                for col in categorical[:4]:  # Limit to first 4 to avoid clutter
                    unique_count = df[col].nunique()
                    print(f"Column: {col}")
                    print(f"  Unique values: {unique_count:,}")
                    print(f"  Missing: {df[col].isna().sum():,}")
                    
                    if unique_count <= 20:
                        print(f"  Top 10 values:")
                        value_counts = df[col].value_counts().head(10)
                        for val, count in value_counts.items():
                            print(f"    {val}: {count:,}")
                    print()
            else:
                print("No categorical columns detected.")
        ''')),
        
        nbf.v4.new_markdown_cell('## PricePilot Feature Coverage'),
        
        nbf.v4.new_code_cell(textwrap.dedent('''
            # Assess feature availability for PricePilot
            coverage = pd.DataFrame({
                'Feature': [
                    'Historical Product Price',
                    'Discount / Promotion',
                    'Units Sold / Quantity',
                    'Revenue / Total',
                    'Product Category',
                    'Temporal Data (Date)',
                    'Store Identifier',
                    'Product Identifier',
                    'Customer Identifier',
                    'Inventory / Stock Level'
                ],
                'Available': [
                    any('price' in c.lower() for c in df.columns),
                    any('discount' in c.lower() or 'promo' in c.lower() or 'markdown' in c.lower() for c in df.columns),
                    any('quantity' in c.lower() or 'qty' in c.lower() or 'sold' in c.lower() or 'units' in c.lower() for c in df.columns),
                    any('revenue' in c.lower() or 'total' in c.lower() for c in df.columns),
                    any('category' in c.lower() or 'dept' in c.lower() or 'class' in c.lower() for c in df.columns),
                    any('date' in c.lower() for c in df.columns),
                    any('store' in c.lower() for c in df.columns),
                    any('product' in c.lower() or 'item' in c.lower() or 'sku' in c.lower() for c in df.columns),
                    any('customer' in c.lower() or 'cust' in c.lower() for c in df.columns),
                    any('stock' in c.lower() or 'inventory' in c.lower() for c in df.columns),
                ]
            })
            
            coverage['Data Type'] = coverage['Feature'].apply(
                lambda f: df[[c for c in df.columns if f.lower().split()[0] in c.lower()[0:10]]].dtypes.values[0] if any(f.lower().split()[0] in c.lower()[0:10] for c in df.columns) else 'N/A'
            )
            
            print("Feature Coverage for PricePilot AI:")
            display(coverage)
            
            coverage_pct = (coverage['Available'].sum() / len(coverage) * 100)
            print(f"\\nFeature Coverage Score: {coverage_pct:.1f}%")
        ''')),
        
        nbf.v4.new_markdown_cell('## Data Quality Summary'),
        
        nbf.v4.new_code_cell(textwrap.dedent('''
            print("=" * 60)
            print("DATA QUALITY SUMMARY")
            print("=" * 60)
            print(f"Total Records: {len(df):,}")
            print(f"Total Columns: {df.shape[1]}")
            print(f"Memory Usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
            print(f"\\nData Completeness:")
            print(f"  Cells with data: {df.count().sum():,}")
            print(f"  Empty cells: {(df.isna().sum().sum()):,}")
            print(f"  Completeness: {((df.count().sum() / (len(df) * df.shape[1])) * 100):.2f}%")
            print(f"\\nData Integrity:")
            print(f"  Exact duplicate rows: {df.duplicated().sum():,}")
            print(f"  Numeric column count: {len(df.select_dtypes(include=['number']).columns)}")
            print(f"  Categorical column count: {len(df.select_dtypes(include=['object']).columns)}")
            print(f"\\nNext Steps:")
            print(f"  1. Review individual column distributions above")
            print(f"  2. Check temporal coverage if dates are present")
            print(f"  3. Identify key business metrics for PricePilot")
            print(f"  4. Review full EDA report in eda/reports/")
        ''')),
    ]
    nb.cells = cells
    with open(NOTEBOOK_DIR / f'{stem}_eda.ipynb', 'w', encoding='utf-8') as f:
        nbf.write(nb, f)


def analyze_duplicates(df: pd.DataFrame, raw_path: Path) -> dict:
    """
    Analyze duplicate rows with evidence-based assessment.
    Returns analysis results without automatically removing duplicates.
    
    Duplicates are retained by default unless there is clear evidence
    they represent erroneous data entry or unintended duplication.
    """
    analysis = {
        'file_name': raw_path.name,
        'total_rows': len(df),
        'exact_duplicate_rows': 0,
        'duplicate_percentage': 0.0,
        'rows_removed': 0,
        'rows_retained': len(df),
        'duplicate_decision': 'Retained — insufficient evidence that duplicates are erroneous.',
        'duplicate_reasoning': 'Without clear identifier columns or business context indicating these are errors, duplicates are preserved to avoid data loss.'
    }
    
    exact_dupes = df.duplicated().sum()
    if exact_dupes > 0:
        dupe_pct = (exact_dupes / len(df)) * 100
        analysis['exact_duplicate_rows'] = int(exact_dupes)
        analysis['duplicate_percentage'] = round(dupe_pct, 3)
    
    return analysis


def clean_and_export(df: pd.DataFrame, raw_path: Path) -> tuple:
    """
    Clean dataset with evidence-based transformations.
    
    Returns:
        tuple: (cleaned_df, duplicate_analysis)
    
    Note: Duplicates are RETAINED by default. Only removes exact duplicates
    if there is clear, documented evidence they represent errors. A percentage
    threshold alone is not sufficient justification for deletion in an internship project.
    """
    cleaned = df.copy()
    
    # Remove unnamed index columns
    cleaned = cleaned.loc[:, ~cleaned.columns.astype(str).str.contains(r'^Unnamed: ', na=False)]
    
    # Normalize column names
    cleaned.columns = [re.sub(r'[^a-z0-9]+', '_', str(c).lower()).strip('_') for c in cleaned.columns]
    
    # Parse date-like columns
    date_like_cols = [c for c in cleaned.columns if 'date' in c or 'time' in c]
    for col in date_like_cols:
        cleaned[col] = pd.to_datetime(cleaned[col], errors='coerce')
    
    # Handle object columns
    for col in cleaned.columns:
        if cleaned[col].dtype == object:
            cleaned[col] = cleaned[col].astype(str).replace({'nan': pd.NA, 'None': pd.NA})
    
    # Analyze duplicates with evidence-based approach
    dup_analysis = analyze_duplicates(cleaned, raw_path)
    
    # By default: RETAIN all duplicates unless there is clear evidence to remove them
    # This aligns with professional data handling practices for internship projects
    # where data loss must be justified by specific, documented evidence
    
    out_file = PROCESSED_DIR / f'cleaned_{stem_name(raw_path)}.csv'
    cleaned.to_csv(out_file, index=False)
    
    return cleaned, dup_analysis


def create_report(file_name: str, df: pd.DataFrame, cleaned_df: pd.DataFrame, dup_analysis: dict):
    """
    Create comprehensive markdown report with evidence-based duplicate analysis.
    """
    missing = df.isna().sum().sort_values(ascending=False).head(10)
    exact_dupes = dup_analysis['exact_duplicate_rows']
    dupe_pct = dup_analysis['duplicate_percentage']
    
    lines = [
        '# Dataset Report',
        f'## {file_name}',
        '',
        '### Dataset Dimensions',
        f'- Raw rows: {df.shape[0]:,}',
        f'- Raw columns: {df.shape[1]}',
        f'- Cleaned rows: {cleaned_df.shape[0]:,}',
        f'- Cleaned columns: {cleaned_df.shape[1]}',
        '',
        '### Data Quality Assessment',
        '',
        '#### Duplicate Row Analysis',
        '',
        f'**OBSERVATION:**',
        f'- Exact duplicate rows found: {exact_dupes:,} ({dupe_pct:.3f}% of {dup_analysis["total_rows"]:,} total rows)',
        '',
        f'**INTERPRETATION:**',
        f'- Exact duplicates may represent: legitimate repeated business transactions (e.g., multiple identical purchases), data entry errors, or unintended duplication.',
        f'- Without definitive evidence of errors, data preservation is the professionally appropriate decision to avoid information loss.',
        '',
        f'**DECISION:**',
        f'- {dup_analysis["duplicate_decision"]}',
        '',
        f'**SUMMARY:**',
        f'- Rows removed: {dup_analysis["rows_removed"]}',
        f'- Rows retained: {dup_analysis["rows_retained"]:,}',
        f'- Reasoning: {dup_analysis["duplicate_reasoning"]}',
        '',
        '#### Missing Values (Top 10)',
        '',
        '| Column | Count | Percentage |',
        '|--------|------:|----------:|',
    ]
    
    for col, count in missing.items():
        pct = (count / len(df) * 100) if len(df) > 0 else 0
        if count > 0:
            lines.append(f'| {col} | {count:,} | {pct:.2f}% |')
    
    if missing.empty:
        lines.append('| (No missing values) | - | - |')
    
    lines.extend([
        '',
        '### Preprocessing Performed',
        '- Removed unnamed/index columns',
        '- Normalized column names to lower_snake_case',
        '- Parsed date-like columns to datetime where possible',
        f'- Applied evidence-based duplicate handling (see Duplicate Row Analysis above)',
        '- Preserved raw file without modification',
        '',
        '### Data Type Summary',
    ])
    
    dtype_summary = cleaned_df.dtypes.astype(str).value_counts()
    for dtype, count in dtype_summary.items():
        lines.append(f'- {dtype}: {count}')
    
    lines.extend([
        '',
        '### PricePilot Feature Coverage',
        '- **Price data**: ' + ('Yes' if any('price' in c.lower() for c in df.columns) else 'No'),
        '- **Sales/quantity data**: ' + ('Yes' if any(term in str(df.columns).lower() for term in ['quantity', 'qty', 'sales', 'sold']) else 'No'),
        '- **Temporal data**: ' + ('Yes' if any('date' in c.lower() or 'time' in c.lower() for c in df.columns) else 'No'),
        '- **Product identifiers**: ' + ('Yes' if any(term in str(df.columns).lower() for term in ['product', 'item', 'sku']) else 'No'),
        '- **Store identifiers**: ' + ('Yes' if any('store' in c.lower() for c in df.columns) else 'No'),
        '',
        '### Suitability for PricePilot',
        '- Use this dataset as supporting evidence for pricing, revenue, and demand analysis.',
        '- Validate key fields (date, product ID, store ID) before integrating with other datasets.',
        '- Review duplicate handling documentation above before downstream processing.',
    ])
    
    report_path = REPORT_DIR / f'{stem_name(Path(file_name))}_report.md'
    report_path.write_text('\n'.join(lines), encoding='utf-8')


inventory = inventory_table()
inventory.to_csv(REPORT_DIR / 'dataset_inventory_summary.csv', index=False)
(REPORT_DIR / 'dataset_inventory.md').write_text('# Dataset Inventory\n\n' + inventory.to_markdown(index=False), encoding='utf-8')

for raw_path in RAW_FILES:
    df = read_df(raw_path)
    cleaned_df, dup_analysis = clean_and_export(df, raw_path)
    generate_notebook(raw_path)
    create_report(raw_path.name, df, cleaned_df, dup_analysis)

# Create comprehensive dataset comparison notebook
comp_nb = nbf.v4.new_notebook()
comp_nb.cells = [
    nbf.v4.new_markdown_cell('# Dataset Comparison\n\nComprehensive comparison of all raw datasets across size, feature coverage, data quality, and PricePilot relevance.'),
    
    nbf.v4.new_code_cell(textwrap.dedent('''
        import pandas as pd
        import matplotlib.pyplot as plt
        import seaborn as sns
        from pathlib import Path
        
        # Find project root dynamically - works on any machine after cloning
        notebook_dir = Path.cwd()
        if 'eda' not in str(notebook_dir):
            notebook_dir = Path.cwd().parents[0]
        project_root = notebook_dir.parents[0] if (notebook_dir / 'notebooks').exists() else notebook_dir.parents[1]
        report_dir = project_root / 'eda' / 'reports'
        
        # Load inventory
        inventory_path = report_dir / 'dataset_inventory_summary.csv'
        inventory = pd.read_csv(inventory_path)
        print("Dataset Inventory")
        print(f"Total datasets: {len(inventory)}")
        display(inventory)
    ''')),
    
    nbf.v4.new_code_cell(textwrap.dedent('''
        # Dataset dimensions comparison
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        
        # Row counts
        inv_sorted = inventory.sort_values('rows', ascending=True)
        axes[0].barh(inv_sorted['file_name'], inv_sorted['rows'])
        axes[0].set_xlabel('Number of Rows')
        axes[0].set_title('Dataset Row Counts (sorted)')
        axes[0].ticklabel_format(style='plain', axis='x')
        
        # Column counts
        inv_sorted_cols = inventory.sort_values('columns', ascending=True)
        axes[1].barh(inv_sorted_cols['file_name'], inv_sorted_cols['columns'])
        axes[1].set_xlabel('Number of Columns')
        axes[1].set_title('Dataset Column Counts (sorted)')
        
        plt.tight_layout()
        plt.show()
    ''')),
    
    nbf.v4.new_code_cell(textwrap.dedent('''
        # Feature coverage analysis
        features_df = pd.DataFrame({
            'Dataset': inventory['file_name'],
            'Has Price': inventory['price_columns'].notna() & (inventory['price_columns'] != ''),
            'Has Sales/Qty': inventory['sales_columns'].notna() & (inventory['sales_columns'] != ''),
            'Has Date': inventory['date_columns'].notna() & (inventory['date_columns'] != ''),
            'Has Identifiers': inventory['identifier_columns'].notna() & (inventory['identifier_columns'] != ''),
        })
        
        print("PricePilot Feature Coverage by Dataset")
        display(features_df)
        
        # Coverage percentage
        coverage_cols = ['Has Price', 'Has Sales/Qty', 'Has Date', 'Has Identifiers']
        features_df['Feature Coverage %'] = (features_df[coverage_cols].sum(axis=1) / len(coverage_cols) * 100).round(1)
        display(features_df[['Dataset', 'Feature Coverage %']])
    ''')),
    
    nbf.v4.new_code_cell(textwrap.dedent('''
        # Dataset categorization
        retail_keywords = ['sales', 'markdown', 'discount', 'price', 'actual', 'demand', 'promotions']
        ecommerce_keywords = ['amazon', 'ecommerce', 'online']
        reference_keywords = ['catalog', 'stores', 'product']
        
        categories = []
        for idx, row in inventory.iterrows():
            name = row['file_name'].lower()
            if any(k in name for k in retail_keywords):
                cat = 'Retail Analytics'
            elif any(k in name for k in ecommerce_keywords):
                cat = 'Ecommerce Analytics'
            else:
                cat = 'Reference/Metadata'
            categories.append(cat)
        
        inventory['Category'] = categories
        
        print("Datasets by Category")
        category_summary = inventory.groupby('Category')[['rows', 'columns']].agg({'rows': 'sum', 'columns': 'mean'})
        display(category_summary)
        
        print("\\nDetailed Classification")
        for cat in inventory['Category'].unique():
            print(f"\\n{cat}:")
            for f in inventory[inventory['Category'] == cat]['file_name']:
                print(f"  - {f}")
    ''')),
    
    nbf.v4.new_code_cell(textwrap.dedent('''
        # Data quality indicators
        print("Data Quality Summary")
        print("\\nNote: Data quality is assessed during individual dataset EDA.")
        print("Review the individual dataset reports for:")
        print("- Missing value percentages")
        print("- Duplicate row detection")
        print("- Date range and temporal coverage")
        print("- Outlier analysis")
        print("\\nReports location: eda/reports/")
    ''')),
    
    nbf.v4.new_code_cell(textwrap.dedent('''
        # Dataset integration readiness analysis
        print("Dataset Integration Readiness Assessment")
        print("\\nBefore merging datasets, analyze:")
        print("1. Common key fields (product_id, store_id, date, etc.)")
        print("2. Data granularity alignment (transaction vs. summary level)")
        print("3. Temporal overlap between datasets")
        print("4. Data type consistency")
        print("5. Potential duplicate keys")
        print("\\nNote: Individual dataset reports include key field analysis.")
        print("Cross-dataset integration is documented in individual report recommendations.")
    ''')),
    
    nbf.v4.new_code_cell(textwrap.dedent('''
        # Recommendations for PricePilot
        print("RECOMMENDATIONS FOR PRICEPILOT PROJECT")
        print("=" * 60)
        print("\\nPRIMARY DATASETS (Most relevant for pricing):")
        for idx, row in inventory[inventory['potential_role'].str.contains('Retail')].iterrows():
            print(f"  ✓ {row['file_name']}")
            print(f"    Rows: {row['rows']:,} | Columns: {row['columns']}")
            print(f"    Features: {row['price_columns'] if pd.notna(row['price_columns']) else 'None'}")
        
        print("\\nSUPPORTING DATASETS (Context/metadata):")
        for idx, row in inventory[~inventory['potential_role'].str.contains('Retail|Ecommerce')].iterrows():
            print(f"  • {row['file_name']}")
            print(f"    Rows: {row['rows']:,} | Columns: {row['columns']}")
        
        print("\\nECOMMERCE DATASETS (Alternative/parallel analysis):")
        for idx, row in inventory[inventory['potential_role'].str.contains('Ecommerce')].iterrows():
            print(f"  ◦ {row['file_name']}")
            print(f"    Rows: {row['rows']:,} | Columns: {row['columns']}")
        
        print("\\nNEXT STEPS:")
        print("  1. Review individual dataset EDA reports in eda/reports/")
        print("  2. Validate temporal consistency across datasets")
        print("  3. Analyze key field uniqueness and overlap")
        print("  4. Assess data leakage risks (see leakage_audit_report.csv)")
        print("  5. Plan dataset integration strategy based on business requirements")
    ''')),
]

with open(NOTEBOOK_DIR / 'dataset_comparison.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(comp_nb, f)

summary_table = inventory[['file_name', 'rows', 'columns', 'potential_role']].copy()
summary_table.insert(0, 'dataset_order', range(1, len(summary_table) + 1))
(REPORT_DIR / 'eda_summary.md').write_text('# EDA Summary\n\n' + summary_table.to_markdown(index=False), encoding='utf-8')

print(f'Analyzed {len(RAW_FILES)} raw dataset files.')
print(f'Cleaned outputs: {len(list(PROCESSED_DIR.glob("*.csv")))}')
print(f'Notebooks created: {len(list(NOTEBOOK_DIR.glob("*.ipynb")))}')
print(f'Reports created: {len(list(REPORT_DIR.glob("*.md")))}')
