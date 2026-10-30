# ═══════════════════════════════════════════════════════════════════════════════
# build-and-push.ps1  —  Charge Sphere: Build + Push all Docker images to Hub
# ═══════════════════════════════════════════════════════════════════════════════
# Prerequisites:
#   - Docker Desktop running
#   - docker login already done  (run: docker login)
#   - Your EC2 public IP ready
#
# Usage:
#   .\build-and-push.ps1 -HubUser "yourusername" -EC2IP "54.x.x.x"
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$true)]
    [string]$HubUser,

    [Parameter(Mandatory=$true)]
    [string]$EC2IP
)

$ErrorActionPreference = "Stop"
$TAG = "latest"
$ROOT = $PSScriptRoot

function Banner($msg) {
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
}

function Step($msg) { Write-Host "[*] $msg" -ForegroundColor Yellow }
function OK($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

# ── Verify Docker is running ──────────────────────────────────────────────────
Banner "PRE-FLIGHT CHECKS"
Step "Checking Docker daemon..."
try { docker info 2>&1 | Out-Null } catch { Fail "Docker is not running. Start Docker Desktop first." }
OK "Docker is running"

Step "Checking Docker Hub login..."
$loginTest = docker pull hello-world 2>&1
if ($LASTEXITCODE -ne 0) { Fail "Cannot reach Docker Hub. Run 'docker login' first." }
OK "Docker Hub reachable"

# ══════════════════════════════════════════════════════════════════════════════
# IMAGE BUILD MAP
# Format: [service-name] = [context-dir, dockerfile-path]
# ══════════════════════════════════════════════════════════════════════════════
$services = [ordered]@{
    "charge-sphere-service-registry"    = @{ ctx = "service-registry";    df = "service-registry/Dockerfile" }
    "charge-sphere-api-gateway"         = @{ ctx = "api-gateway";         df = "Dockerfile.service" }
    "charge-sphere-user-service"        = @{ ctx = "user-service";        df = "Dockerfile.service" }
    "charge-sphere-station-service"     = @{ ctx = "station-service";     df = "Dockerfile.service" }
    "charge-sphere-charging-service"    = @{ ctx = "charging-service";    df = "Dockerfile.service" }
    "charge-sphere-grid-service"        = @{ ctx = "grid-service";        df = "Dockerfile.service" }
    "charge-sphere-load-balancer-service" = @{ ctx = "load-balancer-service"; df = "Dockerfile.service" }
    "charge-sphere-notification-service" = @{ ctx = "notification-service"; df = "Dockerfile.service" }
}

# ── Build Spring Boot services ────────────────────────────────────────────────
Banner "BUILDING SPRING BOOT MICROSERVICES"
foreach ($imgName in $services.Keys) {
    $svc = $services[$imgName]
    $fullImg = "${HubUser}/${imgName}:${TAG}"
    $ctxPath = Join-Path $ROOT $svc.ctx
    $dfPath  = if ($svc.df -eq "Dockerfile.service") {
                   Join-Path $ROOT "Dockerfile.service"
               } else {
                   Join-Path $ROOT $svc.df
               }

    Step "Building $fullImg ..."
    docker build -t $fullImg -f $dfPath $ctxPath
    if ($LASTEXITCODE -ne 0) { Fail "Build failed for $imgName" }
    OK "Built $fullImg"
}

# ── Build Frontend (requires EC2 IP for VITE_API_BASE_URL) ────────────────────
Banner "BUILDING REACT FRONTEND"
$frontendImg = "${HubUser}/charge-sphere-frontend:${TAG}"
$apiUrl = "http://${EC2IP}:8080"
Step "Building $frontendImg with VITE_API_BASE_URL=$apiUrl ..."
docker build `
    --build-arg VITE_API_BASE_URL=$apiUrl `
    -t $frontendImg `
    -f (Join-Path $ROOT "frontend\Dockerfile.frontend") `
    (Join-Path $ROOT "frontend")
if ($LASTEXITCODE -ne 0) { Fail "Frontend build failed." }
OK "Built $frontendImg"

# ── Push all images to Docker Hub ─────────────────────────────────────────────
Banner "PUSHING ALL IMAGES TO DOCKER HUB"
$allImages = $services.Keys + @("charge-sphere-frontend") | ForEach-Object {
    if ($_ -eq "charge-sphere-frontend") { "${HubUser}/charge-sphere-frontend:${TAG}" }
    else { "${HubUser}/${_}:${TAG}" }
}

foreach ($img in $allImages) {
    Step "Pushing $img ..."
    docker push $img
    if ($LASTEXITCODE -ne 0) { Fail "Push failed for $img" }
    OK "Pushed $img"
}

# ── Summary ───────────────────────────────────────────────────────────────────
Banner "ALL IMAGES PUSHED SUCCESSFULLY"
Write-Host ""
Write-Host "  Docker Hub username : $HubUser" -ForegroundColor White
Write-Host "  EC2 Public IP       : $EC2IP"   -ForegroundColor White
Write-Host "  API Gateway URL     : http://${EC2IP}:8080" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. SSH into your EC2 instance"
Write-Host "  2. Follow DEPLOY_GUIDE.md — Section 3 onward"
Write-Host ""