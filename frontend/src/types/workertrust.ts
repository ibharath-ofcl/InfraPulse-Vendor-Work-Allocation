export type WorkerStatus =
  | 'REGISTERED'
  | 'PENDING_REVIEW'
  | 'UNDER_VERIFICATION'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'ACTIVE_ON_SITE'
  | 'COMPLETED'
  | 'REQUIRES_CORRECTION'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'INACTIVE'
  | 'EXPIRED';

export type DocumentType =
  | 'PHOTO_ID'
  | 'GOVT_ID_OFFLINE_VERIFY'
  | 'SKILL_CERTIFICATE'
  | 'SAFETY_TRAINING_RECORD'
  | 'MEDICAL_FITNESS';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REQUIRES_CORRECTION';

export type VerificationMethod =
  | 'OFFLINE_UIDAI_XML_CONSENT'
  | 'MANUAL_REVIEW'
  | 'VOTER_ID'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'POLICE_CLEARANCE_CERT';

export type VerificationStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REQUIRES_CORRECTION'
  | 'UNAVAILABLE';

export type CertificationType =
  | 'GENERAL_CONSTRUCTION_SAFETY'
  | 'ELECTRICAL_SAFETY'
  | 'EXCAVATION_SAFETY'
  | 'ROADWORK_SAFETY'
  | 'PPE_TRAINING'
  | 'WORKING_AT_HEIGHT'
  | 'CONFINED_SPACE'
  | 'FIRST_AID'
  | 'HEAVY_EQUIPMENT_OPERATION';

export type CertificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export type ApprovalDecision = 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUESTED';

export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';

export type SiteAccessStatus = 'ALLOW_ENTRY' | 'BLOCK_ENTRY';

export type SiteBlockingReason =
  | 'WORKER_NOT_APPROVED'
  | 'WORKER_SUSPENDED'
  | 'INVALID_OR_REVOKED_QR'
  | 'NO_ACTIVE_ASSIGNMENT'
  | 'WRONG_PROJECT'
  | 'WRONG_WORK_ZONE'
  | 'CERTIFICATION_EXPIRED'
  | 'ASSIGNMENT_EXPIRED'
  | 'VENDOR_INACTIVE'
  | 'ALREADY_CHECKED_IN'
  | 'ACCESS_POLICY_VIOLATION';

export type IncidentType =
  | 'SAFETY_VIOLATION'
  | 'MISSING_PPE'
  | 'UNAUTHORIZED_ACCESS'
  | 'EQUIPMENT_MISUSE'
  | 'ACCIDENT'
  | 'NEAR_MISS'
  | 'CERTIFICATION_BREACH';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'REPORTED'
  | 'ACKNOWLEDGED'
  | 'UNDER_INVESTIGATION'
  | 'ACTION_REQUIRED'
  | 'RESOLVED'
  | 'CLOSED';

export type SuspensionStatus = 'ACTIVE' | 'LIFTED';

