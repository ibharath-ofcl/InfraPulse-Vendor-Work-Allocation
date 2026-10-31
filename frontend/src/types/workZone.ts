export type ZoneStatus = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'INACTIVE';

export interface WorkZoneItem {
  id: string;
  zoneCode: string;
  projectId: string;
  projectName: string;
  zoneName: string;
  description?: string;
  pincode: string;
  locality: string;
  district: string;
  state: string;
  centerLatitude?: number;
  centerLongitude?: number;
  status: ZoneStatus;
  activeAssignmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkZonePayload {
  projectId: string;
  zoneName: string;
  description?: string;
  pincode: string;
  locality: string;
  district: string;
  state: string;
  centerLatitude?: number;
  centerLongitude?: number;
}

export interface UpdateWorkZonePayload {
  zoneName?: string;
  description?: string;
  pincode?: string;
  locality?: string;
  district?: string;
  state?: string;
  centerLatitude?: number;
  centerLongitude?: number;
}

export interface UpdateZoneStatusPayload {
  status: ZoneStatus;
}
