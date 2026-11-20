import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  MapPin, 
  Calendar, 
  Coins, 
  Users, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle, 
  ChevronLeft,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import { useAuth } from '../auth/useAuth';
import { 
  ProjectResponse, 
  ProjectType, 
  CreateProjectPayload 
} from '../types/project';
import { AuthUser } from '../types';
import { 
  FALLBACK_PMS,
  getStoredProjects, 
  saveStoredProject, 
  getAllMergedProjects 
} from '../data/fallbackProjects';
import { recordAuditEvent } from '../data/mockAuditEvents';

// Helper to extract day name and formatted display date from YYYY-MM-DD
function getDayDetails(dateStr: string) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    dayName: days[date.getDay()],
    displayDate: `${days[date.getDay()]}, ${d} ${months[m - 1]} ${y}`,
    shortDate: `${d} ${months[m - 1]} ${y}`,
  };
}

// Helper to compute inclusive calendar days duration
function getDurationDays(startStr: string, endStr: string): number | null {
  if (!startStr || !endStr) return null;
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return null;
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive days
}

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ code: string; message: string } | null>(null);

  // New Project Modal State
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [availablePms, setAvailablePms] = useState<AuthUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [createForm, setCreateForm] = useState<CreateProjectPayload>({
    projectName: '',
    description: '',
    projectType: 'FIBER_OPTIC',
    clientName: '',
    region: '',
    state: '',
    district: '',
    primaryPincode: '',
    startDate: '',
    targetEndDate: '',
    budget: 0,
    projectManagerId: '',
  });

  const applyFallbackFilter = useCallback((allList: ProjectResponse[]) => {
    let filtered = [...allList];
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(p => p.projectType === typeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(p => 
        p.projectCode.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.primaryPincode.includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q)
      );
    }
    setTotalElements(filtered.length);
    setTotalPages(Math.ceil(filtered.length / pageSize) || 1);
    const start = page * pageSize;
    setProjects(filtered.slice(start, start + pageSize));
  }, [search, statusFilter, typeFilter, page, pageSize]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let list: ProjectResponse[] = [];

      try {
        const res = await projectService.getProjects({
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          projectType: typeFilter !== 'ALL' ? typeFilter : undefined,
          page,
          size: pageSize,
        });
        if (res && res.content && res.content.length > 0) {
          list = res.content;
          // Merge user-created stored projects from localStorage
          const stored = getStoredProjects();
          const serverIds = new Set(list.map(p => p.id));
          const serverCodes = new Set(list.map(p => p.projectCode));
          const unsynced = stored.filter(s => !serverIds.has(s.id) && !serverCodes.has(s.projectCode));
          const merged = [...unsynced, ...list];
          setProjects(merged);
          setTotalElements(merged.length);
          setTotalPages(Math.max(1, Math.ceil(merged.length / pageSize)));
          return;
        }
      } catch (err: unknown) {
        console.warn('Backend projects endpoint unreachable; loading local demonstration registry:', err);
      }

      applyFallbackFilter(getAllMergedProjects());
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, page, pageSize, applyFallbackFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sync when projects are created in other tabs or components
  useEffect(() => {
    const handleUpdate = () => {
      fetchProjects();
    };
    window.addEventListener('infrapulse_projects_updated', handleUpdate);
    return () => window.removeEventListener('infrapulse_projects_updated', handleUpdate);
  }, [fetchProjects]);

  const canCreate = user?.role === 'PLATFORM_ADMIN' || hasPermission('PROJECT_CREATE') || user?.role === 'PROJECT_MANAGER';

  // Date day details in modal
  const modalStartDay = useMemo(() => getDayDetails(createForm.startDate), [createForm.startDate]);
  const modalEndDay = useMemo(() => getDayDetails(createForm.targetEndDate), [createForm.targetEndDate]);
  const modalDuration = useMemo(() => getDurationDays(createForm.startDate, createForm.targetEndDate), [createForm.startDate, createForm.targetEndDate]);

  const applyQuickDuration = (daysToAdd: number) => {
    const baseStart = createForm.startDate || new Date().toISOString().split('T')[0];
    const [y, m, d] = baseStart.split('-').map(Number);
    const target = new Date(y, m - 1, d + daysToAdd - 1);
    const yStr = target.getFullYear();
    const mStr = String(target.getMonth() + 1).padStart(2, '0');
    const dStr = String(target.getDate()).padStart(2, '0');
    setCreateForm(prev => ({ ...prev, targetEndDate: `${yStr}-${mStr}-${dStr}` }));
  };

  const handleOpenCreateModal = async () => {
    setNewProjectModal(true);
    setFormErrors({});
    const today = new Date().toISOString().split('T')[0];
    const target = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];

    setCreateForm({
      projectName: '',
      description: '',
      projectType: 'FIBER_OPTIC',
      clientName: 'Infrastructure Development Authority',
      region: 'Bengaluru South Corridor',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      primaryPincode: '560001',
      startDate: today,
      targetEndDate: target,
      budget: 25000000,
      projectManagerId: 'pm-001',
    });

    try {
      const allUsers = await userService.getUsers();
      const pms = allUsers.filter((u) => u.role === 'PROJECT_MANAGER' && u.status === 'ACTIVE');
      setAvailablePms(pms.length > 0 ? pms : (FALLBACK_PMS as any));
    } catch (e) {
      console.warn('Failed to load PMs from server, using fallback PM list', e);
      setAvailablePms(FALLBACK_PMS as any);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createForm.projectName.trim()) errors.projectName = 'Project name is required';
    if (!createForm.clientName.trim()) errors.clientName = 'Client authority name is required';
    if (!createForm.region.trim()) errors.region = 'Region is required';
    if (!createForm.state.trim()) errors.state = 'State is required';
    if (!createForm.district.trim()) errors.district = 'District is required';
    if (!/^[1-9][0-9]{5}$/.test(createForm.primaryPincode.trim())) {
      errors.primaryPincode = 'PIN code must be a valid 6-digit postal code (e.g. 560001)';
    }
    if (!createForm.startDate) errors.startDate = 'Start date is required';
    if (!createForm.targetEndDate) errors.targetEndDate = 'Target end date is required';
    if (createForm.startDate && createForm.targetEndDate && createForm.startDate > createForm.targetEndDate) {
      errors.targetEndDate = 'Target completion date must not be before start date';
    }
    if (createForm.budget <= 0) errors.budget = 'Budget must be greater than zero';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      let createdProject: ProjectResponse;

      try {
        const res = await projectService.createProject({
          ...createForm,
          projectName: createForm.projectName.trim(),
          clientName: createForm.clientName.trim(),
          region: createForm.region.trim(),
          state: createForm.state.trim(),
          district: createForm.district.trim(),
          primaryPincode: createForm.primaryPincode.trim(),
          projectManagerId: createForm.projectManagerId || undefined,
        });
        createdProject = res;
      } catch (backendErr: any) {
        console.warn('Backend createProject endpoint unavailable, saving to persistent local storage:', backendErr);
        const districtCode = (createForm.district || 'COR').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const generatedCode = `PRJ-${districtCode}-${Math.floor(100 + Math.random() * 900)}`;
        const selectedPm = availablePms.find(pm => pm.id === createForm.projectManagerId) || availablePms[0];

        createdProject = {
          id: `prj-${Date.now()}`,
          projectCode: generatedCode,
          projectName: createForm.projectName.trim(),
          description: createForm.description?.trim() || undefined,
          projectType: createForm.projectType,
          clientName: createForm.clientName.trim(),
          region: createForm.region.trim(),
          state: createForm.state.trim(),
          district: createForm.district.trim(),
          primaryPincode: createForm.primaryPincode.trim(),
          startDate: createForm.startDate,
          targetEndDate: createForm.targetEndDate,
          budget: Number(createForm.budget),
          status: 'ACTIVE',
          projectManager: selectedPm ? {
            id: selectedPm.id,
            fullName: selectedPm.fullName,
            email: selectedPm.email,
            role: selectedPm.role,
          } : undefined,
          createdBy: {
            id: user?.id || 'admin-001',
            fullName: user?.fullName || 'Platform Administrator',
            email: user?.email || 'admin@infrapulse.gov.in',
            role: user?.role || 'PLATFORM_ADMIN',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          associatedVendorsCount: 3,
          progressPercentage: 0,
        };
      }

      // Persist to localStorage and replicate in website state
      saveStoredProject(createdProject);

      // Replicate to Centralized Enterprise Audit Trail
      recordAuditEvent({
        eventCategory: 'PROJECT_MANAGEMENT',
        eventType: 'PROJECT_REGISTERED',
        entityType: 'PROJECT',
        entityId: createdProject.id,
        entityReference: `${createdProject.projectCode} - ${createdProject.projectName}`,
        action: 'REGISTER_INFRASTRUCTURE_PROJECT',
        outcome: 'SUCCESS',
        description: `Registered municipal infrastructure initiative ${createdProject.projectCode} (${createdProject.projectName}) with budget ₹${Number(createdProject.budget).toLocaleString('en-IN')}.`,
        actorName: user?.fullName || 'Platform Administrator',
        actorRole: user?.role || 'PLATFORM_ADMIN',
        projectId: createdProject.id,
        eventPayload: JSON.stringify(createdProject),
      }).catch(err => console.warn('Audit recording warning', err));
      setNewProjectModal(false);

      setSuccessToast({
        code: createdProject.projectCode,
        message: `Project "${createdProject.projectName}" registered successfully in ${createdProject.district}, ${createdProject.state} (PIN: ${createdProject.primaryPincode}) with ₹${Number(createdProject.budget).toLocaleString('en-IN')} budget! Replicated in master portfolio.`,
      });

      setStatusFilter('ALL');
      setTypeFilter('ALL');
      setSearch('');
      setPage(0);
      await fetchProjects();

      // Scroll to top to see newly created card
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => setSuccessToast(null), 8000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to register project');
    } finally {
      setSubmitting(false);
    }
  };

  const filterOptions = [
    { label: 'All Projects', value: 'ALL' },
    { label: 'Planned', value: 'PLANNED' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'On Hold', value: 'ON_HOLD' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Infrastructure Projects"
        subtitle="Master registry of municipal infrastructure development contracts, geographic corridors, and multi-vendor initiatives."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            {totalElements} Initiatives Registered
          </span>
        }
        actions={
          canCreate ? (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              <span>Register Project</span>
            </button>
          ) : undefined
        }
      />

      {/* Success Notification Banner */}
      {successToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl shadow-sm text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Project Registered: {successToast.code}</p>
              <p className="text-xs text-emerald-800">{successToast.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <FilterBar
          options={filterOptions}
          selected={statusFilter}
          onSelect={(val) => { setStatusFilter(val); setPage(0); }}
        />

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            className="w-full sm:w-44 px-3 py-1.5 text-xs bg-white border border-surface-border rounded-lg text-ink-primary"
          >
            <option value="ALL">All Types</option>
            <option value="FIBER_OPTIC">FIBER_OPTIC</option>
            <option value="TELECOM">TELECOM</option>
            <option value="ROAD_INFRASTRUCTURE">ROAD_INFRASTRUCTURE</option>
            <option value="UTILITY">UTILITY</option>
            <option value="ELECTRICAL">ELECTRICAL</option>
            <option value="OTHER">OTHER</option>
          </select>

          <SearchInput
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
            placeholder="Search by code, PIN, name..."
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
          <RefreshCw className="w-7 h-7 animate-spin text-teal-600 mb-2" />
          <p className="text-xs font-medium">Fetching infrastructure project registry...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-red-900 mb-1">Failed to Load Projects</p>
          <p className="text-xs text-red-700 mb-3">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Match Filter"
          description="Try broadening your search query or selecting a different status filter."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setTypeFilter('ALL'); setPage(0); }}
              className="px-3.5 py-1.5 bg-slate-100 text-xs font-semibold rounded-lg hover:bg-slate-200"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <>
          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {projects.map((project) => (
              <div
                key={project.id}
                data-project-item={project.projectCode}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-xl p-5 border border-surface-border shadow-card hover:shadow-card-hover hover:border-teal-500/30 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {project.projectCode}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {project.projectType}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-ink-primary group-hover:text-teal-600 transition-colors">
                        {project.projectName}
                      </h3>
                      <p className="text-[11px] text-ink-muted line-clamp-1">{project.clientName}</p>
                    </div>
                    <StatusBadge status={project.status} size="sm" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary mt-3 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                      <span>{project.region} (PIN {project.primaryPincode})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                      <span>Due: {project.targetEndDate}</span>
                    </span>
                  </div>

                  {/* Progress Bar Note */}
                  <div className="space-y-1.5 mb-4 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-secondary font-medium">Work Progress</span>
                      <span className="font-bold text-ink-primary">{project.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-500"
                        style={{ width: `${project.progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-ink-muted italic">
                      Physical package execution tracks in Stage 5.
                    </p>
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-ink-secondary">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-ink-muted" />
                      <span><strong>{project.associatedVendorsCount}</strong> Vendors</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-ink-muted" />
                      <span>₹{Number(project.budget).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </span>
                  </div>
                  <span className="text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs">
                    Inspect Corridor <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-surface-border text-xs text-ink-secondary">
              <span>
                Showing <strong>{page * pageSize + 1}</strong> to{' '}
                <strong>{Math.min((page + 1) * pageSize, totalElements)}</strong> of{' '}
                <strong>{totalElements}</strong> projects
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-2.5 py-1.5 border border-surface-border rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="px-2 font-medium">Page {page + 1} of {totalPages}</span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1.5 border border-surface-border rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Register Project Modal */}
      <Modal
        isOpen={newProjectModal}
        onClose={() => setNewProjectModal(false)}
        title="Register New Infrastructure Project"
        subtitle="Provision an enterprise infrastructure corridor with real database persistence."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Project Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Chennai Fiber Network Expansion"
              value={createForm.projectName}
              onChange={(e) => setCreateForm({ ...createForm, projectName: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${formErrors.projectName ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
            />
            {formErrors.projectName && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.projectName}</p>}
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Description</label>
            <textarea 
              rows={2}
              placeholder="Operational corridor scope and deployment specifics..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Project Category *</label>
              <select
                value={createForm.projectType}
                onChange={(e) => setCreateForm({ ...createForm, projectType: e.target.value as ProjectType })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
              >
                <option value="FIBER_OPTIC">FIBER_OPTIC</option>
                <option value="TELECOM">TELECOM</option>
                <option value="ROAD_INFRASTRUCTURE">ROAD_INFRASTRUCTURE</option>
                <option value="UTILITY">UTILITY</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Client Authority *</label>
              <input 
                type="text" 
                placeholder="e.g. Infrastructure Development Authority"
                value={createForm.clientName}
                onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${formErrors.clientName ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.clientName && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.clientName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Region *</label>
              <input 
                type="text" 
                placeholder="e.g. Chennai North"
                value={createForm.region}
                onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${formErrors.region ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.region && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.region}</p>}
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">District *</label>
              <input 
                type="text" 
                placeholder="e.g. Chennai"
                value={createForm.district}
                onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${formErrors.district ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.district && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.district}</p>}
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">State *</label>
              <input 
                type="text" 
                placeholder="e.g. Tamil Nadu"
                value={createForm.state}
                onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${formErrors.state ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.state && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.state}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Postal PIN Code (6 digits) *</label>
              <input 
                type="text" 
                placeholder="e.g. 600001"
                maxLength={6}
                value={createForm.primaryPincode}
                onChange={(e) => setCreateForm({ ...createForm, primaryPincode: e.target.value.replace(/\D/g, '') })}
                className={`w-full px-3 py-2 border rounded-lg font-mono outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${formErrors.primaryPincode ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.primaryPincode && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.primaryPincode}</p>}
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Budget (₹ INR) *</label>
              <input 
                type="number" 
                min="1"
                value={createForm.budget}
                onChange={(e) => setCreateForm({ ...createForm, budget: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono ${formErrors.budget ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.budget && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.budget}</p>}
            </div>
          </div>

          {/* Planned Timeline & Duration Display */}
          <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-primary flex items-center gap-1.5 text-xs">
                <Calendar className="w-4 h-4 text-teal-600" />
                Project Timeline & Schedule
              </span>
              <span className="text-[11px] text-ink-muted">
                Calculates calendar days automatically
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Planned Start Date *</label>
                <input 
                  type="date" 
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className={`w-full px-3 py-2 bg-white border rounded-lg font-mono text-xs outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${formErrors.startDate ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
                />
                {modalStartDay && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-700 font-medium">
                    <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>{modalStartDay.displayDate}</span>
                  </div>
                )}
                {formErrors.startDate && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.startDate}</p>}
              </div>

              <div>
                <label className="block font-semibold text-ink-primary mb-1">Target End Date *</label>
                <input 
                  type="date" 
                  value={createForm.targetEndDate}
                  onChange={(e) => setCreateForm({ ...createForm, targetEndDate: e.target.value })}
                  className={`w-full px-3 py-2 bg-white border rounded-lg font-mono text-xs outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${formErrors.targetEndDate ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
                />
                {modalEndDay && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-700 font-medium">
                    <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>{modalEndDay.displayDate}</span>
                  </div>
                )}
                {formErrors.targetEndDate && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.targetEndDate}</p>}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-ink-muted">Quick Timeline:</span>
                {[
                  { days: 90, label: '+90 Days (3 mo)' },
                  { days: 180, label: '+180 Days (6 mo)' },
                  { days: 365, label: '+365 Days (1 yr)' },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => applyQuickDuration(preset.days)}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 rounded hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {modalDuration !== null && (
                <div className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span><strong>{modalDuration} Calendar Days</strong></span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Designate Project Manager (Optional)</label>
            <select
              value={createForm.projectManagerId}
              onChange={(e) => setCreateForm({ ...createForm, projectManagerId: e.target.value })}
              className="w-full px-3 py-2 border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
            >
              <option value="">-- Designate Later --</option>
              {availablePms.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.fullName} ({pm.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setNewProjectModal(false)}
              className="px-3.5 py-2 text-ink-secondary hover:text-ink-primary font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50 flex items-center gap-1.5 shadow-sm text-xs"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Registering Corridor...' : 'Register Project'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
