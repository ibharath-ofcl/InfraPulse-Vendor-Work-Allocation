# InfraPulse AI — Multi-Layered Testing Strategy

**Stage**: Stage 14 — Comprehensive Testing, Security Hardening & Release Readiness  
**Target Architecture**: Polyglot Monolith (Java/Spring Boot, React/TypeScript, Python/FastAPI)  
**Standard**: ISO/IEC/IEEE 29119 Software Testing Standards  
**Status**: ACTIVE & AUTOMATED  

---

## 1. Testing Philosophy & Pyramid Structure

InfraPulse AI adopts a strict **Shift-Left, Layered Testing Pyramid**. Quality assurance is not an afterthought; it is built into the development cycle across unit, integration, contractual, end-to-end, security, and performance domains.

```
                   / \
                  /   \      Critical End-to-End Workflows (3 Workflows)
                 / E2E \     - Full Lifecycle DAG Unblocking
                /-------\    - Milestone to Disbursement Settled
               / Security\   - Cryptographic Audit & Multi-KPI Analytics
              / & Concurr \
             /-------------\ Integration & API Contracts (MockMvc, Pytest, Vitest)
            /  Integration  \ - REST Endpoint validation, DB constraints, Role enforcement
           /-----------------\ Unit & Component Tests
          /     Unit Tests    \ - Pure functions, BigDecimal rounding, React render tests
         /---------------------\
```

---

## 2. Quality Gate Thresholds & CI Enforcement

The platform enforces automated quality gates in `.github/workflows/ci.yml`. Pull requests and commits to `main` must strictly satisfy the following criteria:

| Quality Dimension | Metric / Target | Tooling | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Frontend Test Pass Rate** | **100%** (0 failures, 0 skipped) | Vitest | CI step `npm run test` |
| **Frontend Production Build**| **0 errors** (TypeScript strict check) | Vite / tsc | CI step `npm run build` |
| **Backend Test Pass Rate** | **100%** (0 failures, 0 skipped) | JUnit 5 / Surefire | CI step `mvn test` |
| **Backend Code Coverage** | Class analysis bundle generation | JaCoCo 0.8.12 | CI step `jacoco:report` |
| **AI Service Test Pass Rate**| **100%** (0 failures, 0 skipped) | Pytest 8.x | CI step `pytest` |
| **Security & IDOR Isolation**| **100%** pass on 19 security tests | Spring Security Test | Automated regression suite |
| **Financial Concurrency** | **0 double disbursements**, 0 math loss| JUnit 5 / MockMvc | Concurrency test suite |
| **Audit Chain Integrity** | Tamper detection flagged `INVALID` | SHA-256 Engine | Integrity test suite |

---

## 3. Tier-Specific Testing Methodologies

### 3.1 Frontend Tier (React 18 + TypeScript + Vite)
- **Framework**: Vitest + React Testing Library + `@testing-library/jest-dom`.
- **Environment**: `jsdom` simulating browser DOM semantics.
- **Coverage**:
  - `milestones.test.ts`: Milestone state badges, payment eligibility checks, currency formatting, agreement calculations.
  - `analytics.test.ts`: Vendor KPI calculations, grade assignment (A+ to F), radar chart rendering.
  - `projectVendor.test.ts`: Project status badges, vendor capability tags, form validations.
  - `workAllocation.test.ts`: Spatial allocation forms, status transitions, conflict warnings.
  - `dashboard.test.ts`: KPI cards, summary counters, filter changes.
  - `humanReview.test.ts`: Decision dialogs, rework notes, physical measurement inputs.
  - `evidence.test.ts`: File upload preview, EXIF coordinate badges, SHA-256 hash displays.
  - `auth.test.ts`: Form state, login handling, token persistence, error rendering.
- **Execution Command**: `npm run test` (68 tests passing across 8 files).

---

### 3.2 Backend Tier (Spring Boot 3.3 + Java 21)
- **Framework**: JUnit 5, Spring Boot Test, Spring Security Test, MockMvc, AssertJ.
- **Database Strategy**: In-memory H2 database running in PostgreSQL compatibility mode (`MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`) with Hibernate DDL auto-generation, mirroring production schema constraints.
- **TearDown & Cleanup Protocol**: Strict foreign-key cascade order in `@AfterEach` teardown methods prevents test contamination and orphaned foreign keys:
  ```
  paymentAuthorizationRepository -> paymentRequestRepository ->
  milestoneWorkAssignmentRepository -> milestoneVerificationRepository ->
  humanInspectionDecisionRepository -> humanInspectionReviewRepository ->
  qualityAssessmentRepository -> templateRepository -> workAssignmentRepository ->
  workZoneRepository -> milestoneRepository -> agreementRepository ->
  projectVendorRepository -> vendorRepository -> projectRepository ->
  refreshTokenRepository -> userRepository
  ```
