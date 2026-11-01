-- InfraPulse AI - WorkerTrust Module Schema Migration
-- V14__workertrust_module.sql: Comprehensive Worker Identity, Verification, Lifecycle & Site Safety Schema

-- 1. Concurrency-Safe Sequence for Worker Codes
CREATE SEQUENCE IF NOT EXISTS worker_code_seq START WITH 100001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS worker_incident_seq START WITH 1001 INCREMENT BY 1;

-- 2. Workers Master Table
CREATE TABLE IF NOT EXISTS workers (
    id VARCHAR(36) PRIMARY KEY,
    worker_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    photo_reference VARCHAR(500),
    mobile_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    date_of_birth DATE,
    current_status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
    job_role VARCHAR(100) NOT NULL DEFAULT 'GENERAL_WORKER',
    skills_experience TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workers_code ON workers(worker_code);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(current_status);
CREATE INDEX IF NOT EXISTS idx_workers_mobile ON workers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_workers_created_by ON workers(created_by);

-- 3. Worker-Vendor Associations Table
CREATE TABLE IF NOT EXISTS worker_vendor_associations (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    association_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_vendor_worker ON worker_vendor_associations(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_vendor_vendor ON worker_vendor_associations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_worker_vendor_status ON worker_vendor_associations(association_status);

-- 4. Worker Consent Records (DPDP Act / Privacy Compliance)
CREATE TABLE IF NOT EXISTS worker_consents (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    consent_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    recorded_by VARCHAR(36) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_worker_consents_worker ON worker_consents(worker_id);

-- 5. Worker Documents (Encrypted & Masked Storage References)
CREATE TABLE IF NOT EXISTS worker_documents (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    secure_storage_reference VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    document_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    review_notes TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(36) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_worker_documents_worker ON worker_documents(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_documents_status ON worker_documents(document_status);

-- 6. Identity Verifications (Masked, Non-Sensitive References, No Full Aadhaar/PAN)
CREATE TABLE IF NOT EXISTS worker_identity_verifications (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    verification_method VARCHAR(100) NOT NULL,
    verification_reference VARCHAR(255),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    verified_by VARCHAR(36) REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_verif_worker ON worker_identity_verifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_verif_status ON worker_identity_verifications(verification_status);

-- 7. Skills & Safety Certifications
CREATE TABLE IF NOT EXISTS worker_certifications (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    certification_type VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(255) NOT NULL,
    certificate_number VARCHAR(100),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    document_reference VARCHAR(500),
    verified_by VARCHAR(36) REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_certs_worker ON worker_certifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_certs_type ON worker_certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_worker_certs_expiry ON worker_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_worker_certs_status ON worker_certifications(verification_status);

-- 8. Formal Review & Approval Decisions
CREATE TABLE IF NOT EXISTS worker_approvals (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(36) NOT NULL REFERENCES users(id),
    decision VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_approvals_worker ON worker_approvals(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_approvals_reviewer ON worker_approvals(reviewer_id);

-- 9. Worker Project & Work Zone Assignments
CREATE TABLE IF NOT EXISTS worker_project_assignments (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_zone_id VARCHAR(36) NOT NULL REFERENCES work_zones(id) ON DELETE CASCADE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    assignment_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    required_role VARCHAR(100),
    assigned_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_assign_worker ON worker_project_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_assign_project ON worker_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_assign_zone ON worker_project_assignments(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_worker_assign_vendor ON worker_project_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_worker_assign_status ON worker_project_assignments(assignment_status);

-- 10. QR Credentials (Opaque Hash Only)
CREATE TABLE IF NOT EXISTS worker_qr_credentials (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    credential_payload TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    credential_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    issued_by VARCHAR(36) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_worker_qr_token_hash ON worker_qr_credentials(token_hash);
CREATE INDEX IF NOT EXISTS idx_worker_qr_worker ON worker_qr_credentials(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_qr_status ON worker_qr_credentials(credential_status);

-- 11. Site Access & Attendance Logs
CREATE TABLE IF NOT EXISTS worker_site_access (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    project_id VARCHAR(36) REFERENCES projects(id),
    work_zone_id VARCHAR(36) REFERENCES work_zones(id),
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    access_status VARCHAR(50) NOT NULL,
    recording_officer_id VARCHAR(36) REFERENCES users(id),
    blocking_reason VARCHAR(255),
    device_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_site_worker ON worker_site_access(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_site_project ON worker_site_access(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_site_zone ON worker_site_access(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_worker_site_entry ON worker_site_access(entry_time);
CREATE INDEX IF NOT EXISTS idx_worker_site_exit ON worker_site_access(exit_time);
CREATE INDEX IF NOT EXISTS idx_worker_site_status ON worker_site_access(access_status);

-- 12. Site Safety Incidents
CREATE TABLE IF NOT EXISTS worker_incidents (
    id VARCHAR(36) PRIMARY KEY,
    incident_reference VARCHAR(50) UNIQUE NOT NULL,
    project_id VARCHAR(36) REFERENCES projects(id),
    work_zone_id VARCHAR(36) REFERENCES work_zones(id),
    worker_id VARCHAR(36) REFERENCES workers(id),
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    immediate_action_taken TEXT,
    incident_status VARCHAR(50) NOT NULL DEFAULT 'REPORTED',
    reported_by VARCHAR(36) NOT NULL REFERENCES users(id),
    assigned_investigator_id VARCHAR(36) REFERENCES users(id),
    resolution TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_worker_incidents_ref ON worker_incidents(incident_reference);
CREATE INDEX IF NOT EXISTS idx_worker_incidents_project ON worker_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_incidents_zone ON worker_incidents(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_worker_incidents_worker ON worker_incidents(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_incidents_status ON worker_incidents(incident_status);

-- 13. Worker Access Suspensions
CREATE TABLE IF NOT EXISTS worker_access_suspensions (
    id VARCHAR(36) PRIMARY KEY,
    worker_id VARCHAR(36) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    imposed_by VARCHAR(36) NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    review_date DATE,
    end_time TIMESTAMP WITH TIME ZONE,
    suspension_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_worker_susp_worker ON worker_access_suspensions(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_susp_status ON worker_access_suspensions(suspension_status);

-- 14. Worker Notifications Table
CREATE TABLE IF NOT EXISTS worker_notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(36),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_notif_recipient ON worker_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_worker_notif_read ON worker_notifications(read_at);

