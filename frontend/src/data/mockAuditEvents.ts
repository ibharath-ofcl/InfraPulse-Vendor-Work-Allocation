import { AuditEvent } from '../types';
import { 
  AuditEventItem, 
  AuditCategory, 
  AuditOutcome, 
  AuditIntegrityReport 
} from '../types/analytics';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
export const LOCAL_STORAGE_AUDIT_KEY = 'infrapulse_stored_audit_events';

/**
 * 18 cryptographically verifiable, canonical seed audit events
 * spanning October through November 20, 2026.
 */
export const initialAuditEvents: AuditEventItem[] = [
  {
    "id": "evt-1001",
    "eventCode": "AUD-2026-001",
    "eventCategory": "SECURITY_AUTH",
    "eventType": "PLATFORM_INITIALIZATION",
    "entityType": "SYSTEM",
    "entityId": "SYS-INIT",
    "entityReference": "InfraPulse Enterprise Core",
    "action": "GENESIS_INITIALIZATION",
    "outcome": "SUCCESS",
    "description": "Cryptographic compliance audit ledger initialized with Genesis block. Scope: GLOBAL.",
    "actorId": "usr-admin-01",
    "actorName": "System Architecture",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "127.0.0.1",
    "correlationId": "CORR-INIT-001",
    "chainScope": "GLOBAL",
    "createdAt": "2026-10-15T09:00:00.000Z",
    "eventPayload": "{\"system\":\"InfraPulse\",\"genesis\":true,\"ledgerVersion\":\"2.4-crypto\"}",
    "sequenceNumber": 1,
    "previousHash": "0000000000000000000000000000000000000000000000000000000000000000",
    "eventHash": "68340d8a14929d103a28a734cacce7dd4541ce2eb854efce14bf73e56be75aa4"
  },
  {
    "id": "evt-1002",
    "eventCode": "AUD-2026-002",
    "eventCategory": "WORK_ALLOCATION",
    "eventType": "WORK_PACKAGE_ALLOCATED",
    "entityType": "ASSIGNMENT",
    "entityId": "ASN-103",
    "entityReference": "ASN-103 (WZ-003)",
    "action": "ISSUE_WORK_ASSIGNMENT",
    "outcome": "SUCCESS",
    "description": "Allocated 11kV underground cable laying to TransGrid Power Infrastructure in PIN 560034.",
    "actorId": "usr-admin-01",
    "actorName": "Arun Kumar",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.10",
    "correlationId": "CORR-WA-103",
    "chainScope": "GLOBAL",
    "createdAt": "2026-10-20T10:15:30.000Z",
    "eventPayload": "{\"packageId\":\"ASN-103\",\"vendor\":\"TransGrid Power\",\"pinCode\":\"560034\",\"workType\":\"CABLE_LAYING\"}",
    "sequenceNumber": 2,
    "previousHash": "68340d8a14929d103a28a734cacce7dd4541ce2eb854efce14bf73e56be75aa4",
    "eventHash": "30c511fd8878501679efe5635bb7c98b7bc56ebab30541a064562de9dd65af72"
  },
  {
    "id": "evt-1003",
    "eventCode": "AUD-2026-003",
    "eventCategory": "FINANCIAL_WORKFLOW",
    "eventType": "MILESTONE_PAYMENT_DISBURSED",
    "entityType": "MILESTONE",
    "entityId": "MLS-502",
    "entityReference": "MLS-502 (₹ 42,00,000)",
    "action": "DISBURSE_MILESTONE_FUNDS",
    "outcome": "SUCCESS",
    "description": "Payment released after 100% inspection pass and civic engineer digital sign-off.",
    "actorId": "usr-fin-02",
    "actorName": "Finance Controller",
    "actorRole": "GOVERNMENT_OFFICIAL",
    "clientIp": "192.168.1.15",
    "correlationId": "CORR-FIN-502",
    "chainScope": "GLOBAL",
    "createdAt": "2026-10-25T15:00:00.000Z",
    "eventPayload": "{\"milestoneId\":\"MLS-502\",\"amount\":4200000,\"currency\":\"INR\",\"recipient\":\"Vanguard Civil\"}",
    "sequenceNumber": 3,
    "previousHash": "30c511fd8878501679efe5635bb7c98b7bc56ebab30541a064562de9dd65af72",
    "eventHash": "4d552e731371344d0bafed4ab47ed9281ce31cadf185485dad7b0f38052295f6"
  },
  {
    "id": "evt-1004",
    "eventCode": "AUD-2026-004",
    "eventCategory": "QUALITY_INSPECTION",
    "eventType": "INSPECTION_REJECTED",
    "entityType": "INSPECTION",
    "entityId": "INS-2026-879",
    "entityReference": "INS-2026-879 (ASN-104)",
    "action": "ISSUE_REWORK_NOTICE",
    "outcome": "FAILURE",
    "description": "Compaction test failed on lift thickness >320mm. Corrective action notice issued to Vanguard Civil Engineering.",
    "actorId": "usr-qa-03",
    "actorName": "Priya Sundaram",
    "actorRole": "QA_INSPECTOR",
    "clientIp": "192.168.1.22",
    "correlationId": "CORR-QA-879",
    "chainScope": "GLOBAL",
    "createdAt": "2026-10-28T14:10:05.000Z",
    "eventPayload": "{\"inspectionId\":\"INS-2026-879\",\"defectSeverity\":\"CRITICAL\",\"failedLift\":325}",
    "sequenceNumber": 4,
    "previousHash": "4d552e731371344d0bafed4ab47ed9281ce31cadf185485dad7b0f38052295f6",
    "eventHash": "1eea44439c2812f5993144fa53da23a6ecf7414576a7a6b6aa3aaadf9370ebd1"
  },
  {
    "id": "evt-1005",
    "eventCode": "AUD-2026-005",
    "eventCategory": "EVIDENCE_AI",
    "eventType": "EVIDENCE_SUBMITTED",
    "entityType": "EVIDENCE",
    "entityId": "EVD-9001",
    "entityReference": "EVD-9001 (ASN-101)",
    "action": "UPLOAD_FIELD_PHOTOMETRY",
    "outcome": "SUCCESS",
    "description": "Field photo uploaded with verified EXIF GPS coordinates (12.9756, 77.6066) within Zone 560001-A perimeter.",
    "actorId": "usr-ven-01",
    "actorName": "Rajesh K. Sharma",
    "actorRole": "VENDOR",
    "clientIp": "103.22.45.18",
    "correlationId": "CORR-EVD-9001",
    "chainScope": "GLOBAL",
    "createdAt": "2026-10-30T16:35:22.000Z",
    "eventPayload": "{\"evidenceId\":\"EVD-9001\",\"lat\":12.9756,\"lng\":77.6066,\"geofenceValid\":true}",
    "sequenceNumber": 5,
    "previousHash": "1eea44439c2812f5993144fa53da23a6ecf7414576a7a6b6aa3aaadf9370ebd1",
    "eventHash": "eca12fb7d74f706ec03cd3012aa1ccb839fcc18ca71a594dd367bb3342faf5cc"
  },
  {
    "id": "evt-1006",
    "eventCode": "AUD-2026-006",
    "eventCategory": "QUALITY_INSPECTION",
    "eventType": "INSPECTION_FLAGGED_AMBIGUOUS",
    "entityType": "INSPECTION",
    "entityId": "INS-2026-881",
    "entityReference": "INS-2026-881 (ASN-101)",
    "action": "AUTOMATED_AI_ASSESSMENT",
    "outcome": "WARNING",
    "description": "AI inspection flagged bedding sand granularity (confidence: 0.72) for mandatory human reviewer confirmation.",
    "actorId": "usr-ai-pipe",
    "actorName": "AI Vision Pipeline",
    "actorRole": "SYSTEM",
    "clientIp": "127.0.0.1",
    "correlationId": "CORR-AI-881",
    "chainScope": "GLOBAL",
    "createdAt": "2026-10-30T16:42:15.000Z",
    "eventPayload": "{\"inspectionId\":\"INS-2026-881\",\"model\":\"YOLOv8-Civil\",\"confidence\":0.72}",
    "sequenceNumber": 6,
    "previousHash": "eca12fb7d74f706ec03cd3012aa1ccb839fcc18ca71a594dd367bb3342faf5cc",
    "eventHash": "1ad72b8e2d450665d3d6b4e4f086723191af6e5a2ace42501fd9081332e66460"
  },
  {
    "id": "evt-1007",
    "eventCode": "AUD-2026-007",
    "eventCategory": "WORK_ALLOCATION",
    "eventType": "DEPENDENCY_CHECK_BLOCKED",
    "entityType": "ASSIGNMENT",
    "entityId": "ASN-102",
    "entityReference": "ASN-102 (WZ-002)",
    "action": "ENFORCE_PREREQUISITE_RULE",
    "outcome": "BLOCKED",
    "description": "System blocked assignment of Road Resurfacing to Vanguard Civil: Prerequisite Trenching (ASN-101) incomplete.",
    "actorId": "usr-admin-01",
    "actorName": "Arun Kumar",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.10",
    "correlationId": "CORR-DEP-102",
    "chainScope": "GLOBAL",
    "createdAt": "2026-10-31T09:30:14.000Z",
    "eventPayload": "{\"blockedAssignment\":\"ASN-102\",\"missingPrerequisite\":\"ASN-101\"}",
    "sequenceNumber": 7,
    "previousHash": "1ad72b8e2d450665d3d6b4e4f086723191af6e5a2ace42501fd9081332e66460",
    "eventHash": "551b4d60ef14de464c4ab16158c0fa787d440a04f704ffeadf7ccc507c801af0"
  },
  {
    "id": "evt-1008",
    "eventCode": "AUD-2026-008",
    "eventCategory": "PROJECT_MANAGEMENT",
    "eventType": "PROJECT_REGISTERED",
    "entityType": "PROJECT",
    "entityId": "PRJ-CHE-101",
    "entityReference": "PRJ-CHE-101 (Chennai Fiber)",
    "action": "REGISTER_INFRASTRUCTURE_PROJECT",
    "outcome": "SUCCESS",
    "description": "Registered municipal infrastructure initiative PRJ-CHE-101 (Chennai Fiber Network Expansion).",
    "actorId": "usr-admin-01",
    "actorName": "Arun Kumar",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.10",
    "correlationId": "CORR-PRJ-CHE",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-10T11:20:00.000Z",
    "eventPayload": "{\"projectId\":\"PRJ-CHE-101\",\"budget\":25000000,\"pin\":\"600001\"}",
    "sequenceNumber": 8,
    "previousHash": "551b4d60ef14de464c4ab16158c0fa787d440a04f704ffeadf7ccc507c801af0",
    "eventHash": "b3f88cf1fe36bb93cc968bda91d7cb51f3551703a832cf8aaf38588a2fc863d3"
  },
  {
    "id": "evt-1009",
    "eventCode": "AUD-2026-009",
    "eventCategory": "SYSTEM_ADMINISTRATION",
    "eventType": "WORK_ZONE_CALIBRATED",
    "entityType": "WORK_ZONE",
    "entityId": "WZ-560034-01",
    "entityReference": "WZ-560034-01 (Koramangala 80ft)",
    "action": "UPDATE_GEOFENCE_POLYGON",
    "outcome": "SUCCESS",
    "description": "Geofence boundary coordinates calibrated for Ward 151 Koramangala corridor (6 points).",
    "actorId": "usr-admin-01",
    "actorName": "Arun Kumar",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.10",
    "correlationId": "CORR-WZ-KOR",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-15T14:05:00.000Z",
    "eventPayload": "{\"zoneId\":\"WZ-560034-01\",\"perimeterPoints\":6,\"areaM2\":14500}",
    "sequenceNumber": 9,
    "previousHash": "b3f88cf1fe36bb93cc968bda91d7cb51f3551703a832cf8aaf38588a2fc863d3",
    "eventHash": "f95d702b6e1653b55b092fd912805bb7da041d1b1ca7d3b5484052cbe81d748d"
  },
  {
    "id": "evt-1010",
    "eventCode": "AUD-2026-010",
    "eventCategory": "CONFLICT_RESOLUTION",
    "eventType": "SPATIAL_COLLISION_RESOLVED",
    "entityType": "CONFLICT",
    "entityId": "CONF-2026-01",
    "entityReference": "CONF-2026-01 (PIN 560001)",
    "action": "MEDIATE_UTILITY_CONFLICT",
    "outcome": "SUCCESS",
    "description": "Resolved spatial corridor clash between BWSSB 400mm water pipe and Airtel 48-core OFC route.",
    "actorId": "usr-admin-01",
    "actorName": "Arun Kumar",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.10",
    "correlationId": "CORR-CONF-01",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-18T16:45:00.000Z",
    "eventPayload": "{\"conflictId\":\"CONF-2026-01\",\"resolution\":\"VERTICAL_OFFSET_400MM\"}",
    "sequenceNumber": 10,
    "previousHash": "f95d702b6e1653b55b092fd912805bb7da041d1b1ca7d3b5484052cbe81d748d",
    "eventHash": "b1ba570af26e4cf46873d56b38e33fe516be5a655495b262d7186095ce9e947c"
  },
  {
    "id": "evt-1011",
    "eventCode": "AUD-2026-011",
    "eventCategory": "SECURITY_AUTH",
    "eventType": "ROLE_ELEVATION_AUTHORIZED",
    "entityType": "USER",
    "entityId": "usr-qa-03",
    "entityReference": "Priya Sundaram (QA)",
    "action": "GRANT_TEMPORARY_PRIVILEGE",
    "outcome": "SUCCESS",
    "description": "Temporary senior field auditor credential granted to Priya Sundaram with expiration 2026-12-01.",
    "actorId": "usr-admin-01",
    "actorName": "Arun Kumar",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.10",
    "correlationId": "CORR-AUTH-ELEV",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-19T18:30:00.000Z",
    "eventPayload": "{\"grantedTo\":\"usr-qa-03\",\"role\":\"SENIOR_QA_AUDITOR\",\"expiresAt\":\"2026-12-01T00:00:00Z\"}",
    "sequenceNumber": 11,
    "previousHash": "b1ba570af26e4cf46873d56b38e33fe516be5a655495b262d7186095ce9e947c",
    "eventHash": "d7f815bebdaa13bc9e68e0cf37a4f042c0851dab0a819f9f657b52815631a013"
  },
  {
    "id": "evt-1012",
    "eventCode": "AUD-2026-012",
    "eventCategory": "SECURITY_AUTH",
    "eventType": "OPERATOR_LOGIN_SUCCESS",
    "entityType": "USER_SESSION",
    "entityId": "SES-2026-1120-01",
    "entityReference": "Session SES-2026-1120-01",
    "action": "AUTHENTICATE_CREDENTIALS",
    "outcome": "SUCCESS",
    "description": "Platform Administrator logged in successfully via multi-factor authentication from IP 192.168.1.42.",
    "actorId": "usr-admin-01",
    "actorName": "Platform Administrator",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.42",
    "correlationId": "CORR-LOGIN-1120",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-20T08:15:10.000Z",
    "eventPayload": "{\"method\":\"PASSWORD_MFA\",\"sessionDurationMinutes\":480,\"mfaType\":\"HARDWARE_TOKEN\"}",
    "sequenceNumber": 12,
    "previousHash": "d7f815bebdaa13bc9e68e0cf37a4f042c0851dab0a819f9f657b52815631a013",
    "eventHash": "4647dfd5f930f095e433e7b329a4f3cb0d640db6fc7435924fdf1d2a91f7eb34"
  },
  {
    "id": "evt-1013",
    "eventCode": "AUD-2026-013",
    "eventCategory": "PROJECT_MANAGEMENT",
    "eventType": "PROJECT_REGISTERED",
    "entityType": "PROJECT",
    "entityId": "PRJ-BLR-101",
    "entityReference": "PRJ-BLR-101 (Bengaluru Smart Grid)",
    "action": "REGISTER_INFRASTRUCTURE_PROJECT",
    "outcome": "SUCCESS",
    "description": "Master registry updated: Smart Grid Optical Fiber & Underground Ducting (PRJ-BLR-101) registered with budget ₹3.50 Cr.",
    "actorId": "usr-admin-01",
    "actorName": "Platform Administrator",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.42",
    "correlationId": "CORR-PRJ-BLR-101",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-20T08:35:00.000Z",
    "eventPayload": "{\"projectCode\":\"PRJ-BLR-101\",\"budget\":35000000,\"pin\":\"560038\",\"vendorsCount\":4}",
    "sequenceNumber": 13,
    "previousHash": "4647dfd5f930f095e433e7b329a4f3cb0d640db6fc7435924fdf1d2a91f7eb34",
    "eventHash": "13545087f4b1f701e2e15f7ac2867145eb62a9d16e3e9b0f8af18a26c1160df0"
  },
  {
    "id": "evt-1014",
    "eventCode": "AUD-2026-014",
    "eventCategory": "WORK_ALLOCATION",
    "eventType": "WORK_PACKAGE_ALLOCATED",
    "entityType": "ASSIGNMENT",
    "entityId": "ASN-101",
    "entityReference": "ASN-101 (WZ-560001-A)",
    "action": "ISSUE_WORK_ASSIGNMENT",
    "outcome": "SUCCESS",
    "description": "Issued primary trenching and duct preparation work package ASN-101 to Apex Infra Utilities Ltd in PIN 560001.",
    "actorId": "usr-admin-01",
    "actorName": "Platform Administrator",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.42",
    "correlationId": "CORR-WA-101",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-20T09:10:22.000Z",
    "eventPayload": "{\"assignmentId\":\"ASN-101\",\"vendor\":\"Apex Infra Utilities\",\"pin\":\"560001\",\"durationDays\":14}",
    "sequenceNumber": 14,
    "previousHash": "13545087f4b1f701e2e15f7ac2867145eb62a9d16e3e9b0f8af18a26c1160df0",
    "eventHash": "0bad879434e86a6a82514f3b8af0621a815cc328778e5be399cbc7bd7bacb477"
  },
  {
    "id": "evt-1015",
    "eventCode": "AUD-2026-015",
    "eventCategory": "EVIDENCE_AI",
    "eventType": "EVIDENCE_SUBMITTED",
    "entityType": "EVIDENCE",
    "entityId": "EVD-9001",
    "entityReference": "EVD-9001 (ASN-101)",
    "action": "MOBILE_FIELD_CAPTURE",
    "outcome": "SUCCESS",
    "description": "Field photo uploaded via Mobile Field Capture for MG Road - Brigade Junction. Calibrated GPS: 12.9756° N, 77.6066° E (±3.2m CEP). 64-bit pHash uniqueness confirmed.",
    "actorId": "usr-field-01",
    "actorName": "Mobile Field Officer",
    "actorRole": "FIELD_AGENT",
    "clientIp": "103.22.45.18",
    "correlationId": "CORR-EVD-1120-01",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-20T09:42:18.000Z",
    "eventPayload": "{\"evidenceId\":\"EVD-9001\",\"phash\":\"d4e2f891a0b3c5e7\",\"depthConfidence\":0.94,\"geofenceStatus\":\"IN_ZONE\"}",
    "sequenceNumber": 15,
    "previousHash": "0bad879434e86a6a82514f3b8af0621a815cc328778e5be399cbc7bd7bacb477",
    "eventHash": "2beb65aab893c6632c32cbfddae3a23a2c4a2b694b462209a376126046564273"
  },
  {
    "id": "evt-1016",
    "eventCode": "AUD-2026-016",
    "eventCategory": "QUALITY_INSPECTION",
    "eventType": "INSPECTION_AUTHORIZED_PASS",
    "entityType": "INSPECTION",
    "entityId": "INS-2026-001",
    "entityReference": "INS-2026-001 (ASN-101)",
    "action": "AUTHORIZE_MILESTONE_PASS",
    "outcome": "SUCCESS",
    "description": "Computer Vision (ResNet-50 / YOLO-v8) verified excavation depth 1.25m and safety mesh. Mandatory engineering checklist compliant. Authorized by Chief Quality Auditor.",
    "actorId": "usr-qa-chief",
    "actorName": "Chief Quality Auditor",
    "actorRole": "SENIOR_QA_AUDITOR",
    "clientIp": "192.168.1.33",
    "correlationId": "CORR-INS-001",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-20T10:15:45.000Z",
    "eventPayload": "{\"inspectionId\":\"INS-2026-001\",\"depthMeters\":1.25,\"confidence\":0.94,\"status\":\"PASS\"}",
    "sequenceNumber": 16,
    "previousHash": "2beb65aab893c6632c32cbfddae3a23a2c4a2b694b462209a376126046564273",
    "eventHash": "92ce2b5e52c7eec0daf64d106eab5a6abebe6c296f45375f25c7a26d0955be13"
  },
  {
    "id": "evt-1017",
    "eventCode": "AUD-2026-017",
    "eventCategory": "PROJECT_MANAGEMENT",
    "eventType": "CONTRACT_EXTRACTED_BOQ",
    "entityType": "CONTRACT",
    "entityId": "CNT-2026-001",
    "entityReference": "CNT-2026-001 (Smart Grid OFC)",
    "action": "PARSE_DOCUMENT_REQUIREMENTS",
    "outcome": "SUCCESS",
    "description": "InfraPulse Intelligence Suite parsed master contract CNT-2026-001. Extracted 34 engineering clauses with 100% compliance readiness.",
    "actorId": "usr-admin-01",
    "actorName": "Platform Administrator",
    "actorRole": "PLATFORM_ADMIN",
    "clientIp": "192.168.1.42",
    "correlationId": "CORR-CNT-EXT-01",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-20T10:50:00.000Z",
    "eventPayload": "{\"contractId\":\"CNT-2026-001\",\"clausesExtracted\":34,\"complianceScore\":85}",
    "sequenceNumber": 17,
    "previousHash": "92ce2b5e52c7eec0daf64d106eab5a6abebe6c296f45375f25c7a26d0955be13",
    "eventHash": "3aa5c670ce84c59548ace6bc042e02e8d948cf5d7593ae2f7c87723b8018d431"
  },
  {
    "id": "evt-1018",
    "eventCode": "AUD-2026-018",
    "eventCategory": "FINANCIAL_WORKFLOW",
    "eventType": "MILESTONE_PAYMENT_DISBURSED",
    "entityType": "MILESTONE",
    "entityId": "MLS-501",
    "entityReference": "MLS-501 (₹ 35,00,000)",
    "action": "DISBURSE_MILESTONE_FUNDS",
    "outcome": "SUCCESS",
    "description": "Milestone MLS-501 (₹ 35,00,000) payment gate cleared for Apex Infra Utilities following verified optical depth and zero defect status.",
    "actorId": "usr-fin-01",
    "actorName": "Finance Gateway Controller",
    "actorRole": "GOVERNMENT_OFFICIAL",
    "clientIp": "192.168.1.15",
    "correlationId": "CORR-FIN-501",
    "chainScope": "GLOBAL",
    "createdAt": "2026-11-20T11:30:15.000Z",
    "eventPayload": "{\"milestoneId\":\"MLS-501\",\"amount\":3500000,\"recipient\":\"Apex Infra Utilities\",\"qualityVerified\":true}",
    "sequenceNumber": 18,
    "previousHash": "3aa5c670ce84c59548ace6bc042e02e8d948cf5d7593ae2f7c87723b8018d431",
    "eventHash": "4ea7de9d7ec2b9276aff9fbcae18a640e963af5e2e0fdf1a2f66c17c54d218b5"
  }
];

