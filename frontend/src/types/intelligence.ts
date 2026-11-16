// InfraPulse Intelligence Suite Types

export type ContractType =
  | 'CIVIL_INFRASTRUCTURE'
  | 'ROAD_WORKS'
  | 'OPTICAL_FIBER'
  | 'WATER_SUPPLY_DRAINAGE'
  | 'ELECTRICAL_GRID';

export type ContractStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'AMENDED'
  | 'SUSPENDED'
  | 'COMPLETED'
  | 'TERMINATED';

export type RequirementCategory =
  | 'SPECIFICATION'
  | 'TOLERANCE'
  | 'SAFETY_RULE'
  | 'MATERIAL_QUALITY'
  | 'DIMENSIONAL'
  | 'ENVIRONMENTAL';

export type VerificationMethod =
  | 'PHOTO_EVIDENCE'
  | 'PHYSICAL_MEASUREMENT'
  | 'LAB_REPORT'
  | 'THIRD_PARTY_CERTIFICATION'
  | 'DRONE_SURVEY'
  | 'MATERIAL_TEST_CERTIFICATE';

export type RequirementApprovalStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEPRECATED';

export type RequirementEvidenceStatus =
  | 'NOT_STARTED'
  | 'EVIDENCE_PENDING'
  | 'EVIDENCE_SUBMITTED'
  | 'AI_REVIEWED'
  | 'REQUIRES_HUMAN_REVIEW'
  | 'REQUIRES_PHYSICAL_MEASUREMENT'
  | 'NON_COMPLIANT'
  | 'VERIFIED'
  | 'WAIVED_WITH_AUTHORIZATION';

