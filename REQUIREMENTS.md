# Requirements Specification
## Distributed EV Charging Station & Grid Load Balancing Platform
**PS046 — Service-Oriented Architecture (SOA) Academic Project**

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the **Distributed EV Charging Station & Grid Load Balancing Platform**. It serves as the authoritative reference for the system's scope, expected behaviour, design constraints, and quality attributes.

### 1.2 Project Overview
With the exponential adoption of Electric Vehicles (EVs) in Indian cities, uncontrolled simultaneous charging imposes severe strain on urban power grids, causing localised voltage drops and zone-level overloads. This platform addresses the problem by providing a cloud-native, SOA-based system that:
- Lets EV owners discover stations and book charging sessions intelligently.
- Dynamically evaluates grid zone capacity before routing users to a station.
- Gives grid administrators real-time visibility and control over load distribution.
- Enforces a 90% overload threshold — stations in saturated zones are automatically bypassed and requests are re-routed to under-utilised alternatives.

### 1.3 Scope

#### In-Scope
| # | Capability |
|---|---|
| 1 | EV owner registration, authentication (JWT), and profile management |
| 2 | Listing and searching available EV charging stations with port-level detail |
| 3 | Intelligent station selection based on a grid load scoring algorithm |
| 4 | Charging session lifecycle management (start, active, stop, billing) |
| 5 | Real-time grid zone monitoring (load kW, capacity kW, overload status) |
| 6 | SOA-orchestrated smart allocation (station + port reservation + grid update + notification) |
| 7 | Admin management of stations (create, update, delete) and grid zones (load simulation) |
| 8 | In-app notification dispatch and retrieval per user |
| 9 | Role-based access control (EV owner vs. administrator) |
| 10 | Eureka service registry and API Gateway for centralized routing |

#### Out of Scope
| # | Excluded Capability | Rationale |
|---|---|---|
| 1 | Physical IoT smart meter / OCPP protocol integration | Hardware dependency; not feasible in academic setting |
| 2 | Real-time payment processing (Razorpay, Stripe) | Billing is cost-estimate only; no payment gateway |
| 3 | Mobile native app (Android / iOS) | Frontend limited to web React SPA |
| 4 | Machine-learning-based demand forecasting | Deferred as future enhancement |
| 5 | Multi-city or federated grid management | Single city (Vijayawada) scope only |
| 6 | MQTT / WebSocket live telemetry streams | Polling-based only; no persistent connections |
| 7 | Third-party OAuth (Google, Facebook) | Custom JWT only |

---

## 2. Actors & Stakeholders

| Actor | Type | Description |
|---|---|---|
| **EV Owner** | Primary User | Registers, logs in, discovers stations, requests smart allocation, monitors active sessions, views billing history and notifications |
| **Grid Administrator** | Primary User | Manages station catalog, simulates grid loads, monitors zone health, triggers overload scenarios, views platform-wide stats |
| **Load Balancer Service** | System Actor (Orchestrator) | Autonomously evaluates candidates, scores them by grid load, and coordinates port reservation + session creation + notification via SOA composition |
| **Station Service** | System Actor | Maintains authoritative port availability and station catalog |
| **Grid Service** | System Actor | Owns and persists real-time grid zone load data |
| **Charging Service** | System Actor | Owns the full lifecycle of charging sessions |
| **Notification Service** | System Actor | Persists and serves per-user alert messages |
| **API Gateway** | Infrastructure | Single entry point; validates JWTs, routes requests to downstream services via Eureka |
| **Service Registry (Eureka)** | Infrastructure | Dynamic service discovery; all microservices self-register |

---

## 3. Functional Requirements

### 3.1 User Management & Authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-U01 | The system SHALL allow any visitor to register a new EV owner account by providing username, email, password, and full name. | High |
| FR-U02 | The system SHALL hash passwords using BCrypt before persisting them. Plain-text passwords MUST never be stored or logged. | High |
| FR-U03 | The system SHALL authenticate users by verifying submitted credentials against the BCrypt hash stored in the database. | High |
| FR-U04 | On successful authentication, the system SHALL issue a short-lived JWT access token (24 hours) and a longer-lived refresh token (7 days). | High |
| FR-U05 | The JWT access token SHALL contain the user's username, role, and user ID as claims. | High |
| FR-U06 | The system SHALL provide a token refresh endpoint that accepts a valid refresh token and returns a new access token without requiring the user to re-enter credentials. | Medium |
| FR-U07 | The system SHALL provide a logout endpoint that invalidates the submitted access token (server-side blacklist). | Medium |
| FR-U08 | The system SHALL allow an authenticated user to view and update their own profile (full name, email). | Medium |
| FR-U09 | A user SHALL be automatically assigned a default EV vehicle (Tata Nexon EV) on registration for convenience. | Low |
| FR-U10 | Registered users SHALL be assignable one of two roles: `ROLE_USER` (EV owner) or `ROLE_ADMIN` (grid administrator). | High |

