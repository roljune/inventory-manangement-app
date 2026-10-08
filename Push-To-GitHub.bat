@echo off
title Push Inventory Management App to GitHub
cd /d "%~dp0"

echo ========================================================
echo   Push Inventory Management App to GitHub
echo ========================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
)

echo Adding files...
git add .
git commit -m "Initial commit: Inventory Management App with Camera/Product Photos"

echo.
echo If you have a remote repository URL (e.g. https://github.com/username/inventory-app.git):
set /p REPO_URL="Enter Git Remote URL (or press Enter to skip): "

if not "%REPO_URL%"=="" (
    git remote remove origin 2>nul
    git remote add origin %REPO_URL%
    echo Pushing to main branch...
    git push -u origin main
    echo.
    echo Done! You can enable GitHub Pages in your repo settings (Settings -> Pages -> Deploy from main).
) else (
    echo Git commit created locally.
)

pause
