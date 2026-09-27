@echo off
title Push PricePilot AI to GitHub
color 0a
echo =====================================================================
echo           PRICEPILOT AI - PUSH REPOSITORY TO GITHUB       
echo =====================================================================
echo.
echo Target Repository: https://github.com/springboardmentor12233a-tech/PricePilot-AI-.git
echo Target Branch:     Yuvraj-Nandu-Patil and main
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

set GIT_EXE=C:\Users\jojo\.gemini\antigravity\scratch\mingit\cmd\git.exe
if not exist "%GIT_EXE%" (
    set GIT_EXE=git
)

echo [*] Staging and committing all project files in this folder...
"%GIT_EXE%" add -A
"%GIT_EXE%" commit -m "feat(deploy): Full end-to-end release with Landing Page, Dashboard, Product Info CRUD, JWT Auth, and Vercel ready"

echo.
echo Please enter your GitHub Personal Access Token (PAT):
set /p GITHUB_PAT="GitHub PAT: "
if "%GITHUB_PAT%"=="" (
    echo Error: GitHub PAT cannot be empty!
    pause
    exit /b 1
)

echo.
echo [*] Pushing branch Yuvraj-Nandu-Patil to GitHub...
"%GIT_EXE%" push https://%GITHUB_PAT%@github.com/springboardmentor12233a-tech/PricePilot-AI-.git Yuvraj-Nandu-Patil --force

echo.
echo [*] Pushing branch main to GitHub...
"%GIT_EXE%" push https://%GITHUB_PAT%@github.com/springboardmentor12233a-tech/PricePilot-AI-.git Yuvraj-Nandu-Patil:main --force

echo.
echo =====================================================================
echo   Push completed successfully!
echo   Repository: https://github.com/springboardmentor12233a-tech/PricePilot-AI-
echo =====================================================================
echo.
pause
