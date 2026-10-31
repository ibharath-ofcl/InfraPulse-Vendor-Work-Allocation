export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface AiDetection {
  id: string;
  classId: string;
  classLabel: string;
  confidence: number;
  boundingBox?: BoundingBox;
  segmentationReference?: string;
}

export interface AiImageQuality {
  resolutionWidth: number;
  resolutionHeight: number;
  blurScore: number;
  brightnessScore: number;
  contrastScore: number;
  qualityStatus: string;
  warnings?: string[];
}

export interface AiModelMetadata {
  modelId: string;
  modelName: string;
  version: string;
  framework: string;
  modelType: string;
  supportedClasses: string[];
  license: string;
  description: string;
  activationStatus: string;
}

export interface AiInferenceResponse {
  id: string;
  inferenceCode: string;
  evidenceId: string;
  evidenceCode: string;
  projectId: string;
  assignmentId: string;
  modelId: string;
  modelVersion: string;
  inferenceType: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  processingDurationMs?: number;
  imageQuality?: AiImageQuality;
  detections: AiDetection[];
  totalDetections: number;
  unsupportedCategories: string[];
  warnings: string[];
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
}
