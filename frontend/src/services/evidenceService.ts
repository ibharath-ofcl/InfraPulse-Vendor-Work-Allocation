import { backendClient } from './api';
import {
  EvidenceDetail,
  EvidenceListResponse,
  EvidenceIntegrityResponse,
  EvidenceCategory,
  EvidenceReviewStatus,
} from '../types/evidence';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const evidenceService = {
  uploadEvidence: async (
    assignmentId: string,
    files: File[],
    category: EvidenceCategory,
    description?: string,
    captureTimestamp?: string,
    latitude?: number,
    longitude?: number
  ): Promise<EvidenceDetail[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('category', category);
    if (description) formData.append('description', description);
    if (captureTimestamp) formData.append('captureTimestamp', captureTimestamp);
    if (latitude !== undefined) formData.append('latitude', latitude.toString());
    if (longitude !== undefined) formData.append('longitude', longitude.toString());

    const response = await backendClient.post<ApiResponse<EvidenceDetail[]>>(
      `/v1/work-assignments/${assignmentId}/evidence`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  getAssignmentEvidence: async (
    assignmentId: string,
    category?: EvidenceCategory,
    page: number = 0,
    size: number = 20
  ): Promise<EvidenceListResponse> => {
    const params: Record<string, unknown> = { page, size };
    if (category && category !== ('ALL' as any)) {
      params.category = category;
    }

    const response = await backendClient.get<ApiResponse<EvidenceListResponse>>(
      `/v1/work-assignments/${assignmentId}/evidence`,
      { params }
    );
    return response.data.data;
  },

  getEvidenceDetails: async (evidenceId: string): Promise<EvidenceDetail> => {
    const response = await backendClient.get<ApiResponse<EvidenceDetail>>(`/v1/evidence/${evidenceId}`);
    return response.data.data;
  },

  verifyIntegrity: async (evidenceId: string): Promise<EvidenceIntegrityResponse> => {
    const response = await backendClient.get<ApiResponse<EvidenceIntegrityResponse>>(
      `/v1/evidence/${evidenceId}/integrity`
    );
    return response.data.data;
  },

  reviewEvidence: async (
    evidenceId: string,
    reviewStatus: EvidenceReviewStatus,
    reviewNotes?: string
  ): Promise<EvidenceDetail> => {
    const response = await backendClient.post<ApiResponse<EvidenceDetail>>(
      `/v1/evidence/${evidenceId}/review`,
      { reviewStatus, reviewNotes }
    );
    return response.data.data;
  },

  deleteEvidence: async (evidenceId: string, reason?: string): Promise<void> => {
    await backendClient.delete(`/v1/evidence/${evidenceId}`, {
      params: { reason },
    });
  },

  getFileUrl: (evidenceId: string): string => {
    return `/api/v1/evidence/${evidenceId}/file`;
  },

  getPreviewUrl: (evidenceId: string): string => {
    return `/api/v1/evidence/${evidenceId}/preview`;
  },
};
