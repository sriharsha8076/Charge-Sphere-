# DESIGN_ANALYSIS.md — EV Charging SOA Platform
## Analytical Insights, Trade-offs & Future Improvements

---

## 1. Why Microservices Architecture?

### Problem
A monolithic EV charging management system would bundle user auth, station inventory, grid monitoring, session management, and notifications in one deployable unit. Any change (e.g., adding a new tariff calculation) requires redeploying the entire application, creating downtime and risk.

### Decision
A **microservices architecture** decomposes the system into 7 independently deployable services, each owning its own database schema and exposing a formal REST API.

### Trade-offs

| Benefit | Cost |
|---------|------|
| Independent deployment & scaling | Network latency between services |
| Fault isolation (one service crash ≠ system down) | Distributed consistency complexity |
| Technology heterogeneity possible | More DevOps overhead (8 JVMs vs 1) |
| Fine-grained scalability (scale charging service alone) | Service discovery and coordination required |

### Evidence in Code
- Each service has its own `pom.xml`, `application.yml`, and schema tables
- No service reads another service's database table directly (bounded context isolation)

---

## 2. Why Netflix Eureka for Service Discovery?

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Eureka (chosen)** | Native Spring Cloud integration, zero-config with `@EnableDiscoveryClient`, AP (always available) | Java-specific ecosystem, single-language client |
| **HashiCorp Consul** | Language-agnostic, DNS-based discovery, KV store | Separate Go binary to manage, more complex setup |
| **Apache Zookeeper** | Strong consistency (CP), battle-tested in Kafka | Complex cluster management, overkill for this scale |
| **Kubernetes DNS** | Production-grade, no extra component needed | Requires K8s environment (not available locally) |

### Why Eureka Wins for This Project
- All services are Spring Boot → `spring-cloud-starter-netflix-eureka-client` is a single dependency
- **AP semantics** (Available + Partition-tolerant) suit EV charging: we'd rather serve a slightly stale station list than return an error
- Self-preservation mode protects against network partition during Eureka's 90s eviction window

### Eureka Optimized Settings (applied in `load-balancer-service/application.yml`)
```yaml
eureka:
  client:
    registry-fetch-interval-seconds: 5   # Refresh client cache every 5s (default: 30s)
  instance:
    lease-renewal-interval-in-seconds: 5  # Heartbeat every 5s (default: 30s)
    lease-expiration-duration-in-seconds: 15  # Evict if no heartbeat for 15s (default: 90s)
```
These settings reduce instance failure detection time from ~90s to ~15s.

---

## 3. Why Client-Side Load Balancing?

### Architecture Decision
Spring Cloud Gateway uses `lb://station-service` URIs, and the `@LoadBalanced RestTemplate` in `load-balancer-service` uses the same. This is **client-side load balancing** (the caller resolves instances from Eureka and picks one), as opposed to server-side (a dedicated load balancer like HAProxy does the pick).

### Trade-offs

| Client-Side LB (chosen) | Server-Side LB |
|--------------------------|----------------|
| No single point of failure | Central LB is a SPOF |
| Eureka instance list cached locally — works even if Eureka briefly goes down | Must route through LB every time |
| Default algorithm: round-robin | More sophisticated algorithms (least-connections, weighted) |
| Service instances must all register with Eureka | Works with any backend regardless of registry |

### Proving It Works
Start two station-service instances:
```bash
# Terminal 1
cd station-service && mvn spring-boot:run -Dserver.port=8082
# Terminal 2
cd station-service && mvn spring-boot:run -Dserver.port=8092
```
Both appear in Eureka dashboard at `http://localhost:8761`. Make 6 rapid calls to `GET /stations`; gateway logs will show alternating upstream ports: `8082 → 8092 → 8082 → 8092 → ...`

---

## 4. The Scoring Algorithm — Design & Trade-offs

### Formula
```
score = currentGridLoadKw / maxGridCapacityKw
```
A score of `0.0` = fully idle zone; `1.0` = fully loaded.  
Stations in zones with `score ≥ 0.90` are classified as `OVERLOADED` and **excluded** from eligible candidates.

### Selection Logic
```
eligible = stations
  .filter(s → s.availablePorts > 0 AND NOT s.isOverloadedZone)
  .sortedBy(s → s.loadScore ASC)     ← ascending = lowest load first

if (eligible is empty AND a port-available station exists):
    → WARNING_OVERLOAD fallback (emergency allocation)

if (no port available anywhere):
    → NO_STATION_AVAILABLE
```

### Algorithm Trade-offs

| Factor | Current | Improvement |
|--------|---------|-------------|
| **Criteria** | Grid load only | Multi-criteria: weight grid load (60%) + port availability (20%) + price (20%) |
| **Data freshness** | Live REST call every request | Cache grid data in Redis with 5s TTL — reduces latency under load |
| **Fairness** | Pure minimum load → same station always wins when idle | Add a small randomized tiebreaker for stations with nearly equal scores |
| **User preference** | Ignores user location | Incorporate haversine distance if latitude/longitude in request |

### Current Weakness
If all 5 stations happen to be in Zone 1 and Zone 1 is overloaded, the algorithm falls back to emergency allocation rather than rejecting the request cleanly. A more sophisticated system would consider station-level load in addition to zone-level load.

---

## 5. Performance Bottlenecks

### Identified Bottlenecks

