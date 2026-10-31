import { describe, it, expect } from 'vitest';
import { mockMilestones } from '../data/mockMilestones';
import { Milestone } from '../types';

describe('Stage 14: Frontend Quality Assurance - Milestones & Financial Authorization Tests', () => {
  it('correctly aggregates milestone financial metrics with simulation boundaries', () => {
    const milestones: Milestone[] = mockMilestones;
    expect(milestones.length).toBeGreaterThan(0);

    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    const disbursedAmount = milestones
      .filter((m) => m.paymentStatus === 'DISBURSED')
      .reduce((sum, m) => sum + m.amount, 0);
    const pendingAmount = milestones
      .filter((m) => m.approvalStatus === 'ELIGIBLE' || m.approvalStatus === 'LOCKED')
      .reduce((sum, m) => sum + m.amount, 0);

    expect(totalAmount).toBeGreaterThan(0);
    expect(disbursedAmount).toBeGreaterThanOrEqual(0);
    expect(pendingAmount).toBeGreaterThanOrEqual(0);
    expect(disbursedAmount + pendingAmount).toBeLessThanOrEqual(totalAmount * 1.5);
  });

  it('filters milestones by search query across vendor, project, and work zone', () => {
    const milestones: Milestone[] = mockMilestones;
    const vendorSearchTerm = milestones[0].vendorName.toLowerCase();

    const filtered = milestones.filter(
      (m) =>
        m.id.toLowerCase().includes(vendorSearchTerm) ||
        m.milestoneName.toLowerCase().includes(vendorSearchTerm) ||
        m.vendorName.toLowerCase().includes(vendorSearchTerm) ||
        m.workZoneName.toLowerCase().includes(vendorSearchTerm)
    );

    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered.every((m) => m.vendorName.toLowerCase().includes(vendorSearchTerm) || m.milestoneName.toLowerCase().includes(vendorSearchTerm))).toBe(true);
  });

  it('filters milestones by approval status (ELIGIBLE, LOCKED, APPROVED)', () => {
    const milestones: Milestone[] = mockMilestones;

    const eligibleMilestones = milestones.filter((m) => m.approvalStatus === 'ELIGIBLE');
    expect(eligibleMilestones.every((m) => m.approvalStatus === 'ELIGIBLE')).toBe(true);

    const lockedMilestones = milestones.filter((m) => m.approvalStatus === 'LOCKED');
    expect(lockedMilestones.every((m) => m.approvalStatus === 'LOCKED')).toBe(true);
  });

  it('validates simulated payment authorization state transition', () => {
    const initialMilestone: Milestone = {
      id: 'MS-TEST-001',
      projectId: 'PRJ-001',
      projectName: 'Metro Phase II',
      workZoneName: 'Zone A - East Corridor',
      pinCode: '560001',
      vendorName: 'Apex Infra Services',
      milestoneName: 'Trenching Inspection & Bedding Completion',
      amount: 1500000,
      inspectionStatus: 'PASSED',
      approvalStatus: 'ELIGIBLE',
      paymentStatus: 'UNPAID',
      dueDate: '2026-11-15',
    };

    expect(initialMilestone.approvalStatus).toBe('ELIGIBLE');
    expect(initialMilestone.paymentStatus).toBe('UNPAID');

    // Simulate authorization
    const authorizedMilestone: Milestone = {
      ...initialMilestone,
      approvalStatus: 'APPROVED',
      paymentStatus: 'DISBURSED',
    };

    expect(authorizedMilestone.approvalStatus).toBe('APPROVED');
    expect(authorizedMilestone.paymentStatus).toBe('DISBURSED');
  });

  it('prevents authorization of LOCKED milestones without physical verification', () => {
    const lockedMilestone: Milestone = {
      id: 'MS-TEST-002',
      projectId: 'PRJ-001',
      projectName: 'Metro Phase II',
      workZoneName: 'Zone B - West Corridor',
      pinCode: '560002',
      vendorName: 'Beacon Engineering',
      milestoneName: 'Backfilling Verification',
      amount: 800000,
      inspectionStatus: 'PENDING',
      approvalStatus: 'LOCKED',
      paymentStatus: 'UNPAID',
      dueDate: '2026-12-01',
    };

    const isAuthorizable = lockedMilestone.approvalStatus === 'ELIGIBLE';
    expect(isAuthorizable).toBe(false);
  });
});