### 3.2 EV Station Management

| ID | Requirement | Priority |
|---|---|---|
| FR-S01 | The system SHALL maintain a catalog of EV charging stations with name, location, GPS coordinates, grid zone, price per kWh, total ports, and current availability. | High |
| FR-S02 | Any authenticated user SHALL be able to list all stations and view individual station details including port-level status. | High |
| FR-S03 | Only users with `ROLE_ADMIN` SHALL be able to create new charging stations. | High |
| FR-S04 | Only users with `ROLE_ADMIN` SHALL be able to update or delete existing stations. | High |
| FR-S05 | The system SHALL automatically create charging ports for a new station based on `totalPorts` count, defaulting to CCS2 type at 60 kW capacity. | Medium |
| FR-S06 | The system SHALL expose a port-level availability endpoint per station showing each port's status (AVAILABLE / OCCUPIED). | High |
| FR-S07 | The system SHALL support occupying and releasing individual ports, updating station-level `availablePorts` counter accordingly. | High |
| FR-S08 | A station SHALL be marked `FULL` when all its ports are occupied, and returned to `AVAILABLE` when any port is released. | Medium |

### 3.3 Grid Zone Monitoring

| ID | Requirement | Priority |
|---|---|---|
| FR-G01 | The system SHALL maintain 5 grid zones covering the Vijayawada region, each with a current load (kW) and maximum capacity (kW). | High |
| FR-G02 | The system SHALL expose a summary endpoint returning total system load, average load percentage, and count of overloaded zones. | High |
| FR-G03 | The system SHALL expose per-zone load details including load percentage and overload status. | High |
| FR-G04 | Only users with `ROLE_ADMIN` SHALL be able to update a grid zone's load value directly (for simulation purposes). | High |
| FR-G05 | The system SHALL automatically compute and update a zone's status (`NORMAL`, `HIGH_LOAD`, `OVERLOADED`) based on load percentage thresholds (< 70% = NORMAL, 70–89% = HIGH_LOAD, ≥ 90% = OVERLOADED). | High |
| FR-G06 | The system SHALL expose additive and subtractive load endpoints used by the Load Balancer when starting/stopping sessions. | High |

### 3.4 Smart Load Balancing & Allocation (Core SOA Orchestration)

| ID | Requirement | Priority |
|---|---|---|
| FR-L01 | The system SHALL provide a station-selection endpoint that evaluates all stations and computes a grid load score: `Score = currentLoad / maxCapacity` for each candidate. | High |
| FR-L02 | The system SHALL exclude stations in grid zones where load percentage ≥ 90% (OVERLOADED) from the primary recommendation pool. | High |
| FR-L03 | The system SHALL return the station with the lowest load score as the recommended station, along with all alternatives ranked by score. | High |
| FR-L04 | If all zones are overloaded, the system SHALL respond with a `WARNING_OVERLOAD` status and recommend the least-loaded available station as an emergency fallback. | Medium |
| FR-L05 | The system SHALL provide an allocation-confirm endpoint that orchestrates 4 downstream service calls in sequence: (1) occupy port on Station Service, (2) add grid load on Grid Service, (3) start session on Charging Service, (4) send notification via Notification Service. | High |
| FR-L06 | The load balancer SHALL handle partial failures in downstream calls gracefully — logging warnings without failing the entire allocation. | Medium |
| FR-L07 | The system SHALL include estimated total charging cost in all recommendation responses. | Medium |

### 3.5 Charging Session Lifecycle

