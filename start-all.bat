@echo off
setlocal enabledelayedexpansion
title EV Charging Platform - Starting All Services

REM --- Resolve project root ---
cd /d "%~dp0"
set "ROOT=%~dp0"

echo.
echo ==================================================================
echo       EV Charging Platform - Complete Platform Startup
echo       8 Backend Microservices + 1 React Frontend
echo ==================================================================
echo.

REM --- Environment Variables ---
set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ev_charging_db"
set "SPRING_DATASOURCE_DRIVER=org.postgresql.Driver"
set "SPRING_DATASOURCE_USERNAME=postgres"
set "SPRING_DATASOURCE_PASSWORD=123456"
set "JWT_SECRET=ev_charging_soa_secret_key_super_secure_32_bytes_long_12345"

REM --- Maven fallback path ---
set "MVN=C:\Users\Harsha\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd"

REM --- Verify Java ---
where java >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found in PATH. Please install JDK 17.
    pause
    exit /b 1
)

echo [INFO] Java found:
java -version 2>&1 | findstr /i "version"
echo.

REM ===================================================================
REM 1/9 - SERVICE REGISTRY (Eureka) - Port 8761
REM ===================================================================
echo [1/9] Starting Service Registry (Eureka) on Port 8761...
set "SVC_DIR=%ROOT%service-registry"
set "SVC_JAR=service-registry-1.0.0.jar"

if exist "%SVC_DIR%\target\%SVC_JAR%" (
    start "1. Service Registry [8761]" cmd /k "title 1. Service Registry [8761] && cd /d "%SVC_DIR%" && java -DSPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL% -DSPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME% -DSPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD% -jar target\%SVC_JAR%"
) else (
    echo [WARN] JAR not found - building service-registry with Maven...
    start "1. Service Registry [8761]" cmd /k "title 1. Service Registry [8761] && cd /d "%SVC_DIR%" && "%MVN%" spring-boot:run"
)

REM --- Wait for Eureka to become available (up to 60 seconds) ---
echo [INFO] Waiting for Eureka to be ready at http://localhost:8761 ...
set EUREKA_UP=0
for /l %%i in (1,1,30) do (
    if !EUREKA_UP!==0 (
        powershell -Command "try { $r=(Invoke-WebRequest -Uri 'http://localhost:8761/actuator/health' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop).StatusCode; if($r -eq 200){exit 0} else {exit 1} } catch { exit 1 }" >nul 2>&1
        if !errorlevel!==0 (
            set EUREKA_UP=1
            echo [OK] Eureka is UP after %%i checks.
        ) else (
            powershell -Command "Start-Sleep -Seconds 2" >nul
        )
    )
)
if !EUREKA_UP!==0 (
    echo [WARN] Eureka did not respond within 60s - continuing anyway.
)
echo.

REM ===================================================================
REM 2/9 - API GATEWAY - Port 8080
REM ===================================================================
echo [2/9] Starting API Gateway on Port 8080...
set "SVC_DIR=%ROOT%api-gateway"
set "SVC_JAR=api-gateway-1.0.0.jar"
if exist "%SVC_DIR%\target\%SVC_JAR%" (
    start "2. API Gateway [8080]" cmd /k "title 2. API Gateway [8080] && cd /d "%SVC_DIR%" && java -DJWT_SECRET=%JWT_SECRET% -jar target\%SVC_JAR%"
) else (
    echo [WARN] JAR not found - building api-gateway with Maven...
    start "2. API Gateway [8080]" cmd /k "title 2. API Gateway [8080] && cd /d "%SVC_DIR%" && "%MVN%" spring-boot:run"
)
ping 127.0.0.1 -n 3 >nul

REM ===================================================================
REM 3/9 - USER SERVICE - Port 8081
REM ===================================================================
echo [3/9] Starting User Service on Port 8081...
set "SVC_DIR=%ROOT%user-service"
set "SVC_JAR=user-service-1.0.0.jar"
if exist "%SVC_DIR%\target\%SVC_JAR%" (
    start "3. User Service [8081]" cmd /k "title 3. User Service [8081] && cd /d "%SVC_DIR%" && java -DSPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL% -DSPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME% -DSPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD% -DJWT_SECRET=%JWT_SECRET% -jar target\%SVC_JAR%"
) else (
    echo [WARN] JAR not found - building user-service with Maven...
    start "3. User Service [8081]" cmd /k "title 3. User Service [8081] && cd /d "%SVC_DIR%" && "%MVN%" spring-boot:run"
)
ping 127.0.0.1 -n 3 >nul

REM ===================================================================
REM 4/9 - STATION SERVICE - Port 8082
REM ===================================================================
echo [4/9] Starting Station Service on Port 8082...
set "SVC_DIR=%ROOT%station-service"
set "SVC_JAR=station-service-1.0.0.jar"
if exist "%SVC_DIR%\target\%SVC_JAR%" (
    start "4. Station Service [8082]" cmd /k "title 4. Station Service [8082] && cd /d "%SVC_DIR%" && java -DSPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL% -DSPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME% -DSPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD% -jar target\%SVC_JAR%"
) else (
    echo [WARN] JAR not found - building station-service with Maven...
    start "4. Station Service [8082]" cmd /k "title 4. Station Service [8082] && cd /d "%SVC_DIR%" && "%MVN%" spring-boot:run"
)
ping 127.0.0.1 -n 3 >nul

