@echo off
title Choy Apparel Inventory Management System
cd /d "%~dp0"
echo Starting Choy Apparel Inventory Management System...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
