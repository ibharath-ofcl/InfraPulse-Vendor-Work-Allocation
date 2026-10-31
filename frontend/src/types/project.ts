export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export type ProjectType = 
  | 'TELECOM' 
  | 'ROAD_INFRASTRUCTURE' 
  | 'UTILITY' 
  | 'FIBER_OPTIC' 
  | 'ELECTRICAL' 
  | 'OTHER';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface ProjectVendorAssociation {
  id: string;
  vendorId: string;
  vendorCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  city?: string;
  state?: string;
  status: string;
  serviceCategories: string[];
  associationStatus: 'ACTIVE' | 'DEACTIVATED';
  associatedAt: string;
  deactivatedAt?: string;
  associatedByName?: string;
  notes?: string;
}

export interface ProjectManagerAssignmentRecord {
  id: string;
  managerId: string;
  managerName: string;
  managerEmail: string;
  assignedAt: string;
  assignedByName?: string;
  active: boolean;
}

export interface AuditRecord {
  id: string;
  actorId?: string;
  eventType: string;
  entityType: string;
  entityId: string;
  summary: string;
  reason?: string;
  createdAt: string;
}

export interface ProjectResponse {
  id: string;
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: ProjectType;
  clientName: string;
  region: string;
  state: string;
  district: string;
  primaryPincode: string;
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  budget: number;
  status: ProjectStatus;
  projectManager?: UserSummary;
  createdBy?: UserSummary;
  createdAt: string;
  updatedAt: string;
  associatedVendorsCount: number;
  progressPercentage: number;
}

export interface ProjectDetailResponse extends ProjectResponse {
  associatedVendors: ProjectVendorAssociation[];
  managerAssignments: ProjectManagerAssignmentRecord[];
  auditTrail: AuditRecord[];
}

export interface CreateProjectPayload {
  projectName: string;
  description?: string;
  projectType: ProjectType;
  clientName: string;
  region: string;
  state: string;
  district: string;
  primaryPincode: string;
  startDate: string;
  targetEndDate: string;
  budget: number;
  projectManagerId?: string;
}

export interface UpdateProjectPayload {
  projectName: string;
  description?: string;
  projectType: ProjectType;
  clientName: string;
  region: string;
  state: string;
  district: string;
  primaryPincode: string;
  startDate: string;
  targetEndDate: string;
  budget: number;
}

export interface UpdateProjectStatusPayload {
  status: ProjectStatus;
  reason?: string;
}

export interface AssignManagerPayload {
  managerId: string;
}

export interface AssociateVendorPayload {
  vendorId: string;
  notes?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
