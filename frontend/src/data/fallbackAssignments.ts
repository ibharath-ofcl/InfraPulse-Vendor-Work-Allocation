import { WorkAssignmentItem } from '../types/workAssignment';

export const FALLBACK_ASSIGNMENTS: WorkAssignmentItem[] = [
  {
    id: 'asn-001',
    assignmentCode: 'INF-WA-2026-001001',
    projectId: 'PRJ-CHE-101',
    projectCode: 'PRJ-CHE-101',
    projectName: 'Chennai Fiber Network Expansion',
    workZoneId: 'WZ-600040-001',
    zoneCode: 'WZ-600040-001',
    zoneName: 'Anna Nagar Sector A',
    pincode: '600040',
    locality: 'Anna Nagar',
    vendorId: 'vnd-1001',
    vendorCode: 'VND-1001',
    vendorName: 'ABC Infrastructure Services',
    workType: 'TRENCHING',
    workTypeDisplayName: 'Trenching',
    title: 'Micro-Trenching — Anna Nagar 2nd Avenue Commercial Corridor',
    description: '1.2m micro-trench excavation along northern pedestrian boundary for optical fiber ducting.',
    plannedStartDate: '2026-11-10',
    targetEndDate: '2026-11-28',
    actualStartDate: '2026-11-10',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    instructions: 'Night excavation only between 22:00 and 05:00. Safety warning tape must be laid at 0.5m depth.',
    createdBy: {
      id: 'admin-001',
      fullName: 'Platform Administrator',
      email: 'admin@infrapulse.gov.in',
      role: 'PLATFORM_ADMIN',
    },
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-16T10:00:00Z',
  },
  {
    id: 'asn-002',
    assignmentCode: 'INF-WA-2026-001002',
    projectId: 'PRJ-CHE-101',
    projectCode: 'PRJ-CHE-101',
    projectName: 'Chennai Fiber Network Expansion',
    workZoneId: 'WZ-600001-001',
    zoneCode: 'WZ-600001-001',
    zoneName: 'George Town Heritage Corridor',
    pincode: '600001',
    locality: 'George Town',
    vendorId: 'vnd-1001',
    vendorCode: 'VND-1001',
    vendorName: 'ABC Infrastructure Services',
    workType: 'ROAD_RESURFACING',
    workTypeDisplayName: 'Road Resurfacing',
    title: 'Bituminous Surface Restoration — George Town Arterial Flank',
    description: 'Post-trenching hot-mix bituminous road resurfacing and curb alignment restoration.',
    plannedStartDate: '2026-11-18',
    targetEndDate: '2026-12-05',
    priority: 'CRITICAL',
    status: 'ASSIGNED',
    instructions: 'Requires municipal density compaction certificate sign-off before laying surface course.',
    createdBy: {
      id: 'admin-001',
      fullName: 'Platform Administrator',
      email: 'admin@infrapulse.gov.in',
      role: 'PLATFORM_ADMIN',
    },
    createdAt: '2026-11-02T10:30:00Z',
    updatedAt: '2026-11-16T10:00:00Z',
  },
  {
    id: 'asn-003',
    assignmentCode: 'INF-WA-2026-002001',
    projectId: 'PRJ-BLR-202',
    projectCode: 'PRJ-BLR-202',
    projectName: 'Bengaluru Smart Utility Corridor',
    workZoneId: 'WZ-560001-001',
    zoneCode: 'WZ-560001-001',
    zoneName: 'MG Road Metro Corridor',
    pincode: '560001',
    locality: 'MG Road',
    vendorId: 'vnd-1003',
    vendorCode: 'VND-1003',
    vendorName: 'Apex Infra Utilities Ltd',
    workType: 'TRENCHING',
    workTypeDisplayName: 'Trenching',
    title: 'Civil Utility Trench Excavation — MG Road West Flank',
    description: 'Underground conduit ducting trenching for smart power lines along metro pillars.',
    plannedStartDate: '2026-11-12',
    targetEndDate: '2026-11-30',
    actualStartDate: '2026-11-13',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    instructions: 'Coordinate with BMRCL metro ground engineer for vibration monitoring thresholds.',
    createdBy: {
      id: 'admin-001',
      fullName: 'Platform Administrator',
      email: 'admin@infrapulse.gov.in',
      role: 'PLATFORM_ADMIN',
    },
    createdAt: '2026-11-03T11:00:00Z',
    updatedAt: '2026-11-16T10:00:00Z',
  },
  {
    id: 'asn-004',
    assignmentCode: 'INF-WA-2026-002002',
    projectId: 'PRJ-BLR-202',
    projectCode: 'PRJ-BLR-202',
    projectName: 'Bengaluru Smart Utility Corridor',
    workZoneId: 'WZ-560001-002',
    zoneCode: 'WZ-560001-002',
    zoneName: 'Brigade Junction Sector 2',
    pincode: '560001',
    locality: 'Brigade Road',
    vendorId: 'vnd-1002',
    vendorCode: 'VND-1002',
    vendorName: 'Metro Utility Contractors',
    workType: 'UNDERGROUND_CABLE_INSTALLATION',
    workTypeDisplayName: 'Underground Cable Installation',
    title: '11kV Feeder Cable Pulling — Brigade Junction Commercial Ring',
    description: 'Armored triple-core 11kV copper feeder cable pulling through existing HDPE pipe conduits.',
    plannedStartDate: '2026-11-15',
    targetEndDate: '2026-12-08',
    priority: 'HIGH',
    status: 'ACCEPTED',
    instructions: 'Tension winch pull rating must not exceed 2.5 kN. Ground wire calibration mandatory.',
    createdBy: {
      id: 'admin-001',
      fullName: 'Platform Administrator',
      email: 'admin@infrapulse.gov.in',
      role: 'PLATFORM_ADMIN',
    },
    createdAt: '2026-11-04T14:15:00Z',
    updatedAt: '2026-11-16T10:00:00Z',
  },
  {
    id: 'asn-005',
    assignmentCode: 'INF-WA-2026-003001',
    projectId: 'PRJ-BLR-101',
    projectCode: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workZoneId: 'WZ-560038-001',
    zoneCode: 'WZ-560038-001',
    zoneName: 'Indiranagar 100 Feet Road Corridor',
    pincode: '560038',
    locality: 'Indiranagar',
    vendorId: 'vnd-1005',
    vendorCode: 'VND-1005',
    vendorName: 'TransGrid Power Infrastructure',
    workType: 'UNDERGROUND_CABLE_INSTALLATION',
    workTypeDisplayName: 'Underground Cable Installation',
    title: '96-Core Armored Optical Fiber Blowing — 100 Feet Road Trunk',
    description: 'Compressed air fiber blowing through 40/33mm PLB ducts for municipal traffic AI backbone.',
    plannedStartDate: '2026-10-25',
    targetEndDate: '2026-11-20',
    actualStartDate: '2026-10-26',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    instructions: 'OTDR bidirectional test results must be uploaded to evidence center upon completion.',
    createdBy: {
      id: 'admin-001',
      fullName: 'Platform Administrator',
      email: 'admin@infrapulse.gov.in',
      role: 'PLATFORM_ADMIN',
    },
    createdAt: '2026-10-20T08:30:00Z',
    updatedAt: '2026-11-16T10:00:00Z',
  },
  {
    id: 'asn-006',
    assignmentCode: 'INF-WA-2026-003002',
    projectId: 'PRJ-BLR-101',
    projectCode: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workZoneId: 'WZ-560038-002',
    zoneCode: 'WZ-560038-002',
    zoneName: 'HAL 2nd Stage Service Duct',
    pincode: '560038',
    locality: 'HAL 2nd Stage',
    vendorId: 'vnd-1003',
    vendorCode: 'VND-1003',
    vendorName: 'Apex Infra Utilities Ltd',
    workType: 'BACKFILLING',
    workTypeDisplayName: 'Backfilling',
    title: 'Granular Soil Compaction & Warning Tape Laying — HAL Sector',
    description: 'Engineered granular sand bedding, warning tape placement at 60cm, and mechanical plate compaction.',
    plannedStartDate: '2026-11-05',
    targetEndDate: '2026-11-22',
    priority: 'MEDIUM',
    status: 'SUBMITTED_FOR_REVIEW',
    instructions: 'Proctor density compaction test certificates required before site handover.',
    createdBy: {
      id: 'admin-001',
      fullName: 'Platform Administrator',
      email: 'admin@infrapulse.gov.in',
      role: 'PLATFORM_ADMIN',
    },
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-11-16T10:00:00Z',
  },
  {
    id: 'asn-007',
    assignmentCode: 'INF-WA-2026-004001',
    projectId: 'PRJ-HYD-303',
    projectCode: 'PRJ-HYD-303',
    projectName: 'Hyderabad Metro Water & Ducting Corridor Phase 2',
    workZoneId: 'WZ-500081-001',
    zoneCode: 'WZ-500081-001',
    zoneName: 'HITEC City Phase 2 IT Corridor',
    pincode: '500081',
    locality: 'Madhapur',
    vendorId: 'vnd-1004',
    vendorCode: 'VND-1004',
    vendorName: 'Vanguard Civil Engineering',
    workType: 'FINAL_INSPECTION',
    workTypeDisplayName: 'Final Inspection',
    title: 'As-Built GIS Validation & Chamber Structural Sign-Off',
    description: 'Comprehensive digital inspection of manholes, depth compliance, and corridor telemetry sensors.',
    plannedStartDate: '2026-10-15',
    targetEndDate: '2026-11-05',
    actualStartDate: '2026-10-16',
    actualEndDate: '2026-11-04',
    priority: 'HIGH',
    status: 'COMPLETED',
    instructions: 'Full photogrammetric 3D scan and depth log submitted to municipal audit archive.',
    createdBy: {
      id: 'admin-001',
      fullName: 'Platform Administrator',
      email: 'admin@infrapulse.gov.in',
      role: 'PLATFORM_ADMIN',
    },
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-11-04T16:00:00Z',
  },
  {
    id: 'asn-008',
    assignmentCode: 'INF-WA-2026-004002',
    projectId: 'PRJ-HYD-303',
    projectCode: 'PRJ-HYD-303',
    projectName: 'Hyderabad Metro Water & Ducting Corridor Phase 2',
    workZoneId: 'WZ-500081-002',
    zoneCode: 'WZ-500081-002',
    zoneName: 'Cyber Gateway Feeder Route',
    pincode: '500081',
    locality: 'HITEC City',
    vendorId: 'vnd-1001',
    vendorCode: 'VND-1001',
    vendorName: 'ABC Infrastructure Services',
    workType: 'TRENCHING',
    workTypeDisplayName: 'Trenching',
    title: 'Secondary Conduit Trenching — Cyber Gateway Ring',
    description: 'Horizontal directional drilling (HDD) under Cyber Gateway intersection without surface traffic disruption.',
    plannedStartDate: '2026-11-14',
    targetEndDate: '2026-12-02',
    priority: 'CRITICAL',
    status: 'ASSIGNED',
    instructions: 'HDD tracking log must be recorded every 3 meters along the crossing arc.',
    createdBy: {
      id: 'admin-001',
      fullName: 'Platform Administrator',
      email: 'admin@infrapulse.gov.in',
      role: 'PLATFORM_ADMIN',
    },
    createdAt: '2026-11-05T15:30:00Z',
    updatedAt: '2026-11-16T10:00:00Z',
  },
];

const LOCAL_STORAGE_KEY = 'infrapulse_stored_assignments';

/**
 * Retrieve user-created assignments stored in localStorage.
 */
export function getStoredAssignments(): WorkAssignmentItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read stored assignments from localStorage', err);
    return [];
  }
}

/**
 * Save a newly created assignment to localStorage and dispatch event.
 */
export function saveStoredAssignment(assignment: WorkAssignmentItem): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const current = getStoredAssignments();
    // Prepend new assignment
    const updated = [assignment, ...current.filter(a => a.id !== assignment.id)];
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('infrapulse_assignments_updated', { detail: assignment }));
  } catch (err) {
    console.error('Failed to save assignment to localStorage', err);
  }
}

/**
 * Get all available assignments merging locally stored user assignments with fallback dataset.
 */
export function getAllMergedAssignments(): WorkAssignmentItem[] {
  const stored = getStoredAssignments();
  const storedIds = new Set(stored.map(s => s.id));
  const fallbackFiltered = FALLBACK_ASSIGNMENTS.filter(f => !storedIds.has(f.id));
  return [...stored, ...fallbackFiltered];
}
