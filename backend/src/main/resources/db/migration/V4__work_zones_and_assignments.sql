-- InfraPulse AI - Work Zones and Work Assignments Schema Migration
-- V4__work_zones_and_assignments.sql: Creates work_zones table, sequence, and work_assignments table

-- 1. Work Zones Table
CREATE TABLE IF NOT EXISTS work_zones (
    id VARCHAR(36) PRIMARY KEY,
    zone_code VARCHAR(50) UNIQUE NOT NULL,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    zone_name VARCHAR(255) NOT NULL,
    description TEXT,
    pincode VARCHAR(20) NOT NULL,
    locality VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    center_latitude NUMERIC(10, 6),
    center_longitude NUMERIC(10, 6),
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_zones_project ON work_zones(project_id);
CREATE INDEX IF NOT EXISTS idx_work_zones_pincode ON work_zones(pincode);
CREATE INDEX IF NOT EXISTS idx_work_zones_code ON work_zones(zone_code);
CREATE INDEX IF NOT EXISTS idx_work_zones_status ON work_zones(status);
CREATE INDEX IF NOT EXISTS idx_work_zones_locality ON work_zones(locality);

-- 2. Concurrency-Safe Sequence for Assignment Codes
CREATE SEQUENCE IF NOT EXISTS work_assignment_seq START WITH 1001 INCREMENT BY 1;

-- 3. Work Assignments Table
CREATE TABLE IF NOT EXISTS work_assignments (
    id VARCHAR(36) PRIMARY KEY,
    assignment_code VARCHAR(50) UNIQUE NOT NULL,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_zone_id VARCHAR(36) NOT NULL REFERENCES work_zones(id) ON DELETE CASCADE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    work_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    planned_start_date DATE NOT NULL,
    target_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'ASSIGNED',
    instructions TEXT,
    cancellation_reason TEXT,
    rejection_reason TEXT,
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_assignment_dates CHECK (target_end_date >= planned_start_date)
);

CREATE INDEX IF NOT EXISTS idx_assignments_project ON work_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_zone ON work_assignments(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_assignments_vendor ON work_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_code ON work_assignments(assignment_code);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON work_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_priority ON work_assignments(priority);
CREATE INDEX IF NOT EXISTS idx_assignments_work_type ON work_assignments(work_type);
CREATE INDEX IF NOT EXISTS idx_assignments_dates ON work_assignments(planned_start_date, target_end_date);
