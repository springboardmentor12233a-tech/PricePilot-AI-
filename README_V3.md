# PricePilot AI - v3 add-on (no existing file changed)

New files only:
- backend/app/v3.py            JWT auth (admin/user), KPIs, 7/30/90-day revenue forecast, charts data, report CSV, AI chatbot
- backend/requirements-v3.txt  extra dependency (PyJWT)
- frontend/v3/index.html       new dashboard (login, overview, product outlook, AI assistant, reports, users)

Run (from project root, after the Milestone 2 pipeline has created data/processed/combined_daily.csv):
    python -m pip install -r backend\requirements.txt -r backend\requirements-v3.txt
    uvicorn backend.app.v3:app --reload
Open http://127.0.0.1:8000/v3/     (old dashboard still at http://127.0.0.1:8000/)

Demo logins: admin / admin123  and  user / user123   (users are stored in data/users.db, created on first run)
Set PRICEPILOT_JWT_SECRET before any real deployment.
Optional smarter chatbot: set ANTHROPIC_API_KEY (and optionally CLAUDE_MODEL). Without it the built-in data assistant answers.
