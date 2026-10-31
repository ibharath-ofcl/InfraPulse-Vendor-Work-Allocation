# InfraPulse AI — Platform Architecture

## 1. Architectural Vision & Style
InfraPulse AI is engineered as a **modular monolithic backend** coupled with a dedicated, separately deployable **Python AI Vision Microservice** and an enterprise **React/TypeScript Single Page Application (SPA)**. 

### Why a Modular Monolith Backend?
Rather than fragmenting business domains into complex distributed microservices prematurely (which introduces distributed transaction overhead, network latency, and orchestration fragility), the backend maintains strong module boundaries within a unified Spring Boot 3 application. Domains (Projects, Zones, Allocations, Dependencies, Milestones, Audit) communicate via clean in-process service boundaries, backed by transactional guarantees in PostgreSQL with PostGIS.

### Why a Separate Python AI Service?
Computer vision tasks require specialized C-backed libraries (OpenCV, NumPy, PyTorch/TensorFlow, Pillow). Decoupling the AI service allows independent resource allocation (GPU/CPU optimization, vertical autoscaling) without bloating the enterprise Java runtime.

```
┌─────────────────────────────────────────────────────────────┐
│                   React 18 + Vite SPA                       │
│        (TypeScript, Tailwind CSS, Lucide, Recharts)         │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTPS / JSON                  │
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│            Spring Boot 3.3 Modular Monolith                 │
│                 (Java 21, Spring Data JPA)                  │
│                                                             │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────┐  │
│  │ Project & Zones   │ │ Dependency Engine │ │ Allocations│ │
│  └───────────────────┘ └───────────────────┘ └───────────┘  │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────┐  │
│  │ Evidence Registry │ │ Milestone Engine  │ │ Audit Log │  │
│  └───────────────────┘ └───────────────────┘ └───────────┘  │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
        JDBC / PostGIS                  REST / JSON
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   PostgreSQL 16 + PostGIS    │ │   FastAPI Python 3.11+     │
│       (Flyway Migrations)    │ │   (OpenCV, Pillow, ML)     │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Frontend Architecture (`/frontend`)
- **Core Framework**: React 18 with TypeScript running on Vite for sub-second hot-module reloading and high-performance production tree-shaking.
- **Styling Architecture**: Tailwind CSS with custom design tokens for enterprise dark mode, glassmorphic card overlays (`backdrop-filter`), and accessible color contrasts.
- **Client Routing**: React Router v6 for declarative role-based routing and code-split layout boundaries.
- **Data Fetching Layer**: Axios instance with centralized request/response interceptors, automatic JWT injection, and structured error mapping.
- **Iconography & Visualization**: Lucide React for consistent vector symbols; Recharts for future telemetry, milestone burndown charts, and vendor performance graphs.
- **Folder Topology**:
  - `src/components/`: Modular, reusable presentation widgets (buttons, cards, badges, modal dialogs).
  - `src/layouts/`: Frame layouts for Admin and Vendor workspaces.
  - `src/pages/`: Route-level screens (LandingPage, AllocationBoard, EvidenceReview).
  - `src/routes/`: Route declarations and protection guards.
  - `src/services/`: Isolated API clients consuming backend and AI services.
  - `src/types/`: Strict TypeScript contracts and DTO definitions.

---

## 3. Backend Architecture (`/backend`)
- **Runtime**: Java 21 LTS with virtual thread readiness and modern pattern matching.
- **Framework**: Spring Boot 3.3.x with Spring Web, Spring Data JPA, and Bean Validation.
- **Security Foundation**: Spring Security configured for stateless REST operations, CSRF protection tailored for API tokens, and fine-grained endpoint rules.
- **Package Partitioning**:
  - `com.infrapulse.config`: Cross-cutting beans, WebMvc, and CORS policies.
  - `com.infrapulse.common`: Standard unified `ApiResponse<T>`, exception advice, and base entities.
  - `com.infrapulse.security`: Security filter chains, token evaluators, and principal resolution.
  - `com.infrapulse.modules`: Domain-partitioned packages:
    - `auth` & `user`: Role-based access control (ADMIN, PROJECT_MANAGER, QUALITY_INSPECTOR, VENDOR, AUDITOR), token management.
    - `project` & `workzone`: Infrastructure project hierarchy, municipal PIN codes, PostGIS spatial boundaries.
    - `vendor` & `allocation`: Vendor profiles, capacity scoring, work package assignments.
    - `dependency`: Topological DAG sorting, prerequisite validation, circular dependency detection.
    - `evidence`: Cryptographic photo registry, tamper detection, EXIF metadata extraction.
    - `ai`: Computer vision integration, edge detection, excavation contour segmentation.
    - `quality`: Stage 10 AI Quality Inspection Engine, work-type inspection templates, multi-criteria assessment, scoring, and confidence evaluation.
    - `humanreview`: Stage 11 Human-in-the-Loop review workspace, Rule 2 pre-validation engine, physical measurements with engineering spec checks, corrective action management, and Stage 6 downstream work zone release.
    - `finance`: Stage 12 Milestone management and payment authorization gates.
    - `analytics`: Stage 13 Empirical vendor performance analytics engine, 10 KPIs, explainable weighted scoring configurations, multi-vendor comparison, project health metrics, and asynchronous CSV report generator.
    - `audit` (`com.infrapulse.common.audit`): Stage 13 Enterprise append-only audit trail with SHA-256 cryptographic hash chaining, sequence integrity verification, and tamper detection.
    - `dashboard`: Real-time operational telemetry and cross-module monitoring.

---

### 3.1. Stage 10 & 11 Quality Inspection & Human Review Architecture
InfraPulse AI enforces an authoritative quality gate before any infrastructure work package can be completed or released downstream:
1. **AI Quality Assessment Engine (`quality`)**:
   - Compares field evidence against work-type inspection templates (`quality_inspection_templates`).
   - Automatically computes weighted compliance scores, completeness metrics, and assigns assessment statuses (`PASSED`, `FAILED`, `FLAGGED_FOR_REVIEW`, `INCONCLUSIVE`).
   - Generates granular findings (`quality_findings`) linking specific defects or compliance anomalies.
2. **Human-in-the-Loop Review Workspace (`humanreview`)**:
   - Dual-mode inspection workspace with synchronized high-resolution zoom, bounding box overlays, and criterion-by-criterion evaluation.
   - **Rule 2 Pre-Validation Engine**: Enforces that an `APPROVED` decision is strictly rejected if:
     - Any mandatory or critical criterion failed.
     - Any physical measurement is failed, unverified, or marked `SPECIFICATION_REQUIRED` (measurements never auto-pass without engineering specs).
     - Any corrective action rework notice is pending (`OPEN`, `VENDOR_SUBMITTED`, or `REJECTED`).
   - **Vendor Rework & Remediations**: Field vendors can submit remedial evidence against issued corrective actions, but can NEVER verify or close their own corrective actions (strictly reserved for Inspectors and Admins).
   - **Stage 6 Downstream Dependency Release**: Once an authoritative `APPROVED` decision is committed, the assignment transitions to `COMPLETED` and `RELEASED`, automatically unblocking dependent successor work zones.

---

### 3.2. Stage 13 Enterprise Audit Trail & Vendor Performance Analytics Architecture
Stage 13 introduces immutable enterprise accountability and data-driven vendor evaluation:
1. **Cryptographically Chained Audit Trail (`com.infrapulse.common.audit`)**:
   - Centralized append-only event store (`audit_events`) capturing events across 8 categories (`SECURITY_AUTH`, `WORK_ALLOCATION`, `CONFLICT_RESOLUTION`, `EVIDENCE_AI`, `QUALITY_INSPECTION`, `FINANCIAL_WORKFLOW`, `PROJECT_MANAGEMENT`, `SYSTEM_ADMINISTRATION`).
   - **SHA-256 Hash Chaining**: Every event links to the preceding event's hash (`previous_hash`) and increments a monotonically increasing `sequence_number`.
   - **Canonical Serialization**: Hashes are computed over canonical string payloads; any mutation of timestamp, actor, payload, or outcome triggers cryptographic tamper detection.
   - **Chain Verification**: `AuditIntegrityService` audits the chain on demand to detect broken links, sequence gaps, or tampered event hashes.
2. **Empirical Vendor Analytics Engine (`com.infrapulse.modules.analytics`)**:
   - **10 Ground-Truth KPIs**: Computes completion rates, on-time delivery, quality pass rates, rework frequencies, evidence compliance, inspection turnarounds, corrective action resolution times, overdue counts, delay durations, and simulated financial summaries directly from real database records.
   - **Statistical Sufficiency Protection**: Flags vendors with sample sizes below threshold (`INSUFFICIENT_DATA`), preventing skewed decisions on small datasets.
   - **Dynamic Scoring Framework**: Municipal administrators configure normalized KPI weights via versioned, auditable scoring configurations.
   - **Multi-Vendor Benchmark Matrix**: Ranks vendors into performance tiers (Tier 1 Excellent through Tier 4 Critical) and provides side-by-side comparative analysis with winner callouts.
   - **Asynchronous Reporting**: Generates exportable CSV files across 7 domain categories via streaming endpoints.

---

## 4. Database Architecture (`PostgreSQL + PostGIS`)
- **Database Engine**: PostgreSQL 16 with PostGIS 3.4 spatial extension.
- **Migration Strategy**: Flyway version-controlled migrations (`src/main/resources/db/migration/V*__*.sql`).
- **Spatial Indexing**: Leverages PostGIS geometry types (`GEOMETRY(Polygon, 4326)`, `GEOMETRY(Point, 4326)`) and GIST indexes for ultra-fast spatial containment, overlap detection, and distance queries between work parcels.
- **Consistency & Transactions**: Strict ACID compliance with foreign key cascades, unique constraints on active zone assignments, and immutable audit logs.

---

## 5. AI Service Architecture (`/ai-service`)
- **Framework**: Python 3.11+ with FastAPI and ASGI Uvicorn server.
- **Processing Capabilities**:
  - Image manipulation & normalization: OpenCV, Pillow.
  - Schema validation: Pydantic v2.
  - Computer Vision: Object detection, edge detection, excavation contour segmentation, and surface condition classification.
- **Communication Flow**: 
  1. Vendor submits photo evidence to backend.
  2. Backend persists raw image metadata and dispatches asynchronous inspection task to `/api/v1/inspect`.
  3. AI service computes visual metrics, extracts confidence scores, and returns structured inspection inferences.
  4. Cases with confidence `< threshold` are flagged for human-in-the-loop audit.

---

## 6. Service Communication & Ports
| Component | Default Port | Internal Docker Port | Transport | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `3000` | `80` (Nginx) | HTTP/HTTPS | User Interface & Client App |
| **Backend** | `8080` | `8080` | HTTP/JSON | Core Business API & DB Orchestration |
| **AI Service** | `8000` | `8000` | HTTP/JSON | Visual Inference & Evidence Validation |
| **PostgreSQL** | `5432` | `5432` | TCP / JDBC | Relational & Spatial PostGIS Store |

---

## 7. Technology Stack Summary
| Area | Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React.js | 18.3+ | Industry-standard declarative component model |
| **Build Tool** | Vite | 5.4+ | Instant HMR, clean ESM bundle optimization |
| **Language** | TypeScript | 5.6+ | Compile-time type safety preventing runtime null/type errors |
| **Backend Framework** | Spring Boot | 3.3+ | Enterprise robustness, dependency injection, JPA ecosystem |
| **Backend Language** | Java | 21 LTS | High-performance, modern LTS Java with record types |
| **Database** | PostgreSQL + PostGIS | 16 / 3.4 | Relational integrity combined with industrial GIS indexing |
| **Database Migrations**| Flyway | 10.x | Deterministic, immutable schema evolution |
| **AI Framework** | FastAPI | 0.110+ | Ultra-fast async API with native Pydantic validation |
| **AI Runtime** | Python | 3.11+ | Standard ecosystem for image processing & ML models |
| **Containerization** | Docker & Compose | Modern | Reproducible dev, staging, and production environments |