export interface WorkerSummaryResponse {
  id: string;
  workerCode: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: string;
  jobRole: string;
  currentStatus: WorkerStatus;
  vendorId?: string;
  vendorName: string;
  vendorCode?: string;
  activeProjectId?: string;
  activeProjectName?: string;
  activeWorkZoneId?: string;
  activeWorkZoneName?: string;
  activeCertificationsCount: number;
  expiredCertificationsCount: number;
  isCurrentlyOnSite: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export interface WorkerDocumentDto {
  id: string;
  documentType: DocumentType;
  secureStorageReference: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  documentStatus: DocumentStatus;
  reviewNotes?: string;
  uploadedAt: string;
  uploadedByName: string;
}

export interface WorkerCertificationDto {
  id: string;
  certificationType: CertificationType;
  issuingAuthority: string;
  certificateNumber?: string;
  issueDate: string;
  expiryDate?: string;
  verificationStatus: CertificationStatus;
  documentReference?: string;
  isExpired: boolean;
  verifiedAt?: string;
  verifiedByName?: string;
}

export interface WorkerVerificationDto {
  id: string;
  verificationMethod: VerificationMethod;
  verificationReference?: string;
  verificationStatus: VerificationStatus;
  verifiedByName?: string;
  verifiedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface WorkerAssignmentDto {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  workZoneId: string;
  workZoneCode: string;
  workZoneName: string;
  vendorId: string;
  vendorName: string;
  startDate: string;
  endDate: string;
  assignmentStatus: AssignmentStatus;
  requiredRole?: string;
  assignedByName: string;
  createdAt: string;
}

export interface WorkerSiteAccessDto {
  id: string;
  workerId: string;
  workerCode: string;
  workerName: string;
  workerRole: string;
  vendorName: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  workZoneId?: string;
  workZoneName?: string;
  entryTime: string;
  exitTime?: string;
  accessStatus: SiteAccessStatus;
  blockingReason?: string;
  recordingOfficerName?: string;
  isCurrentlyOnSite: boolean;
}

export interface WorkerIncidentDto {
  id: string;
  incidentReference: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  workZoneId?: string;
  workZoneName?: string;
  workerId?: string;
  workerCode?: string;
  workerName?: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  immediateActionTaken?: string;
  incidentStatus: IncidentStatus;
  reportedByName: string;
  assignedInvestigatorName?: string;
  resolution?: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface WorkerSuspensionDto {
  id: string;
  reason: string;
  imposedByName: string;
  startTime: string;
  reviewDate?: string;
  endTime?: string;
  suspensionStatus: SuspensionStatus;
  resolutionNotes?: string;
  isActive: boolean;
}

export interface WorkerQrBadgeResponse {
  credentialId: string;
  workerId: string;
  workerCode: string;
  fullName: string;
  jobRole: string;
  photoReference?: string;
  vendorName: string;
  vendorCode?: string;
  activeProjectName?: string;
  activeWorkZoneName?: string;
  tokenHash: string;
  opaqueToken: string;
  credentialStatus: string;
  issuedAt: string;
  expiresAt: string;
  isValid: boolean;
}

export interface WorkerDetailResponse {
  id: string;
  workerCode: string;
  fullName: string;
  photoReference?: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: string;
  jobRole: string;
  skillsExperience?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  currentStatus: WorkerStatus;
  vendorId?: string;
  vendorName: string;
  vendorCode?: string;
  activeProjectId?: string;
  activeProjectName?: string;
  activeWorkZoneId?: string;
  activeWorkZoneName?: string;
  isCurrentlyOnSite: boolean;
  isSuspended: boolean;
  documents: WorkerDocumentDto[];
  verifications: WorkerVerificationDto[];
  certifications: WorkerCertificationDto[];
  assignments: WorkerAssignmentDto[];
  recentSiteAccess: WorkerSiteAccessDto[];
  incidents: WorkerIncidentDto[];
  suspensions: WorkerSuspensionDto[];
  qrBadge?: WorkerQrBadgeResponse;
  createdAt: string;
  updatedAt: string;
}

export interface SiteAccessScanResult {
  allowed: boolean;
  accessStatus: SiteAccessStatus;
  blockingReason?: SiteBlockingReason;
  humanReadableReason: string;
  siteAccessId?: string;
  workerId?: string;
  workerCode: string;
  fullName: string;
  jobRole: string;
  vendorName: string;
  projectId?: string;
  projectName?: string;
  workZoneId?: string;
  workZoneName?: string;
  photoReference?: string;
  timestamp: string;
}

export interface EmergencyHeadcountResponse {
  totalCheckedIn: number;
  workersByProject: Record<string, number>;
  workersByWorkZone: Record<string, number>;
  workersByVendor: Record<string, number>;
  activePersonnel: WorkerSiteAccessDto[];
  generatedAt: string;
}

export interface WorkforceAnalyticsResponse {
  totalRegisteredWorkers: number;
  approvedWorkers: number;
  pendingVerification: number;
  underVerification: number;
  rejectedWorkers: number;
  suspendedWorkers: number;
  activeOnSiteWorkers: number;
  activeAssignmentsCount: number;
  certificationComplianceRate: number;
  expiredCertificationsCount: number;
  expiringWithin30DaysCertificationsCount: number;
  openSafetyIncidents: number;
  totalSafetyIncidents: number;
  workersByStatus: Record<string, number>;
  workersByVendor: Record<string, number>;
  workersByProject: Record<string, number>;
  dailyAttendanceTrend: { date: string; count: number }[];
}

export interface RegisterWorkerPayload {
  fullName: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: string;
  jobRole: string;
  skillsExperience?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  vendorId?: string;
  consentGranted: boolean;
  verificationMethod?: VerificationMethod;
  verificationReference?: string;
}

export interface AddCertificationPayload {
  certificationType: CertificationType;
  issuingAuthority: string;
  certificateNumber?: string;
  issueDate: string;
  expiryDate?: string;
  documentReference?: string;
}

export interface WorkerApprovalPayload {
  decision: ApprovalDecision;
  reason: string;
}

export interface AssignWorkerPayload {
  projectId: string;
  workZoneId: string;
  startDate: string;
  endDate: string;
  requiredRole?: string;
}

export interface SiteCheckInPayload {
  tokenOrWorkerCode: string;
  projectId: string;
  workZoneId?: string;
  deviceReference?: string;
}

export interface ReportIncidentPayload {
  projectId?: string;
  workZoneId?: string;
  workerId?: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  immediateActionTaken?: string;
}

export interface ResolveIncidentPayload {
  resolution: string;
  incidentStatus: IncidentStatus;
}

export interface SuspendWorkerPayload {
  reason: string;
  reviewDate?: string;
}

export interface ReactivateWorkerPayload {
  resolutionNotes: string;
}
