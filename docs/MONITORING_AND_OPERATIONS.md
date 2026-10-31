# InfraPulse AI — Production Monitoring & Operations Guide

**Stage**: Stage 15 — Final Production Release, Deployment & Official Project Handover  
**Target Release**: v1.0.0  
**Classification**: Site Reliability Engineering (SRE) & Operational Runbook  
**Status**: APPROVED & OPERATIONAL  

---

## 1. System Health Probes & Monitoring Endpoints

InfraPulse AI exposes dedicated health probe endpoints across all architectural tiers:

| Tier / Service | Probe URL | Internal Target | Expected Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Ingress / Frontend** | `http://localhost/` | Nginx HTTP port 80 | `200 OK` (HTML) | Confirms web server availability and asset delivery |
| **Backend API Gateway** | `http://localhost/api/health` | `http://backend:8080/api/health` | `{"status":"UP","application":"InfraPulse AI"}` | Core application liveness and database connection status |
| **Backend Actuator** | `http://backend:8080/actuator/health` | Spring Boot Actuator | `{"status":"UP"}` | Detailed internal health metrics (DB, disk space) |
| **AI Computer Vision** | `http://localhost/ai/health` | `http://ai-service:8000/health` | `{"status":"UP","service":"InfraPulse AI Vision Service"}` | Model availability, OpenCV runtime, and memory state |
| **PostgreSQL Database** | `TCP 5432` | Container Internal | `pg_isready` exit code `0` | Database engine responsiveness and connection acceptance |

---

## 2. Structured Logging Standards & Redaction Rules

All services emit logs formatted with structured metadata to enable aggregation via ELK Stack, Grafana Loki, or AWS CloudWatch:

### 2.1 Standard Log Format
```
[TIMESTAMP] [SEVERITY] [SERVICE_NAME] [THREAD/CORRELATION_ID] [LOGGER] : MESSAGE
```
*Example Production Log*:
```
2026-10-31T23:30:15.124Z INFO infrapulse-backend [http-nio-8080-exec-4] c.i.common.audit.AuditService : Audit logged: event=PAYMENT_AUTHORIZED_SIMULATED, entity=PAYMENT_AUTHORIZATION:d72e13b4, actor=73613573
```

### 2.2 Mandatory Privacy & Redaction Rules
Loggers are strictly forbidden from recording sensitive personal or financial information:
- **NEVER LOG**: Plaintext passwords, JWT signing secrets, user tokens, refresh token UUIDs.
- **NEVER LOG**: Raw image binary bytes, base64 image strings, or contractor bank account details.
- **NEVER LOG**: Database connection credentials or unredacted internal stack traces in public error payloads.

---

## 3. Operational Alerting Thresholds

The following metrics must be monitored with automated alerts in production:

| Alert Identifier | Metric Monitored | Warning Threshold | Critical Threshold | Automated Action |
| :--- | :--- | :---: | :---: | :--- |
| **ALT-ERR-01** | Backend 5xx Error Rate | > 0.5% for 5 min | > 2.0% for 2 min | PagerDuty / Slack on-call alert |
| **ALT-LAT-01** | API Latency (P95) | > 250 ms for 5 min | > 1000 ms for 2 min | Trace slow queries / thread dump |
| **ALT-DB-01** | HikariCP Pool Utilization | > 80% capacity | > 95% capacity | Scale backend replicas / inspect locks |
| **ALT-MEM-01** | JVM Heap / Container RAM | > 75% limit | > 85% limit | Trigger garbage collection alert / scale |
| **ALT-AUD-01** | Cryptographic Audit Tampering | 1 record mismatch | Hash chain broken | Immediate security incident alert |

---

## 4. Runbook: Troubleshooting Common Scenarios

### 4.1 Scenario A: Diagnosing a "403 Forbidden" Work Permit Conflict
- **Symptom**: Field contractor is unable to submit work or ward officer receives a conflict warning when allocating road resurfacing.
- **Root Cause**: The Directed Acyclic Graph (DAG) Dependency Engine enforces sequential physical work order. Road resurfacing cannot proceed while trenching/ducting in the same PIN zone is active or unverified.
- **Verification Step**: Query active dependencies:
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" http://localhost/api/v1/work-assignments/conflicts/zone/WZ-BLR-560001
  ```
- **Remediation**: Complete the prerequisite trenching milestone and obtain quality inspector sign-off to unlock downstream permits.

### 4.2 Scenario B: Cryptographic Audit Chain Verification Alert (`INVALID`)
- **Symptom**: Scheduled integrity verification returns status `INVALID`.
- **Diagnosis**:
  ```bash
  curl -X POST -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost/api/v1/audit-events/integrity/verify
  ```
- **Analysis**: The response JSON includes the exact index and UUID of the corrupted record (`violationDetails`).
- **Remediation**: Check database query logs for direct SQL update/delete statements executed outside the Spring Boot application context. If malicious tampering occurred, isolate the database and initiate the disaster recovery procedure from the latest verified snapshot.

### 4.3 Scenario C: AI Vision Service Unresponsive / High Latency
- **Symptom**: Field evidence uploads time out or take > 30 seconds to return inspection scores.
- **Diagnosis**:
  ```bash
  docker compose -f docker-compose.prod.yml logs --tail=50 ai-service
  ```
- **Remediation**: Check if unoptimized, ultra-high-resolution images (> 20MB) are exhausting container memory. Ensure client-side image compression in the React frontend is enabled. Restart the AI service container if memory consumption exceeds limits:
  ```bash
  docker compose -f docker-compose.prod.yml restart ai-service
  ```
