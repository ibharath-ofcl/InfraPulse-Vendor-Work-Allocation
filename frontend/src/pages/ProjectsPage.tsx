import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft
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

  // New Project Modal
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

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await projectService.getProjects({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        projectType: typeFilter !== 'ALL' ? typeFilter : undefined,
        page,
        size: pageSize,
      });
      setProjects(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch projects from backend';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const canCreate = user?.role === 'PLATFORM_ADMIN' || hasPermission('PROJECT_CREATE');

  const handleOpenCreateModal = async () => {
    setNewProjectModal(true);
    setFormErrors({});
    setCreateForm({
      projectName: '',
      description: '',
      projectType: 'FIBER_OPTIC',
      clientName: '',
      region: '',
      state: '',
      district: '',
      primaryPincode: '',
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      budget: 10000000,
      projectManagerId: '',
    });

    try {
      const allUsers = await userService.getUsers();
      const pms = allUsers.filter((u) => u.role === 'PROJECT_MANAGER' && u.status === 'ACTIVE');
      setAvailablePms(pms);
    } catch (e) {
      console.error('Failed to load PMs', e);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createForm.projectName.trim()) errors.projectName = 'Project name is required';
    if (!createForm.clientName.trim()) errors.clientName = 'Client name is required';
    if (!createForm.region.trim()) errors.region = 'Region is required';
    if (!createForm.state.trim()) errors.state = 'State is required';
    if (!createForm.district.trim()) errors.district = 'District is required';
    if (!/^[1-9][0-9]{5}$/.test(createForm.primaryPincode.trim())) {
      errors.primaryPincode = 'PIN code must be a valid 6-digit postal code';
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
      await projectService.createProject({
        ...createForm,
        projectName: createForm.projectName.trim(),
        clientName: createForm.clientName.trim(),
        region: createForm.region.trim(),
        state: createForm.state.trim(),
        district: createForm.district.trim(),
        primaryPincode: createForm.primaryPincode.trim(),
        projectManagerId: createForm.projectManagerId || undefined,
      });
      setNewProjectModal(false);
      setPage(0);
      await fetchProjects();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
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
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
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
        subtitle="Provision an enterprise infrastructure corridor with real PostgreSQL persistence."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Project Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Chennai Fiber Network Expansion"
              value={createForm.projectName}
              onChange={(e) => setCreateForm({ ...createForm, projectName: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${formErrors.projectName ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
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
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Project Category *</label>
              <select
                value={createForm.projectType}
                onChange={(e) => setCreateForm({ ...createForm, projectType: e.target.value as ProjectType })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
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
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.clientName ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
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
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.region ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
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
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.district ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
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
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.state ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
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
                onChange={(e) => setCreateForm({ ...createForm, primaryPincode: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg font-mono ${formErrors.primaryPincode ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
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
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.budget ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.budget && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.budget}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Planned Start Date *</label>
              <input 
                type="date" 
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.startDate ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.startDate && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.startDate}</p>}
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Target End Date *</label>
              <input 
                type="date" 
                value={createForm.targetEndDate}
                onChange={(e) => setCreateForm({ ...createForm, targetEndDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.targetEndDate ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.targetEndDate && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.targetEndDate}</p>}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Designate Project Manager (Optional)</label>
            <select
              value={createForm.projectManagerId}
              onChange={(e) => setCreateForm({ ...createForm, projectManagerId: e.target.value })}
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
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
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Register Project'}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
