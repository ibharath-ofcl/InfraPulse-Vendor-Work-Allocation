-- InfraPulse AI - Stage 13 Migration
-- V12__enterprise_audit_and_vendor_analytics.sql: Enterprise Audit Trail, Tamper Evidence, and Vendor Analytics

-- 1. Sequences for Audit Codes and Report Codes
CREATE SEQUENCE IF NOT EXISTS audit_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS report_seq START WITH 1001;

-- 2. Alter existing audit_events table to support rich enterprise schema & tamper-evident chaining
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS event_code VARCHAR(64);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS actor_role VARCHAR(32);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS actor_name VARCHAR(100);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS event_category VARCHAR(50);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS action VARCHAR(100);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS entity_reference VARCHAR(100);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS project_id VARCHAR(36);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(36);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS outcome VARCHAR(32) DEFAULT 'SUCCESS';
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(64);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS source_module VARCHAR(50);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS before_state TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS after_state TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS event_payload TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS event_hash VARCHAR(64);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS chain_scope VARCHAR(100) DEFAULT 'GLOBAL';
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS sequence_number BIGINT;

-- Indexes on audit_events
CREATE INDEX IF NOT EXISTS idx_audit_events_code ON audit_events(event_code);
CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_events_project ON audit_events(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_vendor ON audit_events(vendor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_outcome ON audit_events(outcome);
CREATE INDEX IF NOT EXISTS idx_audit_events_chain ON audit_events(chain_scope, sequence_number);

-- 3. Audit Chain Heads Table (For tamper-evident sequencing and verification)
CREATE TABLE IF NOT EXISTS audit_chain_heads (
    id VARCHAR(36) PRIMARY KEY,
    chain_scope VARCHAR(100) UNIQUE NOT NULL,
    last_sequence BIGINT NOT NULL DEFAULT 0,
    last_event_hash VARCHAR(64) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default global chain head
INSERT INTO audit_chain_heads (id, chain_scope, last_sequence, last_event_hash, updated_at)
VALUES ('chain-head-global', 'GLOBAL', 0, '0000000000000000000000000000000000000000000000000000000000000000', CURRENT_TIMESTAMP)
ON CONFLICT (chain_scope) DO NOTHING;

-- 4. Vendor Scoring Configurations Table
CREATE TABLE IF NOT EXISTS vendor_scoring_configurations (
    id VARCHAR(36) PRIMARY KEY,
    configuration_name VARCHAR(100) NOT NULL,
    version INT NOT NULL,
    quality_weight DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
    on_time_weight DECIMAL(5, 2) NOT NULL DEFAULT 25.00,
    evidence_weight DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    rework_weight DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
    completion_weight DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_scoring_active ON vendor_scoring_configurations(active);

-- Seed Default Scoring Configuration (v1: Quality 30%, On-Time 25%, Evidence 15%, Rework 20%, Completion 10%)
INSERT INTO vendor_scoring_configurations (
    id, configuration_name, version, quality_weight, on_time_weight, evidence_weight, rework_weight, completion_weight, active, created_at
) VALUES (
    'cfg-default-v1', 'Standard Enterprise Infrastructure Weighting', 1, 30.00, 25.00, 15.00, 20.00, 10.00, TRUE, CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 5. Vendor Performance Snapshots Table
CREATE TABLE IF NOT EXISTS vendor_performance_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    vendor_id VARCHAR(36) REFERENCES vendors(id) NOT NULL,
    project_id VARCHAR(36) REFERENCES projects(id),
    scoring_configuration_id VARCHAR(36) REFERENCES vendor_scoring_configurations(id),
    period_start DATE,
    period_end DATE,
    completion_rate DECIMAL(6, 2),
    on_time_rate DECIMAL(6, 2),
    quality_pass_rate DECIMAL(6, 2),
    evidence_compliance_rate DECIMAL(6, 2),
    rework_rate DECIMAL(6, 2),
    inspection_turnaround_hours DECIMAL(8, 2),
    corrective_action_resolution_hours DECIMAL(8, 2),
    workload_count INT DEFAULT 0,
    overall_score DECIMAL(6, 2),
    data_sufficiency_status VARCHAR(32) NOT NULL DEFAULT 'SUFFICIENT_DATA',
    sample_counts TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_perf_snapshot_vendor ON vendor_performance_snapshots(vendor_id);
CREATE INDEX IF NOT EXISTS idx_perf_snapshot_project ON vendor_performance_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_perf_snapshot_calc ON vendor_performance_snapshots(calculated_at);

-- 6. Analytics Report Jobs Table
CREATE TABLE IF NOT EXISTS analytics_report_jobs (
    id VARCHAR(36) PRIMARY KEY,
    report_code VARCHAR(64) UNIQUE,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    requested_by VARCHAR(36) REFERENCES users(id) NOT NULL,
    format VARCHAR(16) NOT NULL DEFAULT 'CSV',
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    filter_parameters TEXT,
    record_count INT DEFAULT 0,
    output_reference TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_report_jobs_user ON analytics_report_jobs(requested_by);
CREATE INDEX IF NOT EXISTS idx_report_jobs_type ON analytics_report_jobs(report_type);
CREATE INDEX IF NOT EXISTS idx_report_jobs_created ON analytics_report_jobs(created_at);
