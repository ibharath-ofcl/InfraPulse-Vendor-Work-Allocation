export interface HealthStatus {
  status: 'UP' | 'DOWN' | 'PENDING';
  application?: string;
  service?: string;
  timestamp?: string;
}

export interface ServiceHealthState {
  backend: HealthStatus;
  aiService: HealthStatus;
  loading: boolean;
  error?: string | null;
}
