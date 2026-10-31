import { backendClient } from './api';
import {
  OperationalDashboardSummary,
  VendorPerformance,
  VendorComparison,
  VendorRanking,
  ProjectPerformance,
  ScoringConfiguration,
  ExportReportRequest,
  ReportJobResponse,
} from '../types/analytics';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const analyticsService = {
  getOperationalDashboard: async (projectId?: string): Promise<OperationalDashboardSummary> => {
    const params: Record<string, string> = {};
    if (projectId && projectId !== 'ALL') params.projectId = projectId;
    const res = await backendClient.get<ApiResponse<OperationalDashboardSummary>>('/v1/analytics/dashboard/summary', { params });
    return res.data.data;
  },

  getVendorPerformance: async (vendorId: string, projectId?: string, startDate?: string, endDate?: string): Promise<VendorPerformance> => {
    const params: Record<string, string> = {};
    if (projectId && projectId !== 'ALL') params.projectId = projectId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await backendClient.get<ApiResponse<VendorPerformance>>(`/v1/analytics/vendors/${vendorId}`, { params });
    return res.data.data;
  },

  getAllVendorsPerformance: async (projectId?: string): Promise<VendorPerformance[]> => {
    const params: Record<string, string> = {};
    if (projectId && projectId !== 'ALL') params.projectId = projectId;
    const res = await backendClient.get<ApiResponse<VendorPerformance[]>>('/v1/analytics/vendors', { params });
    return res.data.data;
  },

  getVendorRankings: async (projectId?: string): Promise<VendorRanking[]> => {
    const params: Record<string, string> = {};
    if (projectId && projectId !== 'ALL') params.projectId = projectId;
    const res = await backendClient.get<ApiResponse<VendorRanking[]>>('/v1/analytics/vendors/rankings', { params });
    return res.data.data;
  },

  compareVendors: async (vendorIds: string[], projectId?: string): Promise<VendorComparison> => {
    const params: Record<string, string> = { vendorIds: vendorIds.join(',') };
    if (projectId && projectId !== 'ALL') params.projectId = projectId;
    const res = await backendClient.get<ApiResponse<VendorComparison>>('/v1/analytics/vendors/comparison', { params });
    return res.data.data;
  },

  getProjectPerformance: async (projectId: string): Promise<ProjectPerformance> => {
    const res = await backendClient.get<ApiResponse<ProjectPerformance>>(`/v1/analytics/projects/${projectId}`);
    return res.data.data;
  },

  getAllProjectsPerformance: async (): Promise<ProjectPerformance[]> => {
    const res = await backendClient.get<ApiResponse<ProjectPerformance[]>>('/v1/analytics/projects');
    return res.data.data;
  },

  getScoringConfigurations: async (): Promise<ScoringConfiguration[]> => {
    const res = await backendClient.get<ApiResponse<ScoringConfiguration[]>>('/v1/analytics/scoring-configs');
    return res.data.data;
  },

  getActiveScoringConfiguration: async (): Promise<ScoringConfiguration> => {
    const res = await backendClient.get<ApiResponse<ScoringConfiguration>>('/v1/analytics/scoring-configs/active');
    return res.data.data;
  },

  createScoringConfiguration: async (payload: Partial<ScoringConfiguration>): Promise<ScoringConfiguration> => {
    const res = await backendClient.post<ApiResponse<ScoringConfiguration>>('/v1/analytics/scoring-configs', payload);
    return res.data.data;
  },

  activateScoringConfiguration: async (configId: string): Promise<ScoringConfiguration> => {
    const res = await backendClient.patch<ApiResponse<ScoringConfiguration>>(`/v1/analytics/scoring-configs/${configId}/activate`);
    return res.data.data;
  },

  exportReport: async (req: ExportReportRequest): Promise<ReportJobResponse> => {
    const res = await backendClient.post<ApiResponse<ReportJobResponse>>('/v1/reports/export', req);
    return res.data.data;
  },

  getReportJobStatus: async (jobId: string): Promise<ReportJobResponse> => {
    const res = await backendClient.get<ApiResponse<ReportJobResponse>>(`/v1/reports/jobs/${jobId}`);
    return res.data.data;
  },

  getReportJobs: async (page = 0, size = 10) => {
    const res = await backendClient.get<ApiResponse<any>>('/v1/reports/jobs', { params: { page, size } });
    return res.data.data;
  },

  downloadReportContent: async (jobId: string): Promise<Blob> => {
    const res = await backendClient.get(`/v1/reports/jobs/${jobId}/download`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
