-- InfraPulse AI - Intelligence Suite Schema Migration
-- V15__intelligence_suite.sql: Contract Intelligence, Defect Intelligence & Predictive Risk Engine

-- 1. Concurrency-Safe Sequences
CREATE SEQUENCE IF NOT EXISTS contract_code_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS requirement_code_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS defect_code_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS risk_assessment_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS risk_alert_seq START WITH 1001 INCREMENT BY 1;

-- 2. Project Contracts
CREATE TABLE IF NOT EXISTS project_contracts (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contract_code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    contractor_id VARCHAR(36) REFERENCES vendors(id),
    contract_type VARCHAR(64) NOT NULL DEFAULT 'CIVIL_INFRASTRUCTURE',
    total_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    version_number INT NOT NULL DEFAULT 1,
    uploaded_by VARCHAR(36) REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_project ON project_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contractor ON project_contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON project_contracts(status);

-- 3. Contract Documents
CREATE TABLE IF NOT EXISTS contract_documents (
    id VARCHAR(36) PRIMARY KEY,
    contract_id VARCHAR(36) NOT NULL REFERENCES project_contracts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    extraction_status VARCHAR(32) NOT NULL DEFAULT 'UPLOADED',
    extracted_text_preview TEXT,
    extracted_requirements_count INT DEFAULT 0,
    version INT DEFAULT 1,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(36) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_contract_docs_contract ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_docs_hash ON contract_documents(sha256_hash);

-- 4. Contract Requirements (Structured Requirements Library)
CREATE TABLE IF NOT EXISTS contract_requirements (
    id VARCHAR(36) PRIMARY KEY,
    requirement_code VARCHAR(64) UNIQUE NOT NULL,
    contract_id VARCHAR(36) NOT NULL REFERENCES project_contracts(id) ON DELETE CASCADE,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_package VARCHAR(128) NOT NULL,
    work_zone_id VARCHAR(36) REFERENCES work_zones(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'SPECIFICATION',
    acceptance_criteria TEXT NOT NULL,
    measurement_unit VARCHAR(32),
    required_value VARCHAR(64),
    permitted_tolerance VARCHAR(64),
    mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    requires_human_inspection BOOLEAN NOT NULL DEFAULT TRUE,
    requires_physical_measurement BOOLEAN NOT NULL DEFAULT FALSE,
    verification_method VARCHAR(64) NOT NULL DEFAULT 'PHOTO_EVIDENCE',
    approval_status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    approved_by VARCHAR(36) REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_req_contract ON contract_requirements(contract_id);
CREATE INDEX IF NOT EXISTS idx_req_project ON contract_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_req_zone ON contract_requirements(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_req_approval_status ON contract_requirements(approval_status);
CREATE INDEX IF NOT EXISTS idx_req_category ON contract_requirements(category);

-- 5. Contract Requirement Evidence Mapping
CREATE TABLE IF NOT EXISTS contract_requirement_evidence (
    id VARCHAR(36) PRIMARY KEY,
    requirement_id VARCHAR(36) NOT NULL REFERENCES contract_requirements(id) ON DELETE CASCADE,
    evidence_id VARCHAR(36) REFERENCES work_evidence(id),
    assignment_id VARCHAR(36) REFERENCES work_assignments(id),
    status VARCHAR(32) NOT NULL DEFAULT 'EVIDENCE_PENDING',
    measured_value VARCHAR(64),
    measurement_unit VARCHAR(32),
    physical_measurement_tool VARCHAR(128),
    measurement_notes TEXT,
    measured_by VARCHAR(36) REFERENCES users(id),
    measured_at TIMESTAMP WITH TIME ZONE,
    waiver_reason TEXT,
    waived_by VARCHAR(36) REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_req_evid_req ON contract_requirement_evidence(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_evid_evid ON contract_requirement_evidence(evidence_id);
CREATE INDEX IF NOT EXISTS idx_req_evid_assign ON contract_requirement_evidence(assignment_id);
CREATE INDEX IF NOT EXISTS idx_req_evid_status ON contract_requirement_evidence(status);

-- 6. Infrastructure Defects Master Table
CREATE TABLE IF NOT EXISTS infrastructure_defects (
    id VARCHAR(36) PRIMARY KEY,
    defect_code VARCHAR(64) UNIQUE NOT NULL,
    evidence_id VARCHAR(36) REFERENCES work_evidence(id),
    assignment_id VARCHAR(36) REFERENCES work_assignments(id),
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_zone_id VARCHAR(36) REFERENCES work_zones(id),
    vendor_id VARCHAR(36) REFERENCES vendors(id),
    category VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'DETECTED',
    confidence NUMERIC(5, 4),
    bounding_box_json TEXT,
    model_id VARCHAR(64),
    model_version VARCHAR(32),
    description TEXT NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_cluster_id VARCHAR(36),
    recurrence_count INT DEFAULT 0,
    initial_detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(36) REFERENCES users(id),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_defects_project ON infrastructure_defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_zone ON infrastructure_defects(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_defects_vendor ON infrastructure_defects(vendor_id);
CREATE INDEX IF NOT EXISTS idx_defects_category ON infrastructure_defects(category);
CREATE INDEX IF NOT EXISTS idx_defects_status ON infrastructure_defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_recurring ON infrastructure_defects(is_recurring);

-- 7. Defect Similarity Candidates (Recurring Matching Engine)
CREATE TABLE IF NOT EXISTS defect_similarity_candidates (
    id VARCHAR(36) PRIMARY KEY,
    defect_id VARCHAR(36) NOT NULL REFERENCES infrastructure_defects(id) ON DELETE CASCADE,
    candidate_defect_id VARCHAR(36) NOT NULL REFERENCES infrastructure_defects(id),
    similarity_score NUMERIC(5, 4) NOT NULL,
    spatial_distance_meters NUMERIC(10, 2),
    temporal_distance_days INT,
    comparison_basis VARCHAR(128) NOT NULL,
    human_confirmed BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_defect_sim_defect ON defect_similarity_candidates(defect_id);
CREATE INDEX IF NOT EXISTS idx_defect_sim_candidate ON defect_similarity_candidates(candidate_defect_id);

-- 8. Defect History Events (Full Audit Log of Defect Transitions)
CREATE TABLE IF NOT EXISTS defect_history_events (
    id VARCHAR(36) PRIMARY KEY,
    defect_id VARCHAR(36) NOT NULL REFERENCES infrastructure_defects(id) ON DELETE CASCADE,
    previous_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    action_taken VARCHAR(128) NOT NULL,
    notes TEXT,
    actor_id VARCHAR(36) REFERENCES users(id),
    actor_role VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_defect_hist_defect ON defect_history_events(defect_id);

-- 9. Project Risk Assessments
CREATE TABLE IF NOT EXISTS project_risk_assessments (
    id VARCHAR(36) PRIMARY KEY,
    assessment_code VARCHAR(64) UNIQUE NOT NULL,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_zone_id VARCHAR(36) REFERENCES work_zones(id),
    overall_risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    schedule_risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    vendor_risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    quality_risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    resource_risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    dependency_risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    calculation_method VARCHAR(64) NOT NULL DEFAULT 'DETERMINISTIC_RULES_V1',
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_assess_project ON project_risk_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_assess_level ON project_risk_assessments(overall_risk_level);

-- 10. Project Risk Alerts (Explainable Alerts Engine)
CREATE TABLE IF NOT EXISTS project_risk_alerts (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) REFERENCES project_risk_assessments(id) ON DELETE CASCADE,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_zone_id VARCHAR(36) REFERENCES work_zones(id),
    vendor_id VARCHAR(36) REFERENCES vendors(id),
    work_assignment_id VARCHAR(36) REFERENCES work_assignments(id),
    risk_category VARCHAR(64) NOT NULL,
    risk_level VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    supporting_evidence_data TEXT NOT NULL,
    root_cause_reason TEXT NOT NULL,
    operational_impact TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    missing_data_notes TEXT,
    alert_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    resolved_by VARCHAR(36) REFERENCES users(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_alerts_project ON project_risk_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_category ON project_risk_alerts(risk_category);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_level ON project_risk_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON project_risk_alerts(alert_status);
