import { backendClient } from './api';
import {
  WorkTypeDependencyItem,
  CreateDependencyPayload,
  UpdateDependencyPayload,
  WorkTypeEnum,
} from '../types/workAssignment';
import { PageResponse } from '../types/project';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const workDependencyService = {
  getAllRules: async (params?: {
    projectId?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<WorkTypeDependencyItem>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.projectId && params.projectId !== 'ALL') cleanParams.projectId = params.projectId;
    if (params?.isActive !== undefined) cleanParams.isActive = params.isActive;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 20;
    cleanParams.sort = params?.sort ?? 'priority,asc';

    const response = await backendClient.get<ApiResponse<PageResponse<WorkTypeDependencyItem>>>(
      '/v1/work-dependencies',
      { params: cleanParams }
    );
    return response.data.data;
  },

  getApplicableRules: async (
    workType: WorkTypeEnum,
    projectId?: string
  ): Promise<WorkTypeDependencyItem[]> => {
    const cleanParams: Record<string, unknown> = {};
    if (projectId && projectId !== 'ALL') cleanParams.projectId = projectId;

    const response = await backendClient.get<ApiResponse<WorkTypeDependencyItem[]>>(
      `/v1/work-dependencies/work-type/${workType}`,
      { params: cleanParams }
    );
    return response.data.data;
  },

  createRule: async (payload: CreateDependencyPayload): Promise<WorkTypeDependencyItem> => {
    const response = await backendClient.post<ApiResponse<WorkTypeDependencyItem>>(
      '/v1/work-dependencies',
      payload
    );
    return response.data.data;
  },

  updateRule: async (
    id: string,
    payload: UpdateDependencyPayload
  ): Promise<WorkTypeDependencyItem> => {
    const response = await backendClient.put<ApiResponse<WorkTypeDependencyItem>>(
      `/v1/work-dependencies/${id}`,
      payload
    );
    return response.data.data;
  },

  toggleStatus: async (
    id: string,
    isActive: boolean
  ): Promise<WorkTypeDependencyItem> => {
    const response = await backendClient.patch<ApiResponse<WorkTypeDependencyItem>>(
      `/v1/work-dependencies/${id}/status`,
      { isActive }
    );
    return response.data.data;
  },
};
