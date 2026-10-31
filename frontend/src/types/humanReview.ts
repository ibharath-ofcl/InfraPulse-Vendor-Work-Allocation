export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'ESCALATED';
export type ReviewPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewDecisionType = 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'REQUEST_MORE_EVIDENCE' 
  | 'REWORK_REQUIRED' 
  | 'NEEDS_PHYSICAL_INSPECTION' 
  | 'ESCALATED';

export type PhysicalMeasurementType = 
  | 'TRENCH_DEPTH' 
  | 'TRENCH_WIDTH' 
  | 'BEDDING_THICKNESS' 
  | 'CABLE_BURIAL_DEPTH' 
  | 'CONDUIT_SEPARATION' 
  | 'ASPHALT_THICKNESS' 
  | 'COMPACTION_DENSITY' 
  | 'SURFACE_SLOPE' 
  | 'CLEARANCE_DISTANCE' 
  | 'OTHER';

export type MeasurementUnit = 
  | 'METERS' 
  | 'CENTIMETERS' 
  | 'MILLIMETERS' 
  | 'PERCENTAGE' 
  | 'DEGREES' 
  | 'KILOPASCALS' 
  | 'MEGAPASCALS' 
  | 'OTHER';

export type MeasurementVerificationStatus = 
  | 'VERIFIED_PASS' 
  | 'VERIFIED_FAIL' 
  | 'SPECIFICATION_REQUIRED' 
  | 'DISCREPANCY_FLAGGED';

export type CorrectiveActionType = 
  | 'DEPTH_CORRECTION' 
  | 'TRENCH_WIDENING' 
  | 'BEDDING_REMEDY' 
  | 'WARNING_TAPE_INSTALLATION' 
  | 'CABLE_REROUTING' 
  | 'RE_COMPACTION' 
  | 'SURFACE_RESURFACING' 
  | 'DEBRIS_REMOVAL' 
  | 'PHOTO_RETREAT' 
  | 'DOCUMENTATION_CORRECTION' 
  | 'OTHER';

export type CorrectiveActionStatus = 
  | 'OPEN' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED_FOR_VERIFICATION' 
  | 'VERIFIED_CLOSED' 
  | 'REJECTED';

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingOutcome = 
  | 'PASS' 
  | 'FAIL' 
  | 'FLAGGED' 
  | 'REQUIRES_PHYSICAL_MEASUREMENT' 
  | 'REQUIRES_HUMAN_REVIEW' 
  | 'INSUFFICIENT_EVIDENCE';

export interface QualityFindingDto {
  id: string;
  criterionCode: string;
  criterionName: string;
  category: string;
  severity: FindingSeverity;
  outcome: FindingOutcome;
  title: string;
  description: string;
  evidenceCode?: string;
  photoUrl?: string;
  detectedClasses?: string[];
  confidenceScore?: number;
  measuredValue?: number;
  expectedValue?: number;
  unit?: string;
  requiresPhysicalMeasurement: boolean;
  requiresHumanReview: boolean;
  createdAt: string;
}

export interface HumanReviewSummaryDto {
  id: string;
  reviewCode: string;
  assessmentId: string;
  assessmentCode: string;
  assignmentId: string;
  assignmentCode: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  workZoneId: string;
  workZoneName: string;
  workZoneCode: string;
  pincode: string;
  vendorId: string;
  vendorName: string;
  workType: string;
  templateName: string;
  status: ReviewStatus;
  priority: ReviewPriority;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  evidenceCompletenessScore: number;
  passedCount: number;
  flaggedCount: number;
  failedCount: number;
  findingsCount: number;
  openCorrectiveActionsCount: number;
  pendingMeasurementsCount: number;
  latestDecision?: ReviewDecisionType;
  createdAt: string;
  updatedAt: string;
}

