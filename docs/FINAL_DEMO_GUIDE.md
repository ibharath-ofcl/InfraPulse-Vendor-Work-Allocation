# InfraPulse AI — Final Technical Demonstration Guide

**Stage**: Stage 15 — Final Production Release, Deployment & Official Project Handover  
**Target Release**: v1.0.0  
**Demonstration Scenario**: Chennai Fiber Infrastructure Expansion (Smart City PIN Corridor)  
**Classification**: Evaluator Walkthrough & System Validation  
**Status**: APPROVED & REPRODUCIBLE  

---

## 1. Demonstration Scenario & Synthetic Context

This guide provides technical evaluators, architects, and stakeholders with a complete, reproducible walkthrough of the InfraPulse AI platform.

### Scenario Background:
- **Project Name**: `[DEMO] Chennai Fiber Infrastructure Expansion`
- **Location & Zone**: `WZ-CHN-600001` (Anna Salai Tech Corridor, PIN: 600001)
- **Primary Contractor (Vendor 1)**: `Apex Trenching & Optical Ducting Ltd.` (`DEMO-VND-001`)
- **Secondary Contractor (Vendor 2)**: `Coromandel Roadways & Resurfacing Corp.` (`DEMO-VND-002`)

> [!NOTE]
> All accounts, vendors, permits, and financial figures used in this walkthrough are **SYNTHETIC DEMONSTRATION DATA**. No real money is transferred, and no municipal data is modified.

---

## 2. Demonstration Accounts & Persona Matrix

For testing in an isolated local demonstration environment, the platform initializes the following persona accounts:

| Persona / Role | Email Address | Default Password | Primary System Role & Responsibilities |
| :--- | :--- | :--- | :--- |
| **`PLATFORM_ADMIN`** | `admin@infrapulse.gov.in` | `Admin@InfraPulse2025!` | Master system administration, project creation, user management, and system-wide overrides. |
| **`WARD_OFFICER`** | `ward.officer@infrapulse.gov.in` | `Officer@123` | Municipal jurisdiction authority: defines work zones, creates work allocations, and reviews DAG dependencies. |
| **`FIELD_ENGINEER`** | `field.engineer@infrapulse.gov.in` | `Field@123` | On-site ground coordination, ground measurement capture, and vendor progress tracking. |
| **`QUALITY_INSPECTOR`** | `inspector@infrapulse.gov.in` | `Inspector@123` | Authoritative quality auditor: reviews AI vision findings, inspects evidence, issues approval/rework. |
| **`FINANCE_OFFICER`** | `finance@infrapulse.gov.in` | `Finance@123` | Financial governance: reviews verified milestone claims, authorizes simulated disbursements. |
| **`VENDOR_REPRESENTATIVE`** | `vendor.trench@infrapulse.gov.in` | `Vendor@123` | Commercial contractor: views assigned jobs, uploads photographic evidence with EXIF GPS. |
| **`AUDITOR`** | `auditor@infrapulse.gov.in` | `Auditor@123` | Read-only compliance auditor: inspects logs, views analytics, executes cryptographic audit chain verification. |

---

## 3. Step-by-Step Demonstration Sequence (12 Steps)

### Step 1: Administrator Login & Command Center
1. Navigate to `http://localhost` in your web browser.
2. Sign in as `admin@infrapulse.gov.in` with password `Admin@InfraPulse2025!`.
3. Observe the **Executive Command Dashboard**: real-time counters for Active Projects, Allocated Work Zones, Pending Inspections, and Total Milestone Disbursed.

---

### Step 2: Master Project & Vendor Registry
1. In the sidebar, navigate to **Projects**.
2. Select `[DEMO] Chennai Fiber Infrastructure Expansion`.
3. Note the registered commercial value ($1,200,000.00) and the linked commercial agreements with Vendor 1 (Trenching) and Vendor 2 (Road Resurfacing).

---

### Step 3: Geospatial Work Zone & Phase 1 Allocation
1. Navigate to **Work Allocation**.
2. Select Zone `WZ-CHN-600001` on the interactive GIS map.
3. Assign **Phase 1: Underground Optical Trenching & Duct Laying** to `Apex Trenching Ltd.` (`DEMO-VND-001`).
4. Click **Create Allocation**; status transitions to `ASSIGNED`.

---