- **Execution Command**: `mvn test` (Targeted suites: `CriticalEndToEndWorkflowTest`, `SecurityAndIdorVulnerabilityTest`, `FinancialConcurrencyAndAuditIntegrityTest`, `PerformanceBenchmarkTest`, `FinanceWorkflowTest`).

---

### 3.3 AI Vision Service Tier (Python 3.11 + FastAPI)
- **Framework**: Pytest 8.x + FastAPI `TestClient` (Starlette).
- **Test Scenarios**:
  - `test_health.py`: Health probes, system metadata, uptime metrics.
  - `test_vision.py`: Full analysis pipelines, defect classification, depth estimation, contour extraction.
  - `test_resilience_and_security.py`:
    - Zero-byte files rejection (`400 Bad Request`).
    - Unsupported media types rejection (`400 Bad Request`).
    - Corrupted image bytes defense (`400 Bad Request`).
    - Missing model/resource 404 handling.
    - Path traversal resistance on file uploads.
    - Concurrent inference load simulation.
- **Execution Command**: `pytest tests/` (18 tests passing in 0.73s).

---

## 4. End-to-End Workflow Testing

The platform validates 3 critical, real-world operational workflows in `CriticalEndToEndWorkflowTest.java`:

### Workflow A: Lifecycle DAG with Conflict Blocking & Unblocking
1. Create Work Zone (e.g. `WZ-BLR-560001`) and Project (`PRJ-HW-001`).
2. Register and onboard two distinct vendors (`VND-TRENCH-01`, `VND-PAVE-01`).
3. Create Phase 1 (Trenching & Ducting) and Phase 2 (Road Resurfacing).
4. Assert Phase 2 is **BLOCKED** due to unresolved sequential DAG dependency.
5. Vendor A accepts Phase 1, starts work, and submits photographic evidence with GPS coordinates.
6. AI Vision evaluates evidence and scores quality.
7. Quality Inspector rejects work and orders corrective action (rework).
8. Vendor uploads corrective evidence; Inspector conducts physical ground inspection and signs approval.
9. Verify Phase 1 reaches `COMPLETED` and Phase 2 dependency status transitions to **UNBLOCKED**.

### Workflow B: Commercial Agreement -> Milestone -> Invoice -> Approval -> Settlement
1. Municipal authority creates Vendor Commercial Agreement (`$500,000.00`).
2. Define Milestone 1 (`$200,000.00`) tied to Phase 1 work assignments.
3. Validate physical quality completion unlocks milestone eligibility.
4. Vendor submits Invoice (`INV-2026-001`, `$200,000.00`).
5. Invoice verification engine cross-references work assignments, completion dates, and budget caps.
6. Finance Officer reviews verified invoice and grants formal financial approval.
7. Simulated payment authorization issues digital disbursement reference (`PAY-xxxx`, `AUTH-SIM-xxxx`).
8. Final payment settlement executes; remaining agreement balance automatically decrements to `$300,000.00`.

### Workflow C: Cryptographic Audit Integrity -> 10-KPI Dashboard -> Dynamic Scoring -> CSV Export
1. System logs multiple actions across entities generating cryptographically linked SHA-256 event hashes.
2. Auditor initiates automated hash chain verification; verifies intact chain status `VALID`.
3. Analytics engine calculates 10 distinct empirical KPIs (Quality Pass Rate, SLA Adherence, Rework Rate, Budget Accuracy, etc.).
4. Dynamic weight configuration applied to generate Composite Vendor Score and grade assignments.
5. Comprehensive CSV export generated and validated for header accuracy and data integrity.

---

## 5. Concurrency & Integrity Testing

- **BigDecimal Mathematical Precision**: All currency math uses `BigDecimal` with explicit scale (2 decimal places) and `RoundingMode.HALF_UP` to prevent floating-point drift.
- **Idempotency Locking**: Evaluated under simulated multi-client concurrency. Duplicate payment requests with identical idempotency keys return the existing record or fail fast with `409 Conflict`, guaranteeing zero double-disbursement.
- **Hash Chain Tampering**: Direct mutation of entity payloads (e.g. changing approved amount) or manual modification of stored `event_hash` is detected during chain replay and flagged as `INVALID`.

---

## 6. Performance Benchmarking Methodology

- **Warmup Phase**: 5 unmeasured requests per endpoint to trigger JIT compilation and warm connection pools.
- **Sample Size**: 50 measured sequential/burst requests per critical endpoint.
- **Statistical Aggregation**:
  - P50 (Median) latency
  - P95 latency
  - P99 latency
  - Mean (Average) latency
  - Throughput (Requests Per Second)
  - Error Rate percentage
- **Measured Endpoints**:
  1. `GET /api/v1/work-assignments`
  2. `GET /api/v1/projects`
  3. `GET /api/v1/analytics/dashboard/summary`
  4. `POST /api/v1/audit-events/integrity/verify`