export interface HumanReviewDetailDto {
  id: string;
  reviewCode: string;
  assessmentId: string;
  assessmentCode: string;
  assignmentId: string;
  assignmentCode: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  workZoneId: string;
  workZoneName: string;
  workZoneCode: string;
  pincode: string;
  vendorId: string;
  vendorName: string;
  workType: string;
  templateId: string;
  templateName: string;
  status: ReviewStatus;
  priority: ReviewPriority;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  assignedAt?: string;
  completedAt?: string;
  evidenceCompletenessScore: number;
  totalCriteriaEvaluated: number;
  passedCount: number;
  flaggedCount: number;
  failedCount: number;
  findingsCount: number;
  evaluationSummary?: string;
  latestDecision?: ReviewDecisionType;
  findings: QualityFindingDto[];
  measurements: PhysicalMeasurementDto[];
  correctiveActions: CorrectiveActionDto[];
  decisions: HumanInspectionDecisionDto[];
  escalations: InspectionEscalationDto[];
  createdAt: string;
  updatedAt: string;
}

export interface HumanInspectionDecisionDto {
  id: string;
  reviewId: string;
  decisionType: ReviewDecisionType;
  decisionRationale: string;
  inspectorNotes?: string;
  decidedById: string;
  decidedByName: string;
  decidedAt: string;
}

export interface PhysicalMeasurementDto {
  id: string;
  assessmentId: string;
  measurementCode: string;
  findingId?: string;
  measurementType: PhysicalMeasurementType;
  instrumentUsed?: string;
  measuredValue: number;
  specifiedMin?: number;
  specifiedMax?: number;
  specifiedTarget?: number;
  unit: MeasurementUnit;
  verificationStatus: MeasurementVerificationStatus;
  locationMarker?: string;
  latitude?: number;
  longitude?: number;
  verifiedById?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CorrectiveActionEvidenceDto {
  id: string;
  actionId: string;
  evidenceId: string;
  evidenceCode: string;
  evidenceCategory: string;
  originalFileName: string;
  storageKey: string;
  vendorNotes?: string;
  submittedAt: string;
}

export interface CorrectiveActionDto {
  id: string;
  actionCode: string;
  assessmentId: string;
  reviewId?: string;
  findingId?: string;
  actionType: CorrectiveActionType;
  status: CorrectiveActionStatus;
  priority: ReviewPriority;
  severity: FindingSeverity;
  problemDescription: string;
  requiredAction: string;
  vendorReworkNotes?: string;
  inspectorResolutionNotes?: string;
  dueDate: string;
  verifiedAt?: string;
  verifiedByName?: string;
  evidenceList: CorrectiveActionEvidenceDto[];
  createdAt: string;
  updatedAt: string;
}

export interface InspectionEscalationDto {
  id: string;
  reviewId: string;
  escalationCode: string;
  escalatedToRoleId: string;
  escalatedToRole: string;
  reason: string;
  resolutionNotes?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedByName?: string;
  createdAt: string;
}

export interface RecordDecisionRequest {
  decisionType: ReviewDecisionType;
  decisionRationale: string;
  inspectorNotes?: string;
}

export interface RecordMeasurementRequest {
  measurementType: PhysicalMeasurementType;
  measuredValue: number;
  specifiedMin?: number;
  specifiedMax?: number;
  specifiedTarget?: number;
  unit?: MeasurementUnit;
  findingId?: string;
  instrumentUsed?: string;
  locationMarker?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface VerifyMeasurementRequest {
  verificationStatus: MeasurementVerificationStatus;
  notes?: string;
}

export interface CreateCorrectiveActionRequest {
  findingId?: string;
  actionType: CorrectiveActionType;
  priority: ReviewPriority;
  severity: FindingSeverity;
  problemDescription: string;
  requiredAction: string;
  dueDate?: string;
}

export interface SubmitCorrectiveEvidenceRequest {
  evidenceId: string;
  vendorReworkNotes?: string;
  submissionComment?: string;
}

export interface VerifyCorrectiveActionRequest {
  approved: boolean;
  resolutionNotes: string;
}

export interface CreateEscalationRequest {
  escalatedToRole: string;
  reason: string;
}
