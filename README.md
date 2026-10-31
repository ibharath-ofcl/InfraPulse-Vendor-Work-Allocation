# InfraPulse AI — Intelligent Infrastructure Lifecycle, Vendor Coordination & Quality Assurance Platform

[![Release: v1.0.0](https://img.shields.io/badge/Release-v1.0.0%20GA-brightgreen)](docs/RELEASE_NOTES_v1.0.0.md)
[![Stage 15: Final Production Release & Deployment](https://img.shields.io/badge/Stage%2015-Final%20Release%20%26%20Handover%20Complete-brightgreen)](docs/FINAL_RELEASE_REPORT.md)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20PostGIS%203.4-blue)](https://postgis.net/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-yellow)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-teal)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Gov-lightgrey)]()

InfraPulse AI is an enterprise infrastructure lifecycle coordination and vendor quality assurance platform engineered for municipal corporations, public works departments, and utility operators. It solves the costly problem of uncoordinated contractors causing premature infrastructure damage across shared geographic corridors.

The platform provides centralized postal PIN-code-based work allocation, strictly enforces sequential work dependencies using Directed Acyclic Graphs (DAG), verifies contractor field evidence using computer vision, gates commercial milestone disbursements behind verified ground quality, and guarantees tamper-evident compliance via an append-only cryptographic audit trail.

---

## 1. Problem Statement & Proposed Solution

### The Urban Infrastructure Crisis
In modern metropolitan areas, telecommunications providers, gas distribution utilities, water authorities, and municipal transport agencies operate independently within the same physical corridors. A newly resurfaced road is frequently excavated within weeks by a telecom contractor laying optical fiber, resulting in billions in taxpayer losses, traffic congestion, and degraded urban quality of life.

### The InfraPulse AI Solution
1. **PIN-Code Spatial Work Allocation**: Maps project works into defined geospatial polygon zones (`Polygon, 4326`) mapped to postal PIN codes.
2. **Deterministic DAG Conflict Prevention**: A hard scheduling engine prevents destructive scheduling (e.g., road resurfacing permits are physically blocked until underground trenching and ducting is completed, inspected, and approved).
3. **AI Vision Evidence Verification**: Field contractors submit geo-tagged photographs; computer vision analyzes excavation depth, trench width, and conduit placement.
4. **Authoritative Human Quality Gate**: Quality inspectors verify physical ground measurements and AI findings; unverified work cannot unlock downstream permits.
5. **Quality-Gated Milestone Disbursements**: Multi-point invoice verification automatically validates completed work before releasing digital payment authorization certificates (`PAY-xxxx`, `AUTH-SIM-xxxx`).
6. **Cryptographic SHA-256 Audit Trail**: An append-only blockchain-style hash chain guarantees that inspection records and financial approvals cannot be altered or deleted.

---

## 2. System Architecture & Topology

InfraPulse AI is structured as a **modular monolith backend** with an independent **computer vision inference engine**, an optimized **React SPA**, and a **PostgreSQL 16 + PostGIS 3.4** database.

```
                      +---------------------------------------+
                      |       Client Web Browser (SPA)        |
                      |   React 18 / TypeScript / Vite        |
                      +-------------------+-------------------+
                                          |
                        HTTPS (443) / HTTP (80)
                                          |
                                          v
+---------------------------------------------------------------------------------+
|                       Hardened Nginx Reverse Proxy                              |
|  - Enterprise Security Headers (CSP, HSTS, X-Frame-Options: DENY, nosniff)       |
|  - Rate Limiting Zone: 30 req/sec per IP with burst buffer                      |
|  - Gzip Compression & Static Asset Caching                                      |
+-------------------+-----------------------------+-------------------------------+
                    |                             |
      Internal Proxy (`/api/`)       Internal Proxy (`/ai/`)
                    |                             |
                    v                             v
+------------------------------------+  +-----------------------------------------+
|     Spring Boot 3.3.5 Backend      |  |       AI Vision Service (FastAPI)       |
|  - Java 21 LTS / Spring Security   |  |  - Python 3.11 / OpenCV / Pillow        |
|  - 7-Role RBAC & Multi-Tenant IDOR |  |  - Trench Contour Analysis              |
|  - DAG Dependency Conflict Engine  |<--->  Defect Classification & Depth         |
|  - Financial Milestone Engine      |  |  - Non-root user `infrapulse`           |
|  - SHA-256 Cryptographic Audit     |  +-----------------------------------------+
+-------------------+----------------+
                    |
      JDBC / TLS 1.3 / Prepared Statements
                    |
                    v
+---------------------------------------------------------------------------------+
|                        PostgreSQL 16 + PostGIS 3.4                              |
|  - PostGIS Spatial Polygon Zones & PIN Code Geometries                          |
|  - Flyway Versioned Migrations (`flyway_schema_history`)                        |
|  - Append-Only Hash-Chained Audit Trail Tables                                  |
|  - Persistent Volumes: `postgres_prod_data`, `evidence_prod_data`               |
+---------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

| Service | Technology | Key Libraries / Features |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | TypeScript 5.6, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts |
| **Backend** | Spring Boot 3.3.5 (Java 21) | Spring Web, Spring Data JPA, Spring Security (JWT), Flyway, HikariCP |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Geospatial indexing (`GIST`), boundary polygons, spatial distance queries |
| **AI Service** | FastAPI (Python 3.11+) | Uvicorn, OpenCV Headless, Pillow, Pydantic v2, Pytest |
| **Ingress** | Nginx 1.27 Alpine | HTTP security headers, rate limiting, gzip, SPA fallback |
| **Orchestration**| Docker & Docker Compose | Multi-stage Dockerfiles, private networking, resource limits |

---

## 4. Role-Based Access Control (RBAC) Matrix

The system enforces strict method-level access control across 7 distinct personas:

| Role Identifier | Description & Authority |
| :--- | :--- |
| **`PLATFORM_ADMIN`** | Complete system administration, user provisioning, master project registry, audit verification. |
| **`WARD_OFFICER`** | Municipal jurisdiction authority: defines work zones, creates work allocations, reviews DAG dependencies. |
| **`FIELD_ENGINEER`** | On-site ground coordination, ground measurement capture, vendor progress tracking. |
| **`QUALITY_INSPECTOR`** | Authoritative quality auditor: reviews AI vision findings, inspects evidence, issues approval/rework. |
| **`FINANCE_OFFICER`** | Financial governance: reviews verified milestone claims, authorizes simulated disbursements. |
| **`VENDOR_REPRESENTATIVE`** | Commercial contractor: views assigned jobs, uploads photographic evidence. Multi-tenant isolated. |
| **`AUDITOR`** | Read-only compliance auditor: inspects logs, views analytics, executes cryptographic audit verification. |

---

## 5. Quickstart & Local Installation

### Prerequisites
- **Docker Engine** 24.0+ and **Docker Compose** v2.20+
- Alternatively for individual development: Node.js 20+, JDK 21 LTS, Python 3.11+, and PostgreSQL 16 with PostGIS.

### Option A: Production Orchestration (Docker Compose)
```bash
# 1. Clone the repository
git clone https://github.com/ibharath-ofcl/InfraPulse-Vendor-Work-Allocation.git
cd InfraPulse-Vendor-Work-Allocation

# 2. Configure environment
cp .env.example .env

# 3. Launch production containers
docker compose -f docker-compose.prod.yml up -d

# 4. Verify service health
docker compose -f docker-compose.prod.yml ps
```
Access the application web UI at: **`http://localhost`**

---

### Option B: Local Development Execution

#### 1. Database (PostgreSQL with PostGIS)
```bash
docker compose up -d postgres
```

#### 2. Backend API (Spring Boot 3.3 & Java 21)
```bash
cd backend
mvn clean test
mvn spring-boot:run
```
*Health endpoint:* `curl http://localhost:8080/api/health`

#### 3. AI Vision Service (Python FastAPI)
```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health endpoint:* `curl http://localhost:8000/health`

#### 4. Frontend Web UI (React + Vite)
```bash
cd frontend
npm install
npm test
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 6. Automated Testing Suite & Performance

The platform enforces a 100% pass rate across all three architectural tiers:

```
========================================================================================
                          INFRAPULSE AI AUTOMATED TEST SUITE MATRIX
========================================================================================
 Tier / Test Suite                      Files   Total   Passed   Failed  Skipped  Pass Rate
----------------------------------------------------------------------------------------
 Frontend Vitest Unit & Component           8      68       68        0        0    100.0%
 AI Vision Service Pytest Suite             3      18       18        0        0    100.0%
 Backend Critical E2E Workflows             1       3        3        0        0    100.0%
 Backend Security & IDOR Vulnerabilities    1      19       19        0        0    100.0%
 Backend Financial & Audit Integrity        1       8        8        0        0    100.0%
 Backend Realistic Performance Benchmark    1       4        4        0        0    100.0%
 Backend Finance Business Workflow          1       8        8        0        0    100.0%
----------------------------------------------------------------------------------------
 TOTAL PLATFORM AUTOMATED SUITE            16     128      128        0        0    100.0%
========================================================================================
```

### Real Measured Performance Benchmarks
- **Median Latency (P50)**: 3.42 ms – 5.46 ms across core endpoints.
- **95th Percentile Latency (P95)**: 5.58 ms – 9.24 ms (**Sub-10ms performance**).
- **Average Throughput**: 167.5 – 234.5 requests/second.
- **Platform Error Rate**: 0.00% under burst load.

---

## 7. Interactive Technical Demonstration

A reproducible walkthrough scenario is documented in [`docs/FINAL_DEMO_GUIDE.md`](docs/FINAL_DEMO_GUIDE.md):
- **Scenario**: *Chennai Fiber Infrastructure Expansion* (PIN Zone: 600001).
- **Core Workflow**: Work zone creation -> Trenching allocation to Vendor 1 -> Scheduling conflict blocking road resurfacing by Vendor 2 -> Photo evidence submission -> AI vision defect analysis -> Quality inspector ground verification -> Automatic DAG unblocking of resurfacing permit -> Milestone invoice verification -> Digital payment voucher issuance -> SHA-256 cryptographic audit chain verification -> 10-KPI vendor analytics export.

---

## 8. Complete Documentation Suite Index

| Category | Document Name & Description |
| :--- | :--- |
| **Specifications** | [Project Overview & Demonstration Scenario](docs/PROJECT_OVERVIEW.md) |
| **Architecture** | [System Architecture & Technology Choices](docs/ARCHITECTURE.md) |
| **Database** | [Database Schema & PostGIS Strategy](docs/DATABASE_DESIGN.md) |
| **Database Ops** | [Production Database Guide (Least-Privilege & Migrations)](docs/PRODUCTION_DATABASE_GUIDE.md) |
| **API Standards** | [API Conventions & Error Standards](docs/API_CONVENTIONS.md) |
| **Roadmap** | [15-Stage Development Roadmap (100% Completed)](docs/DEVELOPMENT_ROADMAP.md) |
| **Human Review** | [Human Review & Corrective Action Workflow](docs/HUMAN_REVIEW_WORKFLOW.md) |
| **Audit & Analytics** | [Enterprise Audit Trail & Vendor Performance Analytics](docs/AUDIT_AND_ANALYTICS.md) |
| **Testing** | [Multi-Layered Testing Strategy](docs/TESTING_STRATEGY.md) |
| **Test Results** | [Stage 14 Test Execution & Quality Report](docs/STAGE_14_TEST_REPORT.md) |
| **Security** | [Security Assessment & Hardening Report](docs/SECURITY_ASSESSMENT.md) |
| **Threat Model** | [System Threat Model (STRIDE Methodology)](docs/THREAT_MODEL.md) |
| **Deployment** | [Production Deployment Architecture](docs/DEPLOYMENT_ARCHITECTURE.md) |
| **Disaster Recovery**| [Backup & Disaster Recovery Runbook](docs/BACKUP_AND_DISASTER_RECOVERY.md) |
| **Operations** | [Production Monitoring & Operations Guide](docs/MONITORING_AND_OPERATIONS.md) |
| **Release Notes** | [Official Release Notes (v1.0.0 GA)](docs/RELEASE_NOTES_v1.0.0.md) |
| **Demo Guide** | [Final Technical Demonstration Walkthrough](docs/FINAL_DEMO_GUIDE.md) |
| **Handover** | [Final Release Report & Project Handover](docs/FINAL_RELEASE_REPORT.md) |

---

## 9. Official Repository & Release Status

- **Official GitHub Repository**: `https://github.com/ibharath-ofcl/InfraPulse-Vendor-Work-Allocation.git`
- **Active Branch**: `main`
- **Release Version**: `v1.0.0`
- **Current Stage**: `Stage 15 — Final Production Release, Deployment & Official Project Handover (Completed)`
- **Deployment Status**: `RELEASE_READY_DEPLOYMENT_PENDING` (Fully configured and verified; pending cloud infrastructure assignment).
