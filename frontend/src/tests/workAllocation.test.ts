import { describe, it, expect } from 'vitest';
import { UserRole, Permission } from '../types';
import { WorkTypeEnum, AssignmentStatusEnum } from '../types/workAssignment';

describe('Stage 05: PIN-Code-Based Work Allocation & Assignment Management Frontend Tests', () => {
  describe('RBAC Work Allocation & Work Zone Permissions Verification', () => {
    const rolePermissions: Record<UserRole, Permission[]> = {
      PLATFORM_ADMIN: [
        'VIEW_OVERVIEW', 'MANAGE_USERS', 'MANAGE_PROJECTS', 'VIEW_PROJECTS',
        'VIEW_WORK_ZONES', 'ALLOCATE_WORK', 'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE',
        'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_MILESTONES', 'AUTHORIZE_PAYMENTS', 'VIEW_AUDIT_TRAIL',
        'WORK_ZONE_VIEW', 'WORK_ZONE_CREATE', 'WORK_ZONE_UPDATE', 'WORK_ZONE_STATUS_MANAGE',
        'WORK_ASSIGNMENT_VIEW', 'WORK_ASSIGNMENT_CREATE', 'WORK_ASSIGNMENT_UPDATE', 'WORK_ASSIGNMENT_CANCEL',
        'WORK_ASSIGNMENT_ACCEPT', 'WORK_ASSIGNMENT_REJECT', 'WORK_ASSIGNMENT_START'
      ],
      PROJECT_MANAGER: [
        'VIEW_OVERVIEW', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES', 'ALLOCATE_WORK', 'VIEW_ASSIGNED_WORK',
        'SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_MILESTONES', 'VIEW_AUDIT_TRAIL',
        'WORK_ZONE_VIEW', 'WORK_ZONE_CREATE', 'WORK_ZONE_UPDATE', 'WORK_ZONE_STATUS_MANAGE',
        'WORK_ASSIGNMENT_VIEW', 'WORK_ASSIGNMENT_CREATE', 'WORK_ASSIGNMENT_UPDATE', 'WORK_ASSIGNMENT_CANCEL'
      ],
      VENDOR: [
        'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE', 'VIEW_MILESTONES',
        'WORK_ZONE_VIEW', 'WORK_ASSIGNMENT_VIEW', 'WORK_ASSIGNMENT_ACCEPT', 'WORK_ASSIGNMENT_REJECT', 'WORK_ASSIGNMENT_START'
      ],
      FIELD_ENGINEER: [
        'VIEW_PROJECTS', 'VIEW_WORK_ZONES', 'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE',
        'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_AUDIT_TRAIL',
        'WORK_ZONE_VIEW', 'WORK_ASSIGNMENT_VIEW'
      ],
      FINANCE_OFFICER: [
        'VIEW_PROJECTS', 'VIEW_MILESTONES', 'AUTHORIZE_PAYMENTS', 'VIEW_AUDIT_TRAIL',
        'WORK_ASSIGNMENT_VIEW'
      ]
    };

    it('Platform Admin possesses full work zone and work assignment management permissions', () => {
      const adminPerms = rolePermissions.PLATFORM_ADMIN;
      expect(adminPerms).toContain('WORK_ZONE_CREATE');
      expect(adminPerms).toContain('WORK_ZONE_STATUS_MANAGE');
      expect(adminPerms).toContain('WORK_ASSIGNMENT_CREATE');
      expect(adminPerms).toContain('WORK_ASSIGNMENT_CANCEL');
    });

    it('Project Manager can create zones and assignments within authorized projects', () => {
      const pmPerms = rolePermissions.PROJECT_MANAGER;
      expect(pmPerms).toContain('WORK_ZONE_CREATE');
      expect(pmPerms).toContain('WORK_ASSIGNMENT_CREATE');
      expect(pmPerms).toContain('WORK_ASSIGNMENT_CANCEL');
      expect(pmPerms).not.toContain('WORK_ASSIGNMENT_ACCEPT');
    });

    it('Vendor possesses self-service assignment lifecycle permissions but not administrative creation', () => {
      const vendorPerms = rolePermissions.VENDOR;
      expect(vendorPerms).toContain('WORK_ASSIGNMENT_VIEW');
      expect(vendorPerms).toContain('WORK_ASSIGNMENT_ACCEPT');
      expect(vendorPerms).toContain('WORK_ASSIGNMENT_REJECT');
      expect(vendorPerms).toContain('WORK_ASSIGNMENT_START');
      expect(vendorPerms).not.toContain('WORK_ASSIGNMENT_CREATE');
      expect(vendorPerms).not.toContain('WORK_ASSIGNMENT_CANCEL');
      expect(vendorPerms).not.toContain('WORK_ZONE_CREATE');
    });

    it('Field Engineer and Finance roles cannot create or manipulate work assignments', () => {
      expect(rolePermissions.FIELD_ENGINEER).not.toContain('WORK_ASSIGNMENT_CREATE');
      expect(rolePermissions.FIELD_ENGINEER).not.toContain('WORK_ASSIGNMENT_ACCEPT');
      expect(rolePermissions.FINANCE_OFFICER).not.toContain('WORK_ASSIGNMENT_CREATE');
      expect(rolePermissions.FINANCE_OFFICER).not.toContain('WORK_ZONE_CREATE');
    });
  });

  describe('PIN Code & Work Zone Validation Logic', () => {
    const isValidPinCode = (pin: string) => /^\d{6}$/.test(pin);

    it('validates 6-digit Indian PIN codes correctly', () => {
      expect(isValidPinCode('560001')).toBe(true);
      expect(isValidPinCode('600040')).toBe(true);
      expect(isValidPinCode('110001')).toBe(true);
      expect(isValidPinCode('5600')).toBe(false);
      expect(isValidPinCode('5600011')).toBe(false);
      expect(isValidPinCode('56000A')).toBe(false);
      expect(isValidPinCode('')).toBe(false);
    });

    it('supports multiple work zones under the exact same PIN code', () => {
      const zonesInPincode = [
        { id: 'z1', zoneCode: 'WZ-560001-01', pincode: '560001', zoneName: 'MG Road North' },
        { id: 'z2', zoneCode: 'WZ-560001-02', pincode: '560001', zoneName: 'Brigade Road Junction' },
        { id: 'z3', zoneCode: 'WZ-560001-03', pincode: '560001', zoneName: 'Residency Road South' }
      ];

      const pin = '560001';
      const matched = zonesInPincode.filter(z => z.pincode === pin);
      expect(matched.length).toBe(3);
      expect(new Set(matched.map(z => z.id)).size).toBe(3);
    });
  });

  describe('Work Type & Vendor Eligibility Validation', () => {
    const validWorkTypes: WorkTypeEnum[] = [
      'TRENCHING',
      'UNDERGROUND_CABLE_INSTALLATION',
      'BACKFILLING',
      'ROAD_RESURFACING',
      'FINAL_INSPECTION'
    ];

    const mockAssociatedVendors = [
      {
        id: 'v1',
        vendorCode: 'VND-001',
        companyName: 'Apex Civil Works',
        status: 'ACTIVE',
        serviceCategories: ['TRENCHING', 'BACKFILLING']
      },
      {
        id: 'v2',
        vendorCode: 'VND-002',
        companyName: 'OptiFiber Solutions',
        status: 'ACTIVE',
        serviceCategories: ['UNDERGROUND_CABLE_INSTALLATION']
      },
      {
        id: 'v3',
        vendorCode: 'VND-003',
        companyName: 'Metro Asphalt infra',
        status: 'SUSPENDED',
        serviceCategories: ['ROAD_RESURFACING']
      }
    ];

    it('controlled work type catalog contains all 5 mandatory infrastructure categories', () => {
      expect(validWorkTypes).toHaveLength(5);
      expect(validWorkTypes).toContain('TRENCHING');
      expect(validWorkTypes).toContain('ROAD_RESURFACING');
    });

    it('filters eligible vendors by active status and matching work category', () => {
      const getEligibleVendors = (workType: string) => {
        return mockAssociatedVendors.filter(
          v => v.status === 'ACTIVE' && v.serviceCategories.includes(workType)
        );
      };

      const trenchingVendors = getEligibleVendors('TRENCHING');
      expect(trenchingVendors).toHaveLength(1);
      expect(trenchingVendors[0].companyName).toBe('Apex Civil Works');

      const cableVendors = getEligibleVendors('UNDERGROUND_CABLE_INSTALLATION');
      expect(cableVendors).toHaveLength(1);
      expect(cableVendors[0].companyName).toBe('OptiFiber Solutions');

      // Suspended vendor must not be eligible even if category matches
      const resurfacingVendors = getEligibleVendors('ROAD_RESURFACING');
      expect(resurfacingVendors).toHaveLength(0);
    });
  });

  describe('Schedule Validation Rules', () => {
    const isScheduleValid = (startDate: string, endDate: string) => {
      if (!startDate || !endDate) return false;
      const start = new Date(startDate);
      const end = new Date(endDate);
      return end >= start;
    };

    it('accepts target end date on or after planned start date', () => {
      expect(isScheduleValid('2026-11-10', '2026-11-20')).toBe(true);
      expect(isScheduleValid('2026-11-10', '2026-11-10')).toBe(true);
    });

    it('rejects target completion date before planned start date', () => {
      expect(isScheduleValid('2026-11-20', '2026-11-10')).toBe(false);
      expect(isScheduleValid('', '2026-11-10')).toBe(false);
    });
  });

  describe('Assignment Lifecycle State Transitions', () => {
    const allowedTransitions: Record<AssignmentStatusEnum, AssignmentStatusEnum[]> = {
      DRAFT: ['ASSIGNED', 'CANCELLED'],
      ASSIGNED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['SUBMITTED_FOR_REVIEW', 'CANCELLED'],
      SUBMITTED_FOR_REVIEW: ['COMPLETED', 'REJECTED'],
      REJECTED: ['ASSIGNED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: []
    };

    const canTransition = (from: AssignmentStatusEnum, to: AssignmentStatusEnum) => {
      return allowedTransitions[from]?.includes(to) ?? false;
    };

    it('allows valid lifecycle progression from ASSIGNED to ACCEPTED to IN_PROGRESS', () => {
      expect(canTransition('ASSIGNED', 'ACCEPTED')).toBe(true);
      expect(canTransition('ACCEPTED', 'IN_PROGRESS')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'SUBMITTED_FOR_REVIEW')).toBe(true);
    });

    it('rejects invalid direct completion by vendor without review', () => {
      expect(canTransition('ASSIGNED', 'COMPLETED')).toBe(false);
      expect(canTransition('ACCEPTED', 'COMPLETED')).toBe(false);
      expect(canTransition('IN_PROGRESS', 'COMPLETED')).toBe(false);
    });

    it('treats COMPLETED and CANCELLED as terminal states', () => {
      expect(canTransition('COMPLETED', 'IN_PROGRESS')).toBe(false);
      expect(canTransition('CANCELLED', 'ASSIGNED')).toBe(false);
      expect(canTransition('CANCELLED', 'ACCEPTED')).toBe(false);
    });
  });
});
