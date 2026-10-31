# Changelog

All notable changes to the **InfraPulse AI** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
