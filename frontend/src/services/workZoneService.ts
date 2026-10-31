import { backendClient } from './api';
import {
  WorkZoneItem,
  CreateWorkZonePayload,
  UpdateWorkZonePayload,
  UpdateZoneStatusPayload,
  ZoneStatus,
} from '../types/workZone';
import { PageResponse } from '../types/project';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const workZoneService = {
  getWorkZones: async (params?: {
    projectId?: string;
    pincode?: string;
    status?: ZoneStatus | 'ALL';
    locality?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<WorkZoneItem>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.projectId && params.projectId !== 'ALL') cleanParams.projectId = params.projectId;
    if (params?.pincode) cleanParams.pincode = params.pincode.trim();
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.locality) cleanParams.locality = params.locality;
    if (params?.search) cleanParams.search = params.search;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 10;
    cleanParams.sort = params?.sort ?? 'createdAt,desc';

    const response = await backendClient.get<ApiResponse<PageResponse<WorkZoneItem>>>('/v1/work-zones', {
      params: cleanParams,
    });
    return response.data.data;
  },

  getWorkZoneById: async (id: string): Promise<WorkZoneItem> => {
    const response = await backendClient.get<ApiResponse<WorkZoneItem>>(`/v1/work-zones/${id}`);
    return response.data.data;
  },

  createWorkZone: async (payload: CreateWorkZonePayload): Promise<WorkZoneItem> => {
    const response = await backendClient.post<ApiResponse<WorkZoneItem>>('/v1/work-zones', payload);
    return response.data.data;
  },

  updateWorkZone: async (id: string, payload: UpdateWorkZonePayload): Promise<WorkZoneItem> => {
    const response = await backendClient.put<ApiResponse<WorkZoneItem>>(`/v1/work-zones/${id}`, payload);
    return response.data.data;
  },

  updateWorkZoneStatus: async (id: string, payload: UpdateZoneStatusPayload): Promise<WorkZoneItem> => {
    const response = await backendClient.patch<ApiResponse<WorkZoneItem>>(`/v1/work-zones/${id}/status`, payload);
    return response.data.data;
  },
};
