import { AuditRecord, PageResponse } from './project';

export type VendorStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type ServiceCategory = 
  | 'TRENCHING' 
  | 'UNDERGROUND_CABLE_INSTALLATION' 
  | 'BACKFILLING' 
  | 'ROAD_RESURFACING' 
  | 'FINAL_INSPECTION' 
  | 'OTHER';

export interface VendorProjectItem {
  associationId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  projectType: string;
  projectStatus: string;
  region: string;
  state: string;
  startDate: string;
  targetEndDate: string;
  associationStatus: string;
  associatedAt: string;
  deactivatedAt?: string;
  notes?: string;
}

export interface VendorResponse {
  id: string;
  vendorCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  addressLine?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode: string;
  gstNumber?: string;
  registrationNumber?: string;
  status: VendorStatus;
  serviceCategories: ServiceCategory[];
  userId?: string;
  createdAt: string;
  updatedAt: string;
  activeProjectsCount: number;
}

export interface VendorDetailResponse extends VendorResponse {
  associatedProjects: VendorProjectItem[];
  auditTrail: AuditRecord[];
}

export interface CreateVendorPayload {
  companyName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  addressLine?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode: string;
  gstNumber?: string;
  registrationNumber?: string;
  serviceCategories: ServiceCategory[];
  userId?: string;
}

export interface UpdateVendorPayload {
  companyName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  addressLine?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode: string;
  gstNumber?: string;
  registrationNumber?: string;
  serviceCategories: ServiceCategory[];
}

export interface UpdateVendorStatusPayload {
  status: VendorStatus;
  reason?: string;
}

export type { PageResponse };
