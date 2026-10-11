from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_role, get_db
from app.models.user import User
from app.models.product import Product
from app.models.restock_request import RestockRequest

router = APIRouter(prefix="/restock", tags=["Restock"])


class RestockCreate(BaseModel):
    product_id: int
    quantity: int


class StatusUpdate(BaseModel):
    status: str


def _to_dict(r: RestockRequest, product_name: str, username: str):
    return {
        "id": r.id,
        "product_id": r.product_id,
        "product_name": product_name,
        "requested_by": username,
        "quantity": r.quantity,
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.post("/")
def create_restock_request(
    body: RestockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.quantity <= 0 or body.quantity > 100000:
        raise HTTPException(status_code=400, detail="Quantity must be between 1 and 100000")

    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_req = RestockRequest(
        product_id=body.product_id,
        requested_by=current_user.id,
        quantity=body.quantity,
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return _to_dict(new_req, product.product_name, current_user.username)


@router.get("/")
def list_restock_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(RestockRequest, Product.product_name, User.username)
        .join(Product, Product.id == RestockRequest.product_id)
        .join(User, User.id == RestockRequest.requested_by)
    )
    if current_user.role != "Admin":
        query = query.filter(RestockRequest.requested_by == current_user.id)

    rows = query.order_by(RestockRequest.created_at.desc()).all()
    return [_to_dict(r, name, uname) for r, name, uname in rows]


@router.put("/{request_id}/status")
def update_restock_status(
    request_id: int,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"])),
):
    if body.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")

    req = db.query(RestockRequest).filter(RestockRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request already {req.status}")

    req.status = body.status
    if body.status == "approved":
        product = db.query(Product).filter(Product.id == req.product_id).first()
        if product:
            product.inventory_level = (product.inventory_level or 0) + req.quantity

    db.commit()
    return {"id": req.id, "status": req.status}