import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../services/auditService';
import { analyticsService } from '../services/analyticsService';
import { backendClient } from '../services/api';
import {
  AuditIntegrityReport,
  AuditEventItem,
  VendorPerformance,
  VendorComparison,
  OperationalDashboardSummary,
  ProjectPerformance,
  ScoringConfiguration,
  ReportJobResponse,
} from '../types/analytics';

vi.mock('../services/api', () => ({
  backendClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Stage 13: Enterprise Audit Trail & Analytics Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Audit Service API Contracts', () => {
    it('fetches audit events with filtered query params and pagination', async () => {
      const mockAuditEvent: AuditEventItem = {
        id: 'evt-1',
        eventCode: 'AUTH_001',
        eventCategory: 'SECURITY_AUTH',
        eventType: 'USER_LOGIN',
        entityType: 'User',
        entityId: 'usr-123',
        action: 'LOGIN',
        outcome: 'SUCCESS',
        description: 'User login successful',
        actorId: 'usr-123',
        actorName: 'admin',
        actorRole: 'GOVERNMENT_OFFICIAL',
        clientIp: '127.0.0.1',
        chainScope: 'GLOBAL',
        sequenceNumber: 1,
        eventHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        createdAt: '2026-03-30T10:00:00Z',
      };

      const mockAuditPage = {
        content: [mockAuditEvent],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockAuditPage },
      });

      const result = await auditService.getAuditEvents({
        category: 'SECURITY_AUTH',
        outcome: 'SUCCESS',
        search: 'admin',
        page: 0,
        size: 20,
      });

      expect(backendClient.get).toHaveBeenCalledWith('/v1/audit-events', {
        params: {
          category: 'SECURITY_AUTH',
          outcome: 'SUCCESS',
          search: 'admin',
          page: 0,
          size: 20,
        },
      });
      expect(result.content.length).toBe(1);
      expect(result.content[0].eventCode).toBe('AUTH_001');
    });

    it('verifies cryptographic chain integrity report', async () => {
      const mockReport: AuditIntegrityReport = {
        chainScope: 'GLOBAL',
        status: 'VALID',
        totalEventsChecked: 100,
        validEventsCount: 100,
        invalidEventsCount: 0,
        verifiedAt: '2026-03-30T10:30:00Z',
        violations: [],
      };

      (backendClient.post as any).mockResolvedValueOnce({
        data: { success: true, data: mockReport },
      });

      const report = await auditService.verifyChainIntegrity('GLOBAL');

      expect(backendClient.post).toHaveBeenCalledWith('/v1/audit-events/integrity/verify', null, {
        params: { chainScope: 'GLOBAL' },
      });
      expect(report.status).toBe('VALID');
      expect(report.totalEventsChecked).toBe(100);
      expect(report.invalidEventsCount).toBe(0);
    });

    it('verifies single event cryptographic integrity', async () => {
      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: true },
      });

      const isValid = await auditService.verifySingleEvent('evt-1');
      expect(backendClient.get).toHaveBeenCalledWith('/v1/audit-events/integrity/evt-1');
      expect(isValid).toBe(true);
    });

    it('fetches scoped entity, project and vendor activities', async () => {
      const mockActivityPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
      };

      (backendClient.get as any).mockResolvedValue({
        data: { success: true, data: mockActivityPage },
      });

      await auditService.getProjectActivity('proj-999');
      expect(backendClient.get).toHaveBeenCalledWith('/v1/projects/proj-999/activity', {
        params: { page: 0, size: 20 },
      });

      await auditService.getVendorActivity('ven-555');
      expect(backendClient.get).toHaveBeenCalledWith('/v1/vendors/ven-555/activity', {
        params: { page: 0, size: 20 },
      });
    });
  });

  describe('Analytics Service API Contracts & Engine Logic', () => {
    it('retrieves operational command center dashboard summary', async () => {
      const mockSummary: OperationalDashboardSummary = {
        activeProjectsCount: 12,
        totalWorkAssignmentsCount: 150,
        workStatusDistribution: {
          COMPLETED: 95,
          IN_PROGRESS: 40,
          FLAGGED: 5,
        },
        pendingQualityReviewsCount: 8,
        openCorrectiveActionsCount: 3,
        activeVendorsCount: 20,
        totalRequestedSimulatedAmount: 50000000,
        totalAuthorizedSimulatedAmount: 45000000,
        totalSettledSimulatedAmount: 42000000,
        simulationDisclaimer: 'All financial figures are simulated.',
        asOfTimestamp: '2026-03-30T10:00:00Z',
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockSummary },
      });

      const summary = await analyticsService.getOperationalDashboard('proj-123');
      expect(backendClient.get).toHaveBeenCalledWith('/v1/analytics/dashboard/summary', {
        params: { projectId: 'proj-123' },
      });
      expect(summary.activeProjectsCount).toBe(12);
      expect(summary.totalWorkAssignmentsCount).toBe(150);
      expect(summary.simulationDisclaimer).toContain('simulated');
    });

    it('fetches deep vendor performance metrics with empirical KPIs and sufficiency checks', async () => {
      const mockVendorPerf: VendorPerformance = {
        vendorId: 'ven-1',
        vendorCode: 'VND-001',
        companyName: 'Apex Infrastructure Ltd',
        completionRate: 93.33,
        onTimeRate: 85.71,
        qualityPassRate: 92.0,
        reworkRate: 13.33,
        evidenceComplianceRate: 94.0,
        avgInspectionTurnaroundHours: 24.5,
        avgCorrectiveActionResolutionHours: 48.0,
        overdueAssignmentsCount: 2,
        avgDelayDays: 1.5,
        totalPaymentRequested: 1000000,
        totalPaymentApproved: 950000,
        totalSimulatedSettled: 950000,
        pendingFinancialRequestsCount: 1,
        rejectedFinancialRequestsCount: 0,
        simulationDisclaimer: 'Simulated settlement',
        activeAssignmentsCount: 3,
        completedAssignmentsCount: 14,
        pendingInspectionsCount: 1,
        openCorrectiveActionsCount: 0,
        overallScore: 88.4,
        overallPerformanceScore: 88.4,
        totalAssignments: 15,
        dataSufficiencyStatus: 'SUFFICIENT_DATA',
        scoringConfigurationVersion: 1,
        rankingTier: 'TIER_1_EXCELLENT',
        sampleCounts: {
          eligibleAssignments: 15,
          completedAssignments: 14,
          onTimeAssignments: 12,
        },
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockVendorPerf },
      });

      const perf = await analyticsService.getVendorPerformance('ven-1');
      expect(backendClient.get).toHaveBeenCalledWith('/v1/analytics/vendors/ven-1', {
        params: {},
      });
      expect(perf.overallScore).toBe(88.4);
      expect(perf.dataSufficiencyStatus).toBe('SUFFICIENT_DATA');
      expect(perf.completionRate).toBe(93.33);
      expect(perf.onTimeRate).toBe(85.71);
      expect(perf.qualityPassRate).toBe(92.0);
      expect(perf.sampleCounts.eligibleAssignments).toBe(15);
    });

    it('handles vendor comparison matrix', async () => {
      const mockComparison: VendorComparison = {
        comparedAt: '2026-03-30T10:00:00Z',
        scoringVersion: 1,
        vendors: [
          {
            vendorId: 'ven-1',
            vendorCode: 'VND-001',
            companyName: 'Apex Infrastructure',
            completionRate: 93.33,
            onTimeRate: 85.71,
            qualityPassRate: 92.0,
            reworkRate: 13.33,
            evidenceComplianceRate: 94.0,
            avgInspectionTurnaroundHours: 24,
            avgCorrectiveActionResolutionHours: 48,
            overdueAssignmentsCount: 1,
            avgDelayDays: 1,
            totalPaymentRequested: 1000000,
            totalPaymentApproved: 950000,
            totalSimulatedSettled: 950000,
            pendingFinancialRequestsCount: 1,
            rejectedFinancialRequestsCount: 0,
            simulationDisclaimer: 'Simulated',
            activeAssignmentsCount: 3,
            completedAssignmentsCount: 14,
            pendingInspectionsCount: 1,
            openCorrectiveActionsCount: 0,
            overallScore: 88.4,
            overallPerformanceScore: 88.4,
            totalAssignments: 15,
            dataSufficiencyStatus: 'SUFFICIENT_DATA',
            scoringConfigurationVersion: 1,
            rankingTier: 'TIER_1_EXCELLENT',
            sampleCounts: {},
          },
          {
            vendorId: 'ven-2',
            vendorCode: 'VND-002',
            companyName: 'Beacon Engineering',
            completionRate: 80.0,
            onTimeRate: 70.0,
            qualityPassRate: 78.0,
            reworkRate: 30.0,
            evidenceComplianceRate: 80.0,
            avgInspectionTurnaroundHours: 36,
            avgCorrectiveActionResolutionHours: 72,
            overdueAssignmentsCount: 3,
            avgDelayDays: 4,
            totalPaymentRequested: 800000,
            totalPaymentApproved: 700000,
            totalSimulatedSettled: 700000,
            pendingFinancialRequestsCount: 2,
            rejectedFinancialRequestsCount: 1,
            simulationDisclaimer: 'Simulated',
            activeAssignmentsCount: 2,
            completedAssignmentsCount: 8,
            pendingInspectionsCount: 2,
            openCorrectiveActionsCount: 1,
            overallScore: 76.2,
            overallPerformanceScore: 76.2,
            totalAssignments: 10,
            dataSufficiencyStatus: 'SUFFICIENT_DATA',
            scoringConfigurationVersion: 1,
            rankingTier: 'TIER_2_GOOD',
            sampleCounts: {},
          },
        ],
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockComparison },
      });

      const comparison = await analyticsService.compareVendors(['ven-1', 'ven-2']);
      expect(backendClient.get).toHaveBeenCalledWith('/v1/analytics/vendors/comparison', {
        params: { vendorIds: 'ven-1,ven-2' },
      });
      expect(comparison.vendors.length).toBe(2);
      expect(comparison.vendors[0].companyName).toBe('Apex Infrastructure');
    });

    it('fetches project performance metrics', async () => {
      const mockProjectPerf: ProjectPerformance = {
        projectId: 'proj-1',
        projectCode: 'PRJ-METRO-01',
        projectName: 'Smart City Metro Corridor',
        projectStatus: 'IN_PROGRESS',
        budget: 150000000,
        totalAssignments: 40,
        completedAssignments: 22,
        activeAssignments: 18,
        completionRate: 55.0,
        onTimeRate: 85.0,
        qualityPassRate: 90.0,
        reworkRate: 10.0,
        overdueCount: 2,
        totalMilestones: 10,
        completedMilestones: 5,
        totalMilestoneValue: 75000000,
        approvedPaymentTotal: 60000000,
        simulatedSettledTotal: 55000000,
        simulationDisclaimer: 'Simulated project finance values',
        calculatedAt: '2026-03-30T10:00:00Z',
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockProjectPerf },
      });

      const perf = await analyticsService.getProjectPerformance('proj-1');
      expect(backendClient.get).toHaveBeenCalledWith('/v1/analytics/projects/proj-1');
      expect(perf.projectName).toBe('Smart City Metro Corridor');
      expect(perf.projectStatus).toBe('IN_PROGRESS');
      expect(perf.completionRate).toBe(55.0);
    });

    it('manages scoring configurations and dynamic weights', async () => {
      const mockConfig: ScoringConfiguration = {
        id: 'cfg-default',
        configurationName: 'Standard Enterprise Scoring Model',
        description: 'Default 10-KPI weighted configuration',
        qualityWeight: 0.30,
        onTimeWeight: 0.25,
        evidenceWeight: 0.15,
        reworkWeight: 0.15,
        completionWeight: 0.15,
        version: 1,
        isActive: true,
        effectiveFrom: '2026-01-01T00:00:00Z',
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockConfig },
      });

      const active = await analyticsService.getActiveScoringConfiguration();
      expect(backendClient.get).toHaveBeenCalledWith('/v1/analytics/scoring-configs/active');
      expect(active.isActive).toBe(true);
      expect(active.qualityWeight + active.onTimeWeight + active.evidenceWeight + active.reworkWeight + active.completionWeight).toBeCloseTo(1.0);
    });

    it('triggers export report and checks asynchronous job status', async () => {
      const mockJobResponse: ReportJobResponse = {
        id: 'job-csv-1',
        reportCode: 'RPT-2026-001',
        reportType: 'VENDOR_PERFORMANCE',
        format: 'CSV',
        status: 'COMPLETED',
        recordCount: 25,
        fileName: 'vendor_performance_report.csv',
        downloadUrl: '/api/v1/reports/jobs/job-csv-1/download',
        createdAt: '2026-03-30T11:00:00Z',
        completedAt: '2026-03-30T11:00:02Z',
      };

      (backendClient.post as any).mockResolvedValueOnce({
        data: { success: true, data: mockJobResponse },
      });

      const exportRes = await analyticsService.exportReport({
        reportType: 'VENDOR_PERFORMANCE',
        format: 'CSV',
        projectId: 'proj-1',
      });

      expect(backendClient.post).toHaveBeenCalledWith('/v1/reports/export', {
        reportType: 'VENDOR_PERFORMANCE',
        format: 'CSV',
        projectId: 'proj-1',
      });
      expect(exportRes.id).toBe('job-csv-1');
      expect(exportRes.status).toBe('COMPLETED');
    });
  });
});
