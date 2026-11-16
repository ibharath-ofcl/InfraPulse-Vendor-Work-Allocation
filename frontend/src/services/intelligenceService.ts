import { backendClient } from './api';
import {
  ProjectContract,
  ContractRequirement,
  RequirementEvidenceLink,
  ContractComplianceSummary,
  InfrastructureDefect,
  DefectRecurrenceCandidate,
  DefectDashboardSummary,
  VendorDefectScorecard,
  ProjectRiskAssessment,
  ProjectRiskAlert,
  RiskDashboardSummary,
  IntelligenceOverview,
} from '../types/intelligence';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const intelligenceService = {
  // Unified Intelligence
  async getOverview(projectId: string): Promise<IntelligenceOverview> {
    const res = await backendClient.get<ApiResponse<IntelligenceOverview>>(`/v1/intelligence/overview`, { params: { projectId } });
    return res.data.data;
  },

  // Module A — Contract Intelligence
  async listContracts(params?: { projectId?: string; status?: string; page?: number; size?: number }): Promise<PageResponse<ProjectContract>> {
    const res = await backendClient.get<ApiResponse<PageResponse<ProjectContract>>>(`/v1/intelligence/contracts`, { params });
    return res.data.data;
  },

  async getContract(id: string): Promise<ProjectContract> {
    const res = await backendClient.get<ApiResponse<ProjectContract>>(`/v1/intelligence/contracts/${id}`);
    return res.data.data;
  },

  async createContract(data: {
    projectId: string;
    contractorId?: string;
    title: string;
    contractType: string;
    totalValue: number;
    startDate?: string;
    endDate?: string;
    description?: string;
  }): Promise<ProjectContract> {
    const res = await backendClient.post<ApiResponse<ProjectContract>>(`/v1/intelligence/contracts`, data);
    return res.data.data;
  },

  async uploadContractDocument(contractId: string, file: File, documentTitle?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (documentTitle) formData.append('documentTitle', documentTitle);

    const res = await backendClient.post<ApiResponse<any>>(`/v1/intelligence/contracts/${contractId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async listRequirements(params?: {
    projectId?: string;
    contractId?: string;
    category?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ContractRequirement>> {
    const res = await backendClient.get<ApiResponse<PageResponse<ContractRequirement>>>(`/v1/intelligence/requirements`, { params });
    return res.data.data;
  },

  async getRequirement(id: string): Promise<ContractRequirement> {
    const res = await backendClient.get<ApiResponse<ContractRequirement>>(`/v1/intelligence/requirements/${id}`);
    return res.data.data;
  },

  async approveRequirement(id: string, notes?: string): Promise<ContractRequirement> {
    const res = await backendClient.post<ApiResponse<ContractRequirement>>(`/v1/intelligence/requirements/${id}/approve`, null, {
      params: { notes },
    });
    return res.data.data;
  },

  async rejectRequirement(id: string, notes?: string): Promise<ContractRequirement> {
    const res = await backendClient.post<ApiResponse<ContractRequirement>>(`/v1/intelligence/requirements/${id}/reject`, null, {
      params: { notes },
    });
    return res.data.data;
  },

  async listRequirementEvidence(requirementId: string): Promise<RequirementEvidenceLink[]> {
    const res = await backendClient.get<ApiResponse<RequirementEvidenceLink[]>>(`/v1/intelligence/requirements/${requirementId}/evidence`);
    return res.data.data;
  },

  async recordPhysicalMeasurement(
    requirementEvidenceId: string,
    data: {
      measuredValue: string;
      measurementUnit: string;
      physicalMeasurementTool: string;
      measurementNotes?: string;
    }
  ): Promise<RequirementEvidenceLink> {
    const res = await backendClient.post<ApiResponse<RequirementEvidenceLink>>(`/v1/intelligence/requirements/evidence/${requirementEvidenceId}/measurement`, data);
    return res.data.data;
  },

  async requestWaiver(
    requirementEvidenceId: string,
    data: { waiverReason: string }
  ): Promise<RequirementEvidenceLink> {
    const res = await backendClient.post<ApiResponse<RequirementEvidenceLink>>(`/v1/intelligence/requirements/evidence/${requirementEvidenceId}/waiver`, data);
    return res.data.data;
  },

  async getContractComplianceSummary(projectId: string): Promise<ContractComplianceSummary> {
    const res = await backendClient.get<ApiResponse<ContractComplianceSummary>>(`/v1/intelligence/contracts/summary`, { params: { projectId } });
    return res.data.data;
  },

  // Module B — Defect Intelligence
  async searchDefects(params?: {
    projectId?: string;
    vendorId?: string;
    category?: string;
    status?: string;
    recurring?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<InfrastructureDefect>> {
    const res = await backendClient.get<ApiResponse<PageResponse<InfrastructureDefect>>>(`/v1/intelligence/defects`, { params });
    return res.data.data;
  },

  async getDefect(id: string): Promise<InfrastructureDefect> {
    const res = await backendClient.get<ApiResponse<InfrastructureDefect>>(`/v1/intelligence/defects/${id}`);
    return res.data.data;
  },

  async createDefect(data: {
    projectId: string;
    workZoneId?: string;
    vendorId?: string;
    assignmentId?: string;
    evidenceId?: string;
    category: string;
    severity?: string;
    confidence?: number;
    description: string;
    boundingBoxJson?: string;
  }): Promise<InfrastructureDefect> {
    const res = await backendClient.post<ApiResponse<InfrastructureDefect>>(`/v1/intelligence/defects`, data);
    return res.data.data;
  },

  async updateDefectStatus(
    id: string,
    data: { newStatus: string; reviewNotes?: string; actionTaken?: string }
  ): Promise<InfrastructureDefect> {
    const res = await backendClient.patch<ApiResponse<InfrastructureDefect>>(`/v1/intelligence/defects/${id}/status`, data);
    return res.data.data;
  },

  async getRecurrenceCandidates(defectId: string): Promise<DefectRecurrenceCandidate[]> {
    const res = await backendClient.get<ApiResponse<DefectRecurrenceCandidate[]>>(`/v1/intelligence/defects/${defectId}/recurrence-candidates`);
    return res.data.data;
  },

  async confirmRecurrence(candidateId: string, confirmed: boolean): Promise<void> {
    await backendClient.post<ApiResponse<void>>(`/v1/intelligence/defects/recurrence/${candidateId}/confirm`, null, {
      params: { confirmed },
    });
  },

  async getDefectDashboardSummary(projectId: string): Promise<DefectDashboardSummary> {
    const res = await backendClient.get<ApiResponse<DefectDashboardSummary>>(`/v1/intelligence/defects/summary`, { params: { projectId } });
    return res.data.data;
  },

  async getVendorDefectScorecard(vendorId: string): Promise<VendorDefectScorecard> {
    const res = await backendClient.get<ApiResponse<VendorDefectScorecard>>(`/v1/intelligence/defects/vendor-scorecard/${vendorId}`);
    return res.data.data;
  },

  // Module C — Predictive Risk Intelligence
  async evaluateProjectRisk(projectId: string): Promise<ProjectRiskAssessment> {
    const res = await backendClient.post<ApiResponse<ProjectRiskAssessment>>(`/v1/intelligence/risk/evaluate`, null, { params: { projectId } });
    return res.data.data;
  },

  async getLatestRiskAssessment(projectId: string): Promise<ProjectRiskAssessment | null> {
    const res = await backendClient.get<ApiResponse<ProjectRiskAssessment>>(`/v1/intelligence/risk/assessments/latest`, { params: { projectId } });
    return res.data.data;
  },

  async searchRiskAlerts(params?: {
    projectId?: string;
    category?: string;
    level?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ProjectRiskAlert>> {
    const res = await backendClient.get<ApiResponse<PageResponse<ProjectRiskAlert>>>(`/v1/intelligence/risk/alerts`, { params });
    return res.data.data;
  },

  async getRiskAlert(id: string): Promise<ProjectRiskAlert> {
    const res = await backendClient.get<ApiResponse<ProjectRiskAlert>>(`/v1/intelligence/risk/alerts/${id}`);
    return res.data.data;
  },

  async updateRiskAlertStatus(
    id: string,
    data: { status: string; resolutionNotes?: string }
  ): Promise<ProjectRiskAlert> {
    const res = await backendClient.patch<ApiResponse<ProjectRiskAlert>>(`/v1/intelligence/risk/alerts/${id}/status`, data);
    return res.data.data;
  },

  async getRiskDashboardSummary(projectId: string): Promise<RiskDashboardSummary> {
    const res = await backendClient.get<ApiResponse<RiskDashboardSummary>>(`/v1/intelligence/risk/dashboard`, { params: { projectId } });
    return res.data.data;
  },
};
