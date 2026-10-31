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
