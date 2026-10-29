# TEST_REPORT.md — EV Charging SOA Platform
## Manual & Automated Test Report

**Platform:** Distributed EV Charging Station & Grid Load Balancing (SOA)  
**Test Framework:** JUnit 5 + Mockito + @WebMvcTest + @SpringBootTest + Postman Newman  
**Date:** October 2026  
**Tester:** SOA Team

---

## Unit Tests — LoadBalancerService (JUnit 5 + Mockito)

| # | Test Case | Input | Expected Result | Actual Result | Pass/Fail |
|---|-----------|-------|-----------------|---------------|-----------|
| 1 | Picks lowest-load station | Station A (30% load), Station B (70% load) | Recommends Station A; status=SUCCESS | Station A selected; `loadScore=0.3` | ✅ Pass |
| 2 | Overload bypass | Zone 1 at 95% (Station A), Zone 2 at 40% (Station B) | Station A bypassed; Station B selected | Station B selected; Station A in alternatives | ✅ Pass |
| 3 | All zones overloaded — port exists | Both zones at 96%+ but ports available | status=WARNING_OVERLOAD, emergency station returned | WARNING_OVERLOAD returned with a recommended station | ✅ Pass |
| 4 | All ports occupied | All stations have `availablePorts=0` | status=NO_STATION_AVAILABLE, no recommended station | NO_STATION_AVAILABLE; `recommendedStation=null` | ✅ Pass |
| 5 | Station service down | RestClientException on station call | Graceful degradation; NO_STATION_AVAILABLE | NO_STATION_AVAILABLE without exception thrown | ✅ Pass |
| 6 | Null request defaults to 25 kWh | `null` ChargingRequest | 25 kWh default; estimatedCost = price × 25 | `requiredEnergyKwh=25.0`; cost computed correctly | ✅ Pass |
| 7 | Load score accuracy | 250 kW / 500 kW max | `loadScore=0.5`, `gridLoadPercentage=50.0` | Score=0.5, Percentage=50.0 | ✅ Pass |
| 8 | Confirm & allocate orchestration | userId=1, stationId=1, portId=11, energy=25 | All 4 downstream calls made; sessionId=42 returned | 4 downstream calls verified; sessionId=42 | ✅ Pass |

---

## Unit Tests — JwtUtil (JUnit 5, no Spring context)

| # | Test Case | Input | Expected Result | Actual Result | Pass/Fail |
|---|-----------|-------|-----------------|---------------|-----------|
| 1 | Token generation — claims correct | username=harsha, role=ROLE_USER, userId=7 | Subject=harsha, role=ROLE_USER, userId=7 | All claims match | ✅ Pass |
| 2 | Refresh token type is REFRESH | generateRefreshToken("harsha", 7L) | type claim = "REFRESH" | type = "REFRESH" | ✅ Pass |
| 3 | Valid token passes validation | Fresh token, not blacklisted | validateToken returns true | true | ✅ Pass |
| 4 | Tampered token rejected | JWT with corrupted payload section | validateToken returns false | false | ✅ Pass |
| 5 | Bogus string rejected | "this.is.not.a.jwt" | validateToken returns false | false | ✅ Pass |
| 6 | Null token is safe | null | validateToken returns false, no NPE | false | ✅ Pass |
| 7 | Expired token detected | 1ms expiry, 50ms sleep | isTokenExpired returns true | true | ✅ Pass |
| 8 | Expired token fails validation | 1ms expiry, 50ms sleep | validateToken returns false | false | ✅ Pass |
| 9 | Expired token throws ExpiredJwtException | extractAllClaims on expired token | ExpiredJwtException thrown | Exception thrown | ✅ Pass |
| 10 | Blacklisted token fails validation | blacklistToken(token), then validate | isBlacklisted=true; validateToken=false | Blacklisted and rejected | ✅ Pass |
| 11 | Blacklist null/blank is safe | blacklistToken(null), blacklistToken("") | No exception thrown | No exception | ✅ Pass |
| 12 | Non-blacklisted token is clean | Fresh token not blacklisted | isBlacklisted returns false | false | ✅ Pass |
| 13 | Access token type is ACCESS | generateToken("admin", "ROLE_ADMIN", 1L) | type claim = "ACCESS" | "ACCESS" | ✅ Pass |
| 14 | Refresh token passes signature | generateRefreshToken, then validateToken | true (same secret, valid signature) | true | ✅ Pass |

---

## Slice Tests — GridController (@WebMvcTest + MockMvc)

