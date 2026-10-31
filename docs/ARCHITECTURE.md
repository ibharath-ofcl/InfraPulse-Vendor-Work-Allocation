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
    - `health`: Service discovery and readiness probing (`/api/health`).
    - *Upcoming*: `projects`, `zones`, `vendors`, `allocations`, `dependencies`, `evidence`, `milestones`, `audit`.

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
