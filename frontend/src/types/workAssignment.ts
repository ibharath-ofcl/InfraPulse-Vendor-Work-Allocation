export type WorkTypeEnum =
  | 'TRENCHING'
  | 'UNDERGROUND_CABLE_INSTALLATION'
  | 'BACKFILLING'
  | 'ROAD_RESURFACING'
  | 'FINAL_INSPECTION';

export type AssignmentPriorityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AssignmentStatusEnum =
  | 'DRAFT'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type ReleaseStatusEnum = 'PENDING_RELEASE' | 'RELEASED' | 'REJECTED';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface WorkAssignmentItem {
  id: string;
  assignmentCode: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  workZoneId: string;
  zoneCode: string;
  zoneName: string;
  pincode: string;
  locality: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  workType: WorkTypeEnum;
  workTypeDisplayName: string;
  title: string;
  description?: string;
  plannedStartDate: string;
  targetEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  priority: AssignmentPriorityEnum;
  status: AssignmentStatusEnum;
  instructions?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  releaseStatus?: ReleaseStatusEnum;
  releasedBy?: UserSummary | null;
  releasedAt?: string | null;
  releaseNotes?: string | null;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkAssignmentPayload {
  projectId: string;
  workZoneId: string;
  vendorId: string;
  workType: WorkTypeEnum;
  title: string;
  description?: string;
  plannedStartDate: string;
  targetEndDate: string;
  priority: AssignmentPriorityEnum;
  instructions?: string;
}

export interface UpdateWorkAssignmentPayload {
  title?: string;
  description?: string;
  plannedStartDate?: string;
  targetEndDate?: string;
  priority?: AssignmentPriorityEnum;
  instructions?: string;
}

export interface UpdateAssignmentStatusPayload {
  status: AssignmentStatusEnum;
  reason?: string;
}

export interface CancelAssignmentPayload {
  reason: string;
}

// Stage 6 — Dependency & Conflict Engine Types
export interface BlockedDependencyDetail {
  predecessorWorkType: WorkTypeEnum;
  predecessorWorkTypeDisplayName: string;
  assignmentCode?: string | null;
  assignmentStatus?: AssignmentStatusEnum | null;
  releaseStatus?: ReleaseStatusEnum | null;
  workZoneId: string;
  workZoneName: string;
  assignedVendorName?: string | null;
  reason: string;
  requiredAction: string;
}

export interface SchedulingConflictDetail {
  conflictType: 'DUPLICATE_ACTIVITY' | 'OVERLAPPING_INCOMPATIBLE_WORK' | string;
  conflictingAssignmentCode: string;
  workType: WorkTypeEnum;
  workTypeDisplayName: string;
  status: AssignmentStatusEnum;
  assignedVendorName?: string | null;
  plannedStartDate: string;
  targetEndDate: string;
  message: string;
}

export interface ValidationResultResponse {
  eligible: boolean;
  code: 'READY' | 'DEPENDENCY_BLOCKED' | 'SCHEDULING_CONFLICT' | 'DUPLICATE_ACTIVITY' | string;
  message: string;
  blockedDependencies: BlockedDependencyDetail[];
  conflicts: SchedulingConflictDetail[];
  hasDuplicate: boolean;
  duplicateAssignmentCode?: string | null;
}

export interface AssignmentValidationPayload {
  projectId: string;
  workZoneId: string;
  workType: WorkTypeEnum;
  vendorId?: string;
  plannedStartDate?: string;
  targetEndDate?: string;
  excludeAssignmentId?: string;
}

export interface PrerequisiteReleasePayload {
  decision: ReleaseStatusEnum;
  notes: string;
}

export interface WorkTypeDependencyItem {
  id: string;
  projectId?: string | null;
  projectName?: string | null;
  predecessorWorkType: WorkTypeEnum;
  predecessorDisplayName: string;
  successorWorkType: WorkTypeEnum;
  successorDisplayName: string;
  requiredPredecessorStatus: AssignmentStatusEnum;
  requiresReleaseApproval: boolean;
  isActive: boolean;
  priority: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDependencyPayload {
  projectId?: string | null;
  predecessorWorkType: WorkTypeEnum;
  successorWorkType: WorkTypeEnum;
  requiredPredecessorStatus: AssignmentStatusEnum;
  requiresReleaseApproval: boolean;
  isActive: boolean;
  priority: number;
  description?: string;
}

export interface UpdateDependencyPayload {
  requiredPredecessorStatus?: AssignmentStatusEnum;
  requiresReleaseApproval?: boolean;
  isActive?: boolean;
  priority?: number;
  description?: string;
}
