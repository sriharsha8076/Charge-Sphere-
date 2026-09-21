@echo off
setlocal enabledelayedexpansion
title EV Charging Platform - Stopping All Services
cd /d "%~dp0"

echo.
echo ==================================================================
echo       EV Charging Platform - Stopping All Services
echo ==================================================================
echo.

echo [INFO] Stopping all processes running on EV Charging ports...
echo.

REM Kill by port - finds PID listening on each port and terminates it
set PORTS=8761 8080 8081 8082 8083 8084 8085 8086 3000

for %%P in (%PORTS%) do (
    set "FOUND="
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        if not defined FOUND (
            set "PID=%%a"
            set "FOUND=1"
            echo [STOP] Port %%P - Killing PID %%a ...
            taskkill /PID %%a /F >nul 2>&1
            if !errorlevel!==0 (
                echo       [OK] PID %%a terminated.
            ) else (
                echo       [WARN] Could not kill PID %%a (may already be stopped).
            )
        )
    )
    if not defined FOUND (
        echo [SKIP] Port %%P - No process found (already stopped).
    )
)

echo.
echo [INFO] All service ports freed.
echo.

REM Also close the named terminal windows launched by start-all.bat
echo [INFO] Closing service terminal windows...
for %%T in (
    "1. Service Registry [8761]"
    "2. API Gateway [8080]"
    "3. User Service [8081]"
    "4. Station Service [8082]"
    "5. Charging Service [8083]"
    "6. Grid Service [8084]"
    "7. Load Balancer [8085]"
    "8. Notification Service [8086]"
    "9. React Frontend [3000]"
) do (
    taskkill /FI "WINDOWTITLE eq %%~T" /F >nul 2>&1
)

echo.
echo ==================================================================
echo   All EV Charging services have been stopped.
echo ==================================================================
echo.
pause
