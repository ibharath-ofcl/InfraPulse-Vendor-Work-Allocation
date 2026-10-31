-- InfraPulse AI - Projects and Vendors Schema Migration
-- V3__projects_and_vendors.sql: Creates projects, project_manager_assignments, vendors, vendor_service_categories, and project_vendors tables

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    primary_pincode VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    target_end_date DATE NOT NULL,
    actual_end_date DATE,
    budget NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
    project_manager_id VARCHAR(36) REFERENCES users(id),
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_project_dates CHECK (target_end_date >= start_date),
    CONSTRAINT chk_project_budget CHECK (budget > 0)
);

CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_pm ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_pincode ON projects(primary_pincode);
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- 2. Project Manager Assignments History Table
CREATE TABLE IF NOT EXISTS project_manager_assignments (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    manager_id VARCHAR(36) NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(36) NOT NULL REFERENCES users(id),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_pm_assignments_project ON project_manager_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_assignments_manager ON project_manager_assignments(manager_id);

-- 3. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(36) PRIMARY KEY,
    vendor_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    alternate_phone VARCHAR(50),
    address_line VARCHAR(255),
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20) NOT NULL,
    gst_number VARCHAR(50),
    registration_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    user_id VARCHAR(36) REFERENCES users(id),
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_pincode ON vendors(pincode);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);

-- 4. Vendor Service Categories Table (Normalized enum representation)
CREATE TABLE IF NOT EXISTS vendor_service_categories (
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    service_category VARCHAR(50) NOT NULL,
    PRIMARY KEY (vendor_id, service_category)
);

CREATE INDEX IF NOT EXISTS idx_vendor_services_cat ON vendor_service_categories(service_category);

-- 5. Project-Vendor Association Join Table
CREATE TABLE IF NOT EXISTS project_vendors (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    association_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    associated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    associated_by VARCHAR(36) NOT NULL REFERENCES users(id),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_project_vendors_proj ON project_vendors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_vendors_vnd ON project_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_project_vendors_status ON project_vendors(association_status);

-- 6. Audit Events Table
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36) REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