REM ===================================================================
REM 5/9 - CHARGING SESSION SERVICE - Port 8083
REM ===================================================================
echo [5/9] Starting Charging Service on Port 8083...
set "SVC_DIR=%ROOT%charging-service"
set "SVC_JAR=charging-service-1.0.0.jar"
if exist "%SVC_DIR%\target\%SVC_JAR%" (
    start "5. Charging Service [8083]" cmd /k "title 5. Charging Service [8083] && cd /d "%SVC_DIR%" && java -DSPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL% -DSPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME% -DSPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD% -jar target\%SVC_JAR%"
) else (
    echo [WARN] JAR not found - building charging-service with Maven...
    start "5. Charging Service [8083]" cmd /k "title 5. Charging Service [8083] && cd /d "%SVC_DIR%" && "%MVN%" spring-boot:run"
)
ping 127.0.0.1 -n 3 >nul

REM ===================================================================
REM 6/9 - GRID MONITORING SERVICE - Port 8084
REM ===================================================================
echo [6/9] Starting Grid Service on Port 8084...
set "SVC_DIR=%ROOT%grid-service"
set "SVC_JAR=grid-service-1.0.0.jar"
if exist "%SVC_DIR%\target\%SVC_JAR%" (
    start "6. Grid Service [8084]" cmd /k "title 6. Grid Service [8084] && cd /d "%SVC_DIR%" && java -DSPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL% -DSPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME% -DSPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD% -jar target\%SVC_JAR%"
) else (
    echo [WARN] JAR not found - building grid-service with Maven...
    start "6. Grid Service [8084]" cmd /k "title 6. Grid Service [8084] && cd /d "%SVC_DIR%" && "%MVN%" spring-boot:run"
)
ping 127.0.0.1 -n 3 >nul

REM ===================================================================
REM 7/9 - LOAD BALANCER SERVICE - Port 8085
REM ===================================================================
echo [7/9] Starting Load Balancer on Port 8085...
set "SVC_DIR=%ROOT%load-balancer-service"
set "SVC_JAR=load-balancer-service-1.0.0.jar"
if exist "%SVC_DIR%\target\%SVC_JAR%" (
    start "7. Load Balancer [8085]" cmd /k "title 7. Load Balancer [8085] && cd /d "%SVC_DIR%" && java -jar target\%SVC_JAR%"
) else (
    echo [WARN] JAR not found - building load-balancer-service with Maven...
    start "7. Load Balancer [8085]" cmd /k "title 7. Load Balancer [8085] && cd /d "%SVC_DIR%" && "%MVN%" spring-boot:run"
)
ping 127.0.0.1 -n 3 >nul

REM ===================================================================
REM 8/9 - NOTIFICATION SERVICE - Port 8086
REM ===================================================================
echo [8/9] Starting Notification Service on Port 8086...
set "SVC_DIR=%ROOT%notification-service"
set "SVC_JAR=notification-service-1.0.0.jar"
if exist "%SVC_DIR%\target\%SVC_JAR%" (
    start "8. Notification Service [8086]" cmd /k "title 8. Notification Service [8086] && cd /d "%SVC_DIR%" && java -DSPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL% -DSPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME% -DSPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD% -jar target\%SVC_JAR%"
) else (
    echo [WARN] JAR not found - building notification-service with Maven...
    start "8. Notification Service [8086]" cmd /k "title 8. Notification Service [8086] && cd /d "%SVC_DIR%" && "%MVN%" spring-boot:run"
)
ping 127.0.0.1 -n 3 >nul

REM ===================================================================
REM 9/9 - REACT FRONTEND - Port 3000
REM ===================================================================
echo [9/9] Starting React Frontend on Port 3000...
set "FRONTEND_DIR=%ROOT%frontend"
if exist "%FRONTEND_DIR%\node_modules" (
    start "9. React Frontend [3000]" cmd /k "title 9. React Frontend [3000] && cd /d "%FRONTEND_DIR%" && npm run dev"
) else (
    echo [INFO] Installing frontend dependencies first...
    start "9. React Frontend [3000]" cmd /k "title 9. React Frontend [3000] && cd /d "%FRONTEND_DIR%" && npm install && npm run dev"
)

REM -------------------------------------------------------------------
echo.
echo ==================================================================
echo              All Services (Backend + Frontend) Started!
echo ==================================================================
echo.
echo   [UI]  React Frontend      :  http://localhost:3000
echo   [API] Eureka Dashboard    :  http://localhost:8761
echo   [API] API Gateway         :  http://localhost:8080
echo   [API] User Service        :  http://localhost:8081
echo   [API] Station Service     :  http://localhost:8082
echo   [API] Charging Service    :  http://localhost:8083
echo   [API] Grid Service        :  http://localhost:8084
echo   [API] Load Balancer       :  http://localhost:8085
echo   [API] Notification Svc    :  http://localhost:8086
echo.
echo   Services register with Eureka within ~30 seconds.
echo   To stop EVERYTHING, run:  stop-all.bat
echo ==================================================================
echo.
endlocal
