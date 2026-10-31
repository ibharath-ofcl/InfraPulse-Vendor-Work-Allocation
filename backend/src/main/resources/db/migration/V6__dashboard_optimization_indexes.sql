-- InfraPulse AI - Stage 07: Dashboard Optimization Indexes
-- V6__dashboard_optimization_indexes.sql

-- 1. Performance indexes for Work Assignments dashboard filtering & aggregation
CREATE INDEX IF NOT EXISTS idx_assignments_proj_status ON work_assignments(project_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_proj_zone ON work_assignments(project_id, work_zone_id);
CREATE INDEX IF NOT EXISTS idx_assignments_vend_status ON work_assignments(vendor_id, status);

-- 2. Performance indexes for Audit Events timeline queries
CREATE INDEX IF NOT EXISTS idx_audit_events_created_desc ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity_lookup ON audit_events(entity_type, entity_id, created_at DESC);