### Step 4: The DAG Dependency Conflict Demonstration (Core Innovation)
1. Attempt to create a new work permit for **Phase 2: Road Resurfacing & Asphalt Paving** to `Coromandel Roadways` (`DEMO-VND-002`) in the exact same PIN zone `WZ-CHN-600001`.
2. **System Behavior**: The Directed Acyclic Graph (DAG) Conflict Engine immediately triggers a hard scheduling block:
   - **Alert Banner**: `[CONFLICT DETECTED] Sequential Dependency Block`.
   - **Reason**: *Road Resurfacing cannot proceed in Zone WZ-CHN-600001 until prerequisite Trenching & Ducting by Apex Trenching Ltd. is physically completed, inspected, and approved.*
   - **Permit Status**: Automatically set to `BLOCKED`.

---

### Step 5: Contractor Field Evidence Submission
1. Log out and sign in as `vendor.trench@infrapulse.gov.in` (Vendor 1).
2. Open the active assignment `Underground Optical Trenching`.
3. Click **Start Work** (status transitions to `IN_PROGRESS`).
4. In the **Photo Evidence** tab, upload field trenching photos.
5. Note the automatic client-side image compression, EXIF GPS coordinate extraction, and SHA-256 tamper-evident checksum generation.
6. Click **Submit for Inspection** (status transitions to `SUBMITTED`).

---

### Step 6: AI Computer Vision Inference
1. The backend automatically dispatches evidence to the FastAPI Python vision engine.
2. OpenCV and Pillow run edge detection, trench contour extraction, depth estimation, and conduit detection.
3. The AI scores the evidence with a Quality Rating and flags any potential trench width/depth defects.

---

### Step 7: Quality Inspector Human Review & Rework
1. Log out and sign in as `inspector@infrapulse.gov.in` (Quality Inspector).
2. Open the **Human Review Queue**.
3. Inspect the evidence with the AI bounding box overlays.
4. Simulate a quality finding: Enter rejection reason `"Trench depth at Station 4 is 0.75m; specification requires minimum 1.20m. Rework required."`
5. Click **Issue Corrective Action / Rework**.
6. The assignment status transitions to `REWORK_REQUESTED`.

---

### Step 8: Corrective Action Submission & Final Ground Approval
1. Vendor 1 uploads corrective photographic evidence demonstrating 1.25m depth.
2. The Inspector inputs the verified physical ground measurement (`1.25 meters`), verifies Rule 2 compliance, and clicks **Approve Quality Inspection**.
3. Assignment status transitions to `VERIFIED` / `APPROVED`.

---

### Step 9: Automatic DAG Dependency Release
1. Navigate back to **Work Allocation**.
2. Observe that **Phase 2: Road Resurfacing** has automatically transitioned from `BLOCKED` to **`ELIGIBLE_FOR_SCHEDULING`**.
3. The sequential dependency has cleared cleanly without manual overrides!

---

### Step 10: Milestone Eligibility & Invoice Submission
1. In the sidebar, navigate to **Milestones & Finance**.
2. Select Milestone 1: *Phase 1 Optical Trenching Completion* ($150,000.00).
3. The system confirms: `Status: ELIGIBLE_FOR_PAYMENT` (physical quality completion verified).
4. Vendor 1 submits invoice `INV-CHN-2026-001` for $150,000.00.
5. The automated invoice verification engine checks work completion dates, budget caps, and remaining contract balances. Status transitions to `INVOICE_VERIFIED`.

---

### Step 11: Finance Officer Formal Authorization & Disbursement
1. Log out and sign in as `finance@infrapulse.gov.in` (Finance Officer).
2. Open **Payment Authorizations**.
3. Review the verified invoice, attached evidence certificates, and ground inspection sign-off.
4. Click **Authorize Milestone Payment**.
5. The system issues a digital disbursement certificate:
   - **Payment Code**: `PAY-1001`
   - **Authorization Reference**: `AUTH-SIM-8F4C2E9A`
   - **Disbursed Amount**: `$150,000.00 USD`
   - **Contract Balance**: Automatically decremented from $1,200,000.00 to $1,050,000.00.

---

### Step 12: Cryptographic Audit Verification & Vendor Performance Analytics
1. Log in as `auditor@infrapulse.gov.in` (Auditor).
2. Open **Audit Trail & Integrity**.
3. Click **Verify Chain Integrity**:
   - The engine computes SHA-256 hashes across all historical audit records.
   - **Status**: Returns `VALID: 100% Intact Chain (0 Violations)`.
4. Open **Vendor Analytics & Scorecards**:
   - Inspect the 10 empirical KPIs calculated for `Apex Trenching Ltd.`: Quality Pass Rate (92%), SLA Adherence (95%), Rework Resolution Speed (24h).
   - View the interactive multi-axis **Radar Comparison Chart**.
   - Click **Export Analytics CSV** to download the comprehensive compliance report.
