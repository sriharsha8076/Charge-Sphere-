@echo off
title React Frontend Launcher - EV Charging Platform
echo =========================================================================
echo       Launching React Frontend (http://localhost:3000)
echo =========================================================================
echo.

cd /d "%~dp0frontend"
cmd /c "npm install && npm run dev"
echo Done.
