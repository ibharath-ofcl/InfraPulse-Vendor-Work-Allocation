# InfraPulse AI — Database Design Strategy

## 1. Initial Database Strategy
InfraPulse AI adopts an evolutionary schema strategy driven by versioned Flyway migrations.
- **Stage 1 Baseline**: Establishes PostgreSQL 16 connectivity, activates the PostGIS spatial engine, and registers a baseline `system_metadata` table for environment validation.
- **Subsequent Stages**: Incremental migrations will introduce domain entities with strict foreign key integrity, spatial constraints, and indexing.

---

## 2. PostgreSQL & PostGIS Purpose
Infrastructure lifecycle management is fundamentally spatial:
1. **Postal PIN Codes & Municipal Wards**: Work is bounded by municipal administrative boundaries and 6-digit postal codes.
2. **PostGIS Geometry**: Storing spatial coordinates as `GEOMETRY(Polygon, 4326)` allows:
   - Calculating spatial intersections (`ST_Intersects`) between planned trenching routes and road resurfacing polygons.
   - Determining whether two vendors are assigned conflicting work packages within the same physical street parcel.
   - Validating whether uploaded photographic evidence matches the actual coordinates of the work zone (`ST_DWithin(photo_geom, zone_geom, 50 meters)`).

---

## 3. Entity-Relationship Blueprint (Target Architecture)

```mermaid
erDiagram
    PROJECT ||--o{ WORK_ZONE : contains
    WORK_ZONE ||--o{ WORK_ASSIGNMENT : allocates
    VENDOR ||--o{ WORK_ASSIGNMENT : receives
    WORK_TYPE ||--o{ WORK_ASSIGNMENT : classifies
    WORK_TYPE ||--o{ QUALITY_INSPECTION_TEMPLATE : defines
    QUALITY_INSPECTION_TEMPLATE ||--o{ QUALITY_INSPECTION_CRITERIA : contains
    WORK_ASSIGNMENT ||--o{ DEPENDENCY : "prerequisite / successor"
    WORK_ASSIGNMENT ||--o{ EVIDENCE : submits
    EVIDENCE ||--o{ AI_INSPECTION : evaluates
    WORK_ASSIGNMENT ||--o{ QUALITY_ASSESSMENT : assesses
    QUALITY_ASSESSMENT ||--o{ QUALITY_FINDING : produces
    WORK_ASSIGNMENT ||--o{ HUMAN_INSPECTION_REVIEW : routes
    HUMAN_INSPECTION_REVIEW ||--o{ REVIEW_DECISION : records
    HUMAN_INSPECTION_REVIEW ||--o{ PHYSICAL_MEASUREMENT : verifies
    HUMAN_INSPECTION_REVIEW ||--o{ CORRECTIVE_ACTION : issues
    CORRECTIVE_ACTION ||--o{ CORRECTIVE_ACTION_EVIDENCE : remediates
    HUMAN_INSPECTION_REVIEW ||--o{ INSPECTION_ESCALATION : escalates
    WORK_ASSIGNMENT ||--o{ MILESTONE : generates
    MILESTONE ||--o{ PAYMENT_AUTHORIZATION : authorizes
    WORK_ASSIGNMENT ||--o{ AUDIT_LOG : tracks
```

---

## 4. Planned Entities & Schema Specifications

### 4.1. Projects & Work Zones
- **`projects`**: High-level municipal or infrastructure contract initiatives.
  - `id` (UUID, PK)
  - `name`, `code`, `description`
  - `status` (`DRAFT`, `ACTIVE`, `COMPLETED`, `SUSPENDED`)
  - `start_date`, `target_end_date`
  - `created_at`, `updated_at`

- **`work_zones`**: Geospatial subdivisions mapped to municipal PIN codes.
  - `id` (UUID, PK)
  - `project_id` (UUID, FK -> `projects`)
  - `pin_code` (VARCHAR(10), Indexed)
  - `zone_code`, `zone_name` (e.g., "Ward 104 - Koramangala 5th Block")
  - `boundary_geom` (GEOMETRY(Polygon, 4326), Spatial Index)
  - `center_point` (GEOMETRY(Point, 4326))

