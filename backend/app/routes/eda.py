import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import CompetitorPrice, CustomerActivity, DailyOperation, Product, User

router = APIRouter(prefix="/api/eda", tags=["eda"])

TABLE_MAP = {
    "product_catalog": Product,
    "daily_operations": DailyOperation,
    "customer_activity": CustomerActivity,
    "competitor_prices": CompetitorPrice,
}


@router.get("/summary")
def eda_summary(dataset: str, db: Session = Depends(get_db),
                 _user: User = Depends(require_roles(*roles.EDA_USERS))):
    model = TABLE_MAP.get(dataset)
    if not model:
        raise HTTPException(status_code=400, detail=f"Unknown dataset '{dataset}'. Choose from {list(TABLE_MAP)}")
    df = pd.read_sql(db.query(model).statement, db.connection())
    numeric_cols = df.select_dtypes(include="number").columns.tolist()

    outliers = {}
    for col in numeric_cols:
        q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        outliers[col] = int(((df[col] < lower) | (df[col] > upper)).sum())

    return {
        "dataset": dataset,
        "rows": int(len(df)),
        "columns": list(df.columns),
        "missing_values": {k: int(v) for k, v in df.isnull().sum().to_dict().items() if v > 0},
        "duplicate_rows": int(df.duplicated().sum()),
        "numeric_summary": df[numeric_cols].describe().round(2).to_dict(),
        "outlier_counts": outliers,
        "correlation": df[numeric_cols].corr().round(2).fillna(0).to_dict() if len(numeric_cols) > 1 else {},
    }


@router.get("/distribution")
def eda_distribution(dataset: str, column: str, bins: int = 20, db: Session = Depends(get_db),
                      _user: User = Depends(require_roles(*roles.EDA_USERS))):
    model = TABLE_MAP.get(dataset)
    if not model:
        raise HTTPException(status_code=400, detail="Unknown dataset")
    df = pd.read_sql(db.query(getattr(model, column)).statement, db.connection())
    series = df[column].dropna()
    if pd.api.types.is_numeric_dtype(series):
        counts, edges = pd.cut(series, bins=bins, retbins=True)
        hist = counts.value_counts().sort_index()
        return {"type": "numeric", "labels": [str(i) for i in hist.index], "counts": hist.tolist()}
    vc = series.value_counts().head(30)
    return {"type": "categorical", "labels": vc.index.tolist(), "counts": vc.tolist()}
