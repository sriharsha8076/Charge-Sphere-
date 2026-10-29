# VIVA_QA.md — SOA Project Viva Voce Preparation
## 10 Likely Questions with Model Answers

---

### Q1. What is Service-Oriented Architecture (SOA) and how does your project demonstrate it?

**Model Answer:**  
SOA is an architectural style where software components are designed as interoperable, loosely coupled services that communicate via standardised interfaces. In my project, each concern (user management, station inventory, grid monitoring, session lifecycle, notifications, and orchestration) is an independent service with its own database, REST API, and deployment unit.

The **Load Balancer Service** acts as the SOA Orchestrator — it composes calls across 4 other services in one atomic workflow: reserving a port, updating grid load, creating a charging session, and dispatching a notification. None of these services know about each other — they only talk through REST APIs.

---

### Q2. Explain the Load Balancing algorithm. How is a station selected?

**Model Answer:**  
When an EV user requests charging, the Load Balancer:

1. Fetches all stations from the **Station Service** and all grid zones from the **Grid Service**.
2. For each station, computes: `loadScore = currentGridLoadKw / maxGridCapacityKw`
3. Filters: keeps only stations with `availablePorts > 0` AND `gridLoad < 90%` (not overloaded).
4. Sorts eligible stations by `loadScore` ascending — station in the least-loaded zone wins.
5. If all zones are overloaded but ports are available, it triggers an emergency **WARNING_OVERLOAD** fallback.
6. If no ports exist at all, it returns **NO_STATION_AVAILABLE**.

This is an application-level load balancing algorithm (domain-driven), which runs on top of the infrastructure-level round-robin balancing provided by Spring Cloud LoadBalancer.

---

### Q3. What is service discovery and how does Eureka implement it?

**Model Answer:**  
Service discovery allows services to find each other dynamically without hardcoded IP addresses or ports. Netflix Eureka implements this as a **client-side discovery registry**:

1. Each microservice (client) registers itself with the Eureka Server at startup, sending its hostname, port, service name, and health URL.
2. The Eureka Server stores this in a registry and accepts **heartbeats** every 30 seconds (5s in our optimised config) from each service.
3. When a caller needs to talk to `station-service`, it asks Eureka for the current list of `station-service` instances. The `@LoadBalanced RestTemplate` resolves `lb://station-service/stations` by querying the locally-cached Eureka registry.
4. If a service misses 3 heartbeats, Eureka removes it from the registry (eviction).

---

### Q4. What is a Circuit Breaker and where is it used in your project?

**Model Answer:**  
A Circuit Breaker is a resilience pattern that prevents cascading failures. It has three states:
- **CLOSED** (normal): all requests flow through.
- **OPEN** (failure detected): all requests are short-circuited to a fallback immediately, protecting the system.
- **HALF-OPEN** (recovery): a few probe requests are allowed; if they succeed, the breaker closes again.

In my project, **Resilience4j CircuitBreakers** are configured at two layers:
1. **API Gateway** (`api-gateway/application.yml`): a per-route circuit breaker for each of the 6 downstream services (user, station, grid, charging, load-balancer, notification). If a service is down, the gateway serves a fallback response from `FallbackController` instead of letting the request hang.
2. **Load Balancer Service**: circuit breakers named `station-client`, `grid-client`, `charging-client`, and `notification-client` protect each outgoing call within the orchestration.

---

### Q5. Why did you choose REST/HTTP over messaging systems like Kafka for inter-service communication?

**Model Answer:**  
For **synchronous workflows** like smart charging allocation, REST is the right choice because:
- The client (frontend) needs an immediate response with the selected station details.
- The orchestration is a **request/response** interaction — the user must get confirmation before plugging in.

However, I acknowledge this as a limitation. The notification dispatch is a **fire-and-forget** operation — the user doesn't need to wait for it. A better design would publish a `SessionStarted` event to a **Kafka topic** and have the Notification Service consume it asynchronously. This is documented in `DESIGN_ANALYSIS.md` as a future improvement.

---

### Q6. How does your API Gateway enforce security?

**Model Answer:**  
The gateway has an ordered filter chain:

