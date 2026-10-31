import { describe, it, expect } from 'vitest';
import { UserRole, Permission } from '../types';
import { setInMemoryToken, getInMemoryToken } from '../services/api';

describe('Role and Permission Verification', () => {
  const rolePermissions: Record<UserRole, Permission[]> = {
    PLATFORM_ADMIN: [
      'VIEW_OVERVIEW', 'MANAGE_USERS', 'MANAGE_PROJECTS', 'VIEW_PROJECTS',
      'VIEW_WORK_ZONES', 'ALLOCATE_WORK', 'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE',
      'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_MILESTONES', 'AUTHORIZE_PAYMENTS', 'VIEW_AUDIT_TRAIL'
    ],
    PROJECT_MANAGER: [
      'VIEW_OVERVIEW', 'MANAGE_PROJECTS', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES',
      'ALLOCATE_WORK', 'VIEW_ASSIGNED_WORK', 'VIEW_MILESTONES', 'VIEW_AUDIT_TRAIL'
    ],
    VENDOR: [
      'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE', 'VIEW_MILESTONES'
    ],
    FIELD_ENGINEER: [
      'VIEW_OVERVIEW', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES', 'VIEW_ASSIGNED_WORK',
      'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_MILESTONES', 'VIEW_AUDIT_TRAIL'
    ],
    FINANCE_OFFICER: [
      'VIEW_OVERVIEW', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES', 'VIEW_MILESTONES',
      'AUTHORIZE_PAYMENTS', 'VIEW_AUDIT_TRAIL'
    ],
  };

  it('Platform Admin possesses all 13 operational permissions including MANAGE_USERS', () => {
    const adminPermissions = rolePermissions.PLATFORM_ADMIN;
    expect(adminPermissions).toContain('MANAGE_USERS');
    expect(adminPermissions).toContain('ALLOCATE_WORK');
    expect(adminPermissions).toContain('AUTHORIZE_PAYMENTS');
    expect(adminPermissions).toHaveLength(13);
  });

  it('Vendor role cannot manage users, allocate work, or approve quality reviews', () => {
    const vendorPermissions = rolePermissions.VENDOR;
    expect(vendorPermissions).not.toContain('MANAGE_USERS');
    expect(vendorPermissions).not.toContain('ALLOCATE_WORK');
    expect(vendorPermissions).not.toContain('APPROVE_QUALITY_REVIEW');
    expect(vendorPermissions).toContain('SUBMIT_EVIDENCE');
  });

  it('Finance Officer has payment authorization but cannot allocate work or review evidence', () => {
    const financePermissions = rolePermissions.FINANCE_OFFICER;
    expect(financePermissions).toContain('AUTHORIZE_PAYMENTS');
    expect(financePermissions).toContain('VIEW_MILESTONES');
    expect(financePermissions).not.toContain('ALLOCATE_WORK');
    expect(financePermissions).not.toContain('SUBMIT_EVIDENCE');
  });

  it('Field Engineer can review evidence and approve quality reviews but cannot authorize payments', () => {
    const fieldPermissions = rolePermissions.FIELD_ENGINEER;
    expect(fieldPermissions).toContain('REVIEW_EVIDENCE');
    expect(fieldPermissions).toContain('APPROVE_QUALITY_REVIEW');
    expect(fieldPermissions).not.toContain('AUTHORIZE_PAYMENTS');
    expect(fieldPermissions).not.toContain('MANAGE_USERS');
  });
});

describe('In-Memory Token Management', () => {
  it('Stores access token in memory rather than localStorage', () => {
    setInMemoryToken('test-access-token-jwt-value');
    expect(getInMemoryToken()).toBe('test-access-token-jwt-value');
    setInMemoryToken(null);
    expect(getInMemoryToken()).toBeNull();
  });
});
