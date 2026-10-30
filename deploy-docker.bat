@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo        CHARGE SPHERE - DOCKER DEPLOYMENT
echo ===============================================================================
echo.

:: 1. Check Docker CLI
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker CLI not found. Please install Docker Desktop first.
    pause
    exit /b 1
)

:: 2. Check if Docker daemon is running
echo [*] Checking Docker daemon status...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] Docker engine is not currently running.
    echo [*] Attempting to launch Docker Desktop...
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" (
        start "" "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
    ) else if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
    echo [*] Waiting 20 seconds for Docker engine to initialize...
    timeout /t 20 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] Docker engine is still not responding.
        echo Please ensure Docker Desktop is open and showing "Engine running" in your taskbar,
        echo then rerun this script.
        pause
        exit /b 1
    )
)
echo [OK] Docker daemon is active and responsive.
echo.

:: 3. Build & start all containers in detached mode
echo [*] Building and starting all microservices & database via Docker Compose...
echo [*] This will build the multi-stage images on first run. Please wait...
echo.

docker compose up --build -d

if %ERRORLEVEL% neq 0 (
    echo [ERROR] docker compose failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===============================================================================
echo                       CONTAINER STATUS
echo ===============================================================================
docker compose ps
echo.
echo ===============================================================================
echo                       ACCESS ENDPOINTS
echo ===============================================================================
echo  - Frontend UI:         http://localhost:3000
echo  - API Gateway:         http://localhost:8080
echo  - Eureka Dashboard:    http://localhost:8761
echo  - PostgreSQL Database: localhost:5432 (ev_charging_db)
echo ===============================================================================
echo.
echo [INFO] To view logs: docker compose logs -f [service-name]
echo [INFO] To stop:      docker compose down
echo.
pause
