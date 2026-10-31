import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evidenceService } from '../services/evidenceService';
import { backendClient } from '../services/api';
import { EvidenceDetail, EvidenceIntegrityResponse, EvidenceListResponse } from '../types/evidence';

vi.mock('../services/api', () => ({
  backendClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Stage 08: Photo Evidence Management Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvidence: EvidenceDetail = {
    id: 'ev-123',
    evidenceCode: 'INF-EV-2026-000001',
    projectId: 'proj-1',
    projectName: 'Smart City Fiber Grid',
    projectCode: 'INF-PRJ-001',
    workZoneId: 'zone-1',
    workZoneName: 'Sector 4 North',
    zoneCode: 'WZ-SEC4',
    assignmentId: 'assign-1',
    assignmentCode: 'INF-WA-2026-000001',
    workType: 'TRENCHING',
    workTypeDisplayName: 'Trenching & Excavation',
    vendorId: 'vend-1',
    vendorName: 'Apex Infrastructure Ltd',
    vendorCode: 'VND-001',
    uploadedById: 'user-1',
    uploadedByName: 'Vendor Lead',
    uploadedByRole: 'ROLE_VENDOR',
    evidenceCategory: 'WORK_IN_PROGRESS',
    evidenceCategoryDisplayName: 'Work In Progress',
    originalFileName: 'trench_depth_check.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1048576,
    fileSizeFormatted: '1.0 MB',
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    imageWidth: 1920,
    imageHeight: 1080,
    uploadedAt: '2026-10-31T10:00:00Z',
    description: 'Trenching along main road chainage 0+150',
    latitude: 17.385044,
    longitude: 78.486671,
    processingStatus: 'READY',
    processingStatusDisplayName: 'Ready for Analysis',
    reviewStatus: 'PENDING_REVIEW',
    reviewStatusDisplayName: 'Pending Field Review',
    hasPreview: true,
    fileDownloadUrl: '/api/v1/evidence/ev-123/file',
    previewUrl: '/api/v1/evidence/ev-123/preview',
  };

  it('uploads evidence with multipart form data', async () => {
    (backendClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: [mockEvidence] },
    });

    const dummyFile = new File(['dummy-image-content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await evidenceService.uploadEvidence(
      'assign-1',
      [dummyFile],
      'WORK_IN_PROGRESS',
      'Site documentation test',
      undefined,
      17.385044,
      78.486671
    );

    expect(backendClient.post).toHaveBeenCalledWith(
      '/v1/work-assignments/assign-1/evidence',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].evidenceCode).toBe('INF-EV-2026-000001');
  });

  it('retrieves evidence list for assignment with category filter', async () => {
    const mockList: EvidenceListResponse = {
      evidence: [mockEvidence],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    };

    (backendClient.get as any).mockResolvedValueOnce({
      data: { success: true, data: mockList },
    });

    const result = await evidenceService.getAssignmentEvidence('assign-1', 'WORK_IN_PROGRESS', 0, 20);

    expect(backendClient.get).toHaveBeenCalledWith('/v1/work-assignments/assign-1/evidence', {
      params: { page: 0, size: 20, category: 'WORK_IN_PROGRESS' },
    });
    expect(result.evidence).toHaveLength(1);
  });

  it('verifies evidence SHA-256 integrity on demand', async () => {
    const mockIntegrity: EvidenceIntegrityResponse = {
      evidenceId: 'ev-123',
      evidenceCode: 'INF-EV-2026-000001',
      storedChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      calculatedChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      integrityValid: true,
      verifiedAt: '2026-10-31T10:05:00Z',
      statusMessage: 'Cryptographic SHA-256 match verified against immutable disk storage.',
    };

    (backendClient.get as any).mockResolvedValueOnce({
      data: { success: true, data: mockIntegrity },
    });

    const result = await evidenceService.verifyIntegrity('ev-123');

    expect(backendClient.get).toHaveBeenCalledWith('/v1/evidence/ev-123/integrity');
    expect(result.integrityValid).toBe(true);
    expect(result.storedChecksum).toEqual(result.calculatedChecksum);
  });

  it('submits human review decision on evidence', async () => {
    const reviewedEvidence: EvidenceDetail = {
      ...mockEvidence,
      reviewStatus: 'APPROVED',
      reviewNotes: 'Meets depth standards.',
      reviewedByName: 'Senior Inspector',
      reviewedAt: '2026-10-31T10:10:00Z',
    };

    (backendClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: reviewedEvidence },
    });

    const result = await evidenceService.reviewEvidence('ev-123', 'APPROVED', 'Meets depth standards.');

    expect(backendClient.post).toHaveBeenCalledWith('/v1/evidence/ev-123/review', {
      reviewStatus: 'APPROVED',
      reviewNotes: 'Meets depth standards.',
    });
    expect(result.reviewStatus).toBe('APPROVED');
  });

  it('soft-deletes evidence with reason', async () => {
    (backendClient.delete as any).mockResolvedValueOnce({
      data: { success: true },
    });

    await evidenceService.deleteEvidence('ev-123', 'Duplicate photo submitted');

    expect(backendClient.delete).toHaveBeenCalledWith('/v1/evidence/ev-123', {
      params: { reason: 'Duplicate photo submitted' },
    });
  });
});
