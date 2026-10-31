import { backendClient } from './api';
import { 
  AuditEventItem, 
  AuditIntegrityReport, 
  AuditCategory, 
  AuditOutcome 
} from '../types/analytics';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const auditService = {
  getAuditEvents: async (params?: {
    search?: string;
    category?: AuditCategory | 'ALL';
    eventType?: string;
    actorId?: string;
    projectId?: string;
    vendorId?: string;
    entityType?: string;
    outcome?: AuditOutcome | 'ALL';
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AuditEventItem>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.category && params.category !== 'ALL') cleanParams.category = params.category;
    if (params?.eventType) cleanParams.eventType = params.eventType;
    if (params?.actorId) cleanParams.actorId = params.actorId;
    if (params?.projectId && params.projectId !== 'ALL') cleanParams.projectId = params.projectId;
    if (params?.vendorId && params.vendorId !== 'ALL') cleanParams.vendorId = params.vendorId;
    if (params?.entityType) cleanParams.entityType = params.entityType;
    if (params?.outcome && params.outcome !== 'ALL') cleanParams.outcome = params.outcome;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 20;

    const res = await backendClient.get<ApiResponse<PageResponse<AuditEventItem>>>('/v1/audit-events', {
      params: cleanParams,
    });
    return res.data.data;
  },

  getAuditEventById: async (eventId: string): Promise<AuditEventItem> => {
    const res = await backendClient.get<ApiResponse<AuditEventItem>>(`/v1/audit-events/${eventId}`);
    return res.data.data;
  },

  getEntityActivity: async (entityType: string, entityId: string): Promise<AuditEventItem[]> => {
    const res = await backendClient.get<ApiResponse<AuditEventItem[]>>(`/v1/audit-events/entity/${entityType}/${entityId}`);
    return res.data.data;
  },

  getUserActivity: async (userId: string, page = 0, size = 20): Promise<PageResponse<AuditEventItem>> => {
    const res = await backendClient.get<ApiResponse<PageResponse<AuditEventItem>>>(`/v1/audit-events/users/${userId}`, {
      params: { page, size },
    });
    return res.data.data;
  },

  getProjectActivity: async (projectId: string, page = 0, size = 20): Promise<PageResponse<AuditEventItem>> => {
    const res = await backendClient.get<ApiResponse<PageResponse<AuditEventItem>>>(`/v1/projects/${projectId}/activity`, {
      params: { page, size },
    });
    return res.data.data;
  },

  getVendorActivity: async (vendorId: string, page = 0, size = 20): Promise<PageResponse<AuditEventItem>> => {
    const res = await backendClient.get<ApiResponse<PageResponse<AuditEventItem>>>(`/v1/vendors/${vendorId}/activity`, {
      params: { page, size },
    });
    return res.data.data;
  },

  verifyChainIntegrity: async (chainScope = 'GLOBAL'): Promise<AuditIntegrityReport> => {
    const res = await backendClient.post<ApiResponse<AuditIntegrityReport>>('/v1/audit-events/integrity/verify', null, {
      params: { chainScope },
    });
    return res.data.data;
  },

  verifySingleEvent: async (eventId: string): Promise<boolean> => {
    const res = await backendClient.get<ApiResponse<boolean>>(`/v1/audit-events/integrity/${eventId}`);
    return res.data.data;
  },
};
