from app.core.database import SessionLocal  # ADAPT if your session factory has another name
from app.models.models import Product, DemandForecast
from app.services.competitor_analysis import get_competitor_comparison
from app.services.revenue_optimization import compute_elasticity, optimize_price

db = SessionLocal()
forecasted = {r[0] for r in db.query(DemandForecast.product_id).distinct().all()}

print(f"{'id':>6}  {'name':40} comp  elas  opt   forecast")
good = []
for p in db.query(Product).order_by(Product.id).limit(500).all():
    try:
        comp = bool(get_competitor_comparison(db, p.id))
        elas = bool(compute_elasticity(db, p.id))
        opt = bool(optimize_price(db, p.id))
    except Exception:
        continue
    fc = p.id in forecasted
    if comp or elas or opt:
        print(f"{p.id:>6}  {p.name[:40]:40} {comp!s:5} {elas!s:5} {opt!s:5} {fc}")
    if comp and elas and opt:
        good.append((p.id, p.name, fc))

print("\nFully usable products:", len(good))
for pid, name, fc in good[:15]:
    print(f"  {pid}  {name}  (forecast saved: {fc})")
db.close()