### 4.2. Vendors & Work Types
- **`vendors`**: Contracting organizations performing physical construction.
  - `id` (UUID, PK)
  - `company_name`, `registration_no`, `tax_id`
  - `contact_email`, `contact_phone`
  - `status` (`ACTIVE`, `PROBATION`, `SUSPENDED`)
  - `rating_score` (DECIMAL(3, 2))

- **`work_types`**: Standard catalog of physical infrastructure activities.
  - `id` (UUID, PK)
  - `code` (e.g., `TRENCHING`, `CONDUIT_LAYING`, `BACKFILLING`, `ROAD_RESURFACING`)
  - `name`, `description`
  - `standard_duration_days`

### 4.3. Work Assignments & Dependency Rules
- **`work_assignments`**: Specific task allocations issued to vendors in a zone.
  - `id` (UUID, PK)
  - `work_zone_id` (UUID, FK -> `work_zones`)
  - `vendor_id` (UUID, FK -> `vendors`)
  - `work_type_id` (UUID, FK -> `work_types`)
  - `status` (`ASSIGNED`, `IN_PROGRESS`, `SUBMITTED`, `VERIFIED`, `APPROVED`, `BLOCKED`, `REJECTED`)
  - `scheduled_start`, `scheduled_end`
  - `actual_completion_date`

- **`work_dependencies`**: Hard sequential constraints between activities.
  - `id` (UUID, PK)
  - `prerequisite_assignment_id` (UUID, FK -> `work_assignments`)
  - `dependent_assignment_id` (UUID, FK -> `work_assignments`)
  - `dependency_type` (`FINISH_TO_START`, `START_TO_START`)
  - `is_mandatory` (BOOLEAN, default TRUE)

### 4.4. Photographic Evidence & AI Quality Inspection
- **`evidence`**: Multimedia submissions uploaded by field vendors.
  - `id` (UUID, PK)
  - `assignment_id` (UUID, FK -> `work_assignments`)
  - `file_url`, `file_hash_sha256` (Tamper-detection)
  - `capture_timestamp` (TIMESTAMP WITH TIME ZONE)
  - `location_geom` (GEOMETRY(Point, 4326))
  - `metadata_json` (EXIF data, device ID, camera params)

- **`inspections`**: AI vision inferences and human QA decisions.
  - `id` (UUID, PK)
  - `evidence_id` (UUID, FK -> `evidence`)
  - `ai_confidence_score` (DECIMAL(5, 4))
  - `ai_verdict` (`PASSED`, `FAILED`, `AMBIGUOUS`)
  - `ai_inference_payload` (JSONB - detected features, bounding boxes, defects)
  - `human_reviewer_id` (UUID, NULLable)
  - `human_verdict` (`CONFIRMED`, `OVERRIDDEN`, `REJECTED`)
  - `reviewer_notes` (TEXT)

### 4.5. Milestones, Payments & Audit Trail
- **`milestones`**: Financial payment gates associated with verified work packages.
  - `id` (UUID, PK)
  - `assignment_id` (UUID, FK -> `work_assignments`)
  - `milestone_name`, `amount_currency`, `amount_value`
  - `eligibility_status` (`LOCKED`, `ELIGIBLE`, `AUTHORIZED`, `DISBURSED`)
  - `authorized_by`, `authorized_at`

- **`audit_records`**: Immutable, append-only security log for compliance and analytics.
  - `id` (BIGSERIAL, PK)
  - `entity_type` (VARCHAR(50))
  - `entity_id` (VARCHAR(100))
  - `action` (`CREATED`, `STATE_TRANSITION`, `EVIDENCE_UPLOAD`, `AI_EVALUATED`, `MILESTONE_RELEASED`)
  - `actor_id`, `actor_role`
  - `previous_state` (JSONB)
  - `new_state` (JSONB)
  - `ip_address`, `timestamp`

