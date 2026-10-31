import { backendClient } from './api';
import { 
  ProjectResponse, 
  ProjectDetailResponse, 
  CreateProjectPayload, 
  UpdateProjectPayload, 
  UpdateProjectStatusPayload, 
  AssignManagerPayload, 
  AssociateVendorPayload, 
  ProjectVendorAssociation,
  PageResponse 
} from '../types/project';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const projectService = {
  getProjects: async (params?: {
    search?: string;
    status?: string;
    projectType?: string;
    region?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<ProjectResponse>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.projectType && params.projectType !== 'ALL') cleanParams.projectType = params.projectType;
    if (params?.region && params.region !== 'ALL') cleanParams.region = params.region;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 10;
    cleanParams.sort = params?.sort ?? 'createdAt,desc';

    const response = await backendClient.get<ApiResponse<PageResponse<ProjectResponse>>>('/v1/projects', {
      params: cleanParams,
    });
    return response.data.data;
  },

  getProjectById: async (id: string): Promise<ProjectDetailResponse> => {
    const response = await backendClient.get<ApiResponse<ProjectDetailResponse>>(`/v1/projects/${id}`);
    return response.data.data;
  },

  createProject: async (payload: CreateProjectPayload): Promise<ProjectResponse> => {
    const response = await backendClient.post<ApiResponse<ProjectResponse>>('/v1/projects', payload);
    return response.data.data;
  },

  updateProject: async (id: string, payload: UpdateProjectPayload): Promise<ProjectResponse> => {
    const response = await backendClient.put<ApiResponse<ProjectResponse>>(`/v1/projects/${id}`, payload);
    return response.data.data;
  },

  updateProjectStatus: async (id: string, payload: UpdateProjectStatusPayload): Promise<ProjectResponse> => {
    const response = await backendClient.patch<ApiResponse<ProjectResponse>>(`/v1/projects/${id}/status`, payload);
    return response.data.data;
  },

  assignManager: async (id: string, payload: AssignManagerPayload): Promise<ProjectResponse> => {
    const response = await backendClient.put<ApiResponse<ProjectResponse>>(`/v1/projects/${id}/manager`, payload);
    return response.data.data;
  },

  associateVendor: async (projectId: string, payload: AssociateVendorPayload): Promise<ProjectVendorAssociation> => {
    const response = await backendClient.post<ApiResponse<ProjectVendorAssociation>>(
      `/v1/projects/${projectId}/vendors`,
      payload
    );
    return response.data.data;
  },

  removeVendorAssociation: async (projectId: string, vendorId: string): Promise<void> => {
    await backendClient.delete(`/v1/projects/${projectId}/vendors/${vendorId}`);
  },
};
