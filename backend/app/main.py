"""
Entry point of the backend. This is the file uvicorn runs.

Run it with:
    uvicorn app.main:app --reload

`--reload` watches for file changes and restarts automatically — use this
in development only, never in a real deployment.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered dynamic pricing optimization & revenue intelligence system",
    version="0.1.0",
)

# CORS: without this, your Next.js frontend (running on a different port,
# e.g. localhost:3000) will be BLOCKED by the browser from calling this API
# (running on localhost:8000). This is a browser security rule, not a
# FastAPI quirk — every full-stack project with separate frontend/backend
# ports needs this.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """
    Simple endpoint to confirm the API is alive. This is the FIRST thing
    you should test after running the server, and later, the first thing
    Docker healthchecks will hit.
    """
    return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}


# NOTE: We are NOT importing feature routers (auth, pricing, forecasting...)
# here yet — that comes in the next steps as we build each module.
# Keeping main.py minimal right now is intentional: we verify the
# foundation works before stacking features on top of it.
