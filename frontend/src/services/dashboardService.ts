import { backendClient } from './api';
import {
  DashboardSummary,
  AssignmentDistributionResponse,
  ProjectProgressResponse,
  WorkZoneOverviewResponse,
  DependencyMonitoringResponse,
  VendorWorkloadResponse,
  RecentActivityResponse,
  DashboardSearchResponse,
  DashboardFilterParams,
} from '../types/dashboard';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const dashboardService = {
  getSummary: async (params?: DashboardFilterParams): Promise<DashboardSummary> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.projectId && params.projectId !== 'ALL') cleanParams.projectId = params.projectId;
    if (params?.pincode) cleanParams.pincode = params.pincode.trim();
    if (params?.workZoneId && params.workZoneId !== 'ALL') cleanParams.workZoneId = params.workZoneId;
    if (params?.vendorId && params.vendorId !== 'ALL') cleanParams.vendorId = params.vendorId;
    if (params?.workType && params.workType !== 'ALL') cleanParams.workType = params.workType;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;

    const response = await backendClient.get<ApiResponse<DashboardSummary>>('/v1/dashboard/summary', {
      params: cleanParams,
    });
    return response.data.data;
  },

  getAssignmentDistribution: async (params?: DashboardFilterParams): Promise<AssignmentDistributionResponse> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.projectId && params.projectId !== 'ALL') cleanParams.projectId = params.projectId;
    if (params?.pincode) cleanParams.pincode = params.pincode.trim();
    if (params?.workZoneId && params.workZoneId !== 'ALL') cleanParams.workZoneId = params.workZoneId;
    if (params?.vendorId && params.vendorId !== 'ALL') cleanParams.vendorId = params.vendorId;
    if (params?.workType && params.workType !== 'ALL') cleanParams.workType = params.workType;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;

    const response = await backendClient.get<ApiResponse<AssignmentDistributionResponse>>(
      '/v1/dashboard/assignment-distribution',
      { params: cleanParams }
    );
    return response.data.data;
  },

  getProjectProgress: async (projectId?: string): Promise<ProjectProgressResponse> => {
    const cleanParams: Record<string, unknown> = {};
    if (projectId && projectId !== 'ALL') cleanParams.projectId = projectId;

    const response = await backendClient.get<ApiResponse<ProjectProgressResponse>>(
      '/v1/dashboard/project-progress',
      { params: cleanParams }
    );
    return response.data.data;
  },

  getWorkZones: async (
    params?: DashboardFilterParams & { page?: number; size?: number; sort?: string }
  ): Promise<WorkZoneOverviewResponse> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.projectId && params.projectId !== 'ALL') cleanParams.projectId = params.projectId;
    if (params?.pincode) cleanParams.pincode = params.pincode.trim();
    if (params?.workZoneId && params.workZoneId !== 'ALL') cleanParams.workZoneId = params.workZoneId;
    if (params?.vendorId && params.vendorId !== 'ALL') cleanParams.vendorId = params.vendorId;
    if (params?.workType && params.workType !== 'ALL') cleanParams.workType = params.workType;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 20;
    if (params?.sort) cleanParams.sort = params.sort;

    const response = await backendClient.get<ApiResponse<WorkZoneOverviewResponse>>('/v1/dashboard/work-zones', {
      params: cleanParams,
    });
    return response.data.data;
  },

  getDependencyMonitoring: async (
    projectId?: string,
    workZoneId?: string
  ): Promise<DependencyMonitoringResponse> => {
    const cleanParams: Record<string, unknown> = {};
    if (projectId && projectId !== 'ALL') cleanParams.projectId = projectId;
    if (workZoneId && workZoneId !== 'ALL') cleanParams.workZoneId = workZoneId;

    const response = await backendClient.get<ApiResponse<DependencyMonitoringResponse>>(
      '/v1/dashboard/dependency-monitoring',
      { params: cleanParams }
    );
    return response.data.data;
  },

  getVendorWorkload: async (projectId?: string): Promise<VendorWorkloadResponse> => {
    const cleanParams: Record<string, unknown> = {};
    if (projectId && projectId !== 'ALL') cleanParams.projectId = projectId;

    const response = await backendClient.get<ApiResponse<VendorWorkloadResponse>>(
      '/v1/dashboard/vendor-workload',
      { params: cleanParams }
    );
    return response.data.data;
  },

  getRecentActivity: async (
    projectId?: string,
    page: number = 0,
    size: number = 10
  ): Promise<RecentActivityResponse> => {
    const cleanParams: Record<string, unknown> = { page, size };
    if (projectId && projectId !== 'ALL') cleanParams.projectId = projectId;

    const response = await backendClient.get<ApiResponse<RecentActivityResponse>>(
      '/v1/dashboard/recent-activity',
      { params: cleanParams }
    );
    return response.data.data;
  },

  globalSearch: async (query: string): Promise<DashboardSearchResponse> => {
    const response = await backendClient.get<ApiResponse<DashboardSearchResponse>>('/v1/dashboard/search', {
      params: { q: query },
    });
    return response.data.data;
  },
};
