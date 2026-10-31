# InfraPulse AI — Production Deployment Architecture

**Stage**: Stage 15 — Final Production Release, Deployment & Official Project Handover  
**Target Release**: v1.0.0 (Production Release)  
**Classification**: Cloud Architecture & Infrastructure Topology  
**Status**: APPROVED & RELEASE-READY  

---

## 1. Executive Summary & Topology Overview

InfraPulse AI is engineered with a **zero-trust, layered network topology**. Public ingress is strictly concentrated through a hardened Nginx reverse proxy serving the compiled React Single Page Application (SPA). All application services—Spring Boot 3.3 Backend API, FastAPI Computer Vision Inference Engine, and PostgreSQL 16 with PostGIS 3.4—reside on an isolated, private virtual bridge network inaccessible from the public internet.

```
+---------------------------------------------------------------------------------------------------------+
|                                        PUBLIC INTERNET (WAN)                                            |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                   HTTPS (Port 443) / HTTP (Port 80)
                                   TLS 1.3 Termination & WAF Inspection
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                    DEMILITARIZED ZONE (DMZ)                                             |
|                                                                                                         |
|   +-------------------------------------------------------------------------------------------------+   |
|   |                        INFRAPULSE FRONTEND & REVERSE PROXY CONTAINER                            |   |
|   |  - Nginx 1.27 Alpine                                                                            |   |
|   |  - Static Compiled SPA Assets (React 18 / TypeScript / Vite / Tailwind)                        |   |
|   |  - HTTP Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)                   |   |
|   |  - Rate Limiting Zone: 30 requests/sec with burst buffer                                        |   |
|   |  - Gzip Compression & Immutable Static Asset Caching                                            |   |
|   +-------------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                     Internal DNS Service Proxy (`http://backend:8080/api/`)
                     Internal DNS Vision Proxy  (`http://ai-service:8000/`)
                                                     |
+---------------------------------------------------------------------------------------------------------+
|                                 ISOLATED PRIVATE CONTAINER NETWORK                                      |
|                                       `infrapulse-prod-net`                                             |
|                                                                                                         |
|   +---------------------------------------+             +-------------------------------------------+   |
|   |         BACKEND API GATEWAY           |             |         AI VISION SERVICE                 |   |
|   |  - Spring Boot 3.3.5 / Java 21 LTS    |             |  - Python 3.11 / FastAPI                  |   |
|   |  - Spring Security (JWT / 7-Role RBAC)|  Internal   |  - OpenCV & Pillow Inference Engine       |   |
|   |  - DAG Dependency & Conflict Engine   |<----------->|  - Quality Scoring & Defect Detection     |   |
|   |  - Financial Authorization Engine     |  HTTP REST  |  - Non-root user `infrapulse`             |   |
|   |  - SHA-256 Audit Trail Chaining       |             |  - Healthcheck: `/health`                 |   |
|   |  - Healthcheck: `/api/health`         |             +-------------------------------------------+   |
|   +-------------------+-------------------+                                                             |
|                       |                                                                                 |
|                       | Encrypted JDBC Connection (`jdbc:postgresql://postgres:5432/infrapulse_db`)     |
|                       | Least-Privilege App User `infrapulse_app`                                       |
|                       v                                                                                 |
|   +-------------------------------------------------------------------------------------------------+   |
|   |                           RELATIONAL & GEOSPATIAL DATABASE                                      |   |
|   |  - PostgreSQL 16 + PostGIS 3.4 (Alpine)                                                         |   |
|   |  - Spatial Indexing (`GIST(geometry)`) for PIN Zones & Work Packages                           |   |
|   |  - Flyway Versioned Migrations (`flyway_schema_history`)                                        |   |
|   |  - Append-Only Audit Trail Table with SHA-256 Chained Hashes                                    |   |
|   |  - Persistent Named Volume: `postgres_prod_data`                                                |   |
|   |  - Healthcheck: `pg_isready -U infrapulse_app`                                                  |   |
|   +-------------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
                                 |                                                 |
                       Persistent Volume                                 Persistent Volume
                                 v                                                 v
                  +-----------------------------+                   +-----------------------------+
                  |     `postgres_prod_data`    |                   |     `evidence_prod_data`    |
                  |  PostgreSQL Physical WAL &  |                   |  Vendor Uploaded Photo      |
                  |  Relational Table Storage   |                   |  Evidence & Checksums       |
                  +-----------------------------+                   +-----------------------------+