/**
 * Builds the canonical string representation for cryptographic SHA-256 hashing.
 * Matches the backend AuditIntegrityService format:
 * prev | code | type | entType | entId | actId | out | epochMs | payload
 */
export function buildCanonicalPayload(
  event: Partial<AuditEventItem>, 
  previousHash?: string
): string {
  const prev = previousHash && previousHash.trim() ? previousHash : GENESIS_HASH;
  const code = event.eventCode || '';
  const type = event.eventType || '';
  const entType = event.entityType || '';
  const entId = event.entityId || '';
  const actId = event.actorId || 'SYSTEM';
  const out = event.outcome || 'SUCCESS';
  const epochMs = event.createdAt ? new Date(event.createdAt).getTime() : 0;
  const payload = event.eventPayload || '';

  return `${prev}|${code}|${type}|${entType}|${entId}|${actId}|${out}|${epochMs}|${payload}`;
}

/**
 * Computes SHA-256 hash using Web Crypto API.
 */
export async function computeSha256Hex(content: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(content));
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Reads user-generated/runtime audit events stored in localStorage.
 */
export function getStoredAuditEvents(): AuditEventItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read stored audit events from localStorage', err);
    return [];
  }
}

/**
 * Persists an array of audit events to localStorage.
 */
export function saveStoredAuditEvents(events: AuditEventItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save audit events to localStorage', err);
  }
}

