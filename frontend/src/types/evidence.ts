export type EvidenceCategory =
  | 'BEFORE_WORK'
  | 'WORK_IN_PROGRESS'
  | 'AFTER_WORK'
  | 'MATERIAL_EVIDENCE'
  | 'SITE_CONDITION'
  | 'COMPLETION_EVIDENCE'
  | 'SUPPORTING_DOCUMENT';

export type EvidenceProcessingStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'READY'
  | 'PROCESSING_FAILED';

export type EvidenceReviewStatus =
  | 'NOT_REVIEWED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface EvidenceDetail {
  id: string;
  evidenceCode: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  workZoneId: string;
  workZoneName: string;
  zoneCode: string;
  assignmentId: string;
  assignmentCode: string;
  workType: string;
  workTypeDisplayName: string;
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedByRole: string;
  evidenceCategory: EvidenceCategory;
  evidenceCategoryDisplayName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  fileSizeFormatted: string;
  checksumSha256: string;
  imageWidth?: number;
  imageHeight?: number;
  captureTimestamp?: string;
  uploadedAt: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  isUserProvidedLocation?: boolean;
  metadataJson?: string;
  processingStatus: EvidenceProcessingStatus;
  processingStatusDisplayName: string;
  reviewStatus: EvidenceReviewStatus;
  reviewStatusDisplayName: string;
  reviewNotes?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  hasPreview: boolean;
  fileDownloadUrl: string;
  previewUrl: string;
}

export interface EvidenceListResponse {
  evidence: EvidenceDetail[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface EvidenceIntegrityResponse {
  evidenceId: string;
  evidenceCode: string;
  storedChecksum: string;
  calculatedChecksum: string;
  integrityValid: boolean;
  verifiedAt: string;
  statusMessage: string;
}

export interface EvidenceUploadPayload {
  category: EvidenceCategory;
  description?: string;
  captureTimestamp?: string;
  latitude?: number;
  longitude?: number;
}
