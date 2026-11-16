import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { FALLBACK_WORK_ZONES } from '../data/fallbackWorkZones';
import { FALLBACK_PROJECTS } from '../data/fallbackProjects';

export const WorkZonesPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || searchParams.get('project') || 'ALL';

  const [zones, setZones] = useState<WorkZoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [pinFilter, setPinFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ZoneStatus | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>(initialProjectId);
  const [selectedZone, setSelectedZone] = useState<WorkZoneItem | null>(null);

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectResponse[]>(FALLBACK_PROJECTS);
  const [loadingProjects, setLoadingProjects] = useState(false);
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

  const applyFallbackFilter = useCallback((allList: WorkZoneItem[]) => {
    let filtered = [...allList];
    if (projectFilter !== 'ALL') {
      filtered = filtered.filter(
        (z) =>
          z.projectId === projectFilter ||
          z.projectName.toLowerCase().includes(projectFilter.toLowerCase())
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((z) => z.status === statusFilter);
    }
    if (pinFilter.trim()) {
      filtered = filtered.filter((z) => z.pincode.startsWith(pinFilter.trim()));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (z) =>
          z.zoneCode.toLowerCase().includes(q) ||
          z.zoneName.toLowerCase().includes(q) ||
          z.pincode.includes(q) ||
          z.locality.toLowerCase().includes(q) ||
          z.district.toLowerCase().includes(q) ||
          z.projectName.toLowerCase().includes(q) ||
          z.projectId.toLowerCase().includes(q)
      );
    }
    setZones(filtered);
    if (filtered.length > 0) {
      setSelectedZone((prev) => (prev ? filtered.find((f) => f.id === prev.id) || filtered[0] : filtered[0]));
    } else {
      setSelectedZone(null);
    }
  }, [search, pinFilter, statusFilter, projectFilter]);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workZoneService.getWorkZones({
        projectId: projectFilter !== 'ALL' ? projectFilter : undefined,
        search: search.trim() || undefined,
        pincode: pinFilter.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        size: 100,
      });
      if (data && data.content && data.content.length > 0) {
        setZones(data.content);
        if (!selectedZone) {
          setSelectedZone(data.content[0]);
        } else {
          const updated = data.content.find((z) => z.id === selectedZone.id);
          if (updated) setSelectedZone(updated);
          else setSelectedZone(data.content[0]);
        }
      } else {
        applyFallbackFilter(FALLBACK_WORK_ZONES);
      }
    } catch (err: any) {
      console.warn('Backend work zones endpoint unreachable or returned error, using fallback demonstration work zones:', err);
      applyFallbackFilter(FALLBACK_WORK_ZONES);
    } finally {
      setLoading(false);
    }
  }, [search, pinFilter, statusFilter, projectFilter, selectedZone, applyFallbackFilter]);

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

  const loadProjectsForModal = async () => {
    try {
      setLoadingProjects(true);
      const res = await projectService.getProjects({ size: 100 });
      const activeProjects = (res && res.content && res.content.length > 0 ? res.content : FALLBACK_PROJECTS).filter(
        (p) => p.status === 'ACTIVE' || p.status === 'PLANNED'
      );
      setProjects(activeProjects);
      if (activeProjects.length > 0 && !createForm.projectId) {
        setCreateForm((prev) => ({ ...prev, projectId: activeProjects[0].id }));
      }
    } catch (err) {
      console.error('Error fetching projects', err);
      const activeProjects = FALLBACK_PROJECTS.filter((p) => p.status === 'ACTIVE' || p.status === 'PLANNED');
      setProjects(activeProjects);
      if (activeProjects.length > 0 && !createForm.projectId) {
        setCreateForm((prev) => ({ ...prev, projectId: activeProjects[0].id }));
      }
    } finally {
      setLoadingProjects(false);
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

  // Find work types for the selected zone
  const selectedZoneWorkType = useMemo(() => {
    if (!selectedZone) return 'Infrastructure Ducting';
    const zoneAsns = allAssignments.filter((a) => a.workZoneId === selectedZone.id);
    const types = Array.from(
      new Set(
        zoneAsns
          .map((a) => a.workTypeDisplayName || a.workType)
          .filter(Boolean)
      )
    );
    return types.length > 0 ? types.join(', ') : 'Infrastructure Ducting';
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
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search zone, PIN, locality, project..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                if (e.target.value === 'ALL') {
                  searchParams.delete('projectId');
                } else {
                  searchParams.set('projectId', e.target.value);
                }
                setSearchParams(searchParams);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ALL">All Projects ({FALLBACK_PROJECTS.length})</option>
              {FALLBACK_PROJECTS.map((p) => (
                <option key={p.id} value={p.projectCode}>
                  {p.projectCode} • {p.projectName}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={6}
              value={pinFilter}
              onChange={(e) => setPinFilter(e.target.value.replace(/\D/g, ''))}
              placeholder="PIN Code (6 digits)"
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

      {error && zones.length === 0 && (
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

            {/* Dedicated Compact Legend Row Outside the Map Canvas */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-3 py-2 bg-slate-50/90 rounded-lg border border-slate-200 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Status Legend:</span>
                <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Active</span>
                <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span> Available</span>
                <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Completed</span>
                <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Blocked</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-teal-700 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                OpenStreetMap
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

          {/* Selected Zone Detail Card (Complete, Unclipped Details) */}
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
                  <span className="text-slate-400 text-[11px] block">Locality / Jurisdiction</span>
                  <span className="font-medium text-slate-800 break-words block">
                    {selectedZone.locality}, {selectedZone.district}, {selectedZone.state}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Assigned Contractor</span>
                  <span className="font-semibold text-teal-700 break-words block">
                    {selectedZoneVendors}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Work Type & Tasks</span>
                  <span className="font-medium text-slate-800 break-words block">
                    {selectedZoneWorkType}
                  </span>
                  <span className="text-[11px] font-semibold text-teal-700">
                    {selectedZone.activeAssignmentsCount || 0} active task{(selectedZone.activeAssignmentsCount || 0) === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div className="pt-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Linked Project:{' '}
                  <strong className="text-slate-900">{selectedZone.projectName}</strong>{' '}
                  <span className="font-mono text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[10px]">
                    {selectedZone.projectId}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">Created {new Date(selectedZone.createdAt).toLocaleDateString()}</span>
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
                    data-zone-item={zone.zoneCode}
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

                    <div className="text-[11px] text-slate-500 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span>
                          PIN: <strong className="text-slate-800 font-mono">{zone.pincode}</strong>{' '}
                          • {zone.locality}
                        </span>
                        <span className="text-teal-700 font-semibold bg-teal-50/80 px-2 py-0.5 rounded text-[10px] border border-teal-100 shrink-0">
                          {zone.activeAssignmentsCount || 0} tasks
                        </span>
                      </div>
                      
                      <div className="pt-1.5 border-t border-slate-100 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 text-slate-700 text-[11px] min-w-0">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="break-words">
                            Project: <strong className="text-slate-900">{zone.projectName}</strong>
                          </span>
                        </div>
                        {hasGps ? (
                          <span className="text-[10px] text-teal-600 font-medium flex items-center gap-0.5 shrink-0 bg-teal-50/50 px-1.5 py-0.5 rounded border border-teal-100">
                            <MapPin className="w-2.5 h-2.5" />
                            GPS
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 shrink-0">No GPS</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span className="truncate">
                          Project: <strong className="text-slate-800">{zone.projectName}</strong>
                        </span>
                        <span className="font-mono text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0 ml-1">
                          {zone.projectId}
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
