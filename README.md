# Distributed EV Charging Station & Grid Load Balancing Platform

> **Academic Subject:** Service-Oriented Architecture (SOA)  
> **Architecture Style:** Microservices / SOA Orchestration  
> **Tech Stack:** Java Spring Boot, Spring Cloud Gateway, Eureka Server, PostgreSQL / H2 JPA, React.js, Axios, Lucide Icons  

---

## 📄 Academic Abstract

With the exponential adoption of Electric Vehicles (EVs), uncontrolled charging demand poses a severe threat to power grid stability, causing localized voltage drops and zone overloads. This project presents a **Distributed EV Charging Station & Grid Load Balancing Platform** built strictly on **Service-Oriented Architecture (SOA)** principles.

The platform decomposes the domain into independent, loosely-coupled microservices: **User Service**, **Station Service**, **Grid Monitoring Service**, **Charging Session Service**, **Notification Service**, and a central **Load Balancing Service (SOA Orchestrator)**. The Load Balancing Service dynamically evaluates station availability and grid zone capacity using a multi-criteria scoring algorithm:

$$\text{Score} = \frac{\text{Current Grid Zone Load (kW)}}{\text{Maximum Grid Capacity (kW)}}$$

Stations in grid zones exceeding a **90% load threshold** are automatically flagged as overloaded and bypassed, re-routing charging requests to nearby under-utilized stations. The platform includes a responsive React dashboard for EV users and grid administrators, complete with interactive SOA sequence visualization and live grid load simulation.

---

## 📐 SOA Principles & Architectural Demonstration

| SOA Principle | System Implementation & Evidence |
|---|---|
| **1. Loose Coupling** | Microservices maintain independent data boundaries and databases (`user_db`, `station_db`, `grid_db`, `charging_db`). No service directly accesses another's database tables. |
| **2. Service Contract** | Standardized REST APIs using JSON payloads and HTTP status codes (`200 OK`, `201 CREATED`, `400 BAD REQUEST`, `401 UNAUTHORIZED`, `404 NOT FOUND`, `500 INTERNAL SERVER ERROR`). |
| **3. Service Composability** | The `load-balancer-service` orchestrates calls across `station-service`, `grid-service`, `charging-service`, and `notification-service` to satisfy composite business goals. |
| **4. Service Discoverability** | All microservices dynamically register with **Netflix Eureka Service Registry** (`service-registry` at port `8761`) and resolve endpoints via `api-gateway` (port `8080`). |
| **5. Stateless Services** | REST endpoints operate statelessly using JWT bearer tokens without server-side HTTP session state. |
| **6. Reusability** | `grid-service` and `station-service` expose autonomous endpoints consumable by web UIs, mobile apps, or external power utility providers. |
| **7. Interoperability** | Standard HTTP/REST protocols and JSON formats enable seamless interoperability across heterogeneous technologies (Java Spring Boot backend + React frontend). |

---

## 🏛 System Architecture Diagram

