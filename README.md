# 🚀 Enterprise Best-Practice Backend Architecture with API Gateway

A production-grade, highly scalable Node.js & Express backend architecture fully aligned with the **Industry Standard Best-Practice Backend Architecture with API Gateway** specification.

Featuring **API Gateway Perimeter**, **WAF / Firewall**, **Service Discovery**, **Dynamic Load Balancing**, **Distributed Caching (Redis)**, **Asynchronous Messaging Event Bus (AMQP/Kafka style)**, **Prometheus Observability**, **Circuit Breaker Resilience**, and **Multi-Tenancy with BFF (Backend-for-Frontend)**.

---

## 🏛️ System Architecture Alignment Map

```
                    ┌────────────────────────────────────────────────────────┐
                    │               CLIENT APPLICATIONS                      │
                    │   📱 Mobile  │  💻 Web Portal  │  📡 IoT / Admin API   │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                    ┌───────────▼────────────┐
                                    │     FIREWALL / WAF     │
                                    │ (SQLi, XSS, Scanners)  │
                                    └───────────┬────────────┘
                                                │
                    ┌───────────────────────────▼────────────────────────────┐  ◄───► ┌─────────────────────────┐
                    │                   API GATEWAY LAYER                    │        │ CROSS-CUTTING SERVICES  │
                    │  (/api/gateway)                                        │        │                         │
                    │                                                        │        │ 🔐 Identity Provider    │
                    │  1. Authentication & Authorization (OAuth2/JWT)        │        │    (Dual Token Rotation)│
                    │  2. Dynamic Rate Limiting (Sliding-Window Per-Tenant)  │        │ 🛰️ Service Discovery    │
                    │  3. Request Routing (Services & BFF Aggregators)       │        │    (Microservice Reg)   │
                    │  4. Dynamic Load Balancing (Round-Robin / Weights)     │        │ 📊 Observability        │
                    │  5. Distributed Tracing (x-correlation-id)             │        │    (Prometheus/Grafana) │
                    └───────────────────────────┬────────────────────────────┘  ◄───► └─────────────────────────┘
                                                │
                    ┌───────────────────────────▼────────────────────────────┐
                    │                   MICROSERVICES TIER                   │
                    │                                                        │
                    │   [ User Service ]          [ Coin / Wallet Service ]  │
                    │   [ Feedback Service ]      [ Tenant Governance ]      │
                    │   [ Mobile & Web BFFs ]     [ Socket.IO Real-Time ]    │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                    ┌───────────────────────────▼────────────────────────────┐
                    │     INTERNAL MESSAGING & SERVICE MESH (AMQP/Kafka)     │
                    │  Asynchronous Event Bus • Pub/Sub • Dead-Letter Queue  │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                    ┌───────────────────────────▼────────────────────────────┐
                    │               DATA & DISTRIBUTED CACHE LAYER           │
                    │                                                        │
                    │   🍃 MongoDB Atlas          ⚡ Redis / Cache Engine    │
                    │   (Tenant Partitioned)      (Sub-ms BFF Cache Hits)    │
                    └────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Architectural Components (Image Alignment)

### 1. Ingress Firewall / WAF
- **File:** `src/gateway/middlewares/waf.js`
- Deep inspection of query parameters, headers, and request bodies.
- Blocks SQL injection (`UNION SELECT`, `OR 1=1`), Path Traversal (`../`), and Automated Vulnerability Scanners (`sqlmap`, `nikto`).
- Sets `X-WAF-Protection: Active` and `X-WAF-Status: PASS`.

### 2. Service Discovery & Registry
- **File:** `src/gateway/discovery/serviceRegistry.js`
- Endpoint: `GET /api/gateway/discovery`
- Dynamic registration and discovery of microservices (`auth-service`, `coin-service`, `feedback-service`, `tenant-service`).
- Periodic heartbeat monitoring and automated instance health evaluation.

### 3. Gateway Load Balancing
- **File:** `src/gateway/loadbalancer/loadBalancer.js`
- Endpoint: `GET /api/gateway/loadbalancer/status`
- Dynamic load distribution strategies: `round-robin`, `least-connections`, and `random`.
- Automatically skips `DOWN` instances discovered via the Service Registry.

### 4. Distributed Caching Layer (Redis Cache)
- **File:** `src/config/cache.js`
- Endpoint: `GET /api/gateway/cache/stats`
- High-throughput distributed caching layer with automated Redis integration and sub-millisecond in-memory cache engine fallback.
- Caches BFF Mobile and Web aggregated payloads, cutting response latency from 10ms to <1ms on cache hits (`X-Cache: HIT`).

### 5. Lightweight Messaging / Internal Event Bus (AMQP / Message Queue / Kafka)
- **File:** `src/gateway/messaging/eventBus.js`
- Decoupled asynchronous event broker with Pub/Sub and Dead-Letter Queue (DLQ).
- Publishes events like `coin.earned`, `coin.redeemed`, `feedback.created`, and `circuit.state_change`.

### 6. Monitoring & Observability (Prometheus & Grafana)
- **File:** `src/gateway/monitoring/metrics.js`
- Endpoints:
  - `GET /api/gateway/metrics` — Standard Prometheus exposition format.
  - `GET /api/gateway/metrics/json` — Observability telemetry JSON.
- Exposes metrics for request counts, duration histograms, circuit breaker states, heap memory, and cache hit rates.

---

## 🚀 Running Tests

```bash
# 1. Run all 38 System, Gateway, WAF & Observability Tests:
npm run test:all

# 2. Run specifically the Gateway & Best-Practice Architecture Suite:
npm run test:gateway
```
