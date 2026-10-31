import axios from 'axios';
import { HealthStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || '/ai-api';

export const backendClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiServiceClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthService = {
  checkBackendHealth: async (): Promise<HealthStatus> => {
    try {
      const response = await backendClient.get<HealthStatus>('/health');
      return response.data;
    } catch {
      return { status: 'DOWN', application: 'InfraPulse AI' };
    }
  },

  checkAiServiceHealth: async (): Promise<HealthStatus> => {
    try {
      const response = await aiServiceClient.get<HealthStatus>('/health');
      return response.data;
    } catch {
      return { status: 'DOWN', service: 'InfraPulse AI Vision Service' };
    }
  },
};
