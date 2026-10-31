# InfraPulse AI — Threat Model (STRIDE Methodology)

**Stage**: Stage 14 — Comprehensive Testing, Security Hardening & Release Readiness  
**Standard**: STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**Status**: APPROVED & MONITORED  

---

## 1. System Boundary & Architecture Overview

InfraPulse AI orchestrates public infrastructure works involving multiple commercial contractors, municipal oversight authorities, quality inspection teams, and financial disbursing officers.

```
                      +---------------------------------------+
                      |       Client Web Browser (SPA)        |
                      |   React 18 / TypeScript / Vite        |
                      +-------------------+-------------------+
                                          |
                        HTTPS / JSON / JWT (Bearer Header)
                                          |
                                          v
+---------------------------------------------------------------------------------+
|                       Spring Boot 3.3 Backend Gateway                           |
|  - Spring Security Filter Chain (JWT Auth, Role Hierarchy, CORS Lockdown)      |
|  - Rate Limiting & Global Exception Handler (Sanitized 4xx/5xx Responses)       |
|  - Work Allocation Engine & Directed Acyclic Graph (DAG) Conflict Detector      |
|  - Financial Authorization & Verification Engine                                 |
|  - Cryptographic Audit Trail Chaining Service (SHA-256)                         |
+-------------------+-----------------------------+-------------------------------+
                    |                             |
      Internal HTTP / Multipart      JDBC / TLS 1.3 / Prepared Statements
                    |                             |
                    v                             v
+------------------------------------+  +-----------------------------------------+
|     AI Vision Service (FastAPI)    |  |       PostgreSQL 16 + PostGIS 3.4       |
|  - Image Preprocessing & Contour   |  |  - Spatial Boundary Tables & Indexes    |
|  - Quality Scoring & Defect Class  |  |  - Relational Schemas & Constraints     |
|  - Depth & Trench Measurement      |  |  - Append-Only Audit Event Log Chain    |
+------------------------------------+  +-----------------------------------------+
```

---

## 2. STRIDE Threat Vector Analysis

### 2.1 Spoofing (Identity & Integrity)

| Threat ID | Threat Vector | Impact | Likelihood | Mitigation Strategy | Verification Test |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **TH-SP-01** | **JWT Signature Forgery**<br>Attacker crafts an arbitrary JWT with forged claims (`role=PLATFORM_ADMIN`). | Critical | Low | HMAC-SHA256 signing using cryptographically secure 256-bit key secret. Strict signature and expiration verification on every request. | `SecurityAndIdorVulnerabilityTest.testValidLogin` |
| **TH-SP-02** | **Credential Brute-Forcing**<br>Attacker attempts credential enumeration against `/api/auth/login`. | High | Medium | BCrypt hashing with work factor 10, rate limiting, and generic error messages ("Bad credentials"). | `SecurityAndIdorVulnerabilityTest.testInvalidLoginReturnsUnauthorized` |
| **TH-SP-03** | **GPS Metadata Spoofing**<br>Vendor uploads image with forged EXIF coordinates to mimic presence in the assigned work zone. | High | Medium | Spatial polygon point-in-polygon verification via PostGIS `ST_Contains()` against the active `work_zones` geometry; EXIF tamper detection; cross-referenced with vendor timestamp. | `CriticalEndToEndWorkflowTest.testWorkflowA` |

---

### 2.2 Tampering (Data Manipulation)

| Threat ID | Threat Vector | Impact | Likelihood | Mitigation Strategy | Verification Test |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **TH-TA-01** | **Audit Trail Payload Alteration**<br>Attacker with direct database access alters historical milestone completion or payout records. | Critical | Low | Cryptographically chained SHA-256 hash tree. Every event links to `previousEventHash`. Tampered rows break downstream chaining and yield `INVALID` status. | `FinancialConcurrencyAndAuditIntegrityTest.testTamperedAuditPayloadDetected` |
| **TH-TA-02** | **Invoice Overpayment Tampering**<br>Vendor manipulates payment request amount to exceed the agreed milestone budget. | Critical | Medium | Server-side validation enforcing that invoice amount must strictly be `<= remainingAgreementBalance` and `<= milestoneValue`. | `FinancialConcurrencyAndAuditIntegrityTest.testMilestoneOverpaymentBlocked` |
| **TH-TA-03** | **Corrupted Image Injection**<br>Attacker uploads corrupted image bytes or non-image binaries to trigger memory leaks or buffer overflows in OpenCV/Pillow. | High | Medium | Python AI service strictly parses image headers, verifies shape and channel integrity, and rejects invalid streams with HTTP 400. | `test_resilience_and_security.py::test_corrupted_image_returns_400` |

---

### 2.3 Repudiation (Dispute of Actions)

| Threat ID | Threat Vector | Impact | Likelihood | Mitigation Strategy | Verification Test |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **TH-RE-01** | **Payment Authorization Denial**<br>Finance officer denies approving an emergency payment or milestone release. | High | Low | Every authorization records the authorizer's UUID, timestamp, digital authorization code (`PAY-xxxx`), and an immutable audit event (`PAYMENT_AUTHORIZED_SIMULATED`). | `CriticalEndToEndWorkflowTest.testWorkflowB` |
| **TH-RE-02** | **Quality Inspection Decision Dispute**<br>Inspector denies rejecting a vendor's trenching work or ordering rework. | High | Low | Decisions require explicit mandatory `reason`, `reviewer_role`, digital timestamp, and write to `human_inspection_decisions` table with audit logging. | `CriticalEndToEndWorkflowTest.testWorkflowA` |

