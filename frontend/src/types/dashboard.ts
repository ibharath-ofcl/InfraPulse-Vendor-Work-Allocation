export interface DashboardSummary {
  totalProjects: number;
  activeAssignments: number;
  pendingAcceptance: number;
  inProgress: number;
  awaitingReview: number;
  dependencyBlocked: number;
  readyForNextStage: number;
  completedAssignments: number;
  totalAssignments: number;
}

export interface AssignmentDistributionItem {
  status: string;
  statusDisplayName: string;
  count: number;
  percentage: number;
}

export interface AssignmentDistributionResponse {
  distribution: AssignmentDistributionItem[];
  total: number;
}

export interface ProjectProgressItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  location: string;
  projectManagerName: string;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  blockedAssignments: number;
  completionPercentage: number;
  projectStatus: string;
}

export interface ProjectProgressResponse {
  projects: ProjectProgressItem[];
}

export interface WorkZoneOverviewItem {
  workZoneId: string;
  zoneCode: string;
  zoneName: string;
  pincode: string;
  locality: string;
  district: string;
  state: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  centerLatitude: number | null;
  centerLongitude: number | null;
  totalAssignments: number;
  activeWork: number;
  blockedWork: number;
  completedWork: number;
  operationalStatus: string;
}

export interface WorkZoneOverviewResponse {
  workZones: WorkZoneOverviewItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface BlockedDependencyItem {
  assignmentId: string;
  assignmentCode: string;
  title: string;
  workType: string;
  workTypeDisplayName: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  workZoneId: string;
  workZoneName: string;
  pincode: string;
  assignedVendorName: string;
  requiredPredecessorWorkType: string;
  requiredPredecessorWorkTypeDisplayName: string;
  predecessorAssignmentCode: string;
  predecessorVendorName: string;
  predecessorStatus: string;
  releaseStatus: string;
  blockingReason: string;
  requiredAction: string;
}

export interface ReadyDependencyItem {
  assignmentId: string;
  assignmentCode: string;
  title: string;
  workType: string;
  workTypeDisplayName: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  workZoneId: string;
  workZoneName: string;
  pincode: string;
  assignedVendorName: string;
  currentStatus: string;
  releaseStatus: string;
  action: string;
}

export interface DependencyMonitoringResponse {
  blockedAssignments: BlockedDependencyItem[];
  readyAssignments: ReadyDependencyItem[];
  totalBlocked: number;
  totalReady: number;
}

export interface VendorWorkloadItem {
  vendorId: string;
  vendorCode: string;
  companyName: string;
  contactPerson: string;
  status: string;
  activeAssignments: number;
  completedAssignments: number;
  pendingAcceptance: number;
  blockedAssignments: number;
  rejectedAssignments: number;
  currentWorkload: number;
  serviceCategories: string[];
}

export interface VendorWorkloadResponse {
  vendors: VendorWorkloadItem[];
}

export interface RecentActivityItem {
  id: string;
  eventType: string;
  eventTitle: string;
  entityType: string;
  entityId: string;
  summary: string;
  reason: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  projectReference: string | null;
  workZoneReference: string | null;
  assignmentCode: string | null;
  timestamp: string;
}

export interface RecentActivityResponse {
  events: RecentActivityItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DashboardSearchItem {
  id: string;
  type: 'ASSIGNMENT' | 'ZONE' | 'VENDOR' | 'PROJECT';
  code: string;
  title: string;
  subtitle: string;
  status: string;
  link: string;
}

export interface DashboardSearchResponse {
  results: DashboardSearchItem[];
  total: number;
}

export interface DashboardFilterParams {
  projectId?: string;
  pincode?: string;
  workZoneId?: string;
  vendorId?: string;
  workType?: string;
  status?: string;
  dependencyStatus?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
  search?: string;
}
