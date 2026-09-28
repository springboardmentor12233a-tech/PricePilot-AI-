@echo off
title Deploy PricePilot AI to Vercel
color 0b
echo ===============================================================================
echo                   PRICEPILOT AI - VERCEL DEPLOYMENT HELPER
echo ===============================================================================
echo.
echo Opening Vercel New Project page in your default browser...
start "" "https://vercel.com/new"

echo.
echo ===============================================================================
echo  INSTRUCTIONS ON VERCEL:
echo ===============================================================================
echo  1. On the Vercel page that just opened, look under "Import Git Repository".
echo  2. Find your repository: PricePlotAi
echo  3. Click "Import".
echo  4. In the configuration:
echo     - Framework Preset : Other
echo     - Root Directory   : ./ (leave default)
echo  5. Click the blue "Deploy" button!
echo.
echo  Within 30 seconds, Vercel will give you a live production URL!
echo ===============================================================================
echo.
pause
