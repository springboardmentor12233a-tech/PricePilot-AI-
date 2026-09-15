@echo off
title PricePilot AI - GitHub Push Helper
color 0B
echo.
echo  ============================================================
echo   PricePilot AI - Push Milestone 2 to GitHub
echo   Branch: Yuvraj-Nandu-Patil
echo  ============================================================
echo.
echo  You need a GitHub Personal Access Token (PAT) to push.
echo  Get one at: https://github.com/settings/tokens
echo  Select scope: repo (full control)
echo.
set /p PAT=Paste your GitHub PAT here: 
echo.
echo  Pushing to GitHub...

set REMOTE=https://%PAT%@github.com/springboardmentor12233a-tech/PricePilot-AI-.git
set GIT=C:\Users\jojo\.gemini\antigravity\scratch\mingit\cmd\git.exe
set REPO=C:\Users\jojo\.gemini\antigravity\scratch\git_repo

"%GIT%" -C "%REPO%" remote set-url origin "%REMOTE%"
"%GIT%" -C "%REPO%" push origin Yuvraj-Nandu-Patil

if %errorlevel% == 0 (
    echo.
    echo  SUCCESS! Milestone 2 pushed to GitHub!
    echo  URL: https://github.com/springboardmentor12233a-tech/PricePilot-AI-/tree/Yuvraj-Nandu-Patil
    start "" "https://github.com/springboardmentor12233a-tech/PricePilot-AI-/tree/Yuvraj-Nandu-Patil"
) else (
    echo.
    echo  Push failed. Check your PAT and try again.
)
pause
