-- InfraPulse AI - Photo Evidence Management Migration
-- V7__photo_evidence_management.sql: Creates work_evidence table, sequence, and indexes

-- 1. Concurrency-Safe Sequence for Evidence Codes
CREATE SEQUENCE IF NOT EXISTS work_evidence_seq START WITH 1001 INCREMENT BY 1;

-- 2. Work Evidence Table
CREATE TABLE IF NOT EXISTS work_evidence (
    id VARCHAR(36) PRIMARY KEY,
    evidence_code VARCHAR(50) UNIQUE NOT NULL,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_zone_id VARCHAR(36) NOT NULL REFERENCES work_zones(id) ON DELETE CASCADE,
    assignment_id VARCHAR(36) NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(36) NOT NULL REFERENCES users(id),
    evidence_category VARCHAR(64) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    preview_storage_key VARCHAR(500),
    storage_provider VARCHAR(32) NOT NULL DEFAULT 'LOCAL',
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    image_width INTEGER,
    image_height INTEGER,
    capture_timestamp TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    metadata_json TEXT,
    processing_status VARCHAR(32) NOT NULL DEFAULT 'UPLOADED',
    review_status VARCHAR(32) NOT NULL DEFAULT 'NOT_REVIEWED',
    review_notes TEXT,
    reviewed_by VARCHAR(36) REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes for Performance and Scoped Retrieval
CREATE INDEX IF NOT EXISTS idx_evidence_assignment ON work_evidence(assignment_id);
CREATE INDEX IF NOT EXISTS idx_evidence_project ON work_evidence(project_id);
CREATE INDEX IF NOT EXISTS idx_evidence_work_zone ON work_evidence(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_evidence_vendor ON work_evidence(vendor_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploader ON work_evidence(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_evidence_category ON work_evidence(evidence_category);
CREATE INDEX IF NOT EXISTS idx_evidence_code ON work_evidence(evidence_code);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_at ON work_evidence(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_evidence_processing_status ON work_evidence(processing_status);
CREATE INDEX IF NOT EXISTS idx_evidence_review_status ON work_evidence(review_status);
CREATE INDEX IF NOT EXISTS idx_evidence_is_deleted ON work_evidence(is_deleted);
