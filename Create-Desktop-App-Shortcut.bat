@echo off
title Create Choy Apparel Desktop App Shortcut
cd /d "%~dp0"

echo ========================================================
echo   Creating Choy Apparel Desktop App Shortcut
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutPath = Join-Path $DesktopPath 'Choy Apparel Inventory.lnk'
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $PSScriptRoot 'Launch-App.bat'
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = 'Choy Apparel Inventory Management System'
$IconPath = Join-Path $PSScriptRoot 'icons\icon-512.png'
if (Test-Path $IconPath) {
    # Set icon
    $Shortcut.IconLocation = Join-Path $PSScriptRoot 'icons\icon.ico'
}
$Shortcut.Save()
Write-Host 'Desktop shortcut created successfully at:' $ShortcutPath -ForegroundColor Green
"

echo.
echo Desktop shortcut created! You can now launch Choy Apparel directly from your Desktop.
echo.
pause
