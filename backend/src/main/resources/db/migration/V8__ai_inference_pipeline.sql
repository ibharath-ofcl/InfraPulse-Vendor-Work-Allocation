-- V8__ai_inference_pipeline.sql
-- Stage 09: AI Computer Vision Engine & Infrastructure Image Analysis Persistence

CREATE SEQUENCE IF NOT EXISTS ai_inference_seq START WITH 1001 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS ai_inferences (
    id VARCHAR(36) PRIMARY KEY,
    inference_code VARCHAR(64) NOT NULL UNIQUE,
    evidence_id VARCHAR(36) NOT NULL REFERENCES work_evidence(id),
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    assignment_id VARCHAR(36) NOT NULL REFERENCES work_assignments(id),
    model_id VARCHAR(64) NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    inference_type VARCHAR(64) NOT NULL,
    processing_status VARCHAR(32) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms BIGINT,
    error_code VARCHAR(64),
    error_message TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_detections (
    id VARCHAR(36) PRIMARY KEY,
    inference_id VARCHAR(36) NOT NULL REFERENCES ai_inferences(id) ON DELETE CASCADE,
    class_id VARCHAR(64) NOT NULL,
    class_label VARCHAR(128) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    bounding_box_json TEXT NOT NULL,
    segmentation_reference VARCHAR(256),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_image_quality (
    id VARCHAR(36) PRIMARY KEY,
    inference_id VARCHAR(36) NOT NULL REFERENCES ai_inferences(id) ON DELETE CASCADE,
    resolution_width INT NOT NULL,
    resolution_height INT NOT NULL,
    blur_score DOUBLE PRECISION NOT NULL,
    brightness_score DOUBLE PRECISION NOT NULL,
    contrast_score DOUBLE PRECISION NOT NULL,
    quality_status VARCHAR(64) NOT NULL,
    warnings_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_inferences_evidence_id ON ai_inferences(evidence_id);
CREATE INDEX IF NOT EXISTS idx_ai_inferences_assignment_id ON ai_inferences(assignment_id);
CREATE INDEX IF NOT EXISTS idx_ai_inferences_project_id ON ai_inferences(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_inferences_status ON ai_inferences(processing_status);
CREATE INDEX IF NOT EXISTS idx_ai_detections_inference_id ON ai_detections(inference_id);
CREATE INDEX IF NOT EXISTS idx_ai_detections_class_id ON ai_detections(class_id);
CREATE INDEX IF NOT EXISTS idx_ai_quality_inference_id ON ai_image_quality(inference_id);
