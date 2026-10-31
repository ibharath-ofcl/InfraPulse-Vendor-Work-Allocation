# InfraPulse AI — Production Database Guide

**Stage**: Stage 15 — Final Production Release, Deployment & Official Project Handover  
**Target Database**: PostgreSQL 16.x with PostGIS 3.4+ Extension  
**Classification**: Infrastructure & Database Operations  
**Status**: APPROVED & VERIFIED  

---

## 1. Overview & Architecture

InfraPulse AI relies on a relational and geospatial data layer powered by **PostgreSQL 16** with the **PostGIS 3.4** extension. The database houses critical municipal records:
- Master project registries and commercial agreements
- Geospatial work zones (`geometry(Polygon, 4326)`) and postal PIN code mappings
- Directed Acyclic Graph (DAG) dependency nodes and permits
- Work assignment state machines and contractor milestones
- EXIF-extracted photographic evidence metadata
- Human inspection verdicts, physical ground measurements, and rework tracking
- Digitally authorized payment vouchers and settlement references
- Cryptographically chained SHA-256 audit event logs

---

## 2. Least-Privilege Role & User Governance

Under no circumstances should the application connect to the production database using the administrative `postgres` superuser.

### 2.1 Role Creation Script
Execute the following provisioning script as the database administrator (`postgres`) during initial infrastructure bootstrap:

```sql
-- 1. Create dedicated application role with strong authentication
CREATE ROLE infrapulse_app WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOINHERIT
    NOREPLICATION
    CONNECTION LIMIT 50
    ENCRYPTED PASSWORD 'REPLACE_WITH_SECURE_STRONG_DB_PASSWORD_MIN_24_CHARS';

-- 2. Create the production database owned by the application role
CREATE DATABASE infrapulse_db
    WITH OWNER = infrapulse_app
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- 3. Connect to the target database to enable PostGIS
\c infrapulse_db

-- PostGIS requires superuser or trusted extension creation privileges
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4. Grant table & schema permissions to infrapulse_app
GRANT USAGE, CREATE ON SCHEMA public TO infrapulse_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO infrapulse_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO infrapulse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO infrapulse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO infrapulse_app;

-- 5. Revoke dangerous public permissions
REVOKE ALL ON DATABASE infrapulse_db FROM PUBLIC;
GRANT CONNECT ON DATABASE infrapulse_db TO infrapulse_app;
```

---

## 3. Flyway Migration Lifecycle

Database schema versions are strictly tracked and applied using **Flyway**.
- **Migration Location**: `backend/src/main/resources/db/migration`
- **History Table**: `flyway_schema_history`
- **Baseline Version**: `0` (enables clean initialization and safe upgrades)
- **Validation**: On application startup, Flyway compares file checksums against `flyway_schema_history`. If an already executed migration file has been modified, startup fails fast with a `FlywayException` to prevent schema drift.

### 3.1 Rules for Enterprise Migrations
1. **Forward-Only Migrations**: Once a migration (e.g. `V1__init_schema.sql`) has executed in staging or production, its file content must **never** be edited.
2. **Compensating Migrations**: Any schema corrections, index additions, or column alterations must be authored as a new, sequential migration file (e.g. `V2__add_index.sql`).
3. **Non-Destructive DDL**: Avoid destructive `DROP COLUMN` or `DROP TABLE` operations on live production without a multi-phase deprecation window.

---

## 4. Connection Pool Sizing & Tuning (HikariCP)

The Spring Boot backend uses HikariCP for high-performance connection pooling. Production settings must be tuned based on available database hardware and concurrent traffic:

| Parameter | Recommended Value | Description |
| :--- | :---: | :--- |
| `maximum-pool-size` | `20` | Max physical JDBC connections per backend replica. |
| `minimum-idle` | `5` | Keeps 5 warm connections in reserve to eliminate handshake latency. |
| `idle-timeout` | `30000` (30s) | Reclaims idle connections above minimum-idle. |
| `connection-timeout`| `20000` (20s) | Throws `SQLTransientConnectionException` if pool is exhausted after 20s. |
| `max-lifetime` | `1800000` (30m)| Replaces connections before database-side TCP timeouts occur. |

---

## 5. Persistent Storage & Health Probes

### 5.1 Storage Volume Requirements
- **Local / Docker**: Named volume `postgres_data` mapped to `/var/lib/postgresql/data`. Must reside on fast SSD/NVMe storage.
- **Cloud (AWS RDS / GCP Cloud SQL)**: Multi-AZ deployment with automated daily backups, gp3 or provisioned IOPS storage, and minimum 50GB allocated storage with autogrow enabled.

### 5.2 Health Probes
Production orchestrators (Kubernetes / Docker Compose) must use non-intrusive health checks:
```bash
# Periodic Liveness / Readiness Probe
pg_isready -h localhost -p 5432 -U infrapulse_app -d infrapulse_db
```
- Interval: 10s
- Timeout: 5s
- Retries: 5

---

## 6. Backup, Restoration & Disaster Recovery

### 6.1 Automated Daily Logical Backup (`pg_dump`)
Run a daily logical snapshot script via cron or scheduled container:
```bash
#!/usr/bin/env bash
set -eo pipefail

BACKUP_DIR="/var/backups/infrapulse/db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/infrapulse_db_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

# Execute custom-format compressed backup
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -F c \
    -b \
    -v \
    -f "${BACKUP_FILE}"

# Encrypt backup using GPG or upload to secure private S3 bucket
# Keep 30 days of daily backups locally
find "${BACKUP_DIR}" -type f -name "*.dump" -mtime +30 -delete

echo "Backup completed successfully: ${BACKUP_FILE}"
```

### 6.2 Full Database Restoration Procedure
In the event of hardware failure or disaster recovery:
```bash
# 1. Stop backend service to prevent incoming traffic
docker stop infrapulse-backend

# 2. Terminate existing connections to the database
psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'infrapulse_db' AND pid <> pg_backend_pid();"

# 3. Drop and recreate clean database
dropdb -U postgres infrapulse_db
createdb -U postgres -O infrapulse_app infrapulse_db
psql -U postgres -d infrapulse_db -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# 4. Restore from compressed archive
pg_restore -U infrapulse_app -d infrapulse_db -v "/var/backups/infrapulse/db/infrapulse_db_20261031_020000.dump"

# 5. Verify database integrity
psql -U infrapulse_app -d infrapulse_db -c "SELECT count(*) FROM audit_events; SELECT count(*) FROM work_assignments;"

# 6. Restart backend service
docker start infrapulse-backend
```

---

## 7. Migration Rollback Limitations

In production relational databases:
- **Automatic Rollback**: Flyway Community Edition does **not** provide automatic rollback of DDL statements.
- **Transactional DDL**: PostgreSQL supports transactional DDL for most operations (e.g. `CREATE TABLE`, `ADD COLUMN`). If a migration fails mid-way, the entire transaction rolls back, leaving the database at the previous valid version.
- **Rollback Strategy**: If a deployed migration must be reverted, author a forward compensating migration (e.g. `V15__revert_feature_x.sql`) rather than attempting manual database edits.
