# Production-Ready Zero Trust Microservices Backend Architecture 🛡️🚀

This repository contains the complete Infrastructure-as-Code (IaC) and containerized implementation of a highly secure, enterprise-grade microservices backend ecosystem.

---

## 🏛️ System Architecture Overview

```
                        [ Inbound Web / Mobile Traffic ]
                                       │
                                       ▼ (Port 80 / 443)
                      ┌──────────────────────────────────┐
                      │    API Gateway (Nginx Reverse    │
                      │    Proxy & Rate Limiting Zone)   │
                      └────────────────┬─────────────────┘
                                       │
        ══════════════════════ PRIVATE SUBNET VPC ══════════════════════
               │                       │                       │
               ▼                       ▼                       ▼
      ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
      │ Server 1 (Core) │     │Server 2 (Resrv) │     │Server 3(Payment)│
      │   Port 8001     │     │   Port 8002     │     │   Port 8003     │
      └────────┬────────┘     └─────────────────┘     └────────┬────────┘
               │                                               │
               ├──────────────────┐                            ▼
               ▼                  ▼                   ┌─────────────────┐
      ┌─────────────────┐ ┌───────────────┐           │   payment_db    │
      │     core_db     │ │  Redis Queue  │           │ (PostgreSQL 16) │
      │ (PostgreSQL 16) │ │  (Port 6379)  │           └─────────────────┘
      └─────────────────┘ └───────┬───────┘
                                  │
                                  ▼
                         ┌─────────────────┐          ┌─────────────────┐
                         │ Server 5 (AI)   │          │Server 4 (Resrv) │
                         │   Port 8005     │          │   Port 8004     │
                         └─────────────────┘          └─────────────────┘
        ════════════════════════════════════════════════════════════════
```

---

## 🔒 Zero Trust Network & Security Enforcements

1. **Strict Ingress Isolation:**
   - ONLY the **API Gateway** exposes public host ports (`80` / `443`).
   - None of the 5 backend servers, neither PostgreSQL database, nor Redis expose any public host ports.
   - All backend microservices reside in `private_backend_net`.
2. **Rate Limiting Zones:**
   - **General APIs (`/api/v1/core/`, `/api/v1/ai/`):** 30 requests/second per IP.
   - **Payment APIs (`/api/v1/payments/`):** Strict 5 requests/minute per IP to prevent card testing and brute force attacks.
3. **Hardened Containers:**
   - Every microservice runs as an unprivileged non-root user (`appuser:1000`).
   - Strict health checks configured on all Docker containers.
4. **Payment Integrity (ACID Ledger & Webhook Verification):**
   - Double-entry immutable financial ledger (`customer_accounts`, `financial_ledger`).
   - Payment webhooks verified via HMAC-SHA256 signature matching.

---

## 🧩 Microservice Roster

| Service | Container Name | Port (Private) | Purpose |
| :--- | :--- | :--- | :--- |
| **Gateway** | `api_gateway` | 80 / 443 | Entry point, SSL termination, rate limiting, routing |
| **Server 1** | `server1_core` | 8001 | Core business logic, user auth, dispatches jobs to Redis |
| **Server 2** | `server2_reserved`| 8002 | Reserved for Auth & Notifications (Horizontal Scaling) |
| **Server 3** | `server3_payment` | 8003 | Dedicated Payment Service, ACID Ledger, HMAC Webhooks |
| **Server 4** | `server4_reserved`| 8004 | Reserved for Analytics, Event Logging & Aggregation |
| **Server 5** | `server5_ai` | 8005 | AI Automation Worker, LLM pipeline orchestration |
| **Queue** | `redis_queue` | 6379 | In-memory message broker between Server 1 and Server 5 |
| **Core DB** | `core_db` | 5432 | PostgreSQL 16 for core application tables |
| **Payment DB**| `payment_db` | 5432 | Dedicated PostgreSQL 16 for financial ledger |
| **Prometheus**| `prometheus_monitoring` | 9090 | Metrics collection & time-series scraping |
| **Grafana** | `grafana_dashboards` | 3000 | Observability & metrics visualization |

---

## 🚀 Quick Start Deployment

To deploy the entire stack with a single turnkey command:

```bash
cd "/home/monkey/Downloads/General /backend_infrastructure"
./deploy.sh
```

Or manually using Docker Compose:

```bash
docker compose up -d --build
```

---

## 📡 Gateway Routing Table

| Path Pattern | Target Upstream | Description |
| :--- | :--- | :--- |
| `/health` | API Gateway | Ingress gateway status |
| `/api/v1/core/*` | `server1_core:8001` | Core application APIs & job dispatching |
| `/api/v1/reserved-auth/*` | `server2_reserved:8002` | Standby Auth / Notification microservice |
| `/api/v1/payments/*` | `server3_payment:8003` | Charges, ACID ledger, invoices, HMAC webhooks |
| `/api/v1/reserved-analytics/*` | `server4_reserved:8004` | Standby Analytics / Logging microservice |
| `/api/v1/ai/*` | `server5_ai:8005` | AI Automation results & task status |

---

## 🧪 Testing Ingress Endpoints (Examples)

### 1. Gateway Health Check
```bash
curl -i http://localhost/health
```

### 2. Dispatch Heavy Task from Server 1 to Server 5 (via Redis Queue)
```bash
curl -X POST http://localhost/api/v1/core/dispatch-task \
  -H "Content-Type: application/json" \
  -d '{"task_type": "ai_synthesis", "payload": {"query": "Analyze market trends"}}'
```

### 3. Check Task Status on Server 5
```bash
curl -i http://localhost/api/v1/ai/tasks/<TASK_ID>
```

### 4. Process Payment with ACID Ledger on Server 3
```bash
curl -X POST http://localhost/api/v1/payments/charge \
  -H "Content-Type: application/json" \
  -d '{"account_id": "00000000-0000-0000-0000-000000000001", "amount_cents": 4999, "currency": "USD", "description": "Enterprise Subscription"}'
```