| ID | Requirement | Priority |
|---|---|---|
| FR-C01 | The system SHALL allow starting a charging session for a user, station, and port — recording start time, energy target, and cost. | High |
| FR-C02 | The system SHALL prevent a user from starting a new session if they already have an `ACTIVE` session. | High |
| FR-C03 | The system SHALL allow stopping an active session by session ID or user ID, recording end time and marking status as `COMPLETED`. | High |
| FR-C04 | The system SHALL expose a user's full charging history (all sessions). | High |
| FR-C05 | The system SHALL expose a user's current active session if one exists. | High |
| FR-C06 | The system SHALL expose platform-wide charging statistics: total sessions, active sessions, total energy consumed, total revenue. | Medium |

### 3.6 Notification System

| ID | Requirement | Priority |
|---|---|---|
| FR-N01 | The system SHALL persist notification messages triggered by the load balancer (session start events). | High |
| FR-N02 | Each notification SHALL carry: user ID, title, message body, timestamp, read status, and type. | High |
| FR-N03 | The system SHALL allow retrieving all notifications for a specific user, ordered by most recent first. | High |
| FR-N04 | The system SHALL allow marking a notification as read. | Medium |

---

## 4. Non-Functional Requirements

### 4.1 Security

| ID | Requirement |
|---|---|
| NFR-SEC01 | All passwords MUST be hashed with BCrypt (strength ≥ 10) before storage. |
| NFR-SEC02 | All inter-service and client-facing communications MUST use JWT bearer tokens for authentication. |
| NFR-SEC03 | The API Gateway MUST validate JWT signatures on all protected routes before forwarding requests to downstream services. |
| NFR-SEC04 | JWT secrets MUST be loaded from environment variables (`JWT_SECRET`) and MUST NOT be hardcoded in source files. |
| NFR-SEC05 | CORS MUST be restricted to known frontend origins in production. |
| NFR-SEC06 | Role-based authorization MUST enforce that only `ROLE_ADMIN` can perform station creation/deletion and grid load updates. |
| NFR-SEC07 | Logout MUST invalidate the submitted access token via server-side blacklist. |
| NFR-SEC08 | HTTP 401 (Unauthorized) MUST be returned for missing/invalid tokens; HTTP 403 (Forbidden) for valid tokens with insufficient role. |

### 4.2 Availability & Reliability

| ID | Requirement |
|---|---|
| NFR-AVL01 | Each microservice MUST expose a `/actuator/health` endpoint reporting its status to Eureka and monitoring tools. |
| NFR-AVL02 | The API Gateway MUST implement circuit breakers (Resilience4j) with fallback responses to prevent cascading failures when downstream services are unavailable. |
| NFR-AVL03 | The load balancer MUST handle partial downstream failures gracefully (log and continue) rather than failing the entire allocation. |

### 4.3 Scalability

| ID | Requirement |
|---|---|
| NFR-SCL01 | All microservices MUST be stateless and independently deployable, enabling horizontal scaling by adding instances without code changes. |
| NFR-SCL02 | The API Gateway MUST use Eureka-based load balancing (`lb://` scheme) to distribute traffic across multiple instances of a service. |
| NFR-SCL03 | The Service Registry MUST dynamically track instance registrations and deregistrations without manual configuration. |

### 4.4 Performance

| ID | Requirement |
|---|---|
| NFR-PERF01 | API Gateway MUST enforce rate limiting to prevent abuse (default: 10 requests/second per principal). |
| NFR-PERF02 | Station recommendation (`/load-balancer/select-station`) MUST return results within 3 seconds under normal load. |

### 4.5 Interoperability

| ID | Requirement |
|---|---|
| NFR-INT01 | All APIs MUST use REST/HTTP with JSON payloads and standard HTTP status codes. |
| NFR-INT02 | Service-to-service communication MUST use Eureka service discovery (not hardcoded host:port). |

### 4.6 Maintainability

| ID | Requirement |
|---|---|
| NFR-MNT01 | Each microservice MUST have a single bounded domain responsibility. |
| NFR-MNT02 | All request routing through the gateway MUST be logged with method, path, response status, and duration. |

---

## 5. Use Case Descriptions