### 4.6. Stage 10 — AI Quality Inspection & Criteria Engine (`V9`)
- **`quality_inspection_templates`**: Standard inspection definitions tied to specific infrastructure `work_types`.
  - `id` (VARCHAR(64), PK)
  - `work_type` (VARCHAR(64), Indexed)
  - `name`, `description`, `version` (VARCHAR)
  - `pass_threshold_score`, `review_threshold_score` (DECIMAL(5, 2))
  - `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE)

- **`quality_inspection_criteria`**: Granular visual and technical requirements under a template.
  - `id` (VARCHAR(64), PK)
  - `template_id` (VARCHAR(64), FK -> `quality_inspection_templates`)
  - `code` (e.g., `TRENCH_DEPTH_VERIFICATION`, `SAFETY_BARRICADE_COMPLIANCE`)
  - `name`, `description`, `category` (`STRUCTURAL`, `SAFETY`, `DIMENSIONAL`, `FINISH`)
  - `weight` (DECIMAL(5, 2)), `is_mandatory` (BOOLEAN), `is_critical` (BOOLEAN)
  - `min_confidence_score` (DECIMAL(5, 4))
  - `display_order` (INTEGER)

- **`quality_assessments`**: Evaluated inspection run against a work assignment.
  - `id` (VARCHAR(64), PK)
  - `assignment_id` (VARCHAR(64), FK -> `work_assignments`, Indexed)
  - `template_id` (VARCHAR(64), FK -> `quality_inspection_templates`)
  - `status` (`PENDING`, `IN_PROGRESS`, `PASSED`, `FAILED`, `FLAGGED_FOR_REVIEW`, `INCONCLUSIVE`)
  - `overall_score` (DECIMAL(5, 2)), `overall_confidence` (DECIMAL(5, 4))
  - `criteria_evaluated_count`, `criteria_passed_count`, `critical_failures_count` (INTEGER)
  - `is_complete` (BOOLEAN)
  - `evaluated_at`, `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE)

- **`quality_findings`**: Specific defects or criteria-level evaluations.
  - `id` (VARCHAR(64), PK)
  - `assessment_id` (VARCHAR(64), FK -> `quality_assessments`, Indexed)
  - `criterion_id` (VARCHAR(64), FK -> `quality_inspection_criteria`)
  - `evidence_id` (VARCHAR(64), FK -> `work_evidence`, NULLable)
  - `status` (`PASSED`, `FAILED`, `FLAGGED_FOR_REVIEW`, `INCONCLUSIVE`)
  - `score` (DECIMAL(5, 2)), `confidence` (DECIMAL(5, 4))
  - `finding_type` (`DEFECT`, `COMPLIANCE`, `ANOMALY`, `MEASUREMENT_VARIATION`)
  - `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `description`, `recommendation` (TEXT)
  - `bounding_box` (JSONB - coordinates & labels)
  - `created_at` (TIMESTAMP WITH TIME ZONE)

### 4.7. Stage 11 — Human Review, Physical Measurements & Corrective Actions (`V10`)
- **`human_inspection_reviews`**: HITL review task queued for quality inspectors.
  - `id` (VARCHAR(64), PK)
  - `assignment_id` (VARCHAR(64), FK -> `work_assignments`, Indexed)
  - `assessment_id` (VARCHAR(64), FK -> `quality_assessments`, Indexed)
  - `status` (`QUEUED`, `CLAIMED`, `IN_REVIEW`, `COMPLETED`, `ESCALATED`)
  - `priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `URGENT`)
  - `routing_reason` (`AI_FLAGGED_FOR_REVIEW`, `CRITICAL_FAILURE`, `LOW_CONFIDENCE`, `MANDATORY_HUMAN_AUDIT`, `VENDOR_DISPUTE`)
  - `assigned_reviewer_id` (VARCHAR(64), FK -> `users`, NULLable)
  - `claimed_at`, `due_at`, `completed_at` (TIMESTAMP WITH TIME ZONE)
  - `checklist_snapshot` (JSONB)

