@echo off
title Inventory Management System
cd /d "%~dp0"
echo Starting Inventory Management System...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
