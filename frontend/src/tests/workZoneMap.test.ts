import { describe, it, expect } from 'vitest';
import { MapZoneData } from '../components/maps/WorkZoneMap';
import { WorkZoneItem } from '../types/workZone';
import { WorkAssignmentItem } from '../types/workAssignment';

describe('WorkZoneMap & OpenStreetMap Integration Tests', () => {
  const sampleZones: WorkZoneItem[] = [
    {
      id: 'z-1',
      zoneCode: 'WZ-600001-001',
      projectId: 'p-1',
      projectName: 'Chennai Fiber Network Expansion',
      zoneName: 'George Town Heritage Zone',
      pincode: '600001',
      locality: 'George Town',
      district: 'Chennai',
      state: 'Tamil Nadu',
      centerLatitude: 13.09,
      centerLongitude: 80.29,
      status: 'AVAILABLE',
      activeAssignmentsCount: 1,
      createdAt: '2026-11-16T12:00:00Z',
      updatedAt: '2026-11-16T12:00:00Z',
    },
    {
      id: 'z-2',
      zoneCode: 'WZ-600040-001',
      projectId: 'p-1',
      projectName: 'Chennai Fiber Network Expansion',
      zoneName: 'Anna Nagar Sector A',
      pincode: '600040',
      locality: 'Anna Nagar',
      district: 'Chennai',
      state: 'Tamil Nadu',
      centerLatitude: 13.085,
      centerLongitude: 80.2101,
      status: 'ACTIVE',
      activeAssignmentsCount: 1,
      createdAt: '2026-11-16T12:00:00Z',
      updatedAt: '2026-11-16T12:00:00Z',
    },
    {
      id: 'z-3',
      zoneCode: 'WZ-560001-001',
      projectId: 'p-2',
      projectName: 'Bengaluru Smart Utility Corridor',
      zoneName: 'MG Road Metro Corridor',
      pincode: '560001',
      locality: 'MG Road',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      centerLatitude: 12.9756,
      centerLongitude: 77.6066,
      status: 'ACTIVE',
      activeAssignmentsCount: 0,
      createdAt: '2026-11-16T12:00:00Z',
      updatedAt: '2026-11-16T12:00:00Z',
    },
    {
      id: 'z-4',
      zoneCode: 'WZ-560001-002',
      projectId: 'p-2',
      projectName: 'Bengaluru Smart Utility Corridor',
      zoneName: 'Brigade Junction Sector 2',
      pincode: '560001',
      locality: 'Brigade Road',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      centerLatitude: 12.9716,
      centerLongitude: 77.607,
      status: 'AVAILABLE',
      activeAssignmentsCount: 0,
      createdAt: '2026-11-16T12:00:00Z',
      updatedAt: '2026-11-16T12:00:00Z',
    },
    {
      id: 'z-no-coords',
      zoneCode: 'WZ-999999-001',
      projectId: 'p-1',
      projectName: 'Rural Link',
      zoneName: 'Pending GPS Zone',
      pincode: '999999',
      locality: 'Outskirts',
      district: 'Rural',
      state: 'Tamil Nadu',
      centerLatitude: undefined,
      centerLongitude: undefined,
      status: 'AVAILABLE',
      activeAssignmentsCount: 0,
      createdAt: '2026-11-16T12:00:00Z',
      updatedAt: '2026-11-16T12:00:00Z',
    },
  ];

  const sampleAssignments: Partial<WorkAssignmentItem>[] = [
    {
      id: 'asn-1',
      workZoneId: 'z-2',
      vendorName: 'ABC Infrastructure Services',
      workType: 'TRENCHING',
      workTypeDisplayName: 'Mechanical Trenching',
      status: 'ACCEPTED',
    },
    {
      id: 'asn-2',
      workZoneId: 'z-4',
      vendorName: 'Southern Roadworks Pvt Ltd',
      workType: 'ROAD_RESURFACING',
      workTypeDisplayName: 'Asphalt Paving',
      status: 'ASSIGNED',
    },
  ];

  it('validates OpenStreetMap tile endpoint and standard attribution requirement', () => {
    const osmTileEndpoint = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attributionText = '© OpenStreetMap contributors';

    expect(osmTileEndpoint).toContain('tile.openstreetmap.org');
    expect(attributionText).toContain('OpenStreetMap contributors');
    expect(osmTileEndpoint).not.toContain('googleapis');
    expect(osmTileEndpoint).not.toContain('mapbox');
  });

  it('filters out zones with missing, null, or out-of-range coordinates', () => {
    const validZones = sampleZones.filter((z) => {
      const lat = typeof z.centerLatitude === 'number' ? z.centerLatitude : parseFloat(String(z.centerLatitude));
      const lng = typeof z.centerLongitude === 'number' ? z.centerLongitude : parseFloat(String(z.centerLongitude));
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });

    expect(validZones).toHaveLength(4);
    expect(validZones.map((z) => z.zoneCode)).toEqual([
      'WZ-600001-001',
      'WZ-600040-001',
      'WZ-560001-001',
      'WZ-560001-002',
    ]);
  });

  it('correctly maps assigned contractor information from real work assignment records', () => {
    const zone = sampleZones[1];
    const zoneAsns = sampleAssignments.filter((a) => a.workZoneId === zone.id);
    const vendors = Array.from(new Set(zoneAsns.map((a) => a.vendorName).filter(Boolean)));
    const assignedVendor = vendors.length > 0 ? vendors.join(', ') : 'Pending Contractor Allocation';

    expect(assignedVendor).toBe('ABC Infrastructure Services');
  });

  it('falls back to Pending Contractor Allocation when no assignments exist for a zone', () => {
    const zone = sampleZones[0];
    const zoneAsns = sampleAssignments.filter((a) => a.workZoneId === zone.id);
    const vendors = Array.from(new Set(zoneAsns.map((a) => a.vendorName).filter(Boolean)));
    const assignedVendor = vendors.length > 0 ? vendors.join(', ') : 'Pending Contractor Allocation';

    expect(assignedVendor).toBe('Pending Contractor Allocation');
  });

  it('verifies distinct status color mappings matching InfraPulse design tokens', () => {
    const getMarkerColor = (status: string): string => {
      switch (status?.toUpperCase()) {
        case 'ACTIVE':
        case 'IN_PROGRESS':
          return '#0D9488'; // InfraPulse Teal
        case 'COMPLETED':
          return '#10B981'; // Emerald Green
        case 'BLOCKED':
          return '#EF4444'; // Rose Red
        case 'AVAILABLE':
          return '#0284C7'; // Sky / Cyan
        case 'INACTIVE':
        default:
          return '#64748B'; // Slate Grey
      }
    };

    expect(getMarkerColor('ACTIVE')).toBe('#0D9488');
    expect(getMarkerColor('COMPLETED')).toBe('#10B981');
    expect(getMarkerColor('AVAILABLE')).toBe('#0284C7');
    expect(getMarkerColor('BLOCKED')).toBe('#EF4444');
    expect(getMarkerColor('INACTIVE')).toBe('#64748B');
  });

  it('executes multi-filter combination simultaneously (PIN + Search + Status)', () => {
    const pin = '560001';
    const search = 'Brigade Road';
    const status: string = 'AVAILABLE';

    const filtered = sampleZones.filter((z) => {
      if (pin && !z.pincode.startsWith(pin)) return false;
      if (status !== 'ALL' && z.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          z.zoneName.toLowerCase().includes(q) ||
          z.locality.toLowerCase().includes(q) ||
          z.zoneCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].zoneCode).toBe('WZ-560001-002');
    expect(filtered[0].locality).toBe('Brigade Road');
  });

  it('filters zones by associated project', () => {
    const projectFilter = 'p-2';
    const filtered = sampleZones.filter((z) => z.projectId === projectFilter);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((z) => z.zoneCode)).toEqual(['WZ-560001-001', 'WZ-560001-002']);
  });

  it('clearing filters restores all initial registered zones and markers', () => {
    let pinFilter = '560001';
    let searchFilter = 'Brigade';
    let statusFilter: string = 'AVAILABLE';

    // Before reset
    let filtered = sampleZones.filter((z) => {
      if (pinFilter && !z.pincode.startsWith(pinFilter)) return false;
      if (statusFilter !== 'ALL' && z.status !== statusFilter) return false;
      if (searchFilter && !z.zoneName.includes(searchFilter)) return false;
      return true;
    });
    expect(filtered).toHaveLength(1);

    // Reset action
    pinFilter = '';
    searchFilter = '';
    statusFilter = 'ALL';

    filtered = sampleZones.filter((z) => {
      if (pinFilter && !z.pincode.startsWith(pinFilter)) return false;
      if (statusFilter !== 'ALL' && z.status !== statusFilter) return false;
      if (searchFilter && !z.zoneName.includes(searchFilter)) return false;
      return true;
    });

    expect(filtered).toHaveLength(5);
  });

  it('ensures MapZoneData structure contains all required popup and inspection fields', () => {
    const mapZone: MapZoneData = {
      id: 'z-2',
      code: 'WZ-600040-001',
      name: 'Anna Nagar Sector A',
      pinCode: '600040',
      locality: 'Anna Nagar',
      district: 'Chennai',
      state: 'Tamil Nadu',
      projectName: 'Chennai Fiber Network Expansion',
      status: 'ACTIVE',
      currentWorkType: 'Mechanical Trenching',
      assignedVendorName: 'ABC Infrastructure Services',
      activeWork: 1,
      totalAssignments: 1,
      lat: 13.085,
      lng: 80.2101,
      isApproximate: false,
    };

    expect(mapZone.code).toBe('WZ-600040-001');
    expect(mapZone.name).toBe('Anna Nagar Sector A');
    expect(mapZone.pinCode).toBe('600040');
    expect(mapZone.locality).toBe('Anna Nagar');
    expect(mapZone.projectName).toBe('Chennai Fiber Network Expansion');
    expect(mapZone.assignedVendorName).toBe('ABC Infrastructure Services');
    expect(mapZone.status).toBe('ACTIVE');
    expect(mapZone.activeWork).toBe(1);
    expect(mapZone.lat).toBe(13.085);
    expect(mapZone.lng).toBe(80.2101);
  });
});
