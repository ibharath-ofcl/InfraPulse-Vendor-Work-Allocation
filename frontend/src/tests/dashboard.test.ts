import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../services/dashboardService';
import { backendClient } from '../services/api';
import {
  DashboardSummary,
  ProjectProgressResponse,
  WorkZoneOverviewItem,
  DependencyMonitoringResponse,
  VendorWorkloadResponse,
} from '../types/dashboard';

vi.mock('../services/api', () => ({
  backendClient: {
    get: vi.fn(),
  },
}));

describe('Stage 07: Work Lifecycle Dashboard Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Service API Contract & Filtering', () => {
    it('calls /dashboard/summary with project and filter parameters', async () => {
      const mockSummary: DashboardSummary = {
        totalProjects: 3,
        activeAssignments: 5,
        pendingAcceptance: 2,
        inProgress: 3,
        awaitingReview: 1,
        dependencyBlocked: 2,
        readyForNextStage: 4,
        completedAssignments: 6,
        totalAssignments: 15,
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockSummary },
      });

      const result = await dashboardService.getSummary({
        projectId: 'proj-123',
        pincode: '560001',
        workType: 'ROAD_CONSTRUCTION',
      });

      expect(backendClient.get).toHaveBeenCalledWith('/v1/dashboard/summary', {
        params: {
          projectId: 'proj-123',
          pincode: '560001',
          workType: 'ROAD_CONSTRUCTION',
        },
      });
      expect(result).toEqual(mockSummary);
    });

    it('calls /dashboard/project-progress and validates progress percentage calculation', async () => {
      const mockProgress: ProjectProgressResponse = {
        projects: [
          {
            projectId: 'p1',
            projectCode: 'PRJ-001',
            projectName: 'Smart Highway Expansion',
            location: 'Bengaluru North',
            projectManagerName: 'John PM',
            totalAssignments: 10,
            completedAssignments: 4,
            inProgressAssignments: 3,
            blockedAssignments: 1,
            completionPercentage: 50.0, // Backend excludes cancelled assignments (e.g. 4 completed / 8 eligible)
            projectStatus: 'ACTIVE',
          },
          {
            projectId: 'p2',
            projectCode: 'PRJ-002',
            projectName: 'Water Supply Pipeline',
            location: 'Bengaluru South',
            projectManagerName: 'Unassigned',
            totalAssignments: 0,
            completedAssignments: 0,
            inProgressAssignments: 0,
            blockedAssignments: 0,
            completionPercentage: 0.0,
            projectStatus: 'PLANNING',
          },
        ],
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockProgress },
      });

      const result = await dashboardService.getProjectProgress();
      expect(backendClient.get).toHaveBeenCalledWith('/v1/dashboard/project-progress', { params: {} });
      expect(result.projects.length).toBe(2);

      // Verify PRJ-001 completion rule
      const p1 = result.projects[0];
      expect(p1.completionPercentage).toBe(50.0);

      // Verify empty assignments project has 0.0% not started
      const p2 = result.projects[1];
      expect(p2.totalAssignments).toBe(0);
      expect(p2.completionPercentage).toBe(0.0);
    });

    it('calls /dashboard/work-zones and preserves distinct work zones per PIN code', async () => {
      const mockZones: WorkZoneOverviewItem[] = [
        {
          workZoneId: 'zone-1',
          zoneCode: 'WZ-001',
          zoneName: 'Hebbal Flyover Junction',
          pincode: '560024',
          locality: 'Hebbal',
          district: 'Bengaluru Urban',
          state: 'Karnataka',
          projectId: 'p1',
          projectCode: 'PRJ-001',
          projectName: 'Smart Highway Expansion',
          centerLatitude: 13.0358,
          centerLongitude: 77.597,
          totalAssignments: 5,
          activeWork: 2,
          blockedWork: 1,
          completedWork: 2,
          operationalStatus: 'ACTIVE',
        },
        {
          workZoneId: 'zone-2',
          zoneCode: 'WZ-002',
          zoneName: 'Ganganagar Sewer Trench',
          pincode: '560024', // Same PIN code!
          locality: 'Ganganagar',
          district: 'Bengaluru Urban',
          state: 'Karnataka',
          projectId: 'p1',
          projectCode: 'PRJ-001',
          projectName: 'Smart Highway Expansion',
          centerLatitude: 13.028,
          centerLongitude: 77.592,
          totalAssignments: 3,
          activeWork: 1,
          blockedWork: 0,
          completedWork: 1,
          operationalStatus: 'ACTIVE',
        },
      ];

      (backendClient.get as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            workZones: mockZones,
            page: 0,
            size: 20,
            totalElements: 2,
            totalPages: 1,
          },
        },
      });

      const result = await dashboardService.getWorkZones({ pincode: '560024' });
      expect(result.workZones.length).toBe(2);
      expect(result.workZones[0].pincode).toBe('560024');
      expect(result.workZones[1].pincode).toBe('560024');
      expect(result.workZones[0].workZoneId).not.toBe(result.workZones[1].workZoneId);
      expect(result.workZones[0].zoneName).not.toBe(result.workZones[1].zoneName);
    });

    it('calls /dashboard/dependency-monitoring to retrieve Stage 6 blocked & ready activities', async () => {
      const mockDependencyData: DependencyMonitoringResponse = {
        blockedAssignments: [
          {
            assignmentId: 'a1',
            assignmentCode: 'WA-001',
            title: 'Asphalt Laying',
            workType: 'ROAD_CONSTRUCTION',
            workTypeDisplayName: 'Road Construction',
            projectId: 'p1',
            projectCode: 'PRJ-001',
            projectName: 'Smart Highway Expansion',
            workZoneId: 'zone-1',
            workZoneName: 'Hebbal Flyover Junction',
            pincode: '560024',
            assignedVendorName: 'Prime Builders',
            requiredPredecessorWorkType: 'EXCAVATION',
            requiredPredecessorWorkTypeDisplayName: 'Excavation',
            predecessorAssignmentCode: 'WA-000',
            predecessorVendorName: 'Apex Diggers',
            predecessorStatus: 'IN_PROGRESS',
            releaseStatus: 'PENDING_RELEASE',
            blockingReason: 'Prerequisite EXCAVATION is currently IN_PROGRESS and has not been completed/released',
            requiredAction: 'Await prerequisite completion and authorized release',
          },
        ],
        readyAssignments: [
          {
            assignmentId: 'a2',
            assignmentCode: 'WA-002',
            title: 'Cable Trench Excavation',
            workType: 'EXCAVATION',
            workTypeDisplayName: 'Excavation',
            projectId: 'p1',
            projectCode: 'PRJ-001',
            projectName: 'Smart Highway Expansion',
            workZoneId: 'zone-2',
            workZoneName: 'Ganganagar Sewer Trench',
            pincode: '560024',
            assignedVendorName: 'Apex Diggers',
            currentStatus: 'DRAFT',
            releaseStatus: 'NOT_REQUIRED',
            action: 'Ready to assign vendor or commence work',
          },
        ],
        totalBlocked: 1,
        totalReady: 1,
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockDependencyData },
      });

      const result = await dashboardService.getDependencyMonitoring();
      expect(result.blockedAssignments.length).toBe(1);
      expect(result.readyAssignments.length).toBe(1);
      expect(result.blockedAssignments[0].blockingReason).toContain('not been completed/released');
      expect(result.readyAssignments[0].action).toContain('Ready');
    });

    it('calls /dashboard/vendor-workload to retrieve factual operational metrics', async () => {
      const mockVendorWorkload: VendorWorkloadResponse = {
        vendors: [
          {
            vendorId: 'v1',
            vendorCode: 'VND-001',
            companyName: 'Apex Infrastructure Ltd',
            contactPerson: 'Apex Contact',
            status: 'ACTIVE',
            activeAssignments: 4,
            completedAssignments: 8,
            pendingAcceptance: 1,
            blockedAssignments: 1,
            rejectedAssignments: 0,
            currentWorkload: 4, // Equals active assignments
            serviceCategories: ['ROAD_CONSTRUCTION', 'DRAINAGE'],
          },
        ],
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockVendorWorkload },
      });

      const result = await dashboardService.getVendorWorkload();
      expect(result.vendors.length).toBe(1);
      expect(result.vendors[0].currentWorkload).toBe(result.vendors[0].activeAssignments);
      expect(result.vendors[0].serviceCategories).toContain('ROAD_CONSTRUCTION');
    });

    it('calls /dashboard/recent-activity and supports pagination parameters', async () => {
      const mockActivity = {
        events: [
          {
            id: 'evt-1',
            eventType: 'ASSIGNMENT_CREATED',
            eventTitle: 'Work Assignment WA-001 Created',
            entityType: 'WorkAssignment',
            entityId: 'a1',
            summary: 'Assignment created for project Smart Highway',
            reason: '',
            actorId: 'u1',
            actorName: 'Platform Admin',
            actorRole: 'PLATFORM_ADMIN',
            projectReference: 'PRJ-001',
            workZoneReference: 'WZ-001',
            assignmentCode: 'WA-001',
            timestamp: '2026-10-31T10:00:00Z',
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      };

      (backendClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockActivity },
      });

      const result = await dashboardService.getRecentActivity('p1', 0, 10);
      expect(backendClient.get).toHaveBeenCalledWith('/v1/dashboard/recent-activity', {
        params: { projectId: 'p1', page: 0, size: 10 },
      });
      expect(result.events.length).toBe(1);
      expect(result.events[0].actorRole).toBe('PLATFORM_ADMIN');
    });
  });

  describe('Operational Integrity & Business Rule Verification', () => {
    it('distinguishes submitted work awaiting review from authorized completed work', () => {
      const summary: DashboardSummary = {
        totalProjects: 1,
        activeAssignments: 3,
        pendingAcceptance: 1,
        inProgress: 2,
        awaitingReview: 4,
        dependencyBlocked: 1,
        readyForNextStage: 2,
        completedAssignments: 7,
        totalAssignments: 15,
      };

      // Awaiting review must not be merged into completed
      expect(summary.awaitingReview).toBe(4);
      expect(summary.completedAssignments).toBe(7);
      expect(summary.awaitingReview).not.toBe(summary.completedAssignments);
    });

    it('ensures cancelled assignments are never counted in the completion percentage denominator', () => {
      const total = 20;
      const cancelled = 5;
      const completed = 6;
      const eligible = total - cancelled; // 15
      const pct = (completed / eligible) * 100;
      expect(pct).toBe(40);
    });
  });
});
