from pydantic import BaseModel, ConfigDict, Field


class PricePredictionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "garden_tools",
                "freight_price": 15.5,
                "lag_price": 95.0,
                "qty": 12,
                "customers": 8,
                "product_score": 4.2,
                "comp_1": 89.9,
                "comp_2": 92.0,
                "comp_3": 99.5,
                "month": 6,
            }
        }
    )

    category: str = Field(..., description="Product category, e.g. 'garden_tools'")
    freight_price: float = Field(..., ge=0)
    lag_price: float = Field(..., ge=0, description="Product's price in the previous period")
    qty: int = Field(0, ge=0, description="Units sold in the previous period")
    customers: int = Field(0, ge=0)
    product_score: float = Field(0.0, ge=0, le=5)
    comp_1: float | None = Field(None, ge=0, description="Competitor 1's price")
    comp_2: float | None = Field(None, ge=0)
    comp_3: float | None = Field(None, ge=0)
    month: int = Field(..., ge=1, le=12)


class PricePredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    predicted_price: float
    model_used: str = "XGBoost Regressor"