@echo off
echo ===================================================
echo  PricePilot AI: Launching Milestone 1 System
echo ===================================================
echo.
echo Opening Interactive Pricing Dashboard in your browser...
start "" "%~dp0frontend\index.html"
echo.
echo Launching Backend Server...
cd /d "%~dp0backend"
"C:\Users\jojo\.gemini\antigravity\scratch\python311\python.exe" -m uvicorn app.main:app --reload --port 8000
pause
