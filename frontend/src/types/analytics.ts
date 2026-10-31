export type AuditCategory =
  | 'SECURITY_AUTH'
  | 'WORK_ALLOCATION'
  | 'CONFLICT_RESOLUTION'
  | 'EVIDENCE_AI'
  | 'QUALITY_INSPECTION'
  | 'FINANCIAL_WORKFLOW'
  | 'PROJECT_MANAGEMENT'
  | 'SYSTEM_ADMINISTRATION';

export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'WARNING';

export type AuditIntegrityStatus = 'VALID' | 'TAMPERED' | 'BROKEN_CHAIN';

export type DataSufficiencyStatus = 'SUFFICIENT_DATA' | 'INSUFFICIENT_DATA';

export interface AuditEventItem {
  id: string;
  eventCode: string;
  eventCategory: AuditCategory;
  eventType: string;
  entityType: string;
  entityId: string;
  entityReference?: string;
  projectId?: string;
  vendorId?: string;
  workZoneId?: string;
  action: string;
  outcome: AuditOutcome;
  description: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  clientIp?: string;
  userAgent?: string;
  correlationId?: string;
  chainScope: string;
  sequenceNumber?: number;
  eventHash?: string;
  previousHash?: string;
  eventPayload?: string;
  createdAt: string;
}

export interface AuditIntegrityReport {
  chainScope: string;
  status: AuditIntegrityStatus;
  totalEventsChecked: number;
  validEventsCount: number;
  invalidEventsCount: number;
  verifiedAt: string;
  violations: string[];
}

export interface VendorPerformance {
  vendorId: string;
  vendorCode: string;
  companyName: string;
  completionRate: number;
  onTimeRate: number;
  qualityPassRate: number;
  reworkRate: number;
  evidenceComplianceRate: number;
  avgInspectionTurnaroundHours: number;
  avgCorrectiveActionResolutionHours: number;
  overdueAssignmentsCount: number;
  avgDelayDays: number;
  totalPaymentRequested: number;
  totalPaymentApproved: number;
  totalSimulatedSettled: number;
  pendingFinancialRequestsCount: number;
  rejectedFinancialRequestsCount: number;
  simulationDisclaimer: string;
  activeAssignmentsCount: number;
  completedAssignmentsCount: number;
  pendingInspectionsCount: number;
  openCorrectiveActionsCount: number;
  overallScore: number;
  overallPerformanceScore: number;
  totalAssignments: number;
  dataSufficiencyStatus: DataSufficiencyStatus;
  scoringConfigurationVersion: number;
  rankingTier: string;
  sampleCounts: Record<string, number>;
}

export interface VendorComparison {
  projectScopeId?: string;
  comparedAt: string;
  scoringVersion: number;
  vendors: VendorPerformance[];
}

export interface VendorRanking {
  rank: number;
  vendorId: string;
  vendorCode: string;
  companyName: string;
  overallScore: number;
  tier: string;
  dataSufficiencyStatus: DataSufficiencyStatus;
  qualityPassRate: number;
  onTimeRate: number;
  reworkRate: number;
  completionRate: number;
  totalAssignments: number;
}

export interface ProjectPerformance {
  projectId: string;
  projectCode: string;
  projectName: string;
  clientName?: string;
  projectStatus: string;
  budget: number;
  totalAssignments: number;
  completedAssignments: number;
  activeAssignments: number;
  completionRate: number;
  onTimeRate: number;
  qualityPassRate: number;
  reworkRate: number;
  overdueCount: number;
  totalMilestones: number;
  completedMilestones: number;
  totalMilestoneValue: number;
  approvedPaymentTotal: number;
  simulatedSettledTotal: number;
  simulationDisclaimer: string;
  calculatedAt: string;
}

export interface OperationalDashboardSummary {
  activeProjectsCount: number;
  totalWorkAssignmentsCount: number;
  workStatusDistribution: Record<string, number>;
  pendingQualityReviewsCount: number;
  openCorrectiveActionsCount: number;
  activeVendorsCount: number;
  totalRequestedSimulatedAmount: number;
  totalAuthorizedSimulatedAmount: number;
  totalSettledSimulatedAmount: number;
  simulationDisclaimer: string;
  asOfTimestamp: string;
}

export interface ScoringConfiguration {
  id: string;
  configurationName: string;
  description?: string;
  qualityWeight: number;
  onTimeWeight: number;
  evidenceWeight: number;
  reworkWeight: number;
  completionWeight: number;
  version: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdByName?: string;
}

export type ReportType =
  | 'VENDOR_PERFORMANCE'
  | 'PROJECT_PERFORMANCE'
  | 'WORK_ASSIGNMENT'
  | 'QUALITY_INSPECTION'
  | 'CORRECTIVE_ACTION'
  | 'AUDIT_EVENT'
  | 'MILESTONE_FINANCIAL';

export type ReportFormat = 'CSV';

export interface ReportJobResponse {
  id: string;
  reportCode: string;
  reportType: ReportType;
  format: ReportFormat;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  recordCount: number;
  fileName: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface ExportReportRequest {
  reportType: ReportType;
  format: ReportFormat;
  projectId?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
}
