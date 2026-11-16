import { describe, it, expect, vi, beforeEach } from 'vitest';
import { intelligenceService } from '../services/intelligenceService';
import { backendClient } from '../services/api';

vi.mock('../services/api', () => ({
  backendClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('InfraPulse Intelligence Suite Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Module A: Contract Intelligence', () => {
    it('should list contracts for a given project', async () => {
      const mockContracts = {
        data: {
          success: true,
          data: {
            content: [
              {
                id: 'cnt-1',
                contractCode: 'CNT-2026-CH-001',
                title: 'Anna Salai Smart Corridor Resurfacing',
                contractType: 'CIVIL_INFRASTRUCTURE',
                totalValue: 45000000,
                status: 'ACTIVE',
              },
            ],
            totalElements: 1,
            totalPages: 1,
          },
        },
      };

      (backendClient.get as any).mockResolvedValueOnce(mockContracts);

      const res = await intelligenceService.listContracts({ projectId: 'proj-1' });
      expect(backendClient.get).toHaveBeenCalledWith('/v1/intelligence/contracts', {
        params: { projectId: 'proj-1' },
      });
      expect(res.content).toHaveLength(1);
      expect(res.content[0].contractCode).toBe('CNT-2026-CH-001');
    });

    it('should create contract and register extracted specifications', async () => {
      const mockCreated = {
        data: {
          success: true,
          data: {
            id: 'cnt-new',
            contractCode: 'CNT-2026-002',
            title: 'Trenching and Fiber Utility Works',
            contractType: 'OPTICAL_FIBER',
            totalValue: 12000000,
            status: 'DRAFT',
          },
        },
      };

      (backendClient.post as any).mockResolvedValueOnce(mockCreated);

      const res = await intelligenceService.createContract({
        projectId: 'proj-1',
        title: 'Trenching and Fiber Utility Works',
        contractType: 'OPTICAL_FIBER',
        totalValue: 12000000,
      });

      expect(backendClient.post).toHaveBeenCalledWith('/v1/intelligence/contracts', {
        projectId: 'proj-1',
        title: 'Trenching and Fiber Utility Works',
        contractType: 'OPTICAL_FIBER',
        totalValue: 12000000,
      });
      expect(res.contractCode).toBe('CNT-2026-002');
    });

    it('should approve contract requirement through human manager review', async () => {
      const mockApproved = {
        data: {
          success: true,
          data: {
            id: 'req-1',
            requirementCode: 'REQ-00001',
            approvalStatus: 'APPROVED',
          },
        },
      };

      (backendClient.post as any).mockResolvedValueOnce(mockApproved);

      const res = await intelligenceService.approveRequirement('req-1', 'Meets MoRTH Section 500');
      expect(backendClient.post).toHaveBeenCalledWith(
        '/v1/intelligence/requirements/req-1/approve',
        null,
        { params: { notes: 'Meets MoRTH Section 500' } }
      );
      expect(res.approvalStatus).toBe('APPROVED');
    });

    it('should record calibrated physical measurement with tool verification', async () => {
      const mockMeasurement = {
        data: {
          success: true,
          data: {
            id: 'cre-1',
            status: 'VERIFIED',
            measuredValue: '41.2',
            measurementUnit: 'mm',
            physicalMeasurementTool: 'Mitutoyo Digital Caliper SN-8910',
          },
        },
      };

      (backendClient.post as any).mockResolvedValueOnce(mockMeasurement);

      const res = await intelligenceService.recordPhysicalMeasurement('cre-1', {
        measuredValue: '41.2',
        measurementUnit: 'mm',
        physicalMeasurementTool: 'Mitutoyo Digital Caliper SN-8910',
        measurementNotes: 'Core extracted at station 1+240 LHS',
      });

      expect(backendClient.post).toHaveBeenCalledWith(
        '/v1/intelligence/requirements/evidence/cre-1/measurement',
        {
          measuredValue: '41.2',
          measurementUnit: 'mm',
          physicalMeasurementTool: 'Mitutoyo Digital Caliper SN-8910',
          measurementNotes: 'Core extracted at station 1+240 LHS',
        }
      );
      expect(res.status).toBe('VERIFIED');
      expect(res.measuredValue).toBe('41.2');
    });

    it('should submit authorized engineering waiver with justification', async () => {
      const mockWaiver = {
        data: {
          success: true,
          data: {
            id: 'cre-2',
            status: 'WAIVED_WITH_AUTHORIZATION',
            waiverReason: 'Rock stratum encounter approved by Chief Engineer ref CE/2026/882',
          },
        },
      };

      (backendClient.post as any).mockResolvedValueOnce(mockWaiver);

      const res = await intelligenceService.requestWaiver('cre-2', {
        waiverReason: 'Rock stratum encounter approved by Chief Engineer ref CE/2026/882',
      });

      expect(backendClient.post).toHaveBeenCalledWith(
        '/v1/intelligence/requirements/evidence/cre-2/waiver',
        {
          waiverReason: 'Rock stratum encounter approved by Chief Engineer ref CE/2026/882',
        }
      );
      expect(res.status).toBe('WAIVED_WITH_AUTHORIZATION');
    });
  });

  describe('Module B: Defect Intelligence', () => {
    it('should search defects by project and category', async () => {
      const mockDefects = {
        data: {
          success: true,
          data: {
            content: [
              {
                id: 'def-1',
                defectCode: 'DEF-00001',
                category: 'ROAD_CRACK',
                severity: 'HIGH',
                status: 'UNDER_REVIEW',
                recurring: true,
                recurrenceCount: 2,
              },
            ],
            totalElements: 1,
            totalPages: 1,
          },
        },
      };

      (backendClient.get as any).mockResolvedValueOnce(mockDefects);

      const res = await intelligenceService.searchDefects({ projectId: 'proj-1', category: 'ROAD_CRACK' });
      expect(backendClient.get).toHaveBeenCalledWith('/v1/intelligence/defects', {
        params: { projectId: 'proj-1', category: 'ROAD_CRACK' },
      });
      expect(res.content).toHaveLength(1);
      expect(res.content[0].recurring).toBe(true);
    });

    it('should transition defect status through lifecycle', async () => {
      const mockUpdated = {
        data: {
          success: true,
          data: {
            id: 'def-1',
            defectCode: 'DEF-00001',
            status: 'CORRECTIVE_ACTION_REQUIRED',
            reviewNotes: 'Cold milling and bitumen tack coat required',
          },
        },
      };

      (backendClient.patch as any).mockResolvedValueOnce(mockUpdated);

      const res = await intelligenceService.updateDefectStatus('def-1', {
        newStatus: 'CORRECTIVE_ACTION_REQUIRED',
        reviewNotes: 'Cold milling and bitumen tack coat required',
        actionTaken: 'ISSUED_CONTRACTOR_NOTICE',
      });

      expect(backendClient.patch).toHaveBeenCalledWith('/v1/intelligence/defects/def-1/status', {
        newStatus: 'CORRECTIVE_ACTION_REQUIRED',
        reviewNotes: 'Cold milling and bitumen tack coat required',
        actionTaken: 'ISSUED_CONTRACTOR_NOTICE',
      });
      expect(res.status).toBe('CORRECTIVE_ACTION_REQUIRED');
    });

    it('should confirm spatial recurrence match', async () => {
      (backendClient.post as any).mockResolvedValueOnce({
        data: { success: true, message: 'Recurrence confirmed' },
      });

      await intelligenceService.confirmRecurrence('cand-1', true);
      expect(backendClient.post).toHaveBeenCalledWith(
        '/v1/intelligence/defects/recurrence/cand-1/confirm',
        null,
        { params: { confirmed: true } }
      );
    });
  });

  describe('Module C: Predictive Risk Intelligence', () => {
    it('should trigger on-demand project risk evaluation', async () => {
      const mockAssessment = {
        data: {
          success: true,
          data: {
            id: 'assess-1',
            assessmentCode: 'RSK-ASSESS-00001',
            overallRiskLevel: 'MEDIUM',
            overallScore: 42.5,
            scheduleRiskLevel: 'MEDIUM',
            vendorRiskLevel: 'LOW',
            qualityRiskLevel: 'HIGH',
            resourceRiskLevel: 'LOW',
            dependencyRiskLevel: 'LOW',
          },
        },
      };

      (backendClient.post as any).mockResolvedValueOnce(mockAssessment);

      const res = await intelligenceService.evaluateProjectRisk('proj-1');
      expect(backendClient.post).toHaveBeenCalledWith(
        '/v1/intelligence/risk/evaluate',
        null,
        { params: { projectId: 'proj-1' } }
      );
      expect(res.assessmentCode).toBe('RSK-ASSESS-00001');
      expect(res.overallRiskLevel).toBe('MEDIUM');
    });

    it('should retrieve structured explainable risk alerts', async () => {
      const mockAlerts = {
        data: {
          success: true,
          data: {
            content: [
              {
                id: 'alert-1',
                title: 'High Structural Defect Recurrence Rate Detected',
                riskCategory: 'QUALITY_RISK',
                riskLevel: 'HIGH',
                problemStatement: 'Repeated alligator cracking at joint seam.',
                supportingEvidenceData: 'DEF-00001 and DEF-00002 within 14.2m.',
                rootCauseReason: 'Sub-grade instability under high axle load.',
                operationalImpact: 'Premature wearing course failure.',
                recommendedAction: 'Extract core samples and seal micro-fissures.',
                alertStatus: 'ACTIVE',
              },
            ],
            totalElements: 1,
            totalPages: 1,
          },
        },
      };

      (backendClient.get as any).mockResolvedValueOnce(mockAlerts);

      const res = await intelligenceService.searchRiskAlerts({ projectId: 'proj-1', status: 'ACTIVE' });
      expect(backendClient.get).toHaveBeenCalledWith('/v1/intelligence/risk/alerts', {
        params: { projectId: 'proj-1', status: 'ACTIVE' },
      });
      expect(res.content).toHaveLength(1);
      expect(res.content[0].riskLevel).toBe('HIGH');
      expect(res.content[0].recommendedAction).toContain('Extract core samples');
    });

    it('should update risk alert status to ACKNOWLEDGED / RESOLVED', async () => {
      const mockUpdatedAlert = {
        data: {
          success: true,
          data: {
            id: 'alert-1',
            alertStatus: 'RESOLVED',
            resolutionNotes: 'Core tests validated 41.2mm thickness, re-compaction verified',
          },
        },
      };

      (backendClient.patch as any).mockResolvedValueOnce(mockUpdatedAlert);

      const res = await intelligenceService.updateRiskAlertStatus('alert-1', {
        status: 'RESOLVED',
        resolutionNotes: 'Core tests validated 41.2mm thickness, re-compaction verified',
      });

      expect(backendClient.patch).toHaveBeenCalledWith(
        '/v1/intelligence/risk/alerts/alert-1/status',
        {
          status: 'RESOLVED',
          resolutionNotes: 'Core tests validated 41.2mm thickness, re-compaction verified',
        }
      );
      expect(res.alertStatus).toBe('RESOLVED');
    });
  });

  describe('Cross-Module Intelligence Overview', () => {
    it('should return unified overview KPIs across all three modules', async () => {
      const mockOverview = {
        data: {
          success: true,
          data: {
            projectId: 'proj-1',
            projectName: 'Chennai Smart City Modernization',
            totalContracts: 1,
            totalRequirements: 4,
            approvedRequirements: 4,
            verifiedEvidenceRequirements: 3,
            physicalMeasurementRequiredCount: 2,
            contractCompliancePercentage: 75.0,
            totalDefects: 4,
            openDefects: 2,
            recurringDefects: 1,
            defectRecurrencePercentage: 25.0,
            resolvedDefects: 1,
            defectsByCategory: { ROAD_CRACK: 1, POTHOLE: 1 },
            overallRiskLevel: 'MEDIUM',
            overallRiskScore: 42.5,
            activeRiskAlerts: 2,
            criticalRiskAlerts: 0,
            lastEvaluatedAt: '2026-11-01T12:00:00Z',
          },
        },
      };

      (backendClient.get as any).mockResolvedValueOnce(mockOverview);

      const res = await intelligenceService.getOverview('proj-1');
      expect(backendClient.get).toHaveBeenCalledWith('/v1/intelligence/overview', {
        params: { projectId: 'proj-1' },
      });
      expect(res.contractCompliancePercentage).toBe(75.0);
      expect(res.defectRecurrencePercentage).toBe(25.0);
      expect(res.overallRiskScore).toBe(42.5);
    });
  });
});

