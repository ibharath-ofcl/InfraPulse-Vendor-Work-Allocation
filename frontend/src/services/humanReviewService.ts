import { backendClient } from './api';
import {
  HumanReviewSummaryDto,
  HumanReviewDetailDto,
  RecordDecisionRequest,
  HumanInspectionDecisionDto,
  RecordMeasurementRequest,
  VerifyMeasurementRequest,
  PhysicalMeasurementDto,
  CreateCorrectiveActionRequest,
  SubmitCorrectiveEvidenceRequest,
  VerifyCorrectiveActionRequest,
  CorrectiveActionDto,
  CreateEscalationRequest,
  InspectionEscalationDto,
  ReviewStatus,
  ReviewPriority,
} from '../types/humanReview';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const humanReviewService = {
  // 1. Human Review Queue & Details
  getReviewQueue: async (params?: {
    status?: ReviewStatus | string;
    priority?: ReviewPriority | string;
    projectId?: string;
    vendorId?: string;
    reviewerId?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<HumanReviewSummaryDto>> => {
    const response = await backendClient.get<ApiResponse<PageResponse<HumanReviewSummaryDto>>>(
      '/v1/human-reviews',
      { params }
    );
    return response.data.data;
  },

  getReviewDetail: async (reviewId: string): Promise<HumanReviewDetailDto> => {
    const response = await backendClient.get<ApiResponse<HumanReviewDetailDto>>(
      `/v1/human-reviews/${reviewId}`
    );
    return response.data.data;
  },

  getReviewForAssessment: async (assessmentId: string): Promise<HumanReviewDetailDto> => {
    const response = await backendClient.get<ApiResponse<HumanReviewDetailDto>>(
      `/v1/human-reviews/assessment/${assessmentId}`
    );
    return response.data.data;
  },

  assignReviewer: async (reviewId: string, reviewerId: string): Promise<HumanReviewDetailDto> => {
    const response = await backendClient.post<ApiResponse<HumanReviewDetailDto>>(
      `/v1/human-reviews/${reviewId}/assign`,
      null,
      { params: { reviewerId } }
    );
    return response.data.data;
  },

  recordDecision: async (
    reviewId: string,
    request: RecordDecisionRequest
  ): Promise<HumanInspectionDecisionDto> => {
    const response = await backendClient.post<ApiResponse<HumanInspectionDecisionDto>>(
      `/v1/human-reviews/${reviewId}/decisions`,
      request
    );
    return response.data.data;
  },

  escalateReview: async (
    reviewId: string,
    request: CreateEscalationRequest
  ): Promise<InspectionEscalationDto> => {
    const response = await backendClient.post<ApiResponse<InspectionEscalationDto>>(
      `/v1/human-reviews/${reviewId}/escalate`,
      request
    );
    return response.data.data;
  },

  // 2. Physical Measurements
  recordMeasurement: async (
    assessmentId: string,
    request: RecordMeasurementRequest
  ): Promise<PhysicalMeasurementDto> => {
    const response = await backendClient.post<ApiResponse<PhysicalMeasurementDto>>(
      `/v1/quality/assessments/${assessmentId}/measurements`,
      request
    );
    return response.data.data;
  },

  getMeasurements: async (assessmentId: string): Promise<PhysicalMeasurementDto[]> => {
    const response = await backendClient.get<ApiResponse<PhysicalMeasurementDto[]>>(
      `/v1/quality/assessments/${assessmentId}/measurements`
    );
    return response.data.data;
  },

  verifyMeasurement: async (
    measurementId: string,
    request: VerifyMeasurementRequest
  ): Promise<PhysicalMeasurementDto> => {
    const response = await backendClient.put<ApiResponse<PhysicalMeasurementDto>>(
      `/v1/measurements/${measurementId}/verify`,
      request
    );
    return response.data.data;
  },

  // 3. Corrective Actions
  createCorrectiveAction: async (
    assessmentId: string,
    request: CreateCorrectiveActionRequest
  ): Promise<CorrectiveActionDto> => {
    const response = await backendClient.post<ApiResponse<CorrectiveActionDto>>(
      `/v1/quality/assessments/${assessmentId}/corrective-actions`,
      request
    );
    return response.data.data;
  },

  getActionsForAssessment: async (assessmentId: string): Promise<CorrectiveActionDto[]> => {
    const response = await backendClient.get<ApiResponse<CorrectiveActionDto[]>>(
      `/v1/quality/assessments/${assessmentId}/corrective-actions`
    );
    return response.data.data;
  },

  getCorrectiveActions: async (params?: {
    status?: string;
    priority?: string;
    vendorId?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<CorrectiveActionDto>> => {
    const response = await backendClient.get<ApiResponse<PageResponse<CorrectiveActionDto>>>(
      '/v1/corrective-actions',
      { params }
    );
    return response.data.data;
  },

  getActionById: async (actionId: string): Promise<CorrectiveActionDto> => {
    const response = await backendClient.get<ApiResponse<CorrectiveActionDto>>(
      `/v1/corrective-actions/${actionId}`
    );
    return response.data.data;
  },

  submitReworkEvidence: async (
    actionId: string,
    request: SubmitCorrectiveEvidenceRequest
  ): Promise<CorrectiveActionDto> => {
    const response = await backendClient.post<ApiResponse<CorrectiveActionDto>>(
      `/v1/corrective-actions/${actionId}/submit`,
      request
    );
    return response.data.data;
  },

  verifyCorrectiveAction: async (
    actionId: string,
    request: VerifyCorrectiveActionRequest
  ): Promise<CorrectiveActionDto> => {
    const response = await backendClient.put<ApiResponse<CorrectiveActionDto>>(
      `/v1/corrective-actions/${actionId}/verify`,
      request
    );
    return response.data.data;
  },

  getMyVendorCorrectiveActions: async (): Promise<CorrectiveActionDto[]> => {
    const response = await backendClient.get<ApiResponse<CorrectiveActionDto[]>>(
      '/v1/corrective-actions/my-actions'
    );
    return response.data.data;
  },
};
