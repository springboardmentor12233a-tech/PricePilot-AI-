@echo off
title PricePilot AI — Milestone 2 Setup & Run
color 0B
echo.
echo  ================================================================
echo   PricePilot AI — Milestone 2: AI/ML Price ^ Demand Intelligence
echo  ================================================================
echo.

set PYTHON=%~dp0..\python311\python.exe
if not exist "%PYTHON%" (
    echo  [ERROR] Python not found at: %PYTHON%
    echo  Please install Python 3.11 first.
    pause & exit /b 1
)

echo  [1/4] Installing requirements...
"%PYTHON%" -m pip install -r backend\requirements.txt --quiet
echo  [OK] Requirements installed.
echo.

echo  [2/4] Training ML models with GridSearchCV...
echo        (This may take 5-10 minutes the first time)
if not exist "ml\artifacts\demand_model.pkl" (
    "%PYTHON%" ml\train_and_select.py
    echo  [OK] Models trained and saved.
) else (
    echo  [SKIP] Models already trained. Delete ml\artifacts\*.pkl to retrain.
)
echo.

echo  [3/4] Copying .env if not exists...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo  [OK] .env created from template. Edit backend\.env to add GROQ_API_KEY.
) else (
    echo  [SKIP] .env already exists.
)
echo.

echo  [4/4] Starting FastAPI server (Milestone 2)...
echo        API Docs: http://localhost:8000/docs
echo        ML Routes: http://localhost:8000/v2/
echo        Press Ctrl+C to stop.
echo.
cd backend
"%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
