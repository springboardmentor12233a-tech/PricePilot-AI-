@echo off
title PricePilot AI - API & Postman Test Runner
color 0a
echo ===============================================================================
echo          PricePilot AI - Automated Postman Test Suite Execution
echo     Testing: JWT Authentication, Product Information CRUD, & OAuth Flows
echo ===============================================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

set PYTHON_EXE=C:\Users\jojo\.gemini\antigravity\scratch\python311\python.exe
if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

echo [*] Executing test_postman_suite.py...
echo.
"%PYTHON_EXE%" "%SCRIPT_DIR%test_postman_suite.py"

echo.
echo ===============================================================================
echo  Postman Collection file is available at:
echo  %SCRIPT_DIR%PricePilot_AI_Auth_Postman_Collection.json
echo.
echo  Import this JSON file into Postman or web.postman.co to run tests visually!
echo ===============================================================================
echo.
pause