### UC-01: EV Owner — Smart Station Discovery & Booking
**Actor:** EV Owner  
**Precondition:** User is registered and authenticated (holds valid JWT)  
**Flow:**
1. User opens Smart Allocator, enters desired energy (kWh).
2. System (via Load Balancer) fetches all stations from Station Service.
3. System fetches all grid zones from Grid Service.
4. Load Balancer computes score for each station; filters out OVERLOADED zones.
5. System returns ranked list with recommended station highlighted.
6. User reviews candidates and clicks "Confirm Charging".
7. Load Balancer orchestrates: port occupation → grid load increase → session creation → notification dispatch.
8. User receives booking confirmation with cost estimate.  
**Postcondition:** Port is OCCUPIED, session is ACTIVE, user has received a notification.

---

### UC-02: EV Owner — Stop Active Charging Session
**Actor:** EV Owner  
**Precondition:** User has an ACTIVE charging session  
**Flow:**
1. User views Active Session page.
2. User clicks "Stop Charging".
3. Frontend calls `POST /sessions/stop` with user ID.
4. Charging Service marks session COMPLETED with end time.
5. Station Service releases the port (port → AVAILABLE, availablePorts++).
6. Grid Service reduces zone load (–50 kW).
7. User sees session summary with final cost.  
**Postcondition:** Port is AVAILABLE, session is COMPLETED, grid load reduced.

---

### UC-03: Grid Admin — Overload Scenario Simulation
**Actor:** Grid Administrator  
**Precondition:** Admin is authenticated with `ROLE_ADMIN`  
**Flow:**
1. Admin navigates to Admin Centre → Grid Simulator.
2. Admin clicks "Trigger Overload" on a selected zone.
3. System calls `PUT /grid/zones/{id}/load` with load > 90% of capacity.
4. Grid Service updates zone status to OVERLOADED.
5. Any subsequent smart allocation request bypasses stations in this zone.
6. Admin restores load via "Reset Load" button.  
**Postcondition:** Zone status reflects OVERLOADED; load balancer routes around it.

---

### UC-04: Grid Admin — Add New Charging Station
**Actor:** Grid Administrator  
**Precondition:** Admin is authenticated with `ROLE_ADMIN`  
**Flow:**
1. Admin opens Admin Centre → Add Station.
2. Admin submits station name, location, grid zone, price, and port count.
3. System validates JWT role claim (ROLE_ADMIN).
4. Station Service creates station record and auto-generates ports.
5. New station appears in station list immediately.  
**Postcondition:** Station is persisted and available for smart allocation.

---

## 6. Assumptions & Constraints

### Assumptions
| # | Assumption |
|---|---|
| A1 | PostgreSQL 14+ is available locally on port 5432 with database `ev_charging_db`. Services fall back to embedded H2 if PostgreSQL is unreachable. |
| A2 | Java JDK 17 and Apache Maven 3.9+ are available on the host machine. |
| A3 | Node.js 18+ and npm are available for the React frontend. |
| A4 | All services run on a single host (localhost) in the development/demo environment. |
| A5 | Grid zone capacities are fixed at 500 kW each for all 5 Vijayawada zones. |
| A6 | Each active charging session adds a fixed 50 kW load increment to the associated grid zone. |
| A7 | Charging cost is computed as `targetEnergyKwh × pricePerKwh` at the moment of allocation (no dynamic surge pricing). |

### Constraints
| # | Constraint |
|---|---|
| C1 | All 8 microservices must start within 60 seconds of the launcher script executing on a standard development machine. |
| C2 | The JWT secret must be at least 32 characters to comply with HMAC-SHA256 signing requirements. |
| C3 | The system is a single-deployment academic demonstration; horizontal scaling is architecturally supported but not demonstrated with multiple instances. |
| C4 | The frontend assumes the API Gateway is always reachable at `http://localhost:8080`. |
| C5 | Grid zone data (5 Vijayawada zones) is seeded at startup; no dynamic zone creation is supported. |

---

## 7. System Quality Summary

| Quality Attribute | Mechanism |
|---|---|
| Security | JWT authentication, BCrypt hashing, role-based authorization, gateway JWT filter |
| Availability | Actuator health checks, Eureka registration, circuit breakers |
| Scalability | Stateless services, Eureka discovery, `lb://` load balancing |
| Loose Coupling | No direct DB sharing; services communicate only via REST APIs |
| Service Discoverability | Netflix Eureka auto-registration with heartbeat renewal |
| Interoperability | REST/JSON, standard HTTP status codes, CORS-enabled APIs |
| Maintainability | Single-responsibility boundaries, gateway request logging |

---

*Document generated: September 2026 | Project: PS046 SOA Academic Submission*
