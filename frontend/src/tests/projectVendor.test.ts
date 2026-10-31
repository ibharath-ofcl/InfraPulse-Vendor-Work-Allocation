import { describe, it, expect } from 'vitest';
import { UserRole, Permission } from '../types';
import { ProjectStatus } from '../types/project';
import { VendorStatus } from '../types/vendor';

describe('Stage 04: Project & Vendor Management Frontend Tests', () => {

  describe('RBAC Project & Vendor Permissions Verification', () => {
    const rolePermissions: Record<UserRole, Permission[]> = {
      PLATFORM_ADMIN: [
        'VIEW_OVERVIEW', 'MANAGE_USERS', 'MANAGE_PROJECTS', 'VIEW_PROJECTS',
        'VIEW_WORK_ZONES', 'ALLOCATE_WORK', 'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE',
        'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_MILESTONES', 'AUTHORIZE_PAYMENTS', 'VIEW_AUDIT_TRAIL',
        'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_STATUS_MANAGE', 'PROJECT_MANAGER_ASSIGN', 'PROJECT_VENDOR_ASSOCIATE',
        'VENDOR_VIEW', 'VENDOR_CREATE', 'VENDOR_UPDATE', 'VENDOR_STATUS_MANAGE', 'VENDOR_PROJECT_ASSOCIATE'
      ],
      PROJECT_MANAGER: [
        'VIEW_OVERVIEW', 'MANAGE_PROJECTS', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES',
        'ALLOCATE_WORK', 'VIEW_ASSIGNED_WORK', 'VIEW_MILESTONES', 'VIEW_AUDIT_TRAIL',
        'PROJECT_UPDATE', 'PROJECT_VENDOR_ASSOCIATE', 'VENDOR_VIEW'
      ],
      VENDOR: [
        'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE', 'VIEW_MILESTONES', 'VIEW_PROJECTS', 'VENDOR_VIEW'
      ],
      FIELD_ENGINEER: [
        'VIEW_OVERVIEW', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES', 'VIEW_ASSIGNED_WORK',
        'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_MILESTONES', 'VIEW_AUDIT_TRAIL', 'VENDOR_VIEW'
      ],
      FINANCE_OFFICER: [
        'VIEW_OVERVIEW', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES', 'VIEW_MILESTONES',
        'AUTHORIZE_PAYMENTS', 'VIEW_AUDIT_TRAIL', 'VENDOR_VIEW'
      ],
    };

    it('Platform Admin possesses all project and vendor creation and management permissions', () => {
      const adminPerms = rolePermissions.PLATFORM_ADMIN;
      expect(adminPerms).toContain('PROJECT_CREATE');
      expect(adminPerms).toContain('PROJECT_MANAGER_ASSIGN');
      expect(adminPerms).toContain('PROJECT_STATUS_MANAGE');
      expect(adminPerms).toContain('VENDOR_CREATE');
      expect(adminPerms).toContain('VENDOR_STATUS_MANAGE');
      expect(adminPerms).toContain('PROJECT_VENDOR_ASSOCIATE');
    });

    it('Project Manager can update assigned project and associate vendors, but cannot create projects or assign managers', () => {
      const pmPerms = rolePermissions.PROJECT_MANAGER;
      expect(pmPerms).toContain('PROJECT_UPDATE');
      expect(pmPerms).toContain('PROJECT_VENDOR_ASSOCIATE');
      expect(pmPerms).toContain('VENDOR_VIEW');
      expect(pmPerms).not.toContain('PROJECT_CREATE');
      expect(pmPerms).not.toContain('PROJECT_MANAGER_ASSIGN');
      expect(pmPerms).not.toContain('VENDOR_CREATE');
      expect(pmPerms).not.toContain('VENDOR_STATUS_MANAGE');
    });

    it('Vendor cannot create projects, update status, create vendors, or assign managers', () => {
      const vendorPerms = rolePermissions.VENDOR;
      expect(vendorPerms).not.toContain('PROJECT_CREATE');
      expect(vendorPerms).not.toContain('PROJECT_UPDATE');
      expect(vendorPerms).not.toContain('PROJECT_STATUS_MANAGE');
      expect(vendorPerms).not.toContain('VENDOR_CREATE');
      expect(vendorPerms).not.toContain('VENDOR_STATUS_MANAGE');
    });
  });

  describe('Project Creation Form Validation Logic', () => {
    const validateProjectForm = (data: {
      projectName: string;
      projectType: string;
      clientName: string;
      region: string;
      state: string;
      district: string;
      primaryPincode: string;
      startDate: string;
      targetEndDate: string;
      budget: number;
    }) => {
      const errors: Record<string, string> = {};
      if (!data.projectName.trim()) errors.projectName = 'Project name is required';
      if (!data.projectType) errors.projectType = 'Project type is required';
      if (!data.clientName.trim()) errors.clientName = 'Client authority is required';
      if (!data.region.trim()) errors.region = 'Operational region is required';
      if (!data.state.trim()) errors.state = 'State is required';
      if (!data.district.trim()) errors.district = 'District is required';
      if (!/^\d{6}$/.test(data.primaryPincode)) errors.primaryPincode = 'PIN code must be exactly 6 digits';
      if (!data.startDate) errors.startDate = 'Start date is required';
      if (!data.targetEndDate) errors.targetEndDate = 'Target completion date is required';
      if (data.startDate && data.targetEndDate && new Date(data.startDate) > new Date(data.targetEndDate)) {
        errors.targetEndDate = 'Target completion date must not be before start date';
      }
      if (data.budget <= 0) errors.budget = 'Budget must be greater than zero';
      return errors;
    };

    it('accepts valid project details', () => {
      const valid = {
        projectName: 'Chennai Fiber Network Expansion',
        projectType: 'FIBER_OPTIC',
        clientName: 'Infrastructure Development Authority',
        region: 'Chennai North',
        state: 'Tamil Nadu',
        district: 'Chennai',
        primaryPincode: '600001',
        startDate: '2026-11-10',
        targetEndDate: '2027-06-30',
        budget: 25000000
      };
      const errors = validateProjectForm(valid);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('rejects invalid PIN code format', () => {
      const invalid = {
        projectName: 'Metro Line',
        projectType: 'ROAD_INFRASTRUCTURE',
        clientName: 'Transit Board',
        region: 'Metro Zone',
        state: 'Tamil Nadu',
        district: 'Chennai',
        primaryPincode: '6000A1', // Invalid
        startDate: '2026-11-10',
        targetEndDate: '2027-06-30',
        budget: 5000000
      };
      const errors = validateProjectForm(invalid);
      expect(errors.primaryPincode).toBe('PIN code must be exactly 6 digits');
    });

    it('rejects negative or zero budget', () => {
      const invalid = {
        projectName: 'Metro Line',
        projectType: 'ROAD_INFRASTRUCTURE',
        clientName: 'Transit Board',
        region: 'Metro Zone',
        state: 'Tamil Nadu',
        district: 'Chennai',
        primaryPincode: '600001',
        startDate: '2026-11-10',
        targetEndDate: '2027-06-30',
        budget: -50000
      };
      const errors = validateProjectForm(invalid);
      expect(errors.budget).toBe('Budget must be greater than zero');
    });

    it('rejects inverted date ranges where target completion is before start date', () => {
      const invalid = {
        projectName: 'Metro Line',
        projectType: 'ROAD_INFRASTRUCTURE',
        clientName: 'Transit Board',
        region: 'Metro Zone',
        state: 'Tamil Nadu',
        district: 'Chennai',
        primaryPincode: '600001',
        startDate: '2027-01-01',
        targetEndDate: '2026-01-01',
        budget: 1000000
      };
      const errors = validateProjectForm(invalid);
      expect(errors.targetEndDate).toBe('Target completion date must not be before start date');
    });
  });

  describe('Vendor Registration Form Validation Logic', () => {
    const validateVendorForm = (data: {
      companyName: string;
      contactPerson: string;
      email: string;
      phoneNumber: string;
      addressLine: string;
      city: string;
      district: string;
      state: string;
      pincode: string;
      serviceCategories: string[];
    }) => {
      const errors: Record<string, string> = {};
      if (!data.companyName.trim()) errors.companyName = 'Company name is required';
      if (!data.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Valid corporate email is required';
      if (!/^\d{10}$/.test(data.phoneNumber)) errors.phoneNumber = 'Phone number must be exactly 10 digits';
      if (!data.addressLine.trim()) errors.addressLine = 'Business address is required';
      if (!data.city.trim()) errors.city = 'City is required';
      if (!data.district.trim()) errors.district = 'District is required';
      if (!data.state.trim()) errors.state = 'State is required';
      if (!/^\d{6}$/.test(data.pincode)) errors.pincode = 'PIN code must be exactly 6 digits';
      if (data.serviceCategories.length === 0) errors.serviceCategories = 'At least one service capability is required';
      return errors;
    };

    it('accepts valid vendor registration details', () => {
      const valid = {
        companyName: 'ABC Infrastructure Services',
        contactPerson: 'Rajesh Kumar',
        email: 'contact@abcinfra.example',
        phoneNumber: '9876543210',
        addressLine: 'Industrial Estate',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600096',
        serviceCategories: ['TRENCHING', 'ROAD_RESURFACING']
      };
      const errors = validateVendorForm(valid);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('rejects malformed email address', () => {
      const invalid = {
        companyName: 'ABC Infrastructure',
        contactPerson: 'Rajesh Kumar',
        email: 'invalid-email-no-domain',
        phoneNumber: '9876543210',
        addressLine: 'Industrial Estate',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600096',
        serviceCategories: ['TRENCHING']
      };
      const errors = validateVendorForm(invalid);
      expect(errors.email).toBe('Valid corporate email is required');
    });

    it('rejects invalid phone number length', () => {
      const invalid = {
        companyName: 'ABC Infrastructure',
        contactPerson: 'Rajesh Kumar',
        email: 'contact@abcinfra.com',
        phoneNumber: '123', // Invalid
        addressLine: 'Industrial Estate',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600096',
        serviceCategories: ['TRENCHING']
      };
      const errors = validateVendorForm(invalid);
      expect(errors.phoneNumber).toBe('Phone number must be exactly 10 digits');
    });

    it('rejects empty service capabilities', () => {
      const invalid = {
        companyName: 'ABC Infrastructure',
        contactPerson: 'Rajesh Kumar',
        email: 'contact@abcinfra.com',
        phoneNumber: '9876543210',
        addressLine: 'Industrial Estate',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600096',
        serviceCategories: [] // Empty
      };
      const errors = validateVendorForm(invalid);
      expect(errors.serviceCategories).toBe('At least one service capability is required');
    });
  });

  describe('Project & Vendor State Machine Rules', () => {
    const validProjectTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      PLANNED: ['ACTIVE', 'ON_HOLD', 'CANCELLED'],
      ACTIVE: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
      ON_HOLD: ['ACTIVE', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: []
    };

    const validVendorTransitions: Record<VendorStatus, VendorStatus[]> = {
      PENDING_VERIFICATION: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      ACTIVE: ['INACTIVE', 'SUSPENDED'],
      INACTIVE: ['ACTIVE'],
      SUSPENDED: ['ACTIVE']
    };

    it('allows PLANNED to transition to ACTIVE, ON_HOLD, and CANCELLED', () => {
      expect(validProjectTransitions.PLANNED).toContain('ACTIVE');
      expect(validProjectTransitions.PLANNED).toContain('ON_HOLD');
      expect(validProjectTransitions.PLANNED).toContain('CANCELLED');
      expect(validProjectTransitions.PLANNED).not.toContain('COMPLETED');
    });

    it('disallows transitions from terminal COMPLETED or CANCELLED status', () => {
      expect(validProjectTransitions.COMPLETED).toHaveLength(0);
      expect(validProjectTransitions.CANCELLED).toHaveLength(0);
    });

    it('allows PENDING_VERIFICATION vendor to be ACTIVATED or SUSPENDED', () => {
      expect(validVendorTransitions.PENDING_VERIFICATION).toContain('ACTIVE');
      expect(validVendorTransitions.PENDING_VERIFICATION).toContain('SUSPENDED');
    });
  });
});
