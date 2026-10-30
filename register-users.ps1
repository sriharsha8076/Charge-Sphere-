# ═══════════════════════════════════════════════════════════════════════════════
# register-users.ps1  —  Register users on ChargeSphere via REST API
# ═══════════════════════════════════════════════════════════════════════════════
#
# Usage:
#   .\register-users.ps1                             # uses localhost:8080
#   .\register-users.ps1 -BaseUrl "http://54.226.35.212:8080"
#
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$endpoint = "$BaseUrl/users/register"

function Banner($msg) {
    Write-Host ""
    Write-Host ("=" * 65) -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host ("=" * 65) -ForegroundColor Cyan
}

function Register-User($user) {
    $body = $user | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method POST `
            -ContentType "application/json" -Body $body
        Write-Host "[OK] Registered: $($user.username)  (id=$($response.id), role=$($response.role))" -ForegroundColor Green
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        try {
            $msg = ($_.ErrorDetails.Message | ConvertFrom-Json).message
        } catch {
            $msg = $_.ErrorDetails.Message
        }
        if ($status -eq 400 -and $msg -match "already") {
            Write-Host "[SKIP] $($user.username) already exists — skipping." -ForegroundColor Yellow
        } else {
            Write-Host "[FAIL] $($user.username) — HTTP $status : $msg" -ForegroundColor Red
        }
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# USERS TO REGISTER
# Add / remove / edit entries below to create the users you need.
# Roles: "ROLE_USER" (EV driver)  |  "ROLE_ADMIN" (Grid administrator)
# ═══════════════════════════════════════════════════════════════════════════════
$users = @(
    @{ username = "ravi";   email = "ravi@evcharging.com";   password = "password123"; fullName = "Ravi Kumar";       role = "ROLE_USER"  },
    @{ username = "priya";  email = "priya@evcharging.com";  password = "password123"; fullName = "Priya Sharma";     role = "ROLE_USER"  },
    @{ username = "suresh"; email = "suresh@evcharging.com"; password = "password123"; fullName = "Suresh Reddy";     role = "ROLE_USER"  },
    @{ username = "anitha"; email = "anitha@evcharging.com"; password = "password123"; fullName = "Anitha Patel";     role = "ROLE_USER"  },
    @{ username = "kiran";  email = "kiran@evcharging.com";  password = "password123"; fullName = "Kiran Babu";       role = "ROLE_USER"  },
    @{ username = "divya";  email = "divya@evcharging.com";  password = "password123"; fullName = "Divya Naidu";      role = "ROLE_USER"  },
    @{ username = "harsha"; email = "harsha@evcharging.com"; password = "password123"; fullName = "Harsha Gundlapalli"; role = "ROLE_USER" },
    @{ username = "admin2"; email = "admin2@evcharging.com"; password = "password123"; fullName = "Grid Admin 2";     role = "ROLE_ADMIN" }
)

Banner "ChargeSphere — User Registration"
Write-Host "  Target : $endpoint" -ForegroundColor Gray
Write-Host "  Users  : $($users.Count)" -ForegroundColor Gray

# ── Wait for API Gateway to be ready ─────────────────────────────────────────
Write-Host ""
Write-Host "[*] Checking API Gateway health..." -ForegroundColor Yellow
$ready = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $health = Invoke-RestMethod "$BaseUrl/actuator/health" -Method GET -TimeoutSec 5
        if ($health.status -eq "UP") { $ready = $true; break }
    } catch { }
    Write-Host "    Attempt $i/5 — Gateway not ready yet, waiting 5s..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 5
}

if (-not $ready) {
    Write-Host ""
    Write-Host "[WARNING] Gateway health check failed. Trying registrations anyway..." -ForegroundColor DarkYellow
}

# ── Register each user ────────────────────────────────────────────────────────
Banner "Registering Users"
foreach ($u in $users) {
    Register-User $u
}

Banner "Done"
Write-Host "  All done! Log in at $($BaseUrl -replace ':8080','')  (or :8080 for API)" -ForegroundColor Cyan
Write-Host "  Default password for all users: password123" -ForegroundColor Gray
Write-Host ""
