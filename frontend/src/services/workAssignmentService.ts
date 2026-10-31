import { backendClient } from './api';
import {
  WorkAssignmentItem,
  CreateWorkAssignmentPayload,
  UpdateWorkAssignmentPayload,
  UpdateAssignmentStatusPayload,
  CancelAssignmentPayload,
  WorkTypeEnum,
  AssignmentStatusEnum,
  AssignmentPriorityEnum,
} from '../types/workAssignment';
import { PageResponse } from '../types/project';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const workAssignmentService = {
  getAssignments: async (params?: {
    projectId?: string;
    workZoneId?: string;
    pincode?: string;
    vendorId?: string;
    workType?: WorkTypeEnum | 'ALL';
    status?: AssignmentStatusEnum | 'ALL';
    priority?: AssignmentPriorityEnum | 'ALL';
    startDateFrom?: string;
    startDateTo?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<WorkAssignmentItem>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.projectId && params.projectId !== 'ALL') cleanParams.projectId = params.projectId;
    if (params?.workZoneId) cleanParams.workZoneId = params.workZoneId;
    if (params?.pincode) cleanParams.pincode = params.pincode.trim();
    if (params?.vendorId && params.vendorId !== 'ALL') cleanParams.vendorId = params.vendorId;
    if (params?.workType && params.workType !== 'ALL') cleanParams.workType = params.workType;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.priority && params.priority !== 'ALL') cleanParams.priority = params.priority;
    if (params?.startDateFrom) cleanParams.startDateFrom = params.startDateFrom;
    if (params?.startDateTo) cleanParams.startDateTo = params.startDateTo;
    if (params?.search) cleanParams.search = params.search;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 10;
    cleanParams.sort = params?.sort ?? 'createdAt,desc';

    const response = await backendClient.get<ApiResponse<PageResponse<WorkAssignmentItem>>>('/v1/work-assignments', {
      params: cleanParams,
    });
    return response.data.data;
  },

  getAssignmentById: async (id: string): Promise<WorkAssignmentItem> => {
    const response = await backendClient.get<ApiResponse<WorkAssignmentItem>>(`/v1/work-assignments/${id}`);
    return response.data.data;
  },

  createAssignment: async (payload: CreateWorkAssignmentPayload): Promise<WorkAssignmentItem> => {
    const response = await backendClient.post<ApiResponse<WorkAssignmentItem>>('/v1/work-assignments', payload);
    return response.data.data;
  },

  updateAssignment: async (id: string, payload: UpdateWorkAssignmentPayload): Promise<WorkAssignmentItem> => {
    const response = await backendClient.put<ApiResponse<WorkAssignmentItem>>(`/v1/work-assignments/${id}`, payload);
    return response.data.data;
  },

  updateAssignmentStatus: async (id: string, payload: UpdateAssignmentStatusPayload): Promise<WorkAssignmentItem> => {
    const response = await backendClient.patch<ApiResponse<WorkAssignmentItem>>(`/v1/work-assignments/${id}/status`, payload);
    return response.data.data;
  },

  cancelAssignment: async (id: string, payload: CancelAssignmentPayload): Promise<WorkAssignmentItem> => {
    const response = await backendClient.post<ApiResponse<WorkAssignmentItem>>(`/v1/work-assignments/${id}/cancel`, payload);
    return response.data.data;
  },

  getVendorMyAssignments: async (params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<WorkAssignmentItem>> => {
    const cleanParams: Record<string, unknown> = {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
      sort: params?.sort ?? 'createdAt,desc',
    };

    const response = await backendClient.get<ApiResponse<PageResponse<WorkAssignmentItem>>>('/v1/vendors/me/work-assignments', {
      params: cleanParams,
    });
    return response.data.data;
  },
};
