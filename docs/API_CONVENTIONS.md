# InfraPulse AI — API Conventions & Standards

## 1. URL Path & Versioning Strategy
- **Base URI Prefix**: `/api/v1` for core enterprise business domains.
- **Root Health Probes**:
  - Backend: `GET /api/health` (unauthenticated baseline and container probe).
  - AI Vision Service: `GET /health` (FastAPI liveness probe).
- **Resource Pluralization**: Resource endpoints always use plural nouns:
  - `GET /api/v1/projects`
  - `POST /api/v1/work-zones`
  - `GET /api/v1/vendors`
  - `POST /api/v1/allocations`
  - `POST /api/v1/evidence`
- **Sub-Resource Relationships**:
  - `GET /api/v1/work-zones/{zoneId}/allocations`
  - `POST /api/v1/allocations/{allocationId}/evidence`
  - `GET /api/v1/allocations/{allocationId}/milestones`

---

## 2. Standard HTTP Methods
| HTTP Verb | Operation | Description | Success Code |
| :--- | :--- | :--- | :--- |
| **GET** | Read | Retrieve resource representation or filtered collection | `200 OK` |
| **POST** | Create | Create a new entity or trigger a non-idempotent business action | `201 Created` / `200 OK` |
| **PUT** | Replace | Complete replacement of existing entity state | `200 OK` |
| **PATCH** | Partial Update | Update specific subset of attributes | `200 OK` |
| **DELETE** | Remove | Soft delete or purge an entity | `204 No Content` / `200 OK` |

---

## 3. Standard Response Structure
All business REST responses are wrapped in a predictable, consistent envelope:

### Success Response (`ApiResponse<T>`)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "pinCode": "560001",
    "zoneName": "Central Infrastructure Corridor"
  },
  "timestamp": "2026-10-31T04:30:00.000Z"
}
```

### Paginated Collection Response
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 142,
    "totalPages": 8,
    "last": false
  },
  "timestamp": "2026-10-31T04:30:00.000Z"
}
```

---

## 4. Error Handling & Problem Detail
All errors follow structured JSON envelopes with machine-readable codes and actionable descriptions:

### Validation Error (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Validation failed for one or more fields",
  "data": {
    "errors": [
      {
        "field": "pinCode",
        "rejectedValue": "5600",
        "reason": "PIN code must be exactly 6 numeric digits"
      }
    ]
  },
  "timestamp": "2026-10-31T04:30:00.000Z"
}
```

### Dependency Conflict Error (`409 Conflict`)
```json
{
  "success": false,
  "message": "Dependency Conflict: Prerequisite 'TRENCHING' (Allocation: 104) is incomplete in Zone 'Z-4B'. Road resurfacing cannot be scheduled.",
  "data": {
    "errorCode": "DEPENDENCY_VIOLATION",
    "blockingAllocationId": "104",
    "blockingWorkType": "TRENCHING",
    "requiredStatus": "APPROVED",
    "currentStatus": "IN_PROGRESS"
  },
  "timestamp": "2026-10-31T04:30:00.000Z"
}
```

---

## 5. Security & Authentication Conventions
- Authenticated endpoints require standard Bearer token header:
  `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- Cross-Origin Resource Sharing (CORS) enforces explicit allowed origins via `CORS_ALLOWED_ORIGINS` environment variables.

---

## 6. Human Review & Corrective Action API Conventions (Stage 11)

### 6.1. Endpoints Overview

| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/human-reviews/queue` | `QUALITY_INSPECTOR`, `PROJECT_MANAGER`, `ADMIN` | Fetch queued reviews filtered by priority, reason, status |
| **GET** | `/api/v1/human-reviews/{reviewId}` | `QUALITY_INSPECTOR`, `PROJECT_MANAGER`, `ADMIN` | Fetch complete review dossier (evidence, criteria, findings, measurements, actions) |
| **POST** | `/api/v1/human-reviews/{reviewId}/claim` | `QUALITY_INSPECTOR`, `ADMIN` | Claim ownership of a queued review task |
| **POST** | `/api/v1/human-reviews/{reviewId}/decisions` | `QUALITY_INSPECTOR`, `ADMIN` | Record inspection verdict (`APPROVED`, `APPROVED_WITH_CONDITIONS`, `REJECTED`, `REWORK_REQUIRED`, `ESCALATED`) |
| **POST** | `/api/v1/human-reviews/{reviewId}/escalate` | `QUALITY_INSPECTOR`, `ADMIN` | Escalate review to senior management/project managers |
| **POST** | `/api/v1/physical-measurements` | `QUALITY_INSPECTOR`, `ADMIN` | Record or verify physical measurements against engineering tolerances |
| **POST** | `/api/v1/corrective-actions` | `QUALITY_INSPECTOR`, `ADMIN` | Issue rework notice to vendor with severity and remediation deadline |
| **POST** | `/api/v1/corrective-actions/{id}/vendor-submit`| `VENDOR`, `ADMIN` | Vendor submits remedial proof evidence |
| **POST** | `/api/v1/corrective-actions/{id}/verify` | `QUALITY_INSPECTOR`, `ADMIN` | Verify remediation and close corrective action (**Vendors forbidden**) |
| **GET** | `/api/v1/corrective-actions/vendor/{vendorId}`| `VENDOR`, `QUALITY_INSPECTOR`, `ADMIN` | Fetch assigned corrective actions for a vendor organization |

---

### 6.2. Rule 2 Pre-Validation Error (`422 Unprocessable Entity`)
When an inspector attempts to record an `APPROVED` decision while unresolved non-compliances exist, the Rule 2 engine blocks the transition and returns:

```json
{
  "success": false,
  "message": "Rule 2 Validation Failed: Cannot approve review with unverified/non-compliant measurements or open corrective actions.",
  "data": {
    "errorCode": "RULE2_VALIDATION_FAILED",
    "reviewId": "hr-7729-ab12",
    "blockingReasons": [
      "Physical measurement 'TRENCH_DEPTH_MM' is marked SPECIFICATION_REQUIRED without engineering tolerances.",
      "Corrective action 'CA-104-01' is OPEN and must be remediated and verified before approval."
    ]
  },
  "timestamp": "2026-10-31T04:30:00.000Z"
}
```

### 6.3. Physical Measurement Tolerance Error (`400 Bad Request`)
When a physical measurement is recorded without engineering target specifications or tolerance boundaries:

```json
{
  "success": false,
  "message": "Physical measurements must never auto-pass without engineering specifications.",
  "data": {
    "errorCode": "SPECIFICATION_REQUIRED",
    "parameterName": "CONDUIT_DEPTH_MM",
    "measuredValue": 850.0,
    "unit": "MM",
    "complianceStatus": "SPECIFICATION_REQUIRED"
  },
  "timestamp": "2026-10-31T04:30:00.000Z"
}
```