| # | Test Case | HTTP Call | Input / Mocked State | Expected Status | Expected Body | Pass/Fail |
|---|-----------|-----------|---------------------|-----------------|---------------|-----------|
| 1 | Get all zones | GET /grid/zones | 2 zones in repo | 200 | Array of 2 zones | ✅ Pass |
| 2 | Get zone by id — found | GET /grid/zones/1 | Zone 1 exists | 200 | id=1, zoneName set | ✅ Pass |
| 3 | Get zone by id — not found | GET /grid/zones/99 | No zone 99 | 404 | Error string | ✅ Pass |
| 4 | Get zone load info | GET /grid/zones/1/load | Zone 1: 150/500 kW | 200 | loadPercentage=30, status=NORMAL | ✅ Pass |
| 5 | Add load — normal | POST /grid/zones/1/add-load | +50 kW; zone at 150→200 | 200 | currentLoadKw=200, status=NORMAL | ✅ Pass |
| 6 | Add load — triggers OVERLOADED | POST /grid/zones/1/add-load | +60 kW; zone at 420→480 | 200 | status=OVERLOADED | ✅ Pass |
| 7 | Add load — zone not found | POST /grid/zones/99/add-load | No zone 99 | 404 | Error string | ✅ Pass |
| 8 | Remove load — normal | POST /grid/zones/2/remove-load | -200 kW; zone at 350→150 | 200 | currentLoadKw=150, status=NORMAL | ✅ Pass |
| 9 | Remove load — floors at 0 | POST /grid/zones/1/remove-load | -200 kW; zone only has 50 | 200 | currentLoadKw=0.0 | ✅ Pass |
| 10 | PUT set exact load | PUT /grid/zones/1/load | currentLoadKw=400 | 200 | currentLoadKw=400, status=HIGH_LOAD | ✅ Pass |
| 11 | PUT missing body field | PUT /grid/zones/1/load | payload has "wrongField" | 400 | Bad Request | ✅ Pass |
| 12 | GET overall status — stable | GET /grid/status | 2 zones, none overloaded | 200 | systemStatus=STABLE | ✅ Pass |
| 13 | GET overall status — warning | GET /grid/status | 1 zone OVERLOADED | 200 | systemStatus=WARNING_OVERLOAD | ✅ Pass |

---

## Integration Tests — ChargingSession Lifecycle (@SpringBootTest + H2)

| # | Test Case | HTTP Call | Input | Expected Status | Expected Body | Pass/Fail |
|---|-----------|-----------|-------|-----------------|---------------|-----------|
| 1 | Start session | POST /sessions/start | userId=1, stationId=1, energy=25, price=12 | 201 | status=ACTIVE, cost=300.0 | ✅ Pass |
| 2 | Duplicate active session rejected | POST /sessions/start (2nd call) | Same userId already has ACTIVE session | 400 | Existing session returned | ✅ Pass |
| 3 | Get active session | GET /sessions/user/3/active | After starting session for userId=3 | 200 | status=ACTIVE, userId=3 | ✅ Pass |
| 4 | Stop session by sessionId | POST /sessions/stop | sessionId from step 1 | 200 | status=COMPLETED, endTime≠null | ✅ Pass |
| 5 | Stop session by userId | POST /sessions/stop | userId=5 (no sessionId) | 200 | status=COMPLETED | ✅ Pass |
| 6 | Stop non-existent session | POST /sessions/stop | sessionId=9999 | 404 | Not Found error | ✅ Pass |
| 7 | Platform stats aggregation | GET /sessions/stats | 2 sessions started (25+20 kWh) | 200 | totalSessions=2, totalEnergy=45, revenue=500 | ✅ Pass |
| 8 | User session history | GET /sessions/user/8 | After starting session for userId=8 | 200 | Non-empty array | ✅ Pass |

---

## Postman API Tests (Manual / Newman)

| # | Request | Expected Status | Test Assertions | Pass/Fail |
|---|---------|-----------------|-----------------|-----------|
| 1 | POST /users/register | 201 | Has token, userId, username | ✅ Pass |
| 2 | POST /users/login | 200 | JWT saved to env; role=ROLE_USER | ✅ Pass |
| 3 | POST /users/login (admin) | 200 | role=ROLE_ADMIN | ✅ Pass |
| 4 | POST /users/login (wrong password) | 401 | Error in response | ✅ Pass |
| 5 | GET /grid/zones | 200 | Array with ≥1 zone, all fields present | ✅ Pass |
| 6 | GET /stations | 200 | Array with ≥1 station, id/name/gridZoneId | ✅ Pass |
| 7 | POST /load-balancer/select-station | 200 | status in [SUCCESS/WARNING_OVERLOAD/NO_STATION_AVAILABLE], stationId saved | ✅ Pass |
| 8 | POST /load-balancer/allocate | 200 | status=SUCCESS, sessionId saved, estimatedCost > 0 | ✅ Pass |
| 9 | GET /sessions/user/{id}/active | 200 | status=ACTIVE | ✅ Pass |
| 10 | POST /sessions/stop | 200 | status=COMPLETED, endTime≠null | ✅ Pass |
| 11 | GET /sessions/user/{id} | 200 | Non-empty array | ✅ Pass |
| 12 | GET /notifications/user/{id} | 200 | Array with title, message fields | ✅ Pass |
| 13 | GET /stations (no JWT) | 401 | error field in response | ✅ Pass |
| 14 | GET /grid/status | 200 | totalZones, totalCurrentLoadKw, systemStatus | ✅ Pass |
| 15 | GET /sessions/stats | 200 | totalSessions, totalRevenue | ✅ Pass |
| 16 | GET /load-balancer/recommendations | 200 | status field | ✅ Pass |

---

## Coverage Summary

| Service | Test Type | Classes Tested | Coverage (Estimated) |
|---------|-----------|---------------|---------------------|
| load-balancer-service | Unit (Mockito) | `LoadBalancerService` | ~85% of service logic |
| user-service | Unit | `JwtUtil` | ~95% of JWT util |
| grid-service | Slice (@WebMvcTest) | `GridController` | ~100% of controller |
| charging-service | Integration (@SpringBootTest) | `ChargingController`, `ChargingSessionRepository` | ~80% of session lifecycle |
| All Services | Postman Newman | All REST endpoints | End-to-end flow validated |

**Command to generate JaCoCo coverage report:**
```bash
cd load-balancer-service && mvn test jacoco:report
# Report at: load-balancer-service/target/site/jacoco/index.html
```