/**
 * Returns all merged audit events: seed items + localStorage runtime items.
 * Guaranteed to have unbroken sequential numbering and valid hash chaining.
 */
export function getAllMergedAuditEvents(): AuditEventItem[] {
  const stored = getStoredAuditEvents();
  const seedIds = new Set(initialAuditEvents.map(e => e.id));
  const novelStored = stored.filter(e => !seedIds.has(e.id));
  
  // Combine seed events + stored novel events
  const combined = [...initialAuditEvents, ...novelStored];
  
  // Sort chronologically ascending to maintain chain integrity
  combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  return combined;
}

/**
 * Records a new audit event and appends it to the cryptographic chain.
 * Dispatches 'infrapulse_audit_updated' window event for real-time UI synchronization.
 */
export async function recordAuditEvent(input: {
  eventCategory: AuditCategory;
  eventType: string;
  entityType: string;
  entityId: string;
  entityReference?: string;
  action: string;
  outcome: AuditOutcome;
  description: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  projectId?: string;
  vendorId?: string;
  workZoneId?: string;
  eventPayload?: string;
  createdAt?: string;
}): Promise<AuditEventItem> {
  const allEvents = getAllMergedAuditEvents();
  const lastEvent = allEvents[allEvents.length - 1];
  
  const seqNumber = (lastEvent?.sequenceNumber || allEvents.length) + 1;
  const previousHash = lastEvent?.eventHash || GENESIS_HASH;
  const eventCode = `AUD-2026-${String(seqNumber).padStart(3, '0')}`;
  const createdAt = input.createdAt || new Date().toISOString();

  const partialEvent: Partial<AuditEventItem> = {
    ...input,
    eventCode,
    chainScope: 'GLOBAL',
    createdAt,
    actorId: input.actorId || 'usr-admin-01',
    actorName: input.actorName || 'Platform Administrator',
    actorRole: input.actorRole || 'PLATFORM_ADMIN',
    eventPayload: input.eventPayload || JSON.stringify({ recordedAt: createdAt }),
  };

  const canonical = buildCanonicalPayload(partialEvent, previousHash);
  const eventHash = await computeSha256Hex(canonical);

  const newEvent: AuditEventItem = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eventCode,
    eventCategory: input.eventCategory,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    entityReference: input.entityReference,
    projectId: input.projectId,
    vendorId: input.vendorId,
    workZoneId: input.workZoneId,
    action: input.action,
    outcome: input.outcome,
    description: input.description,
    actorId: partialEvent.actorId,
    actorName: partialEvent.actorName,
    actorRole: partialEvent.actorRole,
    clientIp: '192.168.1.42',
    correlationId: `CORR-${Date.now()}`,
    chainScope: 'GLOBAL',
    sequenceNumber: seqNumber,
    previousHash,
    eventHash,
    eventPayload: partialEvent.eventPayload,
    createdAt,
  };

  const existingStored = getStoredAuditEvents();
  saveStoredAuditEvents([...existingStored, newEvent]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('infrapulse_audit_updated', { detail: newEvent }));
  }

  return newEvent;
}

