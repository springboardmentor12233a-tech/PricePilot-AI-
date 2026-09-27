@echo off
title Push PricePilot AI Milestone 3 to GitHub
color 0a
echo =====================================================================
echo           PRICEPILOT AI - PUSH MILESTONE 3 TO GITHUB REPOSITORY       
echo =====================================================================
echo.
echo Target Repository: https://github.com/springboardmentor12233a-tech/PricePilot-AI-.git
echo Target Branch:     Yuvraj-Nandu-Patil
echo.

set SCRIPT_DIR=%~dp0
set GIT_DIR=C:\Users\jojo\.gemini\antigravity\scratch\git_repo
set GIT_EXE=C:\Users\jojo\.gemini\antigravity\scratch\mingit\cmd\git.exe

if not exist "%GIT_EXE%" (
    set GIT_EXE=git
)

echo [*] Synchronizing latest Desktop files into Git repository...
copy /Y "%SCRIPT_DIR%index.html" "%GIT_DIR%\index.html" >nul
copy /Y "%SCRIPT_DIR%landing.html" "%GIT_DIR%\landing.html" >nul
copy /Y "%SCRIPT_DIR%vercel.json" "%GIT_DIR%\vercel.json" >nul
copy /Y "%SCRIPT_DIR%PricePilot_AI_Auth_Postman_Collection.json" "%GIT_DIR%\Milestone3\PricePilot_AI_Auth_Postman_Collection.json" >nul
copy /Y "%SCRIPT_DIR%test_postman_suite.py" "%GIT_DIR%\Milestone3\test_postman_suite.py" >nul

echo [*] Staging and committing all changes...
cd /d "%GIT_DIR%"
"%GIT_EXE%" add -A
"%GIT_EXE%" commit -m "feat(release): Complete end-to-end Milestone 3 with Landing Page, Dashboard, Product Info CRUD, JWT Auth, and Vercel config"

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
"%GIT_EXE%" push https://%GITHUB_PAT%@github.com/springboardmentor12233a-tech/PricePilot-AI-.git HEAD:main --force

echo.
echo =====================================================================
echo   Push completed successfully!
echo   Repository: https://github.com/springboardmentor12233a-tech/PricePilot-AI-
echo =====================================================================
echo.
pause
