import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  RotateCw, 
  AlertCircle, 
  Compass,
  Layers,
  Building2,
  HardHat,
  Info,
  FilterX
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { WorkZoneMap, MapZoneData } from '../components/maps/WorkZoneMap';
import { workZoneService } from '../services/workZoneService';
import { projectService } from '../services/projectService';
import { workAssignmentService } from '../services/workAssignmentService';
import { WorkZoneItem, ZoneStatus, CreateWorkZonePayload } from '../types/workZone';
import { ProjectResponse } from '../types/project';
import { WorkAssignmentItem } from '../types/workAssignment';
import { useAuth } from '../auth/useAuth';

export const WorkZonesPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  // Master Data State
  const [allZones, setAllZones] = useState<WorkZoneItem[]>([]);
  const [allAssignments, setAllAssignments] = useState<WorkAssignmentItem[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [pinFilter, setPinFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ZoneStatus | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<WorkZoneItem | null>(null);

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateWorkZonePayload>({
    projectId: '',
    zoneName: '',
    description: '',
    pincode: '',
    locality: '',
    district: '',
    state: 'Karnataka',
    centerLatitude: undefined,
    centerLongitude: undefined,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canManageZones =
    hasPermission('WORK_ZONE_CREATE') ||
    user?.role === 'PLATFORM_ADMIN' ||
    user?.role === 'PROJECT_MANAGER';

  // Load master dataset from backend (Decoupled from search/selection to prevent tile unmounts)
  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [zonesRes, assignmentsRes, projectsRes] = await Promise.all([
        workZoneService.getWorkZones({ size: 100 }),
        workAssignmentService.getAssignments({ size: 100 }).catch(() => ({ content: [] })),
        projectService.getProjects({ size: 100 }).catch(() => ({ content: [] })),
      ]);

      setAllZones(zonesRes.content || []);
      setAllAssignments(assignmentsRes.content || []);
      setAllProjects(projectsRes.content || []);

      // Retain or initialize selected zone
      if (zonesRes.content && zonesRes.content.length > 0) {
        setSelectedZone((prev) => {
          if (!prev) return zonesRes.content[0];
          const match = zonesRes.content.find((z) => z.id === prev.id);
          return match || zonesRes.content[0];
        });
      } else {
        setSelectedZone(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load geographical work zones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // Combined Multi-Filter Engine (Instant, robust, no network churn)
  const filteredZones = useMemo(() => {
    return allZones.filter((zone) => {
      // 1. PIN code filter (supports exact or prefix matching, digits only)
      if (pinFilter.trim()) {
        const cleanPin = pinFilter.trim();
        if (!zone.pincode.startsWith(cleanPin)) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'ALL') {
        if (zone.status !== statusFilter) {
          return false;
        }
      }

      // 3. Project filter
      if (projectFilter !== 'ALL') {
        if (zone.projectId !== projectFilter) {
          return false;
        }
      }

      // 4. Multi-field search query
      if (search.trim()) {
        const query = search.trim().toLowerCase();

        // Retrieve vendor names associated with this zone
        const zoneAsns = allAssignments.filter((a) => a.workZoneId === zone.id);
        const vendorNames = zoneAsns
          .map((a) => (a as any).vendorCompanyName || (a as any).vendorName || '')
          .join(' ')
          .toLowerCase();

        const matchName = zone.zoneName.toLowerCase().includes(query);
        const matchCode = zone.zoneCode.toLowerCase().includes(query);
        const matchPin = zone.pincode.includes(query);
        const matchLocality = (zone.locality || '').toLowerCase().includes(query);
        const matchDistrict = (zone.district || '').toLowerCase().includes(query);
        const matchProject = (zone.projectName || '').toLowerCase().includes(query);
        const matchVendor = vendorNames.includes(query);

        if (
          !matchName &&
          !matchCode &&
          !matchPin &&
          !matchLocality &&
          !matchDistrict &&
          !matchProject &&
          !matchVendor
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allZones, allAssignments, search, pinFilter, statusFilter, projectFilter]);

  // Sync selected zone with filtered results
  useEffect(() => {
    if (filteredZones.length === 0) {
      // If all filtered out, do not forcefully clear selectedZone so user can still see details or reset
    } else if (selectedZone && !filteredZones.some((z) => z.id === selectedZone.id)) {
      setSelectedZone(filteredZones[0]);
    } else if (!selectedZone && filteredZones.length > 0) {
      setSelectedZone(filteredZones[0]);
    }
  }, [filteredZones, selectedZone]);

  // Convert filtered real work zones with coordinates to MapZoneData format
  const mapZones = useMemo<MapZoneData[]>(() => {
    return filteredZones
      .filter((z) => {
        const lat = Number(z.centerLatitude);
        const lng = Number(z.centerLongitude);
        return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      })
      .map((z) => {
        const lat = Number(z.centerLatitude);
        const lng = Number(z.centerLongitude);

        // Find assigned vendors from real assignments in this zone
        const zoneAssignments = allAssignments.filter((a) => a.workZoneId === z.id);
        const vendors = Array.from(
          new Set(
            zoneAssignments
              .map((a) => (a as any).vendorCompanyName || (a as any).vendorName)
              .filter(Boolean)
          )
        );
        const assignedVendorName =
          vendors.length > 0 ? vendors.join(', ') : 'Pending Contractor Allocation';

        const workTypes = Array.from(
          new Set(
            zoneAssignments
              .map((a) => a.workTypeDisplayName || a.workType)
              .filter(Boolean)
          )
        );
        const currentWorkType =
          workTypes.length > 0 ? workTypes.join(', ') : 'Infrastructure Ducting';

        return {
          id: z.id,
          code: z.zoneCode,
          name: z.zoneName,
          pinCode: z.pincode,
          locality: z.locality,
          district: z.district,
          state: z.state,
          region: z.district || 'Urban Sector',
          projectId: z.projectId,
          projectName: z.projectName,
          status: z.status,
          currentWorkType,
          assignedVendorName,
          activeWork:
            z.activeAssignmentsCount ||
            zoneAssignments.filter(
              (a) => a.status === 'IN_PROGRESS' || a.status === 'ACCEPTED'
            ).length,
          totalAssignments: zoneAssignments.length,
          completedWork: zoneAssignments.filter((a) => a.status === 'COMPLETED').length,
          lat,
          lng,
          isApproximate: false,
        };
      });
  }, [filteredZones, allAssignments]);

  // Handle marker selection with inventory card scroll-into-view
  const handleSelectZoneFromMap = (mZone: MapZoneData) => {
    const match = allZones.find((z) => z.id === mZone.id);
    if (match) {
      setSelectedZone(match);
      const cardEl = document.getElementById(`zone-card-${match.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Find assigned vendors for the selected zone
  const selectedZoneVendors = useMemo(() => {
    if (!selectedZone) return 'Pending Allocation';
    const zoneAsns = allAssignments.filter((a) => a.workZoneId === selectedZone.id);
    const names = Array.from(
      new Set(
        zoneAsns
          .map((a) => (a as any).vendorCompanyName || (a as any).vendorName)
          .filter(Boolean)
      )
    );
    return names.length > 0 ? names.join(', ') : 'Pending Contractor Allocation';
  }, [selectedZone, allAssignments]);

  // Reset all filters to default state
  const handleResetFilters = () => {
    setSearch('');
    setPinFilter('');
    setStatusFilter('ALL');
    setProjectFilter('ALL');
    if (allZones.length > 0) {
      setSelectedZone(allZones[0]);
    }
  };

  const isFiltered =
    Boolean(search.trim()) ||
    Boolean(pinFilter.trim()) ||
    statusFilter !== 'ALL' ||
    projectFilter !== 'ALL';

  // Zone Creation Modal helpers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    if (allProjects.length > 0 && !createForm.projectId) {
      setCreateForm((prev) => ({ ...prev, projectId: allProjects[0].id }));
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !createForm.projectId ||
      !createForm.zoneName ||
      !createForm.pincode ||
      !createForm.locality
    ) {
      setCreateError('Please fill in all mandatory fields.');
      return;
    }
    if (!/^\d{6}$/.test(createForm.pincode)) {
      setCreateError('PIN code must be exactly 6 digits.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const created = await workZoneService.createWorkZone({
        ...createForm,
        centerLatitude: createForm.centerLatitude
          ? Number(createForm.centerLatitude)
          : undefined,
        centerLongitude: createForm.centerLongitude
          ? Number(createForm.centerLongitude)
          : undefined,
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        projectId: '',
        zoneName: '',
        description: '',
        pincode: '',
        locality: '',
        district: '',
        state: 'Karnataka',
        centerLatitude: undefined,
        centerLongitude: undefined,
      });
      await fetchMasterData();
      setSelectedZone(created);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Failed to register work zone.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Geographical Work Zones"
        subtitle="PIN-code mapped spatial sectors coordinating infrastructure work packages, real GIS boundaries, and contractor allocation."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">
            {isFiltered
              ? `Showing ${filteredZones.length} of ${allZones.length} Registered Zones`
              : `${allZones.length} Registered Zones`}
          </span>
        }
        actions={
          canManageZones ? (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Register Work Zone
            </button>
          ) : undefined
        }
      />

      {/* Filter and PIN Search Bar */}
      <div className="bg-white rounded-xl border border-surface-border p-4 shadow-card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Universal Search Input */}
          <div className="relative sm:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by zone, locality, district, project, or vendor..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* 6-Digit PIN Code Filter */}
          <div className="relative sm:col-span-2">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={6}
              value={pinFilter}
              onChange={(e) => setPinFilter(e.target.value.replace(/\D/g, ''))}
              placeholder="PIN (e.g. 560001)"
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          {/* Project Filter */}
          <div className="sm:col-span-3">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ALL">All Projects</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ZoneStatus | 'ALL')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Action Buttons: Reset Filters & Refresh */}
          <div className="sm:col-span-1 flex items-center justify-end gap-1.5">
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg shrink-0 transition-colors"
                title="Reset all search filters"
              >
                <FilterX className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={fetchMasterData}
              disabled={loading}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg shrink-0 transition-colors"
              title="Refresh registered work zones from database"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && allZones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-medium">Loading geographical work zones and map tiles...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-6 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Unable to fetch work zones</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Two Column Grid: Interactive Real Leaflet Map & Zone Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive OpenStreetMap & Selected Zone Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-border">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  Interactive GIS Work Zones Map
                </h3>
                <p className="text-xs text-slate-500">
                  {mapZones.length > 0
                    ? `Displaying ${mapZones.length} registered work zones on live OpenStreetMap tiles`
                    : 'Showing live geographical map'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {mapZones.length} Markers Placed
                </span>
              </div>
            </div>

            {/* Fully Functional Leaflet + OpenStreetMap Map Component */}
            <WorkZoneMap
              zones={mapZones}
              selectedZoneId={selectedZone?.id}
              onSelectZone={handleSelectZoneFromMap}
              onResetFilters={isFiltered ? handleResetFilters : undefined}
              height="440px"
            />
          </div>

          {/* Selected Zone Detail Card */}
          {selectedZone && (
            <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                    {selectedZone.zoneCode}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedZone.zoneName}</h3>
                    <p className="text-[11px] text-slate-500">
                      {selectedZone.locality}, {selectedZone.district}
                    </p>
                  </div>
                </div>
                <StatusBadge status={selectedZone.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block">Postal PIN</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {selectedZone.pincode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Jurisdiction</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {selectedZone.district}, {selectedZone.state}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Assigned Contractor</span>
                  <span className="font-semibold text-slate-800 truncate block text-teal-700">
                    {selectedZoneVendors}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Active Work Tasks</span>
                  <span className="font-bold text-teal-700 text-sm">
                    {selectedZone.activeAssignmentsCount}
                  </span>
                </div>
              </div>

              <div className="pt-3 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Associated Project:{' '}
                    <strong className="text-slate-900">{selectedZone.projectName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  <MapPin className="w-3 h-3 text-teal-600" />
                  {selectedZone.centerLatitude && selectedZone.centerLongitude ? (
                    <span>
                      {Number(selectedZone.centerLatitude).toFixed(4)}° N,{' '}
                      {Number(selectedZone.centerLongitude).toFixed(4)}° E (WGS 84)
                    </span>
                  ) : (
                    <span className="text-amber-600">No coordinates configured</span>
                  )}
                </div>
              </div>

              {selectedZone.description && (
                <div className="mt-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedZone.description}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Work Zone Inventory List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Zone Inventory ({filteredZones.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to locate on map</span>
            </div>

            {/* Empty State when filters yield no matches */}
            {filteredZones.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center">
                <MapPin className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No matching work zones found</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mb-3">
                  No zones match the current search or filter combination.
                </p>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <FilterX className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2.5 mt-3 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredZones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                const hasGps = Boolean(zone.centerLatitude && zone.centerLongitude);

                // Find vendor for this card
                const zoneAsns = allAssignments.filter((a) => a.workZoneId === zone.id);
                const vendorNames = Array.from(
                  new Set(
                    zoneAsns
                      .map((a) => (a as any).vendorCompanyName || (a as any).vendorName)
                      .filter(Boolean)
                  )
                );
                const vendorLabel =
                  vendorNames.length > 0 ? vendorNames.join(', ') : 'Pending Contractor';

                return (
                  <div
                    key={zone.id}
                    id={`zone-card-${zone.id}`}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/50 border-teal-500 shadow-sm ring-1 ring-teal-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {zone.zoneCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{zone.zoneName}</h4>
                      </div>
                      <StatusBadge status={zone.status} size="sm" />
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1.5 mt-2">
                      <div className="flex items-center justify-between">
                        <span>
                          PIN: <strong className="text-slate-800 font-mono">{zone.pincode}</strong>{' '}
                          • {zone.locality}
                        </span>
                        <span className="text-teal-700 font-semibold bg-teal-50/80 px-2 py-0.5 rounded text-[10px] border border-teal-100">
                          {zone.activeAssignmentsCount} tasks
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                        <span className="truncate max-w-[200px]" title={zone.projectName}>
                          Project: {zone.projectName}
                        </span>
                        {hasGps ? (
                          <span className="text-[10px] text-teal-600 font-medium flex items-center gap-0.5 shrink-0">
                            <MapPin className="w-2.5 h-2.5" />
                            GPS Ready
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">No GPS</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-600 flex items-center gap-1">
                        <HardHat className="w-2.5 h-2.5 text-slate-400" />
                        <span className="truncate">
                          Vendor: <strong>{vendorLabel}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Create Work Zone Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register Geographical Work Zone"
      >
        <form onSubmit={handleCreateZone} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Project *
            </label>
            {allProjects.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">Loading active projects...</div>
            ) : (
              <select
                value={createForm.projectId}
                onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">Select Project</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} ({p.projectCode})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Name *</label>
              <input
                type="text"
                value={createForm.zoneName}
                onChange={(e) => setCreateForm({ ...createForm, zoneName: e.target.value })}
                placeholder="e.g. Indiranagar Sector 4"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN Code (6 Digits) *
              </label>
              <input
                type="text"
                maxLength={6}
                value={createForm.pincode}
                onChange={(e) =>
                  setCreateForm({ ...createForm, pincode: e.target.value.replace(/\D/g, '') })
                }
                placeholder="560038"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Locality *</label>
              <input
                type="text"
                value={createForm.locality}
                onChange={(e) => setCreateForm({ ...createForm, locality: e.target.value })}
                placeholder="Indiranagar"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
              <input
                type="text"
                value={createForm.district}
                onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                placeholder="Bengaluru Urban"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                value={createForm.state}
                onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                placeholder="Karnataka"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Latitude (GPS Coordinates)
              </label>
              <input
                type="number"
                step="any"
                value={createForm.centerLatitude ?? ''}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    centerLatitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="12.9716"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Longitude (GPS Coordinates)
              </label>
              <input
                type="number"
                step="any"
                value={createForm.centerLongitude ?? ''}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    centerLongitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="77.6412"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Infrastructure zone details, street boundaries..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50"
            >
              {createSubmitting ? 'Registering...' : 'Register Zone'}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
