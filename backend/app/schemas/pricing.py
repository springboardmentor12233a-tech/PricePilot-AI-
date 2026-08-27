from pydantic import BaseModel, Field


class PricePredictionRequest(BaseModel):
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

    class Config:
        json_schema_extra = {
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


class PricePredictionResponse(BaseModel):
    predicted_price: float
    model_used: str = "XGBoost Regressor"

    model_config = {"protected_namespaces": ()}