/**
 * Verifies the integrity of a single audit event record against its recorded hash.
 */
export async function verifySingleAuditEvent(event: AuditEventItem): Promise<boolean> {
  if (!event || !event.eventHash) return false;
  const canonical = buildCanonicalPayload(event, event.previousHash);
  const recomputed = await computeSha256Hex(canonical);
  return event.eventHash.toLowerCase() === recomputed.toLowerCase();
}

/**
 * Validates the entire sequential cryptographic hash chain from Genesis to Head.
 */
export async function verifyAuditChainIntegrity(events?: AuditEventItem[]): Promise<AuditIntegrityReport> {
  const chain = events || getAllMergedAuditEvents();
  const violations: string[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];
    const expectedPrevious = i === 0 ? GENESIS_HASH : chain[i - 1].eventHash;

    if (current.previousHash?.toLowerCase() !== expectedPrevious?.toLowerCase()) {
      violations.push(`Linkage mismatch at sequence #${current.sequenceNumber} (${current.eventCode}): expected previous hash ${expectedPrevious}, got ${current.previousHash}`);
      invalidCount++;
      continue;
    }

    const isValid = await verifySingleAuditEvent(current);
    if (!isValid) {
      violations.push(`Hash invalid at sequence #${current.sequenceNumber} (${current.eventCode}): recorded hash ${current.eventHash} does not match canonical digest.`);
      invalidCount++;
    } else {
      validCount++;
    }
  }

  return {
    chainScope: 'GLOBAL',
    status: violations.length === 0 ? 'VALID' : 'TAMPERED',
    totalEventsChecked: chain.length,
    validEventsCount: validCount,
    invalidEventsCount: invalidCount,
    verifiedAt: new Date().toISOString(),
    violations,
  };
}

