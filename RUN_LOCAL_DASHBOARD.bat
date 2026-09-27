@echo off
title PricePilot AI - Local Host Runner
color 0b
echo ===============================================================================
echo          PricePilot AI - Dynamic Pricing Intelligence Platform
echo                 Starting Local Server & Frontend Viewers
echo ===============================================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Detect Python - prefers scratch Python 3.11 with full ML packages, or system python
set PYTHON_EXE=C:\Users\jojo\.gemini\antigravity\scratch\python311\python.exe
if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

echo [*] Starting FastAPI Backend on http://127.0.0.1:8000...
set PYTHONPATH=%SCRIPT_DIR%backend
start "PricePilot AI Backend (Port 8000)" "%PYTHON_EXE%" -m uvicorn app.main:app --app-dir "%SCRIPT_DIR%backend" --host 127.0.0.1 --port 8000

echo [*] Waiting for Backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [*] Opening PricePilot AI in your default web browser...
start "" "%SCRIPT_DIR%index.html"

echo.
echo ===============================================================================
echo  PricePilot AI is now running on Localhost!
echo  - User Flow           : Landing Page -> Sign In -> Executive Dashboard
echo  - Direct App Entry    : file:///%SCRIPT_DIR:\=/%index.html
echo  - Standalone Landing  : file:///%SCRIPT_DIR:\=/%landing.html
echo  - FastAPI Swagger Docs: http://127.0.0.1:8000/docs
echo  - Postman Test Suite  : Run RUN_API_TESTS.bat
echo ===============================================================================
echo.
echo Press any key to view the backend status or close this window when done.
pause >nul