export interface ProjectContract {
  id: string;
  contractCode: string;
  projectId: string;
  projectName?: string;
  contractorId?: string;
  contractorName?: string;
  title: string;
  contractType: ContractType;
  totalValue: number;
  status: ContractStatus;
  versionNumber: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  uploadedById?: string;
  uploadedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractRequirement {
  id: string;
  requirementCode: string;
  contractId: string;
  contractCode?: string;
  projectId: string;
  projectName?: string;
  workZoneId?: string;
  workZoneName?: string;
  workPackage: string;
  title: string;
  description: string;
  category: RequirementCategory;
  acceptanceCriteria: string;
  measurementUnit?: string;
  requiredValue?: string;
  permittedTolerance?: string;
  mandatory: boolean;
  requiresHumanInspection: boolean;
  requiresPhysicalMeasurement: boolean;
  verificationMethod: VerificationMethod;
  approvalStatus: RequirementApprovalStatus;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementEvidenceLink {
  id: string;
  requirementId: string;
  requirementCode: string;
  requirementTitle: string;
  evidenceId?: string;
  evidenceCode?: string;
  evidenceThumbnailUrl?: string;
  assignmentId?: string;
  assignmentCode?: string;
  status: RequirementEvidenceStatus;
  measuredValue?: string;
  measurementUnit?: string;
  physicalMeasurementTool?: string;
  measurementNotes?: string;
  measuredById?: string;
  measuredByName?: string;
  measuredAt?: string;
  waiverReason?: string;
  waivedById?: string;
  waivedByName?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface ContractComplianceSummary {
  projectId: string;
  projectName: string;
  totalContracts: number;
  totalRequirements: number;
  approvedRequirements: number;
  draftRequirements: number;
  verifiedEvidenceRequirements: number;
  pendingEvidenceRequirements: number;
  nonCompliantRequirements: number;
  physicalMeasurementRequiredCount: number;
  overallCompliancePercentage: number;
  requirementsByCategory: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

// Module B — Defect Intelligence Types

export type DefectCategory =
  | 'ROAD_CRACK'
  | 'POTHOLE'
  | 'SURFACE_DETERIORATION'
  | 'WATER_ACCUMULATION'
  | 'INCOMPLETE_CONSTRUCTION'
  | 'MISSING_SAFETY_BARRIER'
  | 'MATERIAL_IRREGULARITY'
  | 'UNAUTHORIZED_DEVIATION';

export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DefectStatus =
  | 'DETECTED'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'CORRECTIVE_ACTION_REQUIRED'
  | 'REWORK_SUBMITTED'
  | 'REINSPECTION'
  | 'RESOLVED';

export interface InfrastructureDefect {
  id: string;
  defectCode: string;
  evidenceId?: string;
  evidenceCode?: string;
  evidenceThumbnailUrl?: string;
  assignmentId?: string;
  assignmentCode?: string;
  projectId: string;
  projectName?: string;
  workZoneId?: string;
  workZoneName?: string;
  vendorId?: string;
  vendorName?: string;
  category: DefectCategory;
  severity: DefectSeverity;
  status: DefectStatus;
  confidence?: number;
  boundingBoxJson?: string;
  modelId?: string;
  modelVersion?: string;
  description: string;
  recurring: boolean;
  recurringClusterId?: string;
  recurrenceCount: number;
  initialDetectedAt: string;
  resolvedAt?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface DefectRecurrenceCandidate {
  id: string;
  candidateDefectId: string;
  candidateDefectCode: string;
  candidateCategory: string;
  candidateSeverity: string;
  candidateStatus: string;
  similarityScore: number;
  spatialDistanceMeters?: number;
  temporalDistanceDays?: number;
  comparisonBasis: string;
  humanConfirmed?: boolean;
  createdAt: string;
}

export interface DefectDashboardSummary {
  projectId: string;
  projectName: string;
  totalDefects: number;
  openDefects: number;
  confirmedDefects: number;
  recurringDefects: number;
  resolvedDefects: number;
  correctiveActionsPending: number;
  recurringPercentage: number;
  defectsByCategory: Record<string, number>;
  defectsBySeverity: Record<string, number>;
  defectsByZone: Record<string, number>;
}

export interface VendorDefectScorecard {
  vendorId: string;
  vendorName: string;
  totalAssignments: number;
  totalInspections: number;
  firstPassApprovals: number;
  firstPassApprovalRate: number;
  totalDefectsReported: number;
  confirmedDefects: number;
  recurringDefectsCount: number;
  recurringDefectRate: number;
  resolvedDefects: number;
  averageResolutionDays: number;
  defectsByCategory: Record<string, number>;
}

// Module C — Predictive Risk Intelligence Types

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INSUFFICIENT_DATA';

export type RiskCategory =
  | 'SCHEDULE_RISK'
  | 'VENDOR_EXECUTION_RISK'
  | 'QUALITY_RISK'
  | 'RESOURCE_RISK'
  | 'DEPENDENCY_RISK';

export type RiskAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export interface ProjectRiskAssessment {
  id: string;
  assessmentCode: string;
  projectId: string;
  projectName?: string;
  workZoneId?: string;
  workZoneName?: string;
  overallRiskLevel: RiskLevel;
  scheduleRiskLevel: RiskLevel;
  vendorRiskLevel: RiskLevel;
  qualityRiskLevel: RiskLevel;
  resourceRiskLevel: RiskLevel;
  dependencyRiskLevel: RiskLevel;
  overallScore: number;
  calculationMethod: string;
  evaluatedAt: string;
  activeAlertsCount: number;
}

export interface ProjectRiskAlert {
  id: string;
  assessmentId?: string;
  projectId: string;
  projectName: string;
  workZoneId?: string;
  workZoneName?: string;
  vendorId?: string;
  vendorName?: string;
  workAssignmentId?: string;
  workAssignmentCode?: string;
  riskCategory: RiskCategory;
  riskLevel: RiskLevel;
  title: string;
  problemStatement: string;
  supportingEvidenceData: string;
  rootCauseReason: string;
  operationalImpact: string;
  recommendedAction: string;
  missingDataNotes?: string;
  alertStatus: RiskAlertStatus;
  resolvedById?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface RiskDashboardSummary {
  projectId: string;
  projectName: string;
  overallRiskLevel: RiskLevel;
  overallScore: number;
  totalActiveAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  alertsByCategory: Record<string, number>;
  topAlerts: ProjectRiskAlert[];
}

// Unified Intelligence Overview
export interface IntelligenceOverview {
  projectId: string;
  projectName: string;
  totalContracts: number;
  totalRequirements: number;
  approvedRequirements: number;
  verifiedEvidenceRequirements: number;
  physicalMeasurementRequiredCount: number;
  contractCompliancePercentage: number;
  totalDefects: number;
  openDefects: number;
  recurringDefects: number;
  defectRecurrencePercentage: number;
  resolvedDefects: number;
  defectsByCategory: Record<string, number>;
  overallRiskLevel: RiskLevel;
  overallRiskScore: number;
  activeRiskAlerts: number;
  criticalRiskAlerts: number;
  lastEvaluatedAt: string;
}