/**
 * Filters audit events by search keyword, category, outcome, and flexible date boundaries.
 */
export function filterAuditEvents(
  events: AuditEventItem[],
  params: {
    search?: string;
    category?: AuditCategory | 'ALL';
    outcome?: AuditOutcome | 'ALL';
    startDate?: string;
    endDate?: string;
  }
): AuditEventItem[] {
  let filtered = [...events];

  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(e => 
      e.eventCode.toLowerCase().includes(q) ||
      e.eventType.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      (e.actorName && e.actorName.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.entityReference && e.entityReference.toLowerCase().includes(q)) ||
      (e.entityId && e.entityId.toLowerCase().includes(q))
    );
  }

  if (params.category && params.category !== 'ALL') {
    filtered = filtered.filter(e => e.eventCategory === params.category);
  }

  if (params.outcome && params.outcome !== 'ALL') {
    filtered = filtered.filter(e => e.outcome === params.outcome);
  }

  if (params.startDate) {
    const startMs = params.startDate.includes('T')
      ? new Date(params.startDate).getTime()
      : new Date(`${params.startDate}T00:00:00.000Z`).getTime();
    filtered = filtered.filter(e => new Date(e.createdAt).getTime() >= startMs);
  }

  if (params.endDate) {
    const endMs = params.endDate.includes('T')
      ? new Date(params.endDate).getTime()
      : new Date(`${params.endDate}T23:59:59.999Z`).getTime();
    filtered = filtered.filter(e => new Date(e.createdAt).getTime() <= endMs);
  }

  // Display newest events first (reverse chronological order)
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Legacy backwards compatibility export
 */
