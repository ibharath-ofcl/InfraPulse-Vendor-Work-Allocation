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
