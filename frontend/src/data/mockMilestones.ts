import { Milestone } from '../types';

export const mockMilestones: Milestone[] = [
  {
    id: 'MLS-501',
    milestoneName: 'Phase 1 - Trenching & Bedding Verification',
    projectId: 'PRJ-2026-001',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workZoneName: 'MG Road - Brigade Junction Corridor',
    pinCode: '560001',
    vendorName: 'Apex Infra Utilities Ltd',
    amount: 1850000,
    inspectionStatus: 'PENDING',
    approvalStatus: 'LOCKED',
    paymentStatus: 'BLOCKED',
    dueDate: '2026-11-10',
  },
  {
    id: 'MLS-502',
    milestoneName: 'Final Road Surface Reinstatement & GIS Mapping',
    projectId: 'PRJ-2026-003',
    projectName: 'Metro Line Feeder Duct & Power Conduit Laying',
    workZoneName: 'Yelahanka Satellite Town Outer Ring',
    pinCode: '560064',
    vendorName: 'Apex Infra Utilities Ltd',
    amount: 4200000,
    inspectionStatus: 'PASSED',
    approvalStatus: 'APPROVED',
    paymentStatus: 'DISBURSED',
    dueDate: '2026-10-28',
  },
  {
    id: 'MLS-503',
    milestoneName: 'Primary Conduit Laying & Pull-Box Installation',
    projectId: 'PRJ-2026-002',
    projectName: 'South Zone Arterial Road Resurfacing & Drainage',
    workZoneName: 'Koramangala 80 Feet Road Ward 151',
    pinCode: '560034',
    vendorName: 'TransGrid Power Infrastructure',
    amount: 2950000,
    inspectionStatus: 'PASSED',
    approvalStatus: 'ELIGIBLE',
    paymentStatus: 'PROCESSING',
    dueDate: '2026-11-05',
  },
  {
    id: 'MLS-504',
    milestoneName: 'Sub-base Compaction & Aggregate Leveling',
    projectId: 'PRJ-2026-002',
    projectName: 'South Zone Arterial Road Resurfacing & Drainage',
    workZoneName: 'Sarjapur Main Link Road',
    pinCode: '560034',
    vendorName: 'Vanguard Civil Engineering',
    amount: 1400000,
    inspectionStatus: 'FAILED',
    approvalStatus: 'REJECTED',
    paymentStatus: 'BLOCKED',
    dueDate: '2026-10-30',
  },
];

const LOCAL_STORAGE_MILESTONES_KEY = 'infrapulse_stored_milestones';
let memoryStoredMilestones: Milestone[] = [];

/**
 * Retrieve user/runtime modified milestones from localStorage.
 */
export function getStoredMilestones(): Milestone[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_MILESTONES_KEY);
      if (!raw) return memoryStoredMilestones;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : memoryStoredMilestones;
    } catch (err) {
      console.error('Failed to read milestones from localStorage', err);
      return memoryStoredMilestones;
    }
  }
  return memoryStoredMilestones;
}

/**
 * Persist milestone collection to localStorage and broadcast change.
 */
export function saveStoredMilestones(milestones: Milestone[]): void {
  memoryStoredMilestones = milestones;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_MILESTONES_KEY, JSON.stringify(milestones));
      window.dispatchEvent(new CustomEvent('infrapulse_milestones_updated', { detail: milestones }));
    } catch (err) {
      console.error('Failed to save milestones to localStorage', err);
    }
  }
}

/**
 * Get all merged milestones (stored or initial baseline).
 */
export function getAllMergedMilestones(): Milestone[] {
  const stored = getStoredMilestones();
  if (stored && stored.length > 0) {
    return stored;
  }
  return [...mockMilestones];
}

/**
 * Authoritatively update a milestone's inspection release gate from Quality Assurance.
 */
export function updateMilestoneInspectionGate(
  workZoneOrId: string,
  newStatus: 'PASSED' | 'FAILED' | 'PENDING'
): Milestone | null {
  const all = getAllMergedMilestones();
  let matchedIndex = all.findIndex(
    m => m.id === workZoneOrId || m.workZoneName.toLowerCase() === workZoneOrId.toLowerCase()
  );

  // If not exact match, try matching by prefix
  if (matchedIndex === -1) {
    matchedIndex = all.findIndex(
      m => m.workZoneName.toLowerCase().includes(workZoneOrId.toLowerCase()) ||
           workZoneOrId.toLowerCase().includes(m.workZoneName.toLowerCase())
    );
  }

  if (matchedIndex === -1) return null;

  const target = all[matchedIndex];
  let updatedMilestone: Milestone;

  if (newStatus === 'PASSED') {
    updatedMilestone = {
      ...target,
      inspectionStatus: 'PASSED',
      approvalStatus: 'ELIGIBLE',
      paymentStatus: target.paymentStatus === 'BLOCKED' ? 'PROCESSING' : target.paymentStatus,
    };
  } else if (newStatus === 'FAILED') {
    updatedMilestone = {
      ...target,
      inspectionStatus: 'FAILED',
      approvalStatus: 'REJECTED',
      paymentStatus: 'BLOCKED',
    };
  } else {
    updatedMilestone = {
      ...target,
      inspectionStatus: 'PENDING',
      approvalStatus: 'LOCKED',
      paymentStatus: 'BLOCKED',
    };
  }

  all[matchedIndex] = updatedMilestone;
  saveStoredMilestones(all);
  return updatedMilestone;
}