1. **JwtAuthenticationFilter (Order -1)**: Validates `Authorization: Bearer <token>` on every request. Public routes (`/users/login`, `/users/register`, `/users/refresh`) bypass this. On valid token, it forwards `X-User-Id`, `X-User-Name`, `X-User-Role` headers downstream so services know who the caller is without re-validating the JWT.

2. **RateLimitFilter (Order 0)**: In-memory sliding window limiting each authenticated user (or IP) to 20 requests per second, returning HTTP 429 if exceeded.

3. **CircuitBreaker filters**: Per-route resilience with graceful fallback.

4. **GatewayLoggingFilter (Order 1)**: Structured audit log — method, path, status, duration in ms.

JWT tokens are signed with HMAC-SHA256. The secret is loaded from the `JWT_SECRET` environment variable.

---

### Q7. What is the difference between infrastructure load balancing and your application-level load balancing?

**Model Answer:**  
**Infrastructure-level** (Layer 4/7): Spring Cloud Gateway uses `lb://station-service` URIs, which Spring Cloud LoadBalancer resolves by fetching the list of `station-service` instances from Eureka and distributing requests using **round-robin**. This is stateless and protocol-agnostic.

**Application-level** (my domain algorithm): The `LoadBalancerService` performs a multi-step evaluation of station candidates using real grid telemetry — it fetches live load percentages from the Grid Service and ranks stations by how stressed their electrical zone is. This is a **domain-aware** algorithm that understands EV physics (90% grid threshold, 50 kW per fast charger).

Both layers run simultaneously — infrastructure LB distributes load across multiple station-service instances, while the application algorithm picks the best station for the EV user based on real-world grid constraints.

---

### Q8. What is the 90% overload threshold and why was that value chosen?

**Model Answer:**  
The 90% threshold represents the point at which a power grid zone is considered critically loaded. In electrical engineering, operating at >90% capacity significantly increases the risk of:
- Transformer overload and potential failure
- Voltage sag affecting other consumers in the zone
- Cascading failures in adjacent zones

By flagging zones at ≥90% as `OVERLOADED`, the algorithm proactively reroutes EV charging demand away from stressed zones before a failure occurs. The threshold is configurable in the `GridZone.updateStatusBasedOnLoad()` method and could be adjusted per zone based on the transformer's actual rated capacity.

The system also has a `HIGH_LOAD` status at 70–90%, serving as an early warning without blocking allocation.

---

### Q9. How would you scale this system if 10,000 EVs tried to charge simultaneously in Vijayawada?

**Model Answer:**  
Current single-instance setup cannot handle 10,000 concurrent users. Scaling strategy:

1. **Horizontal scaling of stateless services**: Station, Grid, Charging, and Notification services are stateless — run 5–10 instances of each behind Eureka round-robin.

2. **Scale the Load Balancer Orchestrator**: It's stateless (no DB) — run multiple instances. Eureka + API Gateway will distribute orchestration requests across them.

3. **Redis for shared state**: Move the in-memory rate limiter and JWT blacklist to Redis so all gateway instances share the same state.

4. **Database read replicas**: Add PostgreSQL read replicas for the Station and Grid services to handle read-heavy queries.

5. **Async notifications via Kafka**: Decouple notifications so the orchestration flow doesn't wait for them.

6. **Kubernetes HPA**: Automatically scale each service based on CPU/memory metrics with a Horizontal Pod Autoscaler.

---

### Q10. What would you do differently if you were rebuilding this project?

**Model Answer:**  
Three key improvements:

1. **Async-first**: Use Spring WebFlux (reactive) throughout instead of blocking servlet + RestTemplate. The orchestrator's 4 sequential calls could run in parallel with `Mono.zip()` / `CompletableFuture.allOf()`, cutting latency by 60–70%.

2. **Saga pattern for distributed consistency**: Currently, if the ChargingSession creation fails after port occupation, the port stays occupied and the grid load is inflated. A **Saga** with compensating transactions would automatically release the port and subtract the grid load.

3. **Event-driven architecture**: Replace synchronous notification dispatch with a Kafka event (`ChargingSessionStarted`). This decouples the notification subsystem entirely, allowing multiple consumers (email, SMS, push) without changing the orchestrator code.

These improvements are already documented in `DESIGN_ANALYSIS.md` as the future roadmap.