- **`review_decisions`**: Final or staged human inspection verdicts.
  - `id` (VARCHAR(64), PK)
  - `review_id` (VARCHAR(64), FK -> `human_inspection_reviews`, Indexed)
  - `decision` (`APPROVED`, `APPROVED_WITH_CONDITIONS`, `REJECTED`, `REWORK_REQUIRED`, `ESCALATED`)
  - `reviewer_id` (VARCHAR(64), FK -> `users`)
  - `notes`, `internal_remarks` (TEXT)
  - `override_ai_verdict` (BOOLEAN), `override_justification` (TEXT)
  - `decided_at` (TIMESTAMP WITH TIME ZONE)

- **`physical_measurements`**: Strict engineering metric records checked against required tolerances.
  - `id` (VARCHAR(64), PK)
  - `review_id` (VARCHAR(64), FK -> `human_inspection_reviews`, Indexed)
  - `parameter_name` (e.g., `TRENCH_DEPTH_MM`, `CONDUIT_DIAMETER_MM`)
  - `measured_value` (DECIMAL(12, 4)), `unit` (VARCHAR(32))
  - `target_specification`, `min_tolerance`, `max_tolerance` (DECIMAL(12, 4))
  - `compliance_status` (`IN_SPEC`, `OUT_OF_SPEC`, `CRITICAL_DEVIATION`, `SPECIFICATION_REQUIRED`)
  - `measurement_method` (`AI_ESTIMATED`, `MANUAL_CALIPER`, `SURVEYOR_ROD`, `TOTAL_STATION`, `ULTRASONIC`)
  - `verified_by_inspector` (BOOLEAN)
  - *Constraint*: Measurements never auto-pass if engineering specifications are missing (`SPECIFICATION_REQUIRED`).

- **`corrective_actions`**: Formal rework notices issued to vendors for non-compliant work.
  - `id` (VARCHAR(64), PK)
  - `review_id` (VARCHAR(64), FK -> `human_inspection_reviews`, Indexed)
  - `assignment_id` (VARCHAR(64), FK -> `work_assignments`, Indexed)
  - `vendor_id` (VARCHAR(64), FK -> `vendors`, Indexed)
  - `title`, `description` (TEXT)
  - `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `status` (`OPEN`, `IN_PROGRESS`, `VENDOR_SUBMITTED`, `VERIFIED_CLOSED`, `REJECTED`)
  - `due_date` (TIMESTAMP WITH TIME ZONE)
  - `issued_by_id` (VARCHAR(64), FK -> `users`)
  - `verified_by_id` (VARCHAR(64), FK -> `users`, NULLable)
  - `vendor_resolution_notes`, `rejection_reason` (TEXT)
  - *Security Enforcement*: Vendors are prohibited from closing their own corrective actions (`403 Forbidden`).

- **`corrective_action_evidence`**: Remediation evidence submitted by vendors.
  - `id` (VARCHAR(64), PK)
  - `corrective_action_id` (VARCHAR(64), FK -> `corrective_actions`, Indexed)
  - `evidence_id` (VARCHAR(64), FK -> `work_evidence`)
  - `submitted_by_id` (VARCHAR(64), FK -> `users`)
  - `notes` (TEXT), `submitted_at` (TIMESTAMP WITH TIME ZONE)

- **`inspection_escalations`**: Escalations dispatched to Project Managers and Chief Quality Officers.
  - `id` (VARCHAR(64), PK)
  - `review_id` (VARCHAR(64), FK -> `human_inspection_reviews`, Indexed)
  - `escalated_by_id` (VARCHAR(64), FK -> `users`)
  - `escalation_level` (`TIER_1_SUPERVISOR`, `TIER_2_PROJECT_MANAGER`, `TIER_3_DIRECTOR_ENGINEERING`)
  - `reason`, `notes`, `resolution_notes` (TEXT)
  - `is_resolved` (BOOLEAN), `resolved_at` (TIMESTAMP WITH TIME ZONE)

