-- V11__milestone_management_and_payment_authorization.sql
-- Stage 12: Milestone Management, Vendor Payment Requests & Simulated Payment Authorization

CREATE SEQUENCE IF NOT EXISTS agreement_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS milestone_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS payment_request_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS payment_auth_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS financial_txn_seq START WITH 1001 INCREMENT BY 1;

-- 1. Vendor Agreements
CREATE TABLE IF NOT EXISTS vendor_agreements (
    id VARCHAR(36) PRIMARY KEY,
    agreement_code VARCHAR(64) NOT NULL UNIQUE,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    contract_reference VARCHAR(128) NOT NULL,
    contract_value NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_terms TEXT,
    retention_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    current_version INT NOT NULL DEFAULT 1,
    supporting_document_url TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_va_project ON vendor_agreements(project_id);
CREATE INDEX idx_va_vendor ON vendor_agreements(vendor_id);
CREATE INDEX idx_va_status ON vendor_agreements(status);
CREATE INDEX idx_va_code ON vendor_agreements(agreement_code);

-- 2. Vendor Agreement Versions
CREATE TABLE IF NOT EXISTS vendor_agreement_versions (
    id VARCHAR(36) PRIMARY KEY,
    agreement_id VARCHAR(36) NOT NULL REFERENCES vendor_agreements(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    contract_value NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_terms TEXT,
    retention_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    commercial_terms_snapshot TEXT,
    change_reason TEXT,
    changed_by VARCHAR(36) REFERENCES users(id),
    approved_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vav_agreement ON vendor_agreement_versions(agreement_id);
CREATE INDEX idx_vav_version ON vendor_agreement_versions(agreement_id, version_number);

-- 3. Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id VARCHAR(36) PRIMARY KEY,
    milestone_code VARCHAR(64) NOT NULL UNIQUE,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agreement_id VARCHAR(36) NOT NULL REFERENCES vendor_agreements(id) ON DELETE CASCADE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    sequence_number INT NOT NULL DEFAULT 1,
    milestone_type VARCHAR(64),
    milestone_value NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    percentage_of_contract NUMERIC(5, 2),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_completion_date DATE,
    status VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
    payment_policy VARCHAR(64) NOT NULL DEFAULT 'SINGLE_PAYMENT',
    created_by VARCHAR(36) REFERENCES users(id),
    approved_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pm_project ON project_milestones(project_id);
CREATE INDEX idx_pm_agreement ON project_milestones(agreement_id);
CREATE INDEX idx_pm_vendor ON project_milestones(vendor_id);
CREATE INDEX idx_pm_status ON project_milestones(status);
CREATE INDEX idx_pm_code ON project_milestones(milestone_code);

-- 4. Milestone Work Assignments Mapping
CREATE TABLE IF NOT EXISTS milestone_work_assignments (
    id VARCHAR(36) PRIMARY KEY,
    milestone_id VARCHAR(36) NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
    assignment_id VARCHAR(36) NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_milestone_assignment UNIQUE (milestone_id, assignment_id)
);

CREATE INDEX idx_mwa_milestone ON milestone_work_assignments(milestone_id);
CREATE INDEX idx_mwa_assignment ON milestone_work_assignments(assignment_id);

-- 5. Milestone Verifications
CREATE TABLE IF NOT EXISTS milestone_verifications (
    id VARCHAR(36) PRIMARY KEY,
    milestone_id VARCHAR(36) NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
    verification_status VARCHAR(64) NOT NULL,
    eligibility_result BOOLEAN NOT NULL,
    reason TEXT,
    blocking_conditions TEXT,
    verified_by VARCHAR(36) REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mv_milestone ON milestone_verifications(milestone_id);
CREATE INDEX idx_mv_status ON milestone_verifications(verification_status);

-- 6. Vendor Payment Requests
CREATE TABLE IF NOT EXISTS vendor_payment_requests (
    id VARCHAR(36) PRIMARY KEY,
    payment_request_code VARCHAR(64) NOT NULL UNIQUE,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agreement_id VARCHAR(36) NOT NULL REFERENCES vendor_agreements(id) ON DELETE CASCADE,
    milestone_id VARCHAR(36) NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    invoice_number VARCHAR(128) NOT NULL,
    invoice_date DATE NOT NULL,
    requested_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    description TEXT,
    supporting_document_url TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finance_reviewer_id VARCHAR(36) REFERENCES users(id),
    decision_reason TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_vpr_invoice UNIQUE (project_id, vendor_id, invoice_number)
);

CREATE INDEX idx_vpr_project ON vendor_payment_requests(project_id);
CREATE INDEX idx_vpr_vendor ON vendor_payment_requests(vendor_id);
CREATE INDEX idx_vpr_milestone ON vendor_payment_requests(milestone_id);
CREATE INDEX idx_vpr_status ON vendor_payment_requests(status);
CREATE INDEX idx_vpr_code ON vendor_payment_requests(payment_request_code);

-- 7. Payment Request Documents
CREATE TABLE IF NOT EXISTS payment_request_documents (
    id VARCHAR(36) PRIMARY KEY,
    payment_request_id VARCHAR(36) NOT NULL REFERENCES vendor_payment_requests(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    evidence_or_document_reference TEXT NOT NULL,
    document_type VARCHAR(64) NOT NULL,
    uploaded_by VARCHAR(36) REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prd_request ON payment_request_documents(payment_request_id);

-- 8. Invoice Verifications
CREATE TABLE IF NOT EXISTS invoice_verifications (
    id VARCHAR(36) PRIMARY KEY,
    payment_request_id VARCHAR(36) NOT NULL REFERENCES vendor_payment_requests(id) ON DELETE CASCADE,
    verified_by VARCHAR(36) NOT NULL REFERENCES users(id),
    verification_status VARCHAR(64) NOT NULL,
    verification_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_iv_request ON invoice_verifications(payment_request_id);

-- 9. Financial Approval Decisions
CREATE TABLE IF NOT EXISTS financial_approval_decisions (
    id VARCHAR(36) PRIMARY KEY,
    payment_request_id VARCHAR(36) NOT NULL REFERENCES vendor_payment_requests(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(36) NOT NULL REFERENCES users(id),
    reviewer_role VARCHAR(64) NOT NULL,
    decision_type VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    comments TEXT,
    approved_amount NUMERIC(15, 2),
    previous_decision_id VARCHAR(36) REFERENCES financial_approval_decisions(id),
    decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fad_request ON financial_approval_decisions(payment_request_id);
CREATE INDEX idx_fad_reviewer ON financial_approval_decisions(reviewer_id);
CREATE INDEX idx_fad_type ON financial_approval_decisions(decision_type);

-- 10. Payment Authorizations
CREATE TABLE IF NOT EXISTS payment_authorizations (
    id VARCHAR(36) PRIMARY KEY,
    payment_code VARCHAR(64) NOT NULL UNIQUE,
    payment_request_id VARCHAR(36) NOT NULL REFERENCES vendor_payment_requests(id),
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    milestone_id VARCHAR(36) NOT NULL REFERENCES project_milestones(id),
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id),
    authorized_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    authorization_reference VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(64) NOT NULL DEFAULT 'AUTHORIZED',
    simulation_disclaimer VARCHAR(255) NOT NULL DEFAULT 'SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED',
    authorized_by VARCHAR(36) NOT NULL REFERENCES users(id),
    authorized_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pa_request ON payment_authorizations(payment_request_id);
CREATE INDEX idx_pa_milestone ON payment_authorizations(milestone_id);
CREATE INDEX idx_pa_vendor ON payment_authorizations(vendor_id);
CREATE INDEX idx_pa_status ON payment_authorizations(status);
CREATE INDEX idx_pa_code ON payment_authorizations(payment_code);

-- 11. Financial Transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(36) PRIMARY KEY,
    payment_authorization_id VARCHAR(36) NOT NULL REFERENCES payment_authorizations(id) ON DELETE CASCADE,
    transaction_type VARCHAR(64) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    transaction_reference VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(64) NOT NULL,
    description TEXT,
    simulation_mode BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ft_auth ON financial_transactions(payment_authorization_id);
CREATE INDEX idx_ft_type ON financial_transactions(transaction_type);