---

### 2.4 Information Disclosure (Data Leaks)

| Threat ID | Threat Vector | Impact | Likelihood | Mitigation Strategy | Verification Test |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **TH-IN-01** | **Insecure Direct Object Reference (IDOR)**<br>Vendor queries competitors' contract values, payment requests, or assigned zones. | Critical | High | Explicit vendor principal binding checks on `/api/v1/work-assignments/vendor/{id}` and `/api/v1/finance/payment-requests/vendor/{id}`. Non-admin cross-access returns HTTP 403. | `SecurityAndIdorVulnerabilityTest.testIdorVendorIsolation`, `testIdorPaymentRequestIsolation` |
| **TH-IN-02** | **Internal Stack Trace Leakage**<br>Malformed payloads produce detailed Hibernate SQL exceptions or Jackson parser traces. | Medium | Medium | Centralized `GlobalExceptionHandler` intercepting all exceptions and returning standard `ApiResponse<T>` with sanitised messages. | `SecurityAndIdorVulnerabilityTest.testMalformedJsonRejected` |
| **TH-IN-03** | **Directory Traversal Exposure**<br>Attacker attempts to download system files via `/api/v1/evidence/download?path=../../etc/passwd`. | Critical | Medium | Sanitization of file keys, disallowing relative path separators (`..`, `/`, `\`), and storing evidence in an isolated bucket/directory. | `SecurityAndIdorVulnerabilityTest.testPathTraversalUploadRejected` |

---

### 2.5 Denial of Service (Availability)

| Threat ID | Threat Vector | Impact | Likelihood | Mitigation Strategy | Verification Test |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **TH-DS-01** | **Algorithmic Complexity in DAG Scheduler**<br>Attacker submits deep or cyclic dependency graphs to lock dependency validation. | High | Low | Cycle detection via Kahn's algorithm / DFS cycle check; bounded graph depth limits; immediate rejection of cyclic allocations. | `CriticalEndToEndWorkflowTest.testWorkflowA` |
| **TH-DS-02** | **Double-Spending / Race Condition**<br>Concurrent duplicate disbursement requests submitted in parallel to drain funds. | Critical | Medium | Database unique constraint on `idempotency_key` and invoice number; pessimistic locking on balance deductions; returns HTTP 409 on duplicates. | `FinancialConcurrencyAndAuditIntegrityTest.testIdempotencyKeyPreventsDuplicatePayment` |
| **TH-DS-03** | **Image Upload Flooding**<br>Automated script uploads excessive large files to exhaust server disk space and bandwidth. | Medium | Medium | File size limits (10MB max), content type whitelisting (JPG/PNG/WebP), and rate limiting on upload endpoints. | `SecurityAndIdorVulnerabilityTest.testExecutableScriptUploadRejected` |

---

### 2.6 Elevation of Privilege (Access Control)

| Threat ID | Threat Vector | Impact | Likelihood | Mitigation Strategy | Verification Test |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **TH-EP-01** | **Vendor Self-Approval of Work**<br>Vendor invokes inspection or work assignment approval endpoints to bypass quality gates. | Critical | High | Role validation via `@PreAuthorize("hasAnyRole('QUALITY_INSPECTOR','PLATFORM_ADMIN')")`. Vendors attempting approval receive HTTP 403. | `SecurityAndIdorVulnerabilityTest.testVendorCannotApproveWorkAssignment` |
| **TH-EP-02** | **Inspector Authorizing Disbursements**<br>Corrupt inspector attempts to authorize milestone payouts directly. | Critical | Medium | Milestone authorization restricted strictly to `hasAnyRole('FINANCE_OFFICER','PLATFORM_ADMIN')`. Inspectors receive HTTP 403. | `SecurityAndIdorVulnerabilityTest.testInspectorCannotAuthorizePayments` |
| **TH-EP-03** | **Audit Log Tampering Trigger**<br>Standard user invokes audit verification to overwrite or mask integrity faults. | High | Low | Hash verification endpoint locked strictly to `hasAnyRole('AUDITOR','PLATFORM_ADMIN')`. Other roles receive HTTP 403. | `SecurityAndIdorVulnerabilityTest.testNonAdminCannotTriggerIntegrityVerification` |

---

## 3. Threat Mitigation Summary & Residual Risk Status

| Threat Category | Mitigated By | Remaining Residual Risk | Status |
| :--- | :--- | :--- | :---: |
| **Spoofing** | BCrypt work factor 10, HS256 JWT, PostGIS spatial check | Stolen developer credentials (mitigated by environment separation & rotation) | **CONTROLLED** |
| **Tampering** | SHA-256 audit chaining, balance math guards, byte validation | Direct root DB access by rogue DBA (mitigated by DB audit logs & read-only replicas) | **CONTROLLED** |
| **Repudiation** | Immutable audit table, actor UUID tracking, digital codes | None identified in software domain | **RESOLVED** |
| **Information Disclosure**| IDOR vendor checks, GlobalExceptionHandler, file sanitization | Public IP disclosure behind reverse proxy (addressed in Stage 15 Nginx setup) | **CONTROLLED** |
| **Denial of Service** | Idempotency keys, unique invoice constraints, file limits | Volumetric network DDoS (addressed by infrastructure/CDN WAF in Stage 15) | **ACCEPTED (L3/L4)** |
| **Elevation of Privilege**| Method-level `@PreAuthorize`, 7-tier RBAC matrix | Misconfigured future endpoints (mitigated by automated CI security tests) | **RESOLVED** |
