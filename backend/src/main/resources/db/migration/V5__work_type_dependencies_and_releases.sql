-- InfraPulse AI - Stage 06: Dependency & Conflict Prevention Engine Migration
-- V5__work_type_dependencies_and_releases.sql

-- 1. Add Prerequisite Release Fields to work_assignments
ALTER TABLE work_assignments 
    ADD COLUMN IF NOT EXISTS release_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_RELEASE',
    ADD COLUMN IF NOT EXISTS released_by VARCHAR(36) REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS released_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS release_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_assignments_release_status ON work_assignments(release_status);

-- 2. Create work_type_dependencies Table
CREATE TABLE IF NOT EXISTS work_type_dependencies (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
    predecessor_work_type VARCHAR(64) NOT NULL,
    successor_work_type VARCHAR(64) NOT NULL,
    required_predecessor_status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    requires_release_approval BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wtd_successor ON work_type_dependencies(successor_work_type);
CREATE INDEX IF NOT EXISTS idx_wtd_predecessor ON work_type_dependencies(predecessor_work_type);
CREATE INDEX IF NOT EXISTS idx_wtd_project ON work_type_dependencies(project_id);
CREATE INDEX IF NOT EXISTS idx_wtd_active ON work_type_dependencies(is_active);

-- 3. Seed Default Infrastructure Lifecycle Dependency Rules (Global Scope: project_id IS NULL)
INSERT INTO work_type_dependencies (
    id, project_id, predecessor_work_type, successor_work_type, 
    required_predecessor_status, requires_release_approval, is_active, priority, description
) VALUES
    ('dep-rule-001', NULL, 'TRENCHING', 'UNDERGROUND_CABLE_INSTALLATION', 'COMPLETED', TRUE, TRUE, 1, 'Excavation and trench preparation must be completed and released before laying underground cables.'),
    ('dep-rule-002', NULL, 'UNDERGROUND_CABLE_INSTALLATION', 'BACKFILLING', 'COMPLETED', TRUE, TRUE, 2, 'Underground cable installation must be completed and released before trench backfilling and compaction.'),
    ('dep-rule-003', NULL, 'BACKFILLING', 'ROAD_RESURFACING', 'COMPLETED', TRUE, TRUE, 3, 'Trench backfilling and sub-base restoration must be completed and released before road asphalt resurfacing.'),
    ('dep-rule-004', NULL, 'ROAD_RESURFACING', 'FINAL_INSPECTION', 'COMPLETED', TRUE, TRUE, 4, 'Road surface asphalt restoration must be completed and released before final quality inspection signoff.')
ON CONFLICT (id) DO NOTHING;
