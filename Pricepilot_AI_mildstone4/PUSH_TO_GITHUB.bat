@echo off
title Push PricePilot AI to yuvrajcet26-dotcom/PricePlotAi
color 0a
echo ===============================================================================
echo        PRICEPILOT AI - PUSH TO YOUR PERSONAL GITHUB REPOSITORY
echo ===============================================================================
echo.
echo Target Repository : https://github.com/yuvrajcet26-dotcom/PricePlotAi.git
echo Target Branch     : main
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

set GIT_EXE=C:\Users\jojo\.gemini\antigravity\scratch\mingit\cmd\git.exe
if not exist "%GIT_EXE%" (
    set GIT_EXE=git
)

echo [*] Staging all files in this project...
"%GIT_EXE%" remote remove origin >nul 2>&1
"%GIT_EXE%" remote add origin "https://github.com/yuvrajcet26-dotcom/PricePlotAi.git"
"%GIT_EXE%" branch -M main
"%GIT_EXE%" add -A
"%GIT_EXE%" commit -m "feat: Complete PricePilot AI platform (Landing Page, Dashboard, JWT Auth, Product CRUD, ML Models, Vercel Ready)" >nul 2>&1

echo.
echo Please enter your GitHub Personal Access Token (PAT):
set /p GITHUB_PAT="GitHub PAT: "
if "%GITHUB_PAT%"=="" (
    echo Error: GitHub PAT cannot be empty!
    pause
    exit /b 1
)

echo.
echo [*] Pushing entire project to https://github.com/yuvrajcet26-dotcom/PricePlotAi.git ...
"%GIT_EXE%" push https://%GITHUB_PAT%@github.com/yuvrajcet26-dotcom/PricePlotAi.git main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo   [SUCCESS] Your entire project is now live in your GitHub repository!
    echo   Repository URL: https://github.com/yuvrajcet26-dotcom/PricePlotAi
    echo ===============================================================================
    echo.
    echo Next step: Deploy to Vercel!
    echo Double-click DEPLOY_TO_VERCEL.bat or go to https://vercel.com/new
) else (
    echo.
    echo [ERROR] Push failed. Please verify your Personal Access Token (PAT) has 'repo' scope.
)

echo.
pause
