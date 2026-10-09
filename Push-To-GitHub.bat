@echo off
title Push Choy Apparel Inventory to GitHub
cd /d "%~dp0"
set "PATH=%PATH%;C:\Users\monte\.gemini\antigravity\tools\git\cmd;C:\Users\monte\AppData\Local\Microsoft\WinGet\Packages\GitHub.cli_Microsoft.Winget.Source_8wekyb3d8bbwe\bin"

echo ========================================================
echo   Pushing Choy Apparel Inventory System to GitHub
echo   Account: roljune (monteronarj@gmail.com)
echo   Repo:    https://github.com/roljune/inventory-manangement-app
echo ========================================================
echo.

git remote remove origin 2>nul
git remote add origin https://github.com/roljune/inventory-manangement-app.git

echo Adding and committing any pending changes...
git add .
git commit -m "Choy Apparel Inventory & Camera System - Full Release with Light/Dark Mode" 2>nul

echo.
echo Pushing code to origin main...
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo [SUCCESS] Successfully pushed to GitHub!
    echo View repository at: https://github.com/roljune/inventory-manangement-app
    echo ========================================================
) else (
    echo [NOTICE] If prompted for credentials, please complete the sign-in.
)

echo.
pause
