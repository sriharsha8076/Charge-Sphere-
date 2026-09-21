@echo off
title SOA EV Charging Microservices Launcher
cd /d "%~dp0"
echo =========================================================================
echo       Starting Distributed EV Charging ^& Grid Load Balancing Services
echo       PostgreSQL DB: ev_charging_db ^| User: postgres ^| Password: ******
echo =========================================================================
echo.

set PATH=%PATH%;C:\Users\Harsha\.antigravity-ide\extensions\oracle.oracle-java-26.0.2-universal\nbcode\java\maven\bin;C:\Program Files\Java\jdk-17\bin
set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ev_charging_db
set SPRING_DATASOURCE_DRIVER=org.postgresql.Driver
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=123456

echo Starting 1/8: Service Registry (Eureka Server - Port 8761)...
start "1. Service Registry [8761]" cmd /k "cd service-registry && java -jar target\service-registry-1.0.0.jar || mvn spring-boot:run"

ping 127.0.0.1 -n 8 > nul

echo Starting 2/8: API Gateway (Port 8080)...
start "2. API Gateway [8080]" cmd /k "cd api-gateway && java -jar target\api-gateway-1.0.0.jar || mvn spring-boot:run"

echo Starting 3/8: User Service (Port 8081)...
start "3. User Service [8081]" cmd /k "cd user-service && java -jar target\user-service-1.0.0.jar || mvn spring-boot:run"

echo Starting 4/8: Station Service (Port 8082)...
start "4. Station Service [8082]" cmd /k "cd station-service && java -jar target\station-service-1.0.0.jar || mvn spring-boot:run"

echo Starting 5/8: Charging Session Service (Port 8083)...
start "5. Charging Service [8083]" cmd /k "cd charging-service && java -jar target\charging-service-1.0.0.jar || mvn spring-boot:run"

echo Starting 6/8: Grid Monitoring Service (Port 8084)...
start "6. Grid Service [8084]" cmd /k "cd grid-service && java -jar target\grid-service-1.0.0.jar || mvn spring-boot:run"

echo Starting 7/8: Load Balancing Service [SOA Orchestrator] (Port 8085)...
start "7. Load Balancer [8085]" cmd /k "cd load-balancer-service && java -jar target\load-balancer-service-1.0.0.jar || mvn spring-boot:run"

echo Starting 8/8: Notification Service (Port 8086)...
start "8. Notification Service [8086]" cmd /k "cd notification-service && java -jar target\notification-service-1.0.0.jar || mvn spring-boot:run"

echo.
echo =========================================================================
echo   All 8 SOA microservices started! Eureka Dashboard: http://localhost:8761
echo =========================================================================
echo Done.
