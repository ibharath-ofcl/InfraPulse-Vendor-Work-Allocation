-- InfraPulse AI - Stage 13: Use Case 2 Compliance & Advanced Verification Enhancements
-- V13__use_case_2_verification_enhancements.sql

-- 1. Enhance work_zones with geofence and exclusive lock configurations
ALTER TABLE work_zones
    ADD COLUMN IF NOT EXISTS geofence_radius_meters INT NOT NULL DEFAULT 500,
    ADD COLUMN IF NOT EXISTS boundary_polygon_json TEXT,
    ADD COLUMN IF NOT EXISTS is_exclusive_lock_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_work_zones_exclusive_lock ON work_zones(is_exclusive_lock_enabled);

-- 2. Enhance work_evidence with GPS accuracy, dual timestamps, geofence status, perceptual hash, duplicate detection, and device integrity
ALTER TABLE work_evidence
    ADD COLUMN IF NOT EXISTS gps_accuracy_meters NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS server_receipt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS geofence_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED_NO_GPS',
    ADD COLUMN IF NOT EXISTS distance_from_zone_center_meters NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS perceptual_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS duplicate_status VARCHAR(32) NOT NULL DEFAULT 'UNIQUE',
    ADD COLUMN IF NOT EXISTS duplicate_of_evidence_id VARCHAR(36) REFERENCES work_evidence(id),
    ADD COLUMN IF NOT EXISTS device_orientation_json TEXT,
    ADD COLUMN IF NOT EXISTS device_integrity_status VARCHAR(32) NOT NULL DEFAULT 'WEB_UNATTESTED';

CREATE INDEX IF NOT EXISTS idx_evidence_geofence_status ON work_evidence(geofence_status);
CREATE INDEX IF NOT EXISTS idx_evidence_perceptual_hash ON work_evidence(perceptual_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_duplicate_status ON work_evidence(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_evidence_device_integrity ON work_evidence(device_integrity_status);
CREATE INDEX IF NOT EXISTS idx_evidence_server_receipt ON work_evidence(server_receipt_timestamp);

-- 3. Enhance quality_inspection_templates with contract reference and 85% passing score threshold
ALTER TABLE quality_inspection_templates
    ADD COLUMN IF NOT EXISTS contract_reference VARCHAR(128),
    ADD COLUMN IF NOT EXISTS effective_start_date DATE,
    ADD COLUMN IF NOT EXISTS effective_end_date DATE,
    ADD COLUMN IF NOT EXISTS passing_score_threshold NUMERIC(5, 2) NOT NULL DEFAULT 85.00;

-- Update existing default templates with contract references and standard effective dates
UPDATE quality_inspection_templates
SET contract_reference = 'INFRA-STD-SPEC-2026-V1',
    effective_start_date = '2026-01-01',
    effective_end_date = '2028-12-31',
    passing_score_threshold = 85.00
WHERE contract_reference IS NULL;
