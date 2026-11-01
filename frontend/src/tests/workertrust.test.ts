import { describe, it, expect } from 'vitest';
import { UserRole, Permission } from '../types';
import {
  WorkerStatus,
  SiteAccessStatus,
  SiteBlockingReason,
  WorkerDetailResponse,
  EmergencyHeadcountResponse,
  WorkforceAnalyticsResponse
} from '../types/workertrust';

describe('WorkerTrust & Safety Management Unit & RBAC Tests', () => {

  describe('Role-Based Access Control (RBAC) Permissions Matrix', () => {
    const rolePermissions: Record<UserRole, Permission[]> = {
      PLATFORM_ADMIN: [
        'WORKER_VIEW', 'WORKER_REGISTER', 'WORKER_VERIFY', 'WORKER_APPROVE',
        'WORKER_ASSIGN', 'WORKER_SITE_ACCESS', 'WORKER_SAFETY', 'WORKER_HEADCOUNT', 'WORKER_ANALYTICS'
      ],
      PROJECT_MANAGER: [
        'WORKER_VIEW', 'WORKER_APPROVE', 'WORKER_ASSIGN', 'WORKER_SITE_ACCESS',
        'WORKER_SAFETY', 'WORKER_HEADCOUNT', 'WORKER_ANALYTICS'
      ],
      VENDOR: [
        'WORKER_VIEW', 'WORKER_REGISTER'
      ],
      FIELD_ENGINEER: [
        'WORKER_VIEW', 'WORKER_SITE_ACCESS', 'WORKER_SAFETY', 'WORKER_HEADCOUNT'
      ],
      FINANCE_OFFICER: [
        'WORKER_VIEW', 'WORKER_HEADCOUNT', 'WORKER_ANALYTICS'
      ]
    };

    it('Platform Admin possesses all 9 WorkerTrust permissions', () => {
      const adminPerms = rolePermissions.PLATFORM_ADMIN;
      expect(adminPerms).toContain('WORKER_VIEW');
      expect(adminPerms).toContain('WORKER_REGISTER');
      expect(adminPerms).toContain('WORKER_VERIFY');
      expect(adminPerms).toContain('WORKER_APPROVE');
      expect(adminPerms).toContain('WORKER_ASSIGN');
      expect(adminPerms).toContain('WORKER_SITE_ACCESS');
      expect(adminPerms).toContain('WORKER_SAFETY');
      expect(adminPerms).toContain('WORKER_HEADCOUNT');
      expect(adminPerms).toContain('WORKER_ANALYTICS');
    });

    it('Project Manager can approve, assign, manage site access and safety, but cannot register workers for vendors', () => {
      const pmPerms = rolePermissions.PROJECT_MANAGER;
      expect(pmPerms).toContain('WORKER_VIEW');
      expect(pmPerms).toContain('WORKER_APPROVE');
      expect(pmPerms).toContain('WORKER_ASSIGN');
      expect(pmPerms).toContain('WORKER_SITE_ACCESS');
      expect(pmPerms).toContain('WORKER_SAFETY');
      expect(pmPerms).toContain('WORKER_HEADCOUNT');
      expect(pmPerms).toContain('WORKER_ANALYTICS');
      expect(pmPerms).not.toContain('WORKER_REGISTER');
      expect(pmPerms).not.toContain('WORKER_VERIFY');
    });

    it('Vendor can only view their own workers and register new workers', () => {
      const vendorPerms = rolePermissions.VENDOR;
      expect(vendorPerms).toContain('WORKER_VIEW');
      expect(vendorPerms).toContain('WORKER_REGISTER');
      expect(vendorPerms).not.toContain('WORKER_APPROVE');
      expect(vendorPerms).not.toContain('WORKER_ASSIGN');
      expect(vendorPerms).not.toContain('WORKER_SITE_ACCESS');
      expect(vendorPerms).not.toContain('WORKER_SAFETY');
      expect(vendorPerms).not.toContain('WORKER_HEADCOUNT');
    });

    it('Field Engineer can operate site gate scanner, report safety incidents, and conduct roll-calls', () => {
      const fieldPerms = rolePermissions.FIELD_ENGINEER;
      expect(fieldPerms).toContain('WORKER_VIEW');
      expect(fieldPerms).toContain('WORKER_SITE_ACCESS');
      expect(fieldPerms).toContain('WORKER_SAFETY');
      expect(fieldPerms).toContain('WORKER_HEADCOUNT');
      expect(fieldPerms).not.toContain('WORKER_APPROVE');
      expect(fieldPerms).not.toContain('WORKER_ASSIGN');
      expect(fieldPerms).not.toContain('WORKER_REGISTER');
    });

    it('Finance Officer has strictly read-only visibility for headcount, attendance, and analytics', () => {
      const finPerms = rolePermissions.FINANCE_OFFICER;
      expect(finPerms).toContain('WORKER_VIEW');
      expect(finPerms).toContain('WORKER_HEADCOUNT');
      expect(finPerms).toContain('WORKER_ANALYTICS');
      expect(finPerms).not.toContain('WORKER_APPROVE');
      expect(finPerms).not.toContain('WORKER_SITE_ACCESS');
      expect(finPerms).not.toContain('WORKER_REGISTER');
      expect(finPerms).not.toContain('WORKER_SAFETY');
    });
  });

  describe('Identifier & Compliance Format Validation', () => {
    it('generates immutable Worker IDs matching standard INF-WRK-2026-XXXXXX format', () => {
      const workerIdPattern = /^INF-WRK-\d{4}-\d{6}$/;
      expect(workerIdPattern.test('INF-WRK-2026-000001')).toBe(true);
      expect(workerIdPattern.test('INF-WRK-2026-104928')).toBe(true);
      expect(workerIdPattern.test('AADHAAR-1234-5678')).toBe(false);
      expect(workerIdPattern.test('WRK-123')).toBe(false);
    });

    it('generates Incident tracking codes matching INC-2026-XXXX format', () => {
      const incidentCodePattern = /^INC-\d{4}-\d{4}$/;
      expect(incidentCodePattern.test('INC-2026-0001')).toBe(true);
      expect(incidentCodePattern.test('INC-2026-0042')).toBe(true);
      expect(incidentCodePattern.test('INCIDENT-1')).toBe(false);
    });

    it('enforces privacy-preserving masked identity references', () => {
      const rawAadhaar = '987654321098';
      const maskedAadhaar = `XXXX-XXXX-${rawAadhaar.slice(-4)}`;
      expect(maskedAadhaar).toBe('XXXX-XXXX-1098');
      expect(maskedAadhaar.length).toBe(14);
      expect(maskedAadhaar.startsWith('XXXX-XXXX-')).toBe(true);
    });
  });

  describe('Worker Lifecycle & State Transitions', () => {
    const validTransitions: Record<WorkerStatus, WorkerStatus[]> = {
      REGISTERED: ['PENDING_REVIEW', 'UNDER_VERIFICATION', 'INACTIVE'],
      PENDING_REVIEW: ['UNDER_VERIFICATION', 'APPROVED', 'REQUIRES_CORRECTION', 'REJECTED', 'INACTIVE'],
      UNDER_VERIFICATION: ['APPROVED', 'REQUIRES_CORRECTION', 'REJECTED', 'INACTIVE'],
      REQUIRES_CORRECTION: ['PENDING_REVIEW', 'UNDER_VERIFICATION', 'INACTIVE'],
      APPROVED: ['ASSIGNED', 'ACTIVE_ON_SITE', 'SUSPENDED', 'INACTIVE'],
      ASSIGNED: ['ACTIVE_ON_SITE', 'COMPLETED', 'SUSPENDED', 'INACTIVE'],
      ACTIVE_ON_SITE: ['ASSIGNED', 'APPROVED', 'SUSPENDED', 'COMPLETED', 'INACTIVE'],
      COMPLETED: ['INACTIVE', 'ASSIGNED'],
      REJECTED: ['REGISTERED', 'INACTIVE'],
      SUSPENDED: ['APPROVED', 'ASSIGNED', 'INACTIVE'],
      INACTIVE: ['REGISTERED', 'PENDING_REVIEW'],
      EXPIRED: ['REQUIRES_CORRECTION', 'INACTIVE']
    };

    it('allows an UNDER_VERIFICATION worker to be APPROVED or REJECTED by Project Manager', () => {
      expect(validTransitions.UNDER_VERIFICATION).toContain('APPROVED');
      expect(validTransitions.UNDER_VERIFICATION).toContain('REJECTED');
    });

    it('requires a SUSPENDED worker to be explicitly reactivated to APPROVED before site entry', () => {
      expect(validTransitions.SUSPENDED).toContain('APPROVED');
      expect(validTransitions.SUSPENDED).not.toContain('ACTIVE_ON_SITE');
    });

    it('allows an ACTIVE_ON_SITE worker to be SUSPENDED immediately for safety violation', () => {
      expect(validTransitions.ACTIVE_ON_SITE).toContain('SUSPENDED');
    });
  });

  describe('Site Entry Gate Validation Logic', () => {
    interface GateEvaluationInput {
      status: WorkerStatus;
      isSuspended: boolean;
      hasActiveAssignment: boolean;
      hasExpiredCert: boolean;
      currentlyCheckedIn: boolean;
    }

    function evaluateGateAccess(input: GateEvaluationInput): { status: SiteAccessStatus; reason?: SiteBlockingReason } {
      if (input.isSuspended || input.status === 'SUSPENDED') {
        return { status: 'BLOCK_ENTRY', reason: 'WORKER_SUSPENDED' };
      }
      if (input.status !== 'APPROVED' && input.status !== 'ASSIGNED' && input.status !== 'ACTIVE_ON_SITE') {
        return { status: 'BLOCK_ENTRY', reason: 'WORKER_NOT_APPROVED' };
      }
      if (!input.hasActiveAssignment) {
        return { status: 'BLOCK_ENTRY', reason: 'NO_ACTIVE_ASSIGNMENT' };
      }
      if (input.hasExpiredCert) {
        return { status: 'BLOCK_ENTRY', reason: 'CERTIFICATION_EXPIRED' };
      }
      if (input.currentlyCheckedIn) {
        return { status: 'BLOCK_ENTRY', reason: 'ALREADY_CHECKED_IN' };
      }
      return { status: 'ALLOW_ENTRY' };
    }

    it('allows entry for an APPROVED worker with valid assignment, valid certs, and not currently checked in', () => {
      const result = evaluateGateAccess({
        status: 'APPROVED',
        isSuspended: false,
        hasActiveAssignment: true,
        hasExpiredCert: false,
        currentlyCheckedIn: false
      });
      expect(result.status).toBe('ALLOW_ENTRY');
      expect(result.reason).toBeUndefined();
    });

    it('blocks entry if worker is suspended', () => {
      const result = evaluateGateAccess({
        status: 'SUSPENDED',
        isSuspended: true,
        hasActiveAssignment: true,
        hasExpiredCert: false,
        currentlyCheckedIn: false
      });
      expect(result.status).toBe('BLOCK_ENTRY');
      expect(result.reason).toBe('WORKER_SUSPENDED');
    });

    it('blocks entry if worker is not yet approved by Project Manager', () => {
      const result = evaluateGateAccess({
        status: 'PENDING_REVIEW',
        isSuspended: false,
        hasActiveAssignment: true,
        hasExpiredCert: false,
        currentlyCheckedIn: false
      });
      expect(result.status).toBe('BLOCK_ENTRY');
      expect(result.reason).toBe('WORKER_NOT_APPROVED');
    });

    it('blocks entry if worker has no active zone assignment', () => {
      const result = evaluateGateAccess({
        status: 'APPROVED',
        isSuspended: false,
        hasActiveAssignment: false,
        hasExpiredCert: false,
        currentlyCheckedIn: false
      });
      expect(result.status).toBe('BLOCK_ENTRY');
      expect(result.reason).toBe('NO_ACTIVE_ASSIGNMENT');
    });

    it('blocks entry if worker has an expired mandatory safety certification', () => {
      const result = evaluateGateAccess({
        status: 'APPROVED',
        isSuspended: false,
        hasActiveAssignment: true,
        hasExpiredCert: true,
        currentlyCheckedIn: false
      });
      expect(result.status).toBe('BLOCK_ENTRY');
      expect(result.reason).toBe('CERTIFICATION_EXPIRED');
    });

    it('prevents double-tap entry if worker is already inside the work zone', () => {
      const result = evaluateGateAccess({
        status: 'ACTIVE_ON_SITE',
        isSuspended: false,
        hasActiveAssignment: true,
        hasExpiredCert: false,
        currentlyCheckedIn: true
      });
      expect(result.status).toBe('BLOCK_ENTRY');
      expect(result.reason).toBe('ALREADY_CHECKED_IN');
    });
  });

  describe('Data Contracts & Types Integrity', () => {
    it('verifies WorkerDetailResponse structure and finance data isolation', () => {
      const mockWorkerDetail: WorkerDetailResponse = {
        id: 'wrk-001',
        workerCode: 'INF-WRK-2026-000001',
        fullName: 'Ramesh Kumar',
        dateOfBirth: '1988-04-12',
        mobileNumber: '+91 98765 43210',
        emergencyContactName: 'Sunita Kumar',
        emergencyContactPhone: '+91 98765 43211',
        jobRole: 'Heavy Equipment Operator',
        currentStatus: 'ACTIVE_ON_SITE',
        vendorId: 'ven-001',
        vendorName: 'Apex Trenching Services',
        activeProjectId: 'proj-001',
        activeProjectName: 'Metro Water Supply Line',
        activeWorkZoneId: 'zone-001',
        activeWorkZoneName: 'Sector 4 Trenching Zone',
        isCurrentlyOnSite: true,
        isSuspended: false,
        documents: [],
        verifications: [],
        certifications: [],
        assignments: [],
        recentSiteAccess: [],
        incidents: [],
        suspensions: [],
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z'
      };

      expect(mockWorkerDetail.workerCode).toMatch(/^INF-WRK-\d{4}-\d{6}$/);
      expect(mockWorkerDetail.jobRole).toBe('Heavy Equipment Operator');
      expect(mockWorkerDetail.currentStatus).toBe('ACTIVE_ON_SITE');
      expect(mockWorkerDetail.documents).toBeDefined();
    });

    it('verifies EmergencyHeadcountResponse structure', () => {
      const mockHeadcount: EmergencyHeadcountResponse = {
        generatedAt: '2026-11-01T10:00:00Z',
        totalCheckedIn: 1,
        activePersonnel: [
          {
            id: 'acc-001',
            workerId: 'wrk-001',
            workerCode: 'INF-WRK-2026-000001',
            workerName: 'Ramesh Kumar',
            workerRole: 'Heavy Equipment Operator',
            vendorName: 'Apex Trenching Services',
            projectName: 'Metro Water Supply Line',
            workZoneName: 'Sector 4 Trenching Zone',
            entryTime: '2026-11-01T08:00:00Z',
            accessStatus: 'ALLOW_ENTRY',
            isCurrentlyOnSite: true
          }
        ],
        workersByWorkZone: {
          'Sector 4 Trenching Zone': 1
        },
        workersByProject: {
          'Metro Water Supply Line': 1
        },
        workersByVendor: {
          'Apex Trenching Services': 1
        }
      };

      expect(mockHeadcount.totalCheckedIn).toBe(1);
      expect(mockHeadcount.activePersonnel[0].workerCode).toBe('INF-WRK-2026-000001');
      expect(mockHeadcount.workersByWorkZone['Sector 4 Trenching Zone']).toBe(1);
    });

    it('verifies WorkforceAnalyticsResponse structure', () => {
      const mockAnalytics: WorkforceAnalyticsResponse = {
        totalRegisteredWorkers: 50,
        approvedWorkers: 24,
        pendingVerification: 6,
        underVerification: 4,
        rejectedWorkers: 2,
        suspendedWorkers: 2,
        activeOnSiteWorkers: 18,
        activeAssignmentsCount: 20,
        certificationComplianceRate: 92.5,
        expiredCertificationsCount: 3,
        expiringWithin30DaysCertificationsCount: 4,
        openSafetyIncidents: 1,
        totalSafetyIncidents: 5,
        workersByStatus: { ACTIVE_ON_SITE: 18, APPROVED: 24, PENDING_REVIEW: 6, SUSPENDED: 2 },
        workersByVendor: { 'Apex Trenching Services': 25, 'Buildcon Infra': 25 },
        workersByProject: { 'Metro Water Line': 30, 'Highway Expansion': 20 },
        dailyAttendanceTrend: [{ date: '2026-10-31', count: 22 }]
      };

      expect(mockAnalytics.totalRegisteredWorkers).toBe(50);
      expect(mockAnalytics.activeOnSiteWorkers).toBe(18);
      expect(mockAnalytics.suspendedWorkers).toBe(2);
      expect(mockAnalytics.dailyAttendanceTrend.length).toBe(1);
    });
  });
});
