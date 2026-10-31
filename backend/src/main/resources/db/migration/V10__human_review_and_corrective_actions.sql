-- V10__human_review_and_corrective_actions.sql
-- Stage 11: Human-in-the-Loop Review, Inspection Decisions & Corrective Action Management

CREATE SEQUENCE IF NOT EXISTS human_review_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS corrective_action_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS measurement_seq START WITH 1001 INCREMENT BY 1;

-- 1. Human Inspection Reviews (Queue & Queue assignment)
CREATE TABLE IF NOT EXISTS human_inspection_reviews (
    id VARCHAR(36) PRIMARY KEY,
    review_code VARCHAR(64) NOT NULL UNIQUE,
    assessment_id VARCHAR(36) NOT NULL REFERENCES quality_assessments(id) ON DELETE CASCADE,
    assignment_id VARCHAR(36) NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(36) REFERENCES users(id),
    review_status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    assigned_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hir_assessment ON human_inspection_reviews(assessment_id);
CREATE INDEX idx_hir_assignment ON human_inspection_reviews(assignment_id);
CREATE INDEX idx_hir_reviewer ON human_inspection_reviews(reviewer_id);
CREATE INDEX idx_hir_status ON human_inspection_reviews(review_status);
CREATE INDEX idx_hir_priority ON human_inspection_reviews(priority);

-- 2. Human Inspection Decisions (Authoritative immutable engineering decisions)
CREATE TABLE IF NOT EXISTS human_inspection_decisions (
    id VARCHAR(36) PRIMARY KEY,
    review_id VARCHAR(36) NOT NULL REFERENCES human_inspection_reviews(id) ON DELETE CASCADE,
    assessment_id VARCHAR(36) NOT NULL REFERENCES quality_assessments(id),
    assignment_id VARCHAR(36) NOT NULL REFERENCES work_assignments(id),
    decision_type VARCHAR(64) NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL REFERENCES users(id),
    reviewer_role VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    comments TEXT,
    previous_decision_id VARCHAR(36) REFERENCES human_inspection_decisions(id),
    decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hid_review ON human_inspection_decisions(review_id);
CREATE INDEX idx_hid_assessment ON human_inspection_decisions(assessment_id);
CREATE INDEX idx_hid_assignment ON human_inspection_decisions(assignment_id);
CREATE INDEX idx_hid_type ON human_inspection_decisions(decision_type);

-- 3. Physical Measurements (Depth, Compaction, Thickness, Material)
CREATE TABLE IF NOT EXISTS physical_measurements (
    id VARCHAR(36) PRIMARY KEY,
    measurement_code VARCHAR(64) NOT NULL UNIQUE,
    assessment_id VARCHAR(36) NOT NULL REFERENCES quality_assessments(id) ON DELETE CASCADE,
    finding_id VARCHAR(36) REFERENCES quality_assessment_findings(id),
    measurement_type VARCHAR(64) NOT NULL,
    measured_value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(32) NOT NULL,
    measurement_method VARCHAR(128),
    instrument_reference VARCHAR(128),
    calibration_reference VARCHAR(128),
    inspector_id VARCHAR(36) NOT NULL REFERENCES users(id),
    specification_reference VARCHAR(255),
    specification_version VARCHAR(64),
    min_acceptable_value DOUBLE PRECISION,
    max_acceptable_value DOUBLE PRECISION,
    verification_status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    remarks TEXT,
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pm_assessment ON physical_measurements(assessment_id);
CREATE INDEX idx_pm_finding ON physical_measurements(finding_id);
CREATE INDEX idx_pm_status ON physical_measurements(verification_status);

-- 4. Corrective Actions
CREATE TABLE IF NOT EXISTS corrective_actions (
    id VARCHAR(36) PRIMARY KEY,
    action_code VARCHAR(64) NOT NULL UNIQUE,
    assessment_id VARCHAR(36) NOT NULL REFERENCES quality_assessments(id) ON DELETE CASCADE,
    assignment_id VARCHAR(36) NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
    finding_id VARCHAR(36) REFERENCES quality_assessment_findings(id),
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id),
    assigned_inspector_id VARCHAR(36) REFERENCES users(id),
    action_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    severity VARCHAR(32) NOT NULL DEFAULT 'HIGH',
    status VARCHAR(64) NOT NULL DEFAULT 'OPEN',
    due_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    vendor_notes TEXT,
    reviewer_remarks TEXT,
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ca_assessment ON corrective_actions(assessment_id);
CREATE INDEX idx_ca_assignment ON corrective_actions(assignment_id);
CREATE INDEX idx_ca_vendor ON corrective_actions(vendor_id);
CREATE INDEX idx_ca_status ON corrective_actions(status);
CREATE INDEX idx_ca_inspector ON corrective_actions(assigned_inspector_id);

-- 5. Corrective Action Evidence
CREATE TABLE IF NOT EXISTS corrective_action_evidence (
    id VARCHAR(36) PRIMARY KEY,
    corrective_action_id VARCHAR(36) NOT NULL REFERENCES corrective_actions(id) ON DELETE CASCADE,
    evidence_id VARCHAR(36) NOT NULL REFERENCES work_evidence(id),
    submitted_by VARCHAR(36) NOT NULL REFERENCES users(id),
    submission_type VARCHAR(64) NOT NULL DEFAULT 'REWORK_COMPLETION',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);

CREATE INDEX idx_cae_action ON corrective_action_evidence(corrective_action_id);
CREATE INDEX idx_cae_evidence ON corrective_action_evidence(evidence_id);

-- 6. Inspection Escalations
CREATE TABLE IF NOT EXISTS inspection_escalations (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL REFERENCES quality_assessments(id) ON DELETE CASCADE,
    review_id VARCHAR(36) NOT NULL REFERENCES human_inspection_reviews(id) ON DELETE CASCADE,
    escalation_reason TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'HIGH',
    escalated_by VARCHAR(36) NOT NULL REFERENCES users(id),
    assigned_role VARCHAR(64),
    assigned_reviewer_id VARCHAR(36) REFERENCES users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ie_assessment ON inspection_escalations(assessment_id);
CREATE INDEX idx_ie_review ON inspection_escalations(review_id);
CREATE INDEX idx_ie_status ON inspection_escalations(status);
