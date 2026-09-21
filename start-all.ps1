# ============================================================================
#  EV Charging Platform — start-all.ps1
#  Starts all 8 Spring Boot microservices in separate windows
#  Run from project root: .\start-all.ps1
# ============================================================================
#Requires -Version 5.1

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║       EV Charging Platform — SOA Microservices Startup          ║" -ForegroundColor Cyan
Write-Host "  ║       8 Services  |  Java 17  |  PostgreSQL  |  Eureka          ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Environment ──────────────────────────────────────────────────────────────
$env:JAVA_HOME                = "C:\Program Files\Java\jdk-17"
$env:PATH                     = "$env:JAVA_HOME\bin;$env:PATH"
$env:SPRING_DATASOURCE_URL    = "jdbc:postgresql://localhost:5432/ev_charging_db"
$env:SPRING_DATASOURCE_DRIVER = "org.postgresql.Driver"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "123456"
$env:JWT_SECRET               = "ev_charging_soa_secret_key_super_secure_32_bytes_long_12345"

$MVN = "C:\Users\Harsha\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd"

# ── Verify Java ───────────────────────────────────────────────────────────────
try {
    $jv = & java -version 2>&1
    Write-Host "  [OK] $($jv[0])" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Java not found. Install JDK 17 and add it to PATH." -ForegroundColor Red
    exit 1
}

# ── Service Definitions (ordered by startup dependency) ──────────────────────
$Services = @(
    @{ Num="1"; Name="Service Registry [8761]"; Dir="service-registry";   Jar="service-registry-1.0.0.jar";   DB=$false; JWT=$false }
    @{ Num="2"; Name="API Gateway [8080]";       Dir="api-gateway";        Jar="api-gateway-1.0.0.jar";        DB=$false; JWT=$true  }
    @{ Num="3"; Name="User Service [8081]";      Dir="user-service";       Jar="user-service-1.0.0.jar";       DB=$true;  JWT=$true  }
    @{ Num="4"; Name="Station Service [8082]";   Dir="station-service";    Jar="station-service-1.0.0.jar";    DB=$true;  JWT=$false }
    @{ Num="5"; Name="Charging Service [8083]";  Dir="charging-service";   Jar="charging-service-1.0.0.jar";   DB=$true;  JWT=$false }
    @{ Num="6"; Name="Grid Service [8084]";      Dir="grid-service";       Jar="grid-service-1.0.0.jar";       DB=$true;  JWT=$false }
    @{ Num="7"; Name="Load Balancer [8085]";     Dir="load-balancer-service"; Jar="load-balancer-service-1.0.0.jar"; DB=$false; JWT=$false }
    @{ Num="8"; Name="Notification Service [8086]"; Dir="notification-service"; Jar="notification-service-1.0.0.jar"; DB=$true; JWT=$false }
)

function Start-Service($svc) {
    $dir = Join-Path $ROOT $svc.Dir
    $jar = Join-Path $dir "target\$($svc.Jar)"

    # Build JVM args for env vars
    $jvmArgs = ""
    if ($svc.DB) {
        $jvmArgs += " -DSPRING_DATASOURCE_URL=$env:SPRING_DATASOURCE_URL"
        $jvmArgs += " -DSPRING_DATASOURCE_USERNAME=$env:SPRING_DATASOURCE_USERNAME"
        $jvmArgs += " -DSPRING_DATASOURCE_PASSWORD=$env:SPRING_DATASOURCE_PASSWORD"
    }
    if ($svc.JWT) {
        $jvmArgs += " -DJWT_SECRET=$env:JWT_SECRET"
    }

    if (Test-Path $jar) {
        $cmd = "title $($svc.Num). $($svc.Name) && cd /d `"$dir`" && java$jvmArgs -jar target\$($svc.Jar)"
        Start-Process cmd -ArgumentList "/k", $cmd -WindowStyle Normal
        Write-Host "  [$($svc.Num)/8] Started $($svc.Name) (JAR)" -ForegroundColor Green
    } else {
        Write-Host "  [$($svc.Num)/8] JAR not found — building $($svc.Dir) ..." -ForegroundColor Yellow
        $cmd = "title $($svc.Num). $($svc.Name) && cd /d `"$dir`" && `"$MVN`" spring-boot:run"
        Start-Process cmd -ArgumentList "/k", $cmd -WindowStyle Normal
        Write-Host "  [$($svc.Num)/8] Started $($svc.Name) (Maven)" -ForegroundColor Yellow
    }
}

function Wait-ForEureka {
    Write-Host ""
    Write-Host "  [INFO] Waiting for Eureka at http://localhost:8761/actuator/health ..." -ForegroundColor Yellow
    for ($i = 1; $i -le 30; $i++) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:8761/actuator/health" -TimeoutSec 2 -UseBasicParsing
            if ($r.StatusCode -eq 200) {
                Write-Host "  [OK]   Eureka is UP! (check $i)" -ForegroundColor Green
                return $true
            }
        } catch {}
        Write-Host "  [...]  Attempt $i/30 — Eureka not ready yet, waiting 2s..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
    }
    Write-Host "  [WARN] Eureka did not respond within 60s — services will retry registration." -ForegroundColor Yellow
    return $false
}

# ── Start Services ────────────────────────────────────────────────────────────
Write-Host ""

# 1. Eureka first
Start-Service $Services[0]
Wait-ForEureka

# 2–8. Remaining backend services (1-second stagger to avoid race conditions)
for ($i = 1; $i -lt $Services.Count; $i++) {
    Start-Service $Services[$i]
    Start-Sleep -Seconds 1
}

# 9. React Frontend
Write-Host "  [9/9] Starting React Frontend [3000] ..." -ForegroundColor Green
$frontendDir = Join-Path $ROOT "frontend"
$feCmd = "title 9. React Frontend [3000] && cd /d `"$frontendDir`" && npm run dev"
Start-Process cmd -ArgumentList "/k", $feCmd -WindowStyle Normal

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ==================================================================" -ForegroundColor Cyan
Write-Host "               All Services (Backend + Frontend) Started!           " -ForegroundColor Cyan
Write-Host "  ==================================================================" -ForegroundColor Cyan
Write-Host "    [UI]  React Frontend   :  http://localhost:3000" -ForegroundColor Green
Write-Host "    [API] Eureka Dashboard :  http://localhost:8761" -ForegroundColor Yellow
Write-Host "    [API] API Gateway      :  http://localhost:8080" -ForegroundColor Yellow
Write-Host "    [API] User Service     :  http://localhost:8081" -ForegroundColor Gray
Write-Host ""
Write-Host "    Services register with Eureka within ~30s of startup." -ForegroundColor Gray
Write-Host "    To stop all services:   .\stop-all.bat" -ForegroundColor Red
Write-Host "  ==================================================================" -ForegroundColor Cyan
Write-Host ""