```
                        ┌─────────────────────────────────┐
                        │         React Frontend          │
                        │   (User & Admin Dashboards)     │
                        └────────────────┬────────────────┘
                                         │ HTTP / REST
                                         ▼
                        ┌─────────────────────────────────┐
                        │      API Gateway (Port 8080)    │
                        └────────────────┬────────────────┘
                                         │ Service Lookup
                                         ▼
                        ┌─────────────────────────────────┐
                        │   Service Registry (Port 8761)  │ (Eureka Server)
                        └────────────────┬────────────────┘
                                         │
     ┌───────────────────────────────────┼───────────────────────────────────┐
     │                                   │                                   │
     ▼                                   ▼                                   ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│   User Service   │           │ Station Service  │           │   Grid Service   │
│   (Port 8081)    │           │   (Port 8082)    │           │   (Port 8084)    │
└──────────────────┘           └─────────┬────────┘           └─────────┬────────┘
                                         │                              │
                                         ▼                              ▼
                               ┌──────────────────────────────────────────────┐
                               │     Load Balancing Service (Orchestrator)    │ (Port 8085)
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           Charging Session Service           │ (Port 8083)
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │             Notification Service             │ (Port 8086)
                               └──────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
d:\SOA PROJECT\
├── database/
│   ├── schema.sql                      # PostgreSQL Schema creation script
│   └── data.sql                        # Seed data (5 Vijayawada EV Stations & Grid Zones)
├── service-registry/                   # Eureka Server (Port 8761)
│   ├── pom.xml
│   └── src/main/java/com/evcharging/serviceregistry/ServiceRegistryApplication.java
├── api-gateway/                        # Spring Cloud Gateway (Port 8080)
│   ├── pom.xml
│   └── src/main/resources/application.yml
├── user-service/                       # User Auth & Profile Service (Port 8081)
│   ├── pom.xml
│   └── src/main/java/com/evcharging/userservice/
├── station-service/                    # EV Station & Port Catalog (Port 8082)
│   ├── pom.xml
│   └── src/main/java/com/evcharging/stationservice/
├── charging-service/                   # Session Lifecycle & Billing (Port 8083)
│   ├── pom.xml
│   └── src/main/java/com/evcharging/chargingservice/
├── grid-service/                       # Grid Zone Monitoring (Port 8084)
│   ├── pom.xml
│   └── src/main/java/com/evcharging/gridservice/
├── load-balancer-service/              # Core SOA Orchestrator (Port 8085)
│   ├── pom.xml
│   └── src/main/java/com/evcharging/loadbalancerservice/
├── notification-service/               # Alert Dispatcher (Port 8086)
│   ├── pom.xml
│   └── src/main/java/com/evcharging/notificationservice/
├── frontend/                           # React 18 SPA (Vite, Axios, Lucide Icons)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/Navbar.jsx
│       ├── pages/UserDashboard.jsx
│       ├── pages/FindStation.jsx
│       ├── pages/SmartCharging.jsx
│       ├── pages/ChargingSessionPage.jsx
│       ├── pages/ChargingHistory.jsx
│       ├── pages/AdminDashboard.jsx
│       └── pages/SoaArchitecture.jsx
├── run-all-backend-services.bat       # One-click Windows launcher for microservices
├── run-frontend.bat                    # One-click Windows launcher for React app
└── README.md                           # Documentation
```

---

## 🔑 Sample Login Credentials

| Role | Username | Password | Access Rights |
|---|---|---|---|
| **EV User** | `user` | `password123` | Dashboard, Smart Allocation, Active Session, History |
| **Grid Admin** | `admin` | `password123` | Admin Center, Grid Simulator, Add/Delete Stations, Live Monitor |

---

## 🌐 Microservice Ports & REST API Reference

### 1. Service Registry (`service-registry`)
- **Port:** `8761`
- **Dashboard:** `http://localhost:8761`

### 2. API Gateway (`api-gateway`)
- **Port:** `8080`
- Routes all request paths (`/users/**`, `/stations/**`, `/grid/**`, `/sessions/**`, `/load-balancer/**`, `/notifications/**`).

### 3. User Service (`user-service` - Port 8081)
- `POST /users/register` - Register new EV user/admin
- `POST /users/login` - Authenticate user & receive JWT token
- `GET /users/{id}` - Fetch profile details
- `GET /users/{userId}/vehicles` - Fetch user registered EVs

### 4. Station Service (`station-service` - Port 8082)
- `GET /stations` - List all EV stations
- `GET /stations/{id}` - Get station details and port statuses
- `POST /stations` - Create new charging station (Admin)
- `GET /stations/{id}/availability` - Check port availability
- `POST /stations/{id}/ports/{portId}/occupy` - Mark port occupied
- `POST /stations/{id}/ports/{portId}/release` - Release port

