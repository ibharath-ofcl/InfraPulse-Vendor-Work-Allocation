# Changelog

All notable changes to the **InfraPulse AI** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-11-01

### Use Case 2 Verification Enhancements & Master Five-Role Browser Automation

#### Added
- **Perceptual Duplicate Evidence Detection**: Multi-layer cryptographic (SHA-256) and perceptual difference hashing (`dHash` 64-bit with Hamming distance threshold $\le 5$) preventing fraudulent contractor photo resubmissions.
- **Geofencing & Freshness Verification**: Haversine distance geofence validation ($\le 500\text{m}$, GPS accuracy $\le 50\text{m}$) and 72-hour freshness window with clock skew protection.
- **Monocular Depth Proxy & Defect Segmentation**: AI vision relative optical disparity estimation with explicit advisory disclaimers and normalized polygon segmentation masks.
- **Master Five-Role Browser Automation Suite**: Automated Playwright test harness testing all 5 roles (`PLATFORM_ADMIN`, `PROJECT_MANAGER`, `VENDOR`, `FIELD_ENGINEER`, `FINANCE_OFFICER`) on actual Google Chrome.
- **Responsive Mobile Viewport Validation**: Automated viewport tests across 6 display resolutions (360×800, 375×812, 390×844, 430×932, 768×1024, 1024×768).

#### Fixed
- **TopNavbar 768px Horizontal Overflow**: Resolved iPad Portrait layout squeezing by making the center search bar responsive (`hidden lg:block`) and compacting project scope selector, eliminating the 6px horizontal scrollbar defect.
- **Vite Backend API Proxy**: Updated proxy target to `http://127.0.0.1:8080` and `http://127.0.0.1:8000` to prevent Node.js IPv6 `::1` DNS lookup conflicts and `EPERM` socket restrictions.
- **Mockito Subclass Mock Maker**: Configured `mock-maker-subclass` extension to ensure backend unit and integration test suites execute reliably without dynamic ByteBuddy attachment conflicts.

---

## [1.0.0] - 2026-10-31

### Initial Official Production Release (Stages 1 through 15 Complete)

#### Added
- **Core Architecture (Stage 1)**: Polyglot architecture featuring Spring Boot 3.3.5 (Java 21), React 18 with TypeScript and Vite, Python 3.11 FastAPI Computer Vision service, and PostgreSQL 16 with PostGIS 3.4.
- **Enterprise Design System (Stage 2)**: Industrial Dark Mode tokens, glassmorphic card layouts, responsive navigation, Lucide icons, and Recharts primitives.
- **Authentication & RBAC (Stage 3)**: Spring Security JWT stateless authentication, database-backed refresh token rotation, BCrypt password hashing, and 7-tier Role-Based Access Control matrix (`PLATFORM_ADMIN`, `WARD_OFFICER`, `FIELD_ENGINEER`, `QUALITY_INSPECTOR`, `FINANCE_OFFICER`, `VENDOR_REPRESENTATIVE`, `AUDITOR`).
- **Project & Vendor Governance (Stage 4)**: Master project registry, contractor registration workflows, capability tagging, and contact governance.
- **Geospatial PIN Allocation (Stage 5)**: PostGIS spatial work zones with polygon boundaries, postal PIN code mapping, and interactive leaflet map allocation.
- **DAG Conflict & Dependency Engine (Stage 6)**: Deterministic Directed Acyclic Graph conflict engine enforcing physical sequential execution (e.g. blocking road resurfacing permits while trenching is ongoing).
- **Work Lifecycle Board (Stage 7)**: Multi-state work assignment tracking across state machine (`ASSIGNED` -> `IN_PROGRESS` -> `SUBMITTED` -> `VERIFIED` -> `APPROVED`).
- **Photo Evidence Management (Stage 8)**: Vendor field evidence upload module with client-side image compression, EXIF GPS coordinate verification, and SHA-256 integrity checksums.
- **AI Computer Vision Engine (Stage 9)**: OpenCV image preprocessing pipelines, trench contour analysis, excavation depth estimation, and conduit detection.
- **Automated AI Inspection (Stage 10)**: Automated inspection reports, defect classifications, confidence scoring, and milestone approval recommendations.
- **Human Review & Corrective Actions (Stage 11)**: Authoritative human inspector review queue, AI overlay inspection viewer, Rule 2 pre-validation barrier, ground measurements, and vendor rework remediation.
- **Milestone & Payment Authorization (Stage 12)**: Commercial vendor agreements, physical-quality-linked milestone eligibility, multi-point invoice validation, and simulated digital disbursement vouchers (`PAY-xxxx`, `AUTH-SIM-xxxx`).
- **Cryptographic Audit & Vendor Analytics (Stage 13)**: Append-only cryptographically chained SHA-256 audit trail, automated tamper detection, 10-KPI vendor analytics engine, explainable scoring weights, radar charts, and asynchronous CSV reporting.
- **Comprehensive Testing & Security Hardening (Stage 14)**: 128 automated platform tests passing (68 Vitest, 18 Pytest, 42 Backend), STRIDE threat model, IDOR multi-tenancy isolation, sub-10ms P95 performance benchmarks, and GitHub Actions CI quality gates.
- **Production Release & Hardening (Stage 15)**: Hardened `docker-compose.prod.yml`, Nginx reverse proxy with enterprise HTTP security headers (CSP, HSTS, X-Frame-Options) and rate limiting, production database guide with least-privilege roles, backup and disaster recovery runbooks, structured logging, release automation workflow (`.github/workflows/release.yml`), and synthetic demo guide.

#### Security
- Multi-tenant IDOR isolation verified across all vendor-facing endpoints.
- Separation of duties strictly enforced across inspection, administration, and financial disbursements.
- File upload sanitization rejecting executable extensions (`.sh`, `.exe`, `.bat`) and path traversal sequences (`../../`).
- Cryptographic hash chaining verifying immutability of historical audit records.

#### Known Limitations
- AI computer vision depth estimation is advisory and requires authoritative human inspector verification for final permit release.
- Financial disbursements are simulated vouchers (`PAYMENT_AUTHORIZED_SIMULATED`) for demonstration and audit compliance; no real banking rails are connected.
