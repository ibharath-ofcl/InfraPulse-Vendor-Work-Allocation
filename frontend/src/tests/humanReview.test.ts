import { describe, it, expect, vi, beforeEach } from 'vitest';
import { humanReviewService } from '../services/humanReviewService';
import { backendClient } from '../services/api';
import {
  HumanReviewSummaryDto,
  HumanReviewDetailDto,
  PhysicalMeasurementDto,
  CorrectiveActionDto,
  HumanInspectionDecisionDto,
  AssessmentRevisionDto
} from '../types/humanReview';

vi.mock('../services/api', () => ({
  backendClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Stage 11: Human Review & Corrective Action Workflow Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReviewSummary: HumanReviewSummaryDto = {
    id: 'rev-001',
    reviewCode: 'HIR-2026-0001',
    assessmentId: 'qa-001',
    assessmentCode: 'QA-2026-0001',
    assignmentId: 'assign-001',
    assignmentCode: 'WA-2026-0001',
    projectId: 'proj-001',
    projectName: 'Cyber City Fiber Duct Project',
    projectCode: 'CC-FIB-01',
    workZoneId: 'zone-001',
    workZoneName: 'Zone Alpha',
    workZoneCode: 'ZA-01',
    pincode: '500081',
    vendorId: 'vend-001',
    vendorName: 'Apex Telecom Contractors',
    workType: 'TRENCHING',
    templateName: 'Trenching Specification v2',
    status: 'PENDING',
    priority: 'HIGH',
    evidenceCompletenessScore: 85.0,
    passedCount: 4,
    flaggedCount: 1,
    failedCount: 1,
    findingsCount: 2,
    openCorrectiveActionsCount: 1,
    pendingMeasurementsCount: 1,
    createdAt: '2026-10-31T10:00:00Z',
    updatedAt: '2026-10-31T10:00:00Z',
  };

  const mockReviewDetail: HumanReviewDetailDto = {
    ...mockReviewSummary,
    templateId: 'tpl-001',
    totalCriteriaEvaluated: 6,
    evaluationSummary: 'Trenching depth check flagged insufficient depth requiring measurement',
    findings: [
      {
        id: 'f-1',
        criterionCode: 'TRENCH_DEPTH_CHECK',
        criterionName: 'Trench Depth Minimum',
        category: 'SAFETY_SPEC',
        severity: 'HIGH',
        outcome: 'REQUIRES_PHYSICAL_MEASUREMENT',
        title: 'Trench Depth Requires Physical Measurement',
        description: 'Photo evidence does not provide clear depth calibration; on-site dip rod test required.',
        requiresPhysicalMeasurement: true,
        requiresHumanReview: true,
        detectedClasses: ['trench', 'spoil_pile'],
        createdAt: '2026-10-31T10:00:00Z',
      },
      {
        id: 'f-2',
        criterionCode: 'WARNING_TAPE_CHECK',
        criterionName: 'Warning Tape Placement',
        category: 'SAFETY_SPEC',
        severity: 'MEDIUM',
        outcome: 'FAIL',
        title: 'Warning Tape Missing in Section B',
        description: 'Optical detector did not find yellow warning tape above trench bed.',
        requiresPhysicalMeasurement: false,
        requiresHumanReview: true,
        createdAt: '2026-10-31T10:00:00Z',
      },
    ],
    measurements: [],
    correctiveActions: [],
    decisions: [],
    escalations: [],
    evidenceList: [
      {
        id: 'ev-1',
        evidenceCode: 'EV-001',
        evidenceCategory: 'TRENCH_PROGRESS',
        originalFileName: 'trench_chainage_100.jpg',
        previewUrl: '/api/v1/evidence/ev-1/preview',
        submittedAt: '2026-10-31T09:30:00Z',
        submittedByName: 'Vendor Field Tech',
        aiClarityScore: 92.5,
        aiBlurScore: 11.2,
        aiModelName: 'YOLOv8-InfraQuality',
        aiModelVersion: 'v1.4',
        detections: [
          {
            classLabel: 'trench',
            confidence: 0.942,
            box2d: [0.15, 0.1, 0.85, 0.9],
          },
        ],
      },
    ],
  };

  it('fetches review queue with pagination and filter parameters', async () => {
    (backendClient.get as any).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          content: [mockReviewSummary],
          totalElements: 1,
          totalPages: 1,
          size: 20,
          number: 0,
        },
      },
    });

    const res = await humanReviewService.getReviewQueue({
      status: 'PENDING',
      priority: 'HIGH',
      search: 'Cyber City',
      page: 0,
      size: 20,
    });

    expect(backendClient.get).toHaveBeenCalledWith('/v1/human-reviews', {
      params: {
        status: 'PENDING',
        priority: 'HIGH',
        search: 'Cyber City',
        page: 0,
        size: 20,
      },
    });
    expect(res.content).toHaveLength(1);
    expect(res.content[0].reviewCode).toBe('HIR-2026-0001');
    expect(res.content[0].pincode).toBe('500081');
  });

  it('fetches review details including findings, evidence, and AI detections', async () => {
    (backendClient.get as any).mockResolvedValueOnce({
      data: { success: true, data: mockReviewDetail },
    });

    const detail = await humanReviewService.getReviewDetail('rev-001');

    expect(backendClient.get).toHaveBeenCalledWith('/v1/human-reviews/rev-001');
    expect(detail.id).toBe('rev-001');
    expect(detail.findings).toHaveLength(2);
    expect(detail.evidenceList).toHaveLength(1);
    expect(detail.evidenceList![0].detections[0].classLabel).toBe('trench');
    expect(detail.evidenceList![0].detections[0].confidence).toBeCloseTo(0.942);
  });

  it('validates Rule 2 business logic: blocks approval when mandatory findings are unresolved', () => {
    const evaluateRule2 = (review: HumanReviewDetailDto) => {
      const reasons: string[] = [];
      const failingFindings = (review.findings || []).filter(f => f.outcome === 'FAIL');
      if (failingFindings.length > 0) {
        reasons.push(`${failingFindings.length} mandatory criteria finding(s) marked FAIL`);
      }
      const pendingPhysFindings = (review.findings || []).filter(f => f.outcome === 'REQUIRES_PHYSICAL_MEASUREMENT');
      const verifiedPassMeasurements = (review.measurements || []).filter(m => m.verificationStatus === 'VERIFIED_PASS');
      if (pendingPhysFindings.length > 0 && verifiedPassMeasurements.length === 0) {
        reasons.push(`${pendingPhysFindings.length} criterion requires physical measurement verification`);
      }
      return { canApprove: reasons.length === 0, reasons };
    };

    const statusBlocked = evaluateRule2(mockReviewDetail);
    expect(statusBlocked.canApprove).toBe(false);
    expect(statusBlocked.reasons).toHaveLength(2);
    expect(statusBlocked.reasons[0]).toContain('FAIL');
    expect(statusBlocked.reasons[1]).toContain('physical measurement');

    // Simulate resolved conditions
    const resolvedReview: HumanReviewDetailDto = {
      ...mockReviewDetail,
      findings: [
        {
          ...mockReviewDetail.findings[0],
          outcome: 'PASS',
        },
        {
          ...mockReviewDetail.findings[1],
          outcome: 'PASS',
        },
      ],
      measurements: [
        {
          id: 'm-1',
          assessmentId: 'qa-001',
          measurementCode: 'PM-001',
          measurementType: 'TRENCH_DEPTH',
          measuredValue: 1.25,
          specifiedMin: 1.2,
          unit: 'METERS',
          verificationStatus: 'VERIFIED_PASS',
          createdAt: '2026-10-31T11:00:00Z',
        },
      ],
      correctiveActions: [
        {
          id: 'ca-1',
          actionCode: 'CA-001',
          assessmentId: 'qa-001',
          actionType: 'WARNING_TAPE_INSTALLATION',
          status: 'VERIFIED_CLOSED',
          priority: 'HIGH',
          severity: 'HIGH',
          problemDescription: 'Tape installed and verified',
          requiredAction: 'Install tape',
          dueDate: '2026-11-05T00:00:00Z',
          evidenceList: [],
          createdAt: '2026-10-31T10:00:00Z',
          updatedAt: '2026-10-31T11:30:00Z',
        },
      ],
    };

    const statusApproved = evaluateRule2(resolvedReview);
    expect(statusApproved.canApprove).toBe(true);
    expect(statusApproved.reasons).toHaveLength(0);
  });

  it('records an authoritative inspection decision', async () => {
    const mockDecision: HumanInspectionDecisionDto = {
      id: 'dec-001',
      reviewId: 'rev-001',
      decisionType: 'APPROVED',
      decisionRationale: 'All physical measurements verified against project depth spec v2.1',
      inspectorNotes: 'Civil grade depth compliance verified on chainage 100-250',
      decidedById: 'user-insp-01',
      decidedByName: 'Senior Inspector Verma',
      decidedAt: '2026-10-31T12:00:00Z',
    };

    (backendClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: mockDecision },
    });

    const res = await humanReviewService.recordDecision('rev-001', {
      decisionType: 'APPROVED',
      decisionRationale: 'All physical measurements verified against project depth spec v2.1',
      inspectorNotes: 'Civil grade depth compliance verified on chainage 100-250',
    });

    expect(backendClient.post).toHaveBeenCalledWith(
      '/v1/human-reviews/rev-001/decisions',
      {
        decisionType: 'APPROVED',
        decisionRationale: 'All physical measurements verified against project depth spec v2.1',
        inspectorNotes: 'Civil grade depth compliance verified on chainage 100-250',
      }
    );
    expect(res.decisionType).toBe('APPROVED');
    expect(res.decidedByName).toBe('Senior Inspector Verma');
  });

  it('records and verifies physical measurements against engineering ranges', async () => {
    const mockMeas: PhysicalMeasurementDto = {
      id: 'meas-001',
      assessmentId: 'qa-001',
      measurementCode: 'PM-2026-0001',
      measurementType: 'TRENCH_DEPTH',
      measuredValue: 1.25,
      specifiedMin: 1.20,
      specifiedMax: 1.50,
      unit: 'METERS',
      verificationStatus: 'VERIFIED_PASS',
      instrumentUsed: 'Calibrated Steel Dip Rod #88',
      locationMarker: 'Chainage 120m',
      createdAt: '2026-10-31T10:15:00Z',
    };

    (backendClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: mockMeas },
    });

    const recorded = await humanReviewService.recordMeasurement('qa-001', {
      measurementType: 'TRENCH_DEPTH',
      measuredValue: 1.25,
      unit: 'METERS',
      specifiedMin: 1.20,
      specifiedMax: 1.50,
      instrumentUsed: 'Calibrated Steel Dip Rod #88',
    });

    expect(backendClient.post).toHaveBeenCalledWith(
      '/v1/quality/assessments/qa-001/measurements',
      expect.objectContaining({ measuredValue: 1.25, unit: 'METERS' })
    );
    expect(recorded.verificationStatus).toBe('VERIFIED_PASS');

    // Test verify measurement
    (backendClient.put as any).mockResolvedValueOnce({
      data: { success: true, data: { ...mockMeas, verificationStatus: 'VERIFIED_PASS' } },
    });

    const verified = await humanReviewService.verifyMeasurement('meas-001', {
      verificationStatus: 'VERIFIED_PASS',
      notes: 'Matches calibrated dip-rod reading',
    });

    expect(backendClient.put).toHaveBeenCalledWith(
      '/v1/measurements/meas-001/verify',
      expect.objectContaining({ verificationStatus: 'VERIFIED_PASS' })
    );
    expect(verified.verificationStatus).toBe('VERIFIED_PASS');
  });

  it('manages corrective actions: creates notice, accepts vendor rework, and verifies closure', async () => {
    const mockCA: CorrectiveActionDto = {
      id: 'ca-001',
      actionCode: 'CA-2026-0001',
      assessmentId: 'qa-001',
      actionType: 'DEPTH_CORRECTION',
      status: 'OPEN',
      priority: 'HIGH',
      severity: 'HIGH',
      problemDescription: 'Trench depth insufficient at chainage 50m',
      requiredAction: 'Deepen trench to minimum 1.20m per spec',
      dueDate: '2026-11-04T00:00:00Z',
      evidenceList: [],
      createdAt: '2026-10-31T10:30:00Z',
      updatedAt: '2026-10-31T10:30:00Z',
    };

    // 1. Create CA
    (backendClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: mockCA },
    });

    const created = await humanReviewService.createCorrectiveAction('qa-001', {
      actionType: 'DEPTH_CORRECTION',
      priority: 'HIGH',
      severity: 'HIGH',
      problemDescription: 'Trench depth insufficient at chainage 50m',
      requiredAction: 'Deepen trench to minimum 1.20m per spec',
    });
    expect(created.status).toBe('OPEN');

    // 2. Vendor submits rework evidence
    const submittedCA: CorrectiveActionDto = {
      ...mockCA,
      status: 'SUBMITTED_FOR_VERIFICATION',
      evidenceList: [
        {
          id: 'ca-ev-1',
          actionId: 'ca-001',
          evidenceId: 'ev-rework-1',
          evidenceCode: 'INF-EV-0002',
          evidenceCategory: 'CORRECTIVE_REWORK',
          originalFileName: 're-excavated_trench.jpg',
          storageKey: 'evidence/rework.jpg',
          vendorNotes: 'Trench deepened to 1.25m with photo proof',
          submittedAt: '2026-10-31T11:00:00Z',
        },
      ],
    };

    (backendClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: submittedCA },
    });

    const submitted = await humanReviewService.submitReworkEvidence('ca-001', {
      evidenceId: 'ev-rework-1',
      vendorReworkNotes: 'Trench deepened to 1.25m with photo proof',
    });
    expect(submitted.status).toBe('SUBMITTED_FOR_VERIFICATION');
    expect(submitted.evidenceList).toHaveLength(1);

    // 3. Inspector verifies and closes CA (Rule 4: Vendor cannot self-close)
    const verifiedCA: CorrectiveActionDto = {
      ...submittedCA,
      status: 'VERIFIED_CLOSED',
      verifiedByName: 'Senior Inspector Verma',
      verifiedAt: '2026-10-31T11:45:00Z',
      inspectorResolutionNotes: 'Depth confirmed compliant with dip rod verification.',
    };

    (backendClient.put as any).mockResolvedValueOnce({
      data: { success: true, data: verifiedCA },
    });

    const verified = await humanReviewService.verifyCorrectiveAction('ca-001', {
      approved: true,
      resolutionNotes: 'Depth confirmed compliant with dip rod verification.',
    });
    expect(verified.status).toBe('VERIFIED_CLOSED');
    expect(verified.verifiedByName).toBe('Senior Inspector Verma');
  });

  it('triggers AI reassessment and retrieves versioned revision history', async () => {
    (backendClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: { ...mockReviewDetail, status: 'IN_REVIEW' } },
    });

    const reassessment = await humanReviewService.reassessAssessment('qa-001');
    expect(backendClient.post).toHaveBeenCalledWith('/v1/quality/assessments/qa-001/reassess');
    expect(reassessment.id).toBe('rev-001');

    const mockRevisions: AssessmentRevisionDto[] = [
      {
        id: 'rev-1',
        assessmentCode: 'QA-2026-0001',
        status: 'ASSESSED',
        evidenceCompletenessScore: 85.0,
        createdAt: '2026-10-31T10:00:00Z',
        evaluationSummary: 'Initial assessment',
      },
      {
        id: 'rev-2',
        assessmentCode: 'QA-2026-0001-R1',
        status: 'ASSESSED',
        evidenceCompletenessScore: 100.0,
        createdAt: '2026-10-31T12:00:00Z',
        evaluationSummary: 'Reassessment following verified corrective action CA-2026-0001',
      },
    ];

    (backendClient.get as any).mockResolvedValueOnce({
      data: { success: true, data: mockRevisions },
    });

    const revisions = await humanReviewService.getAssessmentRevisions('qa-001');
    expect(backendClient.get).toHaveBeenCalledWith('/v1/quality/assessments/qa-001/revisions');
    expect(revisions).toHaveLength(2);
    expect(revisions[1].evidenceCompletenessScore).toBe(100.0);
  });

  it('calculates bounding box overlay coordinates correctly for Evidence Viewer', () => {
    // Normalization check: box2d = [ymin, xmin, ymax, xmax] in 0..1 scale
    const box2d = [0.2, 0.15, 0.8, 0.75];
    const [ymin, xmin, ymax, xmax] = box2d;

    const topPct = ymin * 100;
    const leftPct = xmin * 100;
    const widthPct = (xmax - xmin) * 100;
    const heightPct = (ymax - ymin) * 100;

    expect(topPct).toBeCloseTo(20);
    expect(leftPct).toBeCloseTo(15);
    expect(widthPct).toBeCloseTo(60);
    expect(heightPct).toBeCloseTo(60);
  });
});
