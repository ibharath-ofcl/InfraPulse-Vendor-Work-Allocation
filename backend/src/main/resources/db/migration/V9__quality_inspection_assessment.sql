-- V9__quality_inspection_assessment.sql
-- Stage 10: AI Infrastructure Quality Inspection Engine

CREATE SEQUENCE IF NOT EXISTS quality_assessment_seq START WITH 1001 INCREMENT BY 1;

-- Inspection Templates
CREATE TABLE IF NOT EXISTS quality_inspection_templates (
    id VARCHAR(36) PRIMARY KEY,
    template_code VARCHAR(50) NOT NULL UNIQUE,
    work_type VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qit_work_type ON quality_inspection_templates(work_type);

-- Inspection Criteria
CREATE TABLE IF NOT EXISTS quality_inspection_criteria (
    id VARCHAR(36) PRIMARY KEY,
    template_id VARCHAR(36) NOT NULL REFERENCES quality_inspection_templates(id) ON DELETE CASCADE,
    criterion_code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    severity VARCHAR(32) NOT NULL DEFAULT 'HIGH',
    target_detection_class VARCHAR(64),
    evaluation_rule_json TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_criteria_template_code UNIQUE (template_id, criterion_code)
);

CREATE INDEX idx_qic_template ON quality_inspection_criteria(template_id);
CREATE INDEX idx_qic_category ON quality_inspection_criteria(category);

-- Quality Assessments
CREATE TABLE IF NOT EXISTS quality_assessments (
    id VARCHAR(36) PRIMARY KEY,
    assessment_code VARCHAR(64) NOT NULL UNIQUE,
    assignment_id VARCHAR(36) NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
    template_id VARCHAR(36) NOT NULL REFERENCES quality_inspection_templates(id),
    template_version VARCHAR(32) NOT NULL,
    status VARCHAR(64) NOT NULL,
    evidence_completeness_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_criteria_evaluated INT NOT NULL DEFAULT 0,
    passed_criteria_count INT NOT NULL DEFAULT 0,
    flagged_criteria_count INT NOT NULL DEFAULT 0,
    failed_criteria_count INT NOT NULL DEFAULT 0,
    findings_count INT NOT NULL DEFAULT 0,
    predecessor_assessment_id VARCHAR(36) REFERENCES quality_assessments(id),
    revision_number INT NOT NULL DEFAULT 1,
    evaluation_summary TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qa_assignment ON quality_assessments(assignment_id);
CREATE INDEX idx_qa_status ON quality_assessments(status);
CREATE INDEX idx_qa_predecessor ON quality_assessments(predecessor_assessment_id);

-- Quality Assessment Findings
CREATE TABLE IF NOT EXISTS quality_assessment_findings (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL REFERENCES quality_assessments(id) ON DELETE CASCADE,
    criterion_id VARCHAR(36) REFERENCES quality_inspection_criteria(id),
    criterion_code VARCHAR(50) NOT NULL,
    criterion_name VARCHAR(200) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    outcome VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_id VARCHAR(36) REFERENCES work_evidence(id),
    detection_id VARCHAR(36),
    technical_notes TEXT,
    suggested_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qaf_assessment ON quality_assessment_findings(assessment_id);
CREATE INDEX idx_qaf_outcome ON quality_assessment_findings(outcome);
CREATE INDEX idx_qaf_evidence ON quality_assessment_findings(evidence_id);

-- Seed Default Inspection Templates
INSERT INTO quality_inspection_templates (id, template_code, work_type, name, version, description, is_active, created_at, updated_at)
VALUES
('tmpl-trench-001', 'QIT-TRENCHING-V1', 'TRENCHING', 'Trenching & Excavation Quality Checklist', '1.0.0', 'Mandatory quality inspection checklist for trench excavation, barricading, and physical depth verification.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tmpl-cable-001', 'QIT-CABLE-V1', 'UNDERGROUND_CABLE_INSTALLATION', 'Underground Cable Laying Quality Checklist', '1.0.0', 'Mandatory quality inspection for conduit integrity, cable bedding, and depth compliance.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tmpl-backfill-001', 'QIT-BACKFILL-V1', 'BACKFILLING', 'Backfilling & Compaction Quality Checklist', '1.0.0', 'Mandatory quality inspection for layer-by-layer backfill compaction and soil density.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tmpl-road-001', 'QIT-ROAD-V1', 'ROAD_RESURFACING', 'Road Resurfacing & Pavement Quality Checklist', '1.0.0', 'Mandatory quality inspection for asphalt thickness, surface cracks, potholes, and compaction.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tmpl-final-001', 'QIT-FINAL-V1', 'FINAL_INSPECTION', 'Comprehensive Infrastructure Final Inspection', '1.0.0', 'Final comprehensive engineering inspection across all deliverables and site restoration.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Criteria for TRENCHING
INSERT INTO quality_inspection_criteria (id, template_id, criterion_code, name, description, category, is_mandatory, severity, target_detection_class, evaluation_rule_json, order_index, created_at)
VALUES
('crit-tr-01', 'tmpl-trench-001', 'TR-EVD-COMPL', 'Photographic Evidence Completeness', 'Requires photographic evidence across WORK_IN_PROGRESS, BEFORE_WORK, and AFTER_WORK phases.', 'EVIDENCE_COMPLETENESS', TRUE, 'CRITICAL', NULL, '{"min_photos": 2, "required_categories": ["WORK_IN_PROGRESS", "AFTER_WORK"]}', 1, CURRENT_TIMESTAMP),
('crit-tr-02', 'tmpl-trench-001', 'TR-IMG-QUAL', 'Optical Clarity and Lighting', 'Images must not be severely blurred or underexposed so physical site features can be examined.', 'IMAGE_QUALITY', TRUE, 'HIGH', NULL, '{"min_blur_score": 50.0, "min_contrast_score": 15.0}', 2, CURRENT_TIMESTAMP),
('crit-tr-03', 'tmpl-trench-001', 'TR-BAR-PRES', 'Trench Edge & Excavation Recognition', 'Automated computer vision detection of active excavation boundary and safety edge.', 'VISUAL_DETECTION', FALSE, 'MEDIUM', 'excavation_trench', '{"confidence_threshold": 0.50}', 3, CURRENT_TIMESTAMP),
('crit-tr-04', 'tmpl-trench-001', 'TR-SURF-CRACK', 'Structural Sidewall Crack Check', 'Sidewall fracture or surface cracking check along trench margins.', 'VISUAL_DETECTION', TRUE, 'HIGH', 'crack', '{"max_allowed_detections": 0, "confidence_threshold": 0.60}', 4, CURRENT_TIMESTAMP),
('crit-tr-05', 'tmpl-trench-001', 'TR-PHYS-DEPTH', 'Physical Trench Depth Verification', 'Physical measurement required: 2D photographs cannot reliably verify hidden depth. Must be confirmed with authorized calibrated measurement against project specification.', 'PHYSICAL_MEASUREMENT', TRUE, 'CRITICAL', NULL, '{"measurement_type": "TRENCH_DEPTH", "requires_authorized_spec": true}', 5, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Criteria for ROAD_RESURFACING
INSERT INTO quality_inspection_criteria (id, template_id, criterion_code, name, description, category, is_mandatory, severity, target_detection_class, evaluation_rule_json, order_index, created_at)
VALUES
('crit-rd-01', 'tmpl-road-001', 'RD-EVD-COMPL', 'Resurfacing Evidence Completeness', 'Evidence documenting complete resurfaced segment.', 'EVIDENCE_COMPLETENESS', TRUE, 'CRITICAL', NULL, '{"min_photos": 2, "required_categories": ["WORK_IN_PROGRESS", "AFTER_WORK"]}', 1, CURRENT_TIMESTAMP),
('crit-rd-02', 'tmpl-road-001', 'RD-POTHOLE-CHK', 'Pothole & Cavity Detection', 'Verification that no unpaved potholes remain on the finished surface.', 'VISUAL_DETECTION', TRUE, 'CRITICAL', 'pothole', '{"max_allowed_detections": 0, "confidence_threshold": 0.60}', 2, CURRENT_TIMESTAMP),
('crit-rd-03', 'tmpl-road-001', 'RD-CRACK-CHK', 'Surface Crack Inspection', 'Surface crack detection on freshly laid pavement.', 'VISUAL_DETECTION', TRUE, 'HIGH', 'crack', '{"max_allowed_detections": 0, "confidence_threshold": 0.60}', 3, CURRENT_TIMESTAMP),
('crit-rd-04', 'tmpl-road-001', 'RD-THICK-VERIF', 'Asphalt Layer Thickness Verification', 'Physical core test measurement of asphalt layer thickness against project specification.', 'PHYSICAL_MEASUREMENT', TRUE, 'CRITICAL', NULL, '{"measurement_type": "ASPHALT_THICKNESS", "requires_authorized_spec": true}', 4, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