1. **Synchronous orchestration in `LoadBalancerService.confirmAndAllocate()`**  
   The method calls Station → Grid → ChargingSession → Notification **sequentially**. Each call adds latency.  
   - **Impact**: If each downstream call takes 200ms, total time = ~800ms minimum.  
   - **Fix**: Parallelize independent calls using `CompletableFuture`:
     ```java
     CompletableFuture<Void> portFuture   = CompletableFuture.runAsync(() -> occupyPort(...));
     CompletableFuture<Void> gridFuture   = CompletableFuture.runAsync(() -> addGridLoad(...));
     CompletableFuture.allOf(portFuture, gridFuture).join();
     // Then start session and notify
     ```

2. **In-memory Rate Limiter in API Gateway**  
   The `RateLimitFilter` uses `ConcurrentHashMap` — works for a single gateway instance.  
   - **Fix**: Redis-backed `RequestRateLimiter` filter using Spring Cloud Gateway + Spring Data Redis.

3. **RestTemplate is blocking**  
   The `LoadBalancerService` uses a blocking `RestTemplate` in a Spring MVC (servlet) thread.  
   - **Fix**: Migrate to `WebClient` (non-blocking) to improve throughput under high concurrency.

4. **JWT blacklist is in-memory**  
   On service restart, all logged-out tokens become valid again.  
   - **Fix**: Store blacklisted tokens in Redis with TTL equal to the token's remaining lifetime.

---

## 6. Limitations

| Limitation | Impact | Resolution |
|------------|--------|------------|
| Single Eureka instance | SPOF for service discovery | Eureka peer replication (2-node cluster) |
| In-memory blacklist | Token invalidation lost on restart | Redis blacklist with TTL |
| Synchronous notification | Adds latency to every allocation | Kafka topic for async notification dispatch |
| No distributed transaction | Port occupied but session creation fails → inconsistent state | Saga pattern with compensating transactions |
| No HTTPS/TLS | Traffic sniffable in network | Add SSL termination at gateway |
| Hard-coded 50 kW per charger | Inaccurate for DC fast chargers (150–350 kW) | Dynamic kW from port type in Station Service |

---

## 7. Future Improvements

### Short Term (< 1 month)
- [ ] **Springdoc OpenAPI**: Add `springdoc-openapi-starter-webmvc-ui` to each service → live Swagger UI at `/swagger-ui.html`
- [ ] **Multi-factor scoring**: Weight grid load + price + port availability
- [ ] **RestTemplate → WebClient**: Non-blocking I/O in load-balancer-service
- [ ] **Retry + Timeout**: Resilience4j `@Retry` and `TimeLimiter` annotations on `LoadBalancerService` methods

### Medium Term (1–3 months)
- [ ] **Apache Kafka for Notifications**: Replace synchronous `POST /notifications/send` with a Kafka producer in load-balancer-service and a Kafka consumer in notification-service
- [ ] **Redis Cache**: Cache `/grid/zones` response for 5 seconds → reduces grid-service load by 95% under concurrent smart-allocate traffic
- [ ] **Redis Rate Limiter**: Replace in-memory `RateLimitFilter` with the Spring Cloud Gateway built-in `RequestRateLimiter` backed by Redis
- [ ] **Distributed Tracing**: Integrate Spring Cloud Sleuth + Zipkin → visualise cross-service request chains

### Long Term (3–6 months)
- [ ] **Kubernetes Deployment**: Replace `docker-compose.yml` with Helm charts; use K8s HPA (Horizontal Pod Autoscaler) to scale station-service based on CPU/request rate
- [ ] **Saga Pattern**: Implement compensation logic — if session creation fails, automatically release the reserved port and remove the added grid load
- [ ] **GraphQL API**: Replace REST for the frontend queries (station list + grid status combined in one request)
- [ ] **Real-time WebSocket**: Push grid load updates and session status to the frontend in real time using Spring WebSocket (STOMP)

---

## 8. CAP Theorem Analysis

This system operates across multiple distributed services sharing a PostgreSQL database:

| Partition Scenario | System Behaviour |
|---------------------|------------------|
| **Eureka partition** (Eureka goes down) | Services use cached instance list (AP: Available + stale) |
| **PostgreSQL partition** (DB goes down) | Services return 503 (not AP; data integrity prioritised) |
| **Station-service partition** | LoadBalancer returns NO_STATION_AVAILABLE (graceful degradation) |
| **Grid-service partition** | LoadBalancer uses default grid load of 200kW/500kW (fallback in code) |

**Overall**: The system is designed to be **AP** for service discovery (Eureka) and **CP** for data persistence (PostgreSQL ACID transactions).

---

## 9. SOA Compliance Matrix

| SOA Principle | Implementation | Evidence |
|---------------|---------------|---------|
| Loose Coupling | Independent DB schemas, REST-only inter-service communication | Each service has its own tables; no shared JPA entities |
| Service Abstraction | API Gateway hides internal topology from frontend | Frontend calls `localhost:8080`, never knows about ports 8081–8086 |
| Reusability | Station and Grid services are standalone APIs | Callable independently by any HTTP client |
| Composability | Load Balancer orchestrates 4 services atomically | `confirmAndAllocate()` in `LoadBalancerService.java` |
| Autonomy | Each service has its own pom.xml, application.yml, and JAR | 8 independent deployable units |
| Statelessness | JWT auth; no server-side session state in gateway | Gateway is stateless; `@LoadBalanced` RestTemplate is stateless |
| Discoverability | Eureka dashboard; Actuator `/health` endpoints | `http://localhost:8761` shows all registered instances |
| Formal Contract | Typed JSON REST APIs with standard HTTP codes | REST API Reference in README.md |
