# PricePilot AI — Enhanced Milestone 3

## What changed

This version turns the Milestone 3 demo into a role-aware Revenue Intelligence application.

### User workspace
- Revenue command center with KPI cards
- 7 / 30 / 90 day revenue forecast
- Forecast confidence and trend
- Revenue mix and top-product charts
- Product intelligence with demand + pricing recommendation
- AI revenue analyst using Groq through the OpenAI-compatible API
- Business reports and report history
- Personal activity history

### Admin workspace
- Everything in the user workspace
- Access management with role changes
- Platform activity feed
- Database-backed counts for users, AI queries, reports and forecast runs
- Authentication / role / activity status view

## Database

SQLite is created automatically at:

`data/users.db`

Tables:
- `users` — authentication and roles
- `activity` — user/system actions
- `chat_history` — AI questions and responses
- `report_history` — report exports
- `forecast_history` — forecast usage and model signals

This makes the database part of the application workflow rather than only a login store.

## Groq OpenAI-compatible setup

Create `.env` in the project root:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

The backend uses the OpenAI Python SDK with Groq's OpenAI-compatible base URL. The API key is never placed in the frontend.

## Run

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
pip install -r backend\requirements-v3.txt
uvicorn backend.app.v3:app --reload
```

Open:

`http://127.0.0.1:8000/v3/`

Demo admin:
- username: `admin`
- password: `admin123`

Demo user:
- username: `user`
- password: `user123`