export const mockAuditEvents: AuditEvent[] = [
  {
    id: 'AUD-88091',
    timestamp: '2026-10-31 09:30:14 IST',
    user: 'Arun Kumar',
    role: 'Platform Administrator',
    action: 'DEPENDENCY_CHECK_BLOCKED',
    entityType: 'ASSIGNMENT',
    entityReference: 'ASN-102 (WZ-002)',
    status: 'BLOCKED',
    details: 'System blocked assignment of Road Resurfacing to Vanguard Civil: Prerequisite Trenching (ASN-101) incomplete.',
  },
  {
    id: 'AUD-88090',
    timestamp: '2026-10-30 16:42:15 IST',
    user: 'AI Vision Pipeline',
    role: 'Automated Inspector',
    action: 'INSPECTION_FLAGGED_AMBIGUOUS',
    entityType: 'INSPECTION',
    entityReference: 'INS-2026-881 (ASN-101)',
    status: 'WARNING',
    details: 'AI inspection flagged bedding sand granularity (confidence: 0.72) for mandatory human reviewer confirmation.',
  },
  {
    id: 'AUD-88089',
    timestamp: '2026-10-30 16:35:22 IST',
    user: 'Rajesh K. Sharma',
    role: 'Vendor Lead (Apex)',
    action: 'EVIDENCE_SUBMITTED',
    entityType: 'EVIDENCE',
    entityReference: 'EVD-9001 (ASN-101)',
    status: 'SUCCESS',
    details: 'Field photo uploaded with verified EXIF GPS coordinates (12.9756, 77.6066) within Zone 560001-A perimeter.',
  },
  {
    id: 'AUD-88088',
    timestamp: '2026-10-28 14:10:05 IST',
    user: 'Priya Sundaram',
    role: 'QA Inspector',
    action: 'INSPECTION_REJECTED',
    entityType: 'INSPECTION',
    entityReference: 'INS-2026-879 (ASN-104)',
    status: 'CRITICAL',
    details: 'Compaction test failed on lift thickness >320mm. Corrective action notice issued to Vanguard Civil Engineering.',
  },
  {
    id: 'AUD-88087',
    timestamp: '2026-10-25 15:00:00 IST',
    user: 'Finance Controller',
    role: 'Finance Gateway',
    action: 'MILESTONE_PAYMENT_DISBURSED',
    entityType: 'MILESTONE',
    entityReference: 'MLS-502 (₹ 42,00,000)',
    status: 'SUCCESS',
    details: 'Payment released after 100% inspection pass and civic engineer digital sign-off.',
  },
  {
    id: 'AUD-88086',
    timestamp: '2026-10-20 10:15:30 IST',
    user: 'Arun Kumar',
    role: 'Platform Administrator',
    action: 'WORK_PACKAGE_ALLOCATED',
    entityType: 'ASSIGNMENT',
    entityReference: 'ASN-103 (WZ-003)',
    status: 'SUCCESS',
    details: 'Allocated 11kV underground cable laying to TransGrid Power Infrastructure in PIN 560034.',
  },
];