```

---

## 2. Service Communication Protocols & Routing Rules

1. **Client to Ingress (Browser to Nginx)**:
   - External clients connect exclusively to ports 80/443 on the Frontend container.
   - All HTTP traffic is upgraded to HTTPS via standard Nginx redirects.
   - Security headers prevent clickjacking (`X-Frame-Options: DENY`), MIME sniffing (`nosniff`), and unauthorized iframe embedding.
2. **Nginx to Backend Core (`/api/`)**:
   - Routed internally to `http://backend:8080/api/`.
   - Client IP is preserved via `X-Forwarded-For` and `X-Real-IP`.
   - Rate limiting is enforced: max 30 requests/second per IP with burst allowance of 20 requests.
3. **Nginx to AI Vision Service (`/ai/`)**:
   - Routed internally to `http://ai-service:8000/`.
   - Enforces a 60-second read timeout for computationally intensive computer vision inferences.
4. **Backend to AI Vision Service (Internal Sync)**:
   - The Spring Boot backend can directly invoke AI analysis pipelines over the private network via `http://ai-service:8000/analyze`.
5. **Backend to PostgreSQL**:
   - Communicates over JDBC port 5432 with HikariCP connection pooling.
   - All SQL operations utilize prepared statements through Hibernate ORM to prevent SQL injection.

---

## 3. Data Persistence & Volume Storage Strategy

| Storage Volume | Host Path / Mount Point | Purpose | Backup Frequency |
| :--- | :--- | :--- | :--- |
| **`postgres_prod_data`** | `/var/lib/postgresql/data` | PostgreSQL relational database files, WAL logs, and PostGIS geometries | Daily automated `pg_dump` + continuous WAL archiving |
| **`evidence_prod_data`** | `/app/uploads/evidence` | Original photographic evidence submitted by field contractors | Daily incremental rsync / S3 bucket replication |

---

## 4. Multi-Cloud Target Deployment Options

InfraPulse AI is containerized in compliance with the **Open Container Initiative (OCI)** and runs portably across major cloud architectures:

### Option A: Containerized VM / VPS (Single-Node or Swarm)
- **Target**: AWS EC2 / DigitalOcean Droplet / Hetzner Cloud (Ubuntu 22.04 LTS, 4 vCPU, 8GB RAM).
- **Execution**: Clone repository, configure `.env` with production secrets, and launch via `docker compose -f docker-compose.prod.yml up -d`.
- **Ingress**: Let's Encrypt Certbot SSL certificate attached to host Nginx or Cloudflare proxy.

### Option B: Cloud-Native Managed Services (AWS Architecture)
- **Frontend**: AWS S3 + CloudFront CDN (Static hosting with edge SSL).
- **Backend**: AWS Elastic Container Service (ECS) with AWS Fargate.
- **AI Service**: AWS ECS Fargate task with GPU acceleration (optional) or Compute-optimized CPU.
- **Database**: Amazon RDS for PostgreSQL 16 (Multi-AZ) with PostGIS extension enabled.
- **Evidence Storage**: Amazon S3 private bucket with AWS IAM pre-signed upload URLs.

### Option C: Cloud-Native Managed Services (Google Cloud Platform)
- **Frontend & APIs**: Google Cloud Run (Fully managed serverless container runtime).
- **Database**: Google Cloud SQL for PostgreSQL 16 with PostGIS.
- **Evidence Storage**: Google Cloud Storage (GCS) bucket.

---

## 5. Deployment Verification Status

Because external cloud credentials are not provisioned in the local environment, the platform's deployment status is officially classified as:

### **`RELEASE_READY_DEPLOYMENT_PENDING`**

All container build definitions, production orchestration files (`docker-compose.prod.yml`), Nginx reverse proxy hardening, and environment templates have been completed and verified for instant deployment upon cloud target selection.
