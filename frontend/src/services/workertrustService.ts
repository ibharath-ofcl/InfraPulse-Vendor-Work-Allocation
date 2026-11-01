import { backendClient } from './api';
import {
  WorkerSummaryResponse,
  WorkerDetailResponse,
  WorkerDocumentDto,
  WorkerVerificationDto,
  WorkerCertificationDto,
  WorkerAssignmentDto,
  WorkerSiteAccessDto,
  WorkerIncidentDto,
  WorkerQrBadgeResponse,
  SiteAccessScanResult,
  EmergencyHeadcountResponse,
  WorkforceAnalyticsResponse,
  RegisterWorkerPayload,
  AddCertificationPayload,
  WorkerApprovalPayload,
  AssignWorkerPayload,
  SiteCheckInPayload,
  ReportIncidentPayload,
  ResolveIncidentPayload,
  SuspendWorkerPayload,
  ReactivateWorkerPayload,
  WorkerStatus,
  CertificationStatus,
  IncidentStatus,
  IncidentSeverity,
} from '../types/workertrust';
import { PageResponse } from '../types/project';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const workertrustService = {
  listWorkers: async (params?: {
    status?: WorkerStatus | 'ALL';
    search?: string;
    vendorId?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<WorkerSummaryResponse>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.search) cleanParams.search = params.search;
    if (params?.vendorId) cleanParams.vendorId = params.vendorId;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 15;

    const res = await backendClient.get<ApiResponse<PageResponse<WorkerSummaryResponse>>>('/api/v1/workertrust/workers', {
      params: cleanParams,
    });
    return res.data.data;
  },

  getWorkerDetail: async (workerId: string): Promise<WorkerDetailResponse> => {
    const res = await backendClient.get<ApiResponse<WorkerDetailResponse>>(`/api/v1/workertrust/workers/${workerId}`);
    return res.data.data;
  },

  registerWorker: async (payload: RegisterWorkerPayload): Promise<WorkerSummaryResponse> => {
    const res = await backendClient.post<ApiResponse<WorkerSummaryResponse>>('/api/v1/workertrust/workers', payload);
    return res.data.data;
  },

  uploadDocument: async (
    workerId: string,
    documentType: string,
    originalFilename: string,
    contentType: string,
    fileSize: number,
    secureStorageReference?: string
  ): Promise<WorkerDocumentDto> => {
    const params = {
      documentType,
      originalFilename,
      contentType,
      fileSize,
      secureStorageReference,
    };
    const res = await backendClient.post<ApiResponse<WorkerDocumentDto>>(`/api/v1/workertrust/workers/${workerId}/documents`, null, {
      params,
    });
    return res.data.data;
  },

  reviewDocument: async (documentId: string, documentStatus: string, reviewNotes?: string): Promise<WorkerDocumentDto> => {
    const res = await backendClient.patch<ApiResponse<WorkerDocumentDto>>(`/api/v1/workertrust/documents/${documentId}/review`, {
      documentStatus,
      reviewNotes,
    });
    return res.data.data;
  },

  reviewVerification: async (verificationId: string, verificationStatus: string, reviewNotes?: string): Promise<WorkerVerificationDto> => {
    const res = await backendClient.patch<ApiResponse<WorkerVerificationDto>>(`/api/v1/workertrust/verifications/${verificationId}/review`, {
      verificationStatus,
      reviewNotes,
    });
    return res.data.data;
  },

  addCertification: async (workerId: string, payload: AddCertificationPayload): Promise<WorkerCertificationDto> => {
    const res = await backendClient.post<ApiResponse<WorkerCertificationDto>>(`/api/v1/workertrust/workers/${workerId}/certifications`, payload);
    return res.data.data;
  },

  verifyCertification: async (certId: string, status: CertificationStatus): Promise<WorkerCertificationDto> => {
    const res = await backendClient.patch<ApiResponse<WorkerCertificationDto>>(`/api/v1/workertrust/certifications/${certId}/verify`, null, {
      params: { status },
    });
    return res.data.data;
  },

  approveWorker: async (workerId: string, payload: WorkerApprovalPayload): Promise<WorkerDetailResponse> => {
    const res = await backendClient.post<ApiResponse<WorkerDetailResponse>>(`/api/v1/workertrust/workers/${workerId}/approval`, payload);
    return res.data.data;
  },

  suspendWorker: async (workerId: string, payload: SuspendWorkerPayload): Promise<WorkerDetailResponse> => {
    const res = await backendClient.post<ApiResponse<WorkerDetailResponse>>(`/api/v1/workertrust/workers/${workerId}/suspend`, payload);
    return res.data.data;
  },

  reactivateWorker: async (workerId: string, payload: ReactivateWorkerPayload): Promise<WorkerDetailResponse> => {
    const res = await backendClient.post<ApiResponse<WorkerDetailResponse>>(`/api/v1/workertrust/workers/${workerId}/reactivate`, payload);
    return res.data.data;
  },

  getQrBadge: async (workerId: string): Promise<WorkerQrBadgeResponse> => {
    const res = await backendClient.get<ApiResponse<WorkerQrBadgeResponse>>(`/api/v1/workertrust/workers/${workerId}/qr-badge`);
    return res.data.data;
  },

  assignWorker: async (workerId: string, payload: AssignWorkerPayload): Promise<WorkerAssignmentDto> => {
    const res = await backendClient.post<ApiResponse<WorkerAssignmentDto>>(`/api/v1/workertrust/workers/${workerId}/assignments`, payload);
    return res.data.data;
  },

  cancelAssignment: async (assignmentId: string): Promise<WorkerAssignmentDto> => {
    const res = await backendClient.delete<ApiResponse<WorkerAssignmentDto>>(`/api/v1/workertrust/assignments/${assignmentId}`);
    return res.data.data;
  },

  checkIn: async (payload: SiteCheckInPayload): Promise<SiteAccessScanResult> => {
    const res = await backendClient.post<ApiResponse<SiteAccessScanResult>>('/api/v1/workertrust/site-access/check-in', payload);
    return res.data.data;
  },

  checkOut: async (identifier: string): Promise<SiteAccessScanResult> => {
    const res = await backendClient.post<ApiResponse<SiteAccessScanResult>>('/api/v1/workertrust/site-access/check-out', { identifier });
    return res.data.data;
  },

  getEmergencyHeadcount: async (projectId?: string, workZoneId?: string): Promise<EmergencyHeadcountResponse> => {
    const res = await backendClient.get<ApiResponse<EmergencyHeadcountResponse>>('/api/v1/workertrust/site-access/emergency-headcount', {
      params: { projectId, workZoneId },
    });
    return res.data.data;
  },

  getAttendanceHistory: async (vendorId?: string, page = 0, size = 20): Promise<PageResponse<WorkerSiteAccessDto>> => {
    const res = await backendClient.get<ApiResponse<PageResponse<WorkerSiteAccessDto>>>('/api/v1/workertrust/site-access/attendance', {
      params: { vendorId, page, size },
    });
    return res.data.data;
  },

  reportIncident: async (payload: ReportIncidentPayload): Promise<WorkerIncidentDto> => {
    const res = await backendClient.post<ApiResponse<WorkerIncidentDto>>('/api/v1/workertrust/incidents', payload);
    return res.data.data;
  },

  listIncidents: async (params?: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    projectId?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<WorkerIncidentDto>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.status) cleanParams.status = params.status;
    if (params?.severity) cleanParams.severity = params.severity;
    if (params?.projectId) cleanParams.projectId = params.projectId;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 15;

    const res = await backendClient.get<ApiResponse<PageResponse<WorkerIncidentDto>>>('/api/v1/workertrust/incidents', {
      params: cleanParams,
    });
    return res.data.data;
  },

  resolveIncident: async (incidentId: string, payload: ResolveIncidentPayload): Promise<WorkerIncidentDto> => {
    const res = await backendClient.patch<ApiResponse<WorkerIncidentDto>>(`/api/v1/workertrust/incidents/${incidentId}/resolve`, payload);
    return res.data.data;
  },

  getAnalytics: async (projectId?: string, vendorId?: string): Promise<WorkforceAnalyticsResponse> => {
    const res = await backendClient.get<ApiResponse<WorkforceAnalyticsResponse>>('/api/v1/workertrust/analytics', {
      params: { projectId, vendorId },
    });
    return res.data.data;
  },
};

