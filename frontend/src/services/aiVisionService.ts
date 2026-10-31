import { backendClient } from './api';
import { AiInferenceResponse, AiModelMetadata } from '../types/ai';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const aiVisionService = {
  analyzeEvidence: async (evidenceId: string): Promise<AiInferenceResponse> => {
    const response = await backendClient.post<ApiResponse<AiInferenceResponse>>(
      `/v1/evidence/${evidenceId}/analyze`
    );
    return response.data.data;
  },

  getEvidenceAnalysis: async (evidenceId: string): Promise<AiInferenceResponse[]> => {
    const response = await backendClient.get<ApiResponse<AiInferenceResponse[]>>(
      `/v1/evidence/${evidenceId}/analysis`
    );
    return response.data.data;
  },

  getInferenceById: async (inferenceId: string): Promise<AiInferenceResponse> => {
    const response = await backendClient.get<ApiResponse<AiInferenceResponse>>(
      `/v1/ai/inferences/${inferenceId}`
    );
    return response.data.data;
  },

  getAvailableModels: async (): Promise<AiModelMetadata[]> => {
    const response = await backendClient.get<ApiResponse<AiModelMetadata[]>>('/v1/ai/models');
    return response.data.data;
  },
};
