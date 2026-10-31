import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  RotateCw, 
  AlertCircle, 
  Compass
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { WorkZoneMap } from '../components/maps/WorkZoneMap';
import { workZoneService } from '../services/workZoneService';
import { projectService } from '../services/projectService';
import { WorkZoneItem, ZoneStatus, CreateWorkZonePayload } from '../types/workZone';
import { ProjectResponse } from '../types/project';
import { useAuth } from '../auth/useAuth';

export const WorkZonesPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [zones, setZones] = useState<WorkZoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [pinFilter, setPinFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ZoneStatus | 'ALL'>('ALL');
  const [selectedZone, setSelectedZone] = useState<WorkZoneItem | null>(null);

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
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

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workZoneService.getWorkZones({
        search: search.trim() || undefined,
        pincode: pinFilter.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        size: 100,
      });
      setZones(data.content);
      if (data.content.length > 0 && !selectedZone) {
        setSelectedZone(data.content[0]);
      } else if (selectedZone) {
        const updated = data.content.find((z) => z.id === selectedZone.id);
        if (updated) setSelectedZone(updated);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load geographical work zones.');
    } finally {
      setLoading(false);
    }
  }, [search, pinFilter, statusFilter, selectedZone]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const loadProjectsForModal = async () => {
    try {
      setLoadingProjects(true);
      const res = await projectService.getProjects({ size: 100 });
      const activeProjects = res.content.filter((p) => p.status === 'ACTIVE' || p.status === 'PLANNED');
      setProjects(activeProjects);
      if (activeProjects.length > 0 && !createForm.projectId) {
        setCreateForm((prev) => ({ ...prev, projectId: activeProjects[0].id }));
      }
    } catch (err) {
      console.error('Error fetching projects', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    loadProjectsForModal();
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.projectId || !createForm.zoneName || !createForm.pincode || !createForm.locality) {
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
        centerLatitude: createForm.centerLatitude ? Number(createForm.centerLatitude) : undefined,
        centerLongitude: createForm.centerLongitude ? Number(createForm.centerLongitude) : undefined,
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
      await fetchZones();
      setSelectedZone(created);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Failed to register work zone.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Convert zones with coordinates to WorkZoneMap format
  const mapZones = useMemo(() => {
    return zones
      .filter((z) => z.centerLatitude && z.centerLongitude)
      .map((z) => ({
        id: z.id,
        code: z.zoneCode,
        name: z.zoneName,
        pinCode: z.pincode,
        region: z.district || 'Urban Sector',
        projectId: z.projectId,
        projectName: z.projectName,
        status: (z.status === 'ACTIVE' ? 'ACTIVE' : z.status === 'COMPLETED' ? 'COMPLETED' : 'AVAILABLE') as any,
        currentWorkType: 'TRENCHING' as any,
        dependencyStatus: 'CLEARED' as any,
        lat: z.centerLatitude!,
        lng: z.centerLongitude!,
        assignedVendorName: z.projectName,
      }));
  }, [zones]);

  return (
    <PageContainer>
      <PageHeader
        title="Geographical Work Zones"
        subtitle="PIN-code mapped spatial sectors coordinating infrastructure work packages and boundaries."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">
            {zones.length} Registered Zones
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

      {/* Filter and PIN Search */}
      <div className="bg-white rounded-xl border border-surface-border p-4 shadow-card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by zone code, locality, district, or project name..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={6}
              value={pinFilter}
              onChange={(e) => setPinFilter(e.target.value.replace(/\D/g, ''))}
              placeholder="Filter by PIN Code (6 digits)"
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
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
            <button
              onClick={fetchZones}
              disabled={loading}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg shrink-0"
              title="Refresh zones"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && zones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-medium">Loading geographical work zones...</p>
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

      {/* Two Column Grid: GIS Map / Coordinates List & Zone Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map or Coordinate Registry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-border">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  GIS Work Zone Coordinates
                </h3>
                <p className="text-xs text-slate-500">
                  {mapZones.length > 0
                    ? `Displaying ${mapZones.length} geocoded parcels on interactive map`
                    : 'Coordinates list display (no geocoded coordinates supplied for current zones)'}
                </p>
              </div>
              {mapZones.length > 0 && (
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Click marker to inspect
                </span>
              )}
            </div>

            {mapZones.length > 0 ? (
              <WorkZoneMap
                zones={mapZones}
                selectedZoneId={selectedZone?.id}
                onSelectZone={(mZone) => {
                  const match = zones.find((z) => z.id === mZone.id);
                  if (match) setSelectedZone(match);
                }}
                height="420px"
              />
            ) : (
              <div className="p-8 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700 mb-1">Location Registry Mode</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Map markers are rendered exclusively when exact GPS coordinates are configured.
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  SRID: EPSG:4326 (WGS 84)
                </div>
              </div>
            )}
          </div>

          {/* Selected Zone Detail Card */}
          {selectedZone && (
            <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedZone.zoneCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedZone.zoneName}</h3>
                </div>
                <StatusBadge status={selectedZone.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block">PIN Code</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{selectedZone.pincode}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Locality</span>
                  <span className="font-medium text-slate-800 truncate block">{selectedZone.locality}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">District / State</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {selectedZone.district}, {selectedZone.state}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Active Assignments</span>
                  <span className="font-bold text-teal-700">{selectedZone.activeAssignmentsCount}</span>
                </div>
              </div>

              <div className="pt-3 text-xs text-slate-600 flex items-center justify-between">
                <span>Associated Project: <strong className="text-slate-900">{selectedZone.projectName}</strong></span>
                <span className="text-[11px] text-slate-400">Created {selectedZone.createdAt}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Work Zone Inventory List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Zone Inventory ({zones.length})
              </span>
              <span className="text-xs text-slate-400">Select to inspect</span>
            </div>

            {zones.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No work zones registered matching criteria.
              </div>
            )}

            <div className="space-y-2 mt-3 max-h-[560px] overflow-y-auto pr-1">
              {zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50 border-teal-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                          {zone.zoneCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{zone.zoneName}</h4>
                      </div>
                      <StatusBadge status={zone.status} size="sm" />
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 mt-2">
                      <div className="flex items-center justify-between">
                        <span>
                          PIN: <strong className="text-slate-800 font-mono">{zone.pincode}</strong> • {zone.locality}
                        </span>
                        <span className="text-teal-700 font-semibold">{zone.activeAssignmentsCount} tasks</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate pt-1 border-t border-slate-100">
                        Project: {zone.projectName}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Project *</label>
            {loadingProjects ? (
              <div className="text-xs text-slate-400 py-2">Loading active projects...</div>
            ) : (
              <select
                value={createForm.projectId}
                onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code (6 Digits) *</label>
              <input
                type="text"
                maxLength={6}
                value={createForm.pincode}
                onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value.replace(/\D/g, '') })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude (Optional)</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude (Optional)</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
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
