import { backendClient } from './api';
import { 
  AuditEventItem, 
  AuditIntegrityReport, 
  AuditCategory, 
  AuditOutcome 
} from '../types/analytics';
import { 
  getAllMergedAuditEvents, 
  filterAuditEvents, 
  verifyAuditChainIntegrity, 
  verifySingleAuditEvent 
} from '../data/mockAuditEvents';

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

function getLocalPageResponse(params?: {
  search?: string;
  category?: AuditCategory | 'ALL';
  outcome?: AuditOutcome | 'ALL';
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): PageResponse<AuditEventItem> {
  const all = getAllMergedAuditEvents();
  const filtered = filterAuditEvents(all, {
    search: params?.search,
    category: params?.category,
    outcome: params?.outcome,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });
  const page = params?.page ?? 0;
  const size = params?.size ?? 15;
  const startIdx = page * size;
  const content = filtered.slice(startIdx, startIdx + size);
  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));

  return {
    content,
    totalElements,
    totalPages,
    size,
    number: page,
    first: page === 0,
    last: page >= totalPages - 1,
  };
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

    try {
      const res = await backendClient.get<ApiResponse<PageResponse<AuditEventItem>>>('/v1/audit-events', {
        params: cleanParams,
      });
      if (res?.data?.data && res.data.data.content && res.data.data.content.length > 0) {
        return res.data.data;
      }
      return getLocalPageResponse(params);
    } catch {
      return getLocalPageResponse(params);
    }
  },

  getAuditEventById: async (eventId: string): Promise<AuditEventItem> => {
    try {
      const res = await backendClient.get<ApiResponse<AuditEventItem>>(`/v1/audit-events/${eventId}`);
      if (res?.data?.data) return res.data.data;
    } catch {
      // Fallback to local
    }
    const found = getAllMergedAuditEvents().find(e => e.id === eventId || e.eventCode === eventId);
    if (!found) {
      throw new Error(`Audit event not found: ${eventId}`);
    }
    return found;
  },

  getEntityActivity: async (entityType: string, entityId: string): Promise<AuditEventItem[]> => {
    try {
      const res = await backendClient.get<ApiResponse<AuditEventItem[]>>(`/v1/audit-events/entity/${entityType}/${entityId}`);
      if (res?.data?.data && res.data.data.length > 0) return res.data.data;
    } catch {
      // Fallback to local
    }
    return getAllMergedAuditEvents().filter(e => e.entityType === entityType && (e.entityId === entityId || e.entityReference?.includes(entityId)));
  },

  getUserActivity: async (userId: string, page = 0, size = 20): Promise<PageResponse<AuditEventItem>> => {
    try {
      const res = await backendClient.get<ApiResponse<PageResponse<AuditEventItem>>>(`/v1/audit-events/users/${userId}`, {
        params: { page, size },
      });
      if (res?.data?.data && res.data.data.content.length > 0) return res.data.data;
    } catch {
      // Fallback to local
    }
    const all = getAllMergedAuditEvents().filter(e => e.actorId === userId || e.actorName?.toLowerCase().includes(userId.toLowerCase()));
    const content = all.slice(page * size, (page + 1) * size);
    return {
      content,
      totalElements: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / size)),
      size,
      number: page,
      first: page === 0,
      last: page >= Math.ceil(all.length / size) - 1,
    };
  },

  getProjectActivity: async (projectId: string, page = 0, size = 20): Promise<PageResponse<AuditEventItem>> => {
    try {
      const res = await backendClient.get<ApiResponse<PageResponse<AuditEventItem>>>(`/v1/projects/${projectId}/activity`, {
        params: { page, size },
      });
      if (res?.data?.data && res.data.data.content.length > 0) return res.data.data;
    } catch {
      // Fallback to local
    }
    const all = getAllMergedAuditEvents().filter(e => e.projectId === projectId || e.entityReference?.includes(projectId));
    const content = all.slice(page * size, (page + 1) * size);
    return {
      content,
      totalElements: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / size)),
      size,
      number: page,
      first: page === 0,
      last: page >= Math.ceil(all.length / size) - 1,
    };
  },

  getVendorActivity: async (vendorId: string, page = 0, size = 20): Promise<PageResponse<AuditEventItem>> => {
    try {
      const res = await backendClient.get<ApiResponse<PageResponse<AuditEventItem>>>(`/v1/vendors/${vendorId}/activity`, {
        params: { page, size },
      });
      if (res?.data?.data && res.data.data.content.length > 0) return res.data.data;
    } catch {
      // Fallback to local
    }
    const all = getAllMergedAuditEvents().filter(e => e.vendorId === vendorId || e.entityReference?.includes(vendorId));
    const content = all.slice(page * size, (page + 1) * size);
    return {
      content,
      totalElements: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / size)),
      size,
      number: page,
      first: page === 0,
      last: page >= Math.ceil(all.length / size) - 1,
    };
  },

  verifyChainIntegrity: async (chainScope = 'GLOBAL'): Promise<AuditIntegrityReport> => {
    try {
      const res = await backendClient.post<ApiResponse<AuditIntegrityReport>>('/v1/audit-events/integrity/verify', null, {
        params: { chainScope },
      });
      if (res?.data?.data) return res.data.data;
    } catch {
      // Fallback to local
    }
    return verifyAuditChainIntegrity();
  },

  verifySingleEvent: async (eventId: string): Promise<boolean> => {
    try {
      const res = await backendClient.get<ApiResponse<boolean>>(`/v1/audit-events/integrity/${eventId}`);
      if (typeof res?.data?.data === 'boolean') return res.data.data;
    } catch {
      // Fallback to local
    }
    const found = getAllMergedAuditEvents().find(e => e.id === eventId || e.eventCode === eventId);
    if (!found) return false;
    return verifySingleAuditEvent(found);
  },
};