### 5. Grid Monitoring Service (`grid-service` - Port 8084)
- `GET /grid/status` - Overall grid network summary & average load %
- `GET /grid/zones` - List all grid zones
- `GET /grid/zones/{id}/load` - Get zone kW load & overload status
- `PUT /grid/zones/{id}/load` - Update grid zone load (kW)

### 6. Load Balancing Service (`load-balancer-service` - Port 8085)
- `POST /load-balancer/select-station` - Compute load scores and recommend station with lowest grid load
- `POST /load-balancer/allocate` - Confirm reservation, occupy port, increase grid load, create session, notify user
- `GET /load-balancer/recommendations` - Quick recommendation query

### 7. Charging Session Service (`charging-service` - Port 8083)
- `POST /sessions/start` - Initiate active charging session
- `POST /sessions/stop` - Complete charging session & release port
- `GET /sessions/user/{userId}` - Get user session history
- `GET /sessions/user/{userId}/active` - Get user active session

### 8. Notification Service (`notification-service` - Port 8086)
- `POST /notifications/send` - Send notification alert
- `GET /notifications/user/{userId}` - Retrieve user notifications

---

## ⚡ Demo Scenarios & Test Cases

### Scenario 1: Normal Smart Allocation
1. Log in as EV User (`user` / `password123`).
2. Navigate to **Smart Allocator** and request `25 kWh` charging.
3. System checks:
   - Station 1 (Vijayawada Central) → Grid Load: 42%
   - Station 2 (Benz Circle) → Grid Load: 64%
   - Station 3 (Gollapudi) → Grid Load: 36%
   - Station 4 (Auto Nagar) → Grid Load: 52%
   - Station 5 (Mangalagiri) → Grid Load: 35%
4. **Result:** System selects **Mangalagiri EV Station** (Score: `0.35`, lowest load score).
5. Click **Confirm Charging** -> Port reserved, session starts, notification dispatched.

### Scenario 2: Overload Bypass (&gt;90% Grid Load)
1. Log in as Grid Admin (`admin` / `password123`).
2. Go to **Admin Center** -> **Interactive Grid Zone Simulator**.
3. Click **Trigger Overload (&gt;90%)** on **Vijayawada Central (Zone 1)**. Zone load jumps to 94% (470 kW).
4. Switch to User view and request smart allocation.
5. **Result:** Load Balancer flags Grid Overload on Vijayawada Central, displays an alert warning, bypasses Station 1 automatically, and re-routes user to an alternative under-utilized station (e.g. Gollapudi or Mangalagiri).

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- **Java JDK 17+**
- **Node.js 18+** & `npm`
- **PostgreSQL 14+** (Optional: Services fall back automatically to embedded H2 database for instant execution if PostgreSQL is offline).

### Option A: One-Click Execution (Windows)
1. Double-click `run-all-backend-services.bat` to build and start all 8 microservices.
2. Double-click `run-frontend.bat` to launch the React frontend at `http://localhost:3000`.

### Option B: Manual Command Line Start
1. **Start Service Registry:**
   ```bash
   cd service-registry
   mvn spring-boot:run
   ```
2. **Start API Gateway:**
   ```bash
   cd api-gateway
   mvn spring-boot:run
   ```
3. **Start Microservices (in separate terminals):**
   ```bash
   cd user-service && mvn spring-boot:run
   cd station-service && mvn spring-boot:run
   cd charging-service && mvn spring-boot:run
   cd grid-service && mvn spring-boot:run
   cd load-balancer-service && mvn spring-boot:run
   cd notification-service && mvn spring-boot:run
   ```
4. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🔮 Future Enhancements
1. **Dynamic Tariff Surge Pricing:** Introduce real-time price multipliers during peak grid load hours.
2. **Machine Learning Load Forecasting:** Implement ARIMA or LSTM models to predict station traffic 2 hours in advance.
3. **IoT Smart Meter Integration:** Integrate MQTT telemetry protocol to stream high-frequency voltage and power sensor readings from physical EV chargers.
