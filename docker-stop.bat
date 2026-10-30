@echo off
echo ===============================================================================
echo        STOPPING CHARGE SPHERE DOCKER CONTAINERS
echo ===============================================================================
echo.
docker compose down
echo.
echo [OK] All containers stopped and removed.
pause
