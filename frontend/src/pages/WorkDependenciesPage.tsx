import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitFork, 
  Plus, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  Filter, 
  RefreshCw, 
  Sliders
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { Modal } from '../components/common/Modal';
import { workDependencyService } from '../services/workDependencyService';
import { projectService } from '../services/projectService';
import { WorkTypeDependencyItem, WorkTypeEnum, CreateDependencyPayload } from '../types/workAssignment';
import { ProjectResponse } from '../types/project';
import { useAuth } from '../auth/useAuth';

const WORK_TYPES: Array<{ code: WorkTypeEnum; label: string }> = [
  { code: 'TRENCHING', label: 'Trenching' },
  { code: 'UNDERGROUND_CABLE_INSTALLATION', label: 'Underground Cable Installation' },
  { code: 'BACKFILLING', label: 'Backfilling' },
  { code: 'ROAD_RESURFACING', label: 'Road Resurfacing' },
  { code: 'FINAL_INSPECTION', label: 'Final Inspection' },
];

export const WorkDependenciesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'PLATFORM_ADMIN';

  const [rules, setRules] = useState<WorkTypeDependencyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Projects for scope filtering & creation
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPredecessor, setCreatePredecessor] = useState<WorkTypeEnum>('TRENCHING');
  const [createSuccessor, setCreateSuccessor] = useState<WorkTypeEnum>('UNDERGROUND_CABLE_INSTALLATION');
  const [createProjectId, setCreateProjectId] = useState<string>('');
  const [createPriority, setCreatePriority] = useState<number>(1);
  const [createReleaseRequired, setCreateReleaseRequired] = useState<boolean>(true);
  const [createDescription, setCreateDescription] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 1. Fetch accessible projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectService.getProjects({ size: 100 });
        setProjects(res.content || []);
      } catch (err: any) {
        console.error('Failed to load projects', err);
      }
    };
    fetchProjects();
  }, []);

  // 2. Fetch dependency rules from backend
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { projectId?: string; isActive?: boolean } = {};
      if (selectedProjectFilter !== 'ALL') {
        params.projectId = selectedProjectFilter;
      }
      if (statusFilter === 'ACTIVE') {
        params.isActive = true;
      } else if (statusFilter === 'INACTIVE') {
        params.isActive = false;
      }

      const res = await workDependencyService.getAllRules({ ...params, size: 50 });
      setRules(res.content || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dependency rules from backend');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectFilter, statusFilter]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Handle status toggle (Activate / Deactivate rule)
  const handleToggleStatus = async (rule: WorkTypeDependencyItem) => {
    if (!isAdmin) return;
    try {
      await workDependencyService.toggleStatus(rule.id, !rule.isActive);
      setSuccessToast(`Rule "${rule.predecessorDisplayName} → ${rule.successorDisplayName}" ${rule.isActive ? 'deactivated' : 'activated'} successfully.`);
      fetchRules();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update rule status');
    }
  };

  // Handle Rule Creation
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (createPredecessor === createSuccessor) {
      setCreateError('Predecessor and successor work types must be distinct activities.');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      const payload: CreateDependencyPayload = {
        projectId: createProjectId ? createProjectId : null,
        predecessorWorkType: createPredecessor,
        successorWorkType: createSuccessor,
        requiredPredecessorStatus: 'COMPLETED',
        requiresReleaseApproval: createReleaseRequired,
        isActive: true,
        priority: Number(createPriority) || 1,
        description: createDescription.trim() || undefined,
      };

      await workDependencyService.createRule(payload);
      setShowCreateModal(false);
      setSuccessToast(`Dependency rule created successfully: ${createPredecessor} → ${createSuccessor}`);
      // Reset modal inputs
      setCreateDescription('');
      setCreateProjectId('');
      setCreatePriority(1);
      fetchRules();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create dependency rule.');
    } finally {
      setCreating(false);
    }
  };

  const activeCount = rules.filter(r => r.isActive).length;
  const globalCount = rules.filter(r => !r.projectId).length;

  return (
    <PageContainer>
      <PageHeader
        title="Infrastructure Work Dependency & Precedence Engine"
        subtitle="Manage configurable activity prerequisites and release requirements. Enforced at the backend database transaction level to prevent out-of-order execution."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-indigo-600" />
            Stage 06 Engine
          </span>
        }
        actions={
          isAdmin && (
            <button
              onClick={() => {
                setCreateError(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              <span>New Dependency Rule</span>
            </button>
          )
        }
      />

      {/* Success Notification Banner */}
      {successToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl shadow-sm text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold text-xs">{successToast}</p>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded-xl shadow-sm text-rose-900 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-semibold text-xs">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white border border-surface-border rounded-xl shadow-sm">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Total Defined Rules</span>
          <p className="text-2xl font-bold text-ink-primary mt-1">{rules.length}</p>
          <span className="text-[11px] text-teal-600 font-medium">Configured in PostgreSQL</span>
        </div>
        <div className="p-4 bg-white border border-surface-border rounded-xl shadow-sm">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Active Rules Enforced</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          <span className="text-[11px] text-ink-muted font-medium">Blocking dependent work</span>
        </div>
        <div className="p-4 bg-white border border-surface-border rounded-xl shadow-sm">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Global Baseline Pipeline</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{globalCount}</p>
          <span className="text-[11px] text-ink-muted font-medium">Applied to all projects</span>
        </div>
        <div className="p-4 bg-white border border-surface-border rounded-xl shadow-sm">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Prerequisite Release</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">100%</p>
          <span className="text-[11px] text-ink-muted font-medium">Mandatory clearance check</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-surface-border rounded-xl shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ink-muted" />
            <span className="text-xs font-semibold text-ink-primary">Filter Scope:</span>
          </div>
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-surface-border rounded-lg text-xs text-ink-primary outline-none focus:bg-white"
          >
            <option value="ALL">All Project Scopes</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} — {p.projectName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-surface-border rounded-lg text-xs text-ink-primary outline-none focus:bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        <button
          onClick={fetchRules}
          disabled={loading}
          className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink-primary bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Rules</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-600" />
            <h2 className="font-bold text-sm text-ink-primary">Configured Dependency Rules</h2>
          </div>
          <span className="text-xs text-ink-muted">
            Rules execute in ascending priority order (1 = highest)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-ink-muted uppercase tracking-wider text-[10px] font-semibold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Predecessor (Prerequisite)</th>
                <th className="py-3 px-4 text-center">Flow</th>
                <th className="py-3 px-4">Successor (Dependent Activity)</th>
                <th className="py-3 px-4">Required Completion</th>
                <th className="py-3 px-4">Release Clearance</th>
                <th className="py-3 px-4">Project Scope</th>
                <th className="py-3 px-4">Rule Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading && rules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-ink-muted">
                    <RefreshCw className="w-5 h-5 text-teal-600 animate-spin mx-auto mb-2" />
                    <span>Loading active dependency rules...</span>
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-ink-muted">
                    No dependency rules found matching the selected filters.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ink-primary">
                      #{rule.priority}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[11px]">
                          {rule.predecessorDisplayName}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-muted font-mono">{rule.predecessorWorkType}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-ink-muted">
                      <ArrowRight className="w-4 h-4 mx-auto text-teal-600" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200 font-semibold text-[11px]">
                          {rule.successorDisplayName}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-muted font-mono">{rule.successorWorkType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rule.requiredPredecessorStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {rule.requiresReleaseApproval ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          <span>MANDATORY</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-ink-muted">
                          Auto
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rule.projectId ? (
                        <span className="font-medium text-ink-primary">
                          {rule.projectName || rule.projectId}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          GLOBAL BASELINE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rule.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-ink-muted">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(rule)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                            rule.isActive 
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {rule.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dependency Rule Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Infrastructure Dependency Rule"
      >
        <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
          <p className="text-slate-500 text-xs">
            Establish sequential dependencies between infrastructure activities. The work allocation engine verifies that predecessor activities are completed and released before dependent work is allowed.
          </p>

          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-ink-primary mb-1">
              Project Scope (Optional)
            </label>
            <select
              value={createProjectId}
              onChange={(e) => setCreateProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
            >
              <option value="">Global Baseline (Applies across all projects)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-ink-muted">
              Leave blank to enforce as platform-wide infrastructure rule.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Required Predecessor Activity <span className="text-rose-500">*</span>
              </label>
              <select
                value={createPredecessor}
                onChange={(e) => setCreatePredecessor(e.target.value as WorkTypeEnum)}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
              >
                {WORK_TYPES.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Dependent Successor Activity <span className="text-rose-500">*</span>
              </label>
              <select
                value={createSuccessor}
                onChange={(e) => setCreateSuccessor(e.target.value as WorkTypeEnum)}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
              >
                {WORK_TYPES.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Rule Priority (Execution Order)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={createPriority}
                onChange={(e) => setCreatePriority(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="requiresReleaseApproval"
                checked={createReleaseRequired}
                onChange={(e) => setCreateReleaseRequired(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300"
              />
              <label htmlFor="requiresReleaseApproval" className="font-semibold text-ink-primary cursor-pointer">
                Requires Authorized Clearance (RELEASED status)
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">
              Rule Rationale / Description
            </label>
            <textarea
              rows={2}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="e.g. Municipal engineering guidelines require backfilling compaction before road surfacing"
              className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
            />
          </div>

          <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-surface-border rounded-lg font-semibold text-ink-secondary hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {creating ? 'Saving Rule...' : 'Save Dependency Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
