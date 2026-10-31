-- InfraPulse AI - Database Initialization
-- V1__init.sql: Enable PostGIS extension and establish baseline migration

CREATE EXTENSION IF NOT EXISTS postgis;

-- Baseline metadata table for system health & migration verification
CREATE TABLE IF NOT EXISTS system_metadata (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_metadata (key, value)
VALUES ('schema_version', '1.0.0'), ('platform', 'InfraPulse AI')
ON CONFLICT (key) DO NOTHING;
