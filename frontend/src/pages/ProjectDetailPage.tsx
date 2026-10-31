import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  UserCheck, 
  Building2, 
  Plus, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  History,
  ShieldCheck,
  RefreshCw,
  Edit
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { projectService } from '../services/projectService';
import { vendorService } from '../services/vendorService';
import { userService } from '../services/userService';
import { useAuth } from '../auth/useAuth';
import { 
  ProjectDetailResponse, 
  ProjectStatus, 
  ProjectType,
  UpdateProjectPayload
} from '../types/project';
import { VendorResponse } from '../types/vendor';
import { AuthUser } from '../types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableManagers, setAvailableManagers] = useState<AuthUser[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [activeVendors, setActiveVendors] = useState<VendorResponse[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [associationNotes, setAssociationNotes] = useState('');
  const [associateSubmitting, setAssociateSubmitting] = useState(false);

  const [vendorToRemove, setVendorToRemove] = useState<string | null>(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProjectPayload>({
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
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectById(id);
      setProject(data);
      setSelectedStatus(data.status);
      setEditForm({
        projectName: data.projectName,
        description: data.description || '',
        projectType: data.projectType,
        clientName: data.clientName,
        region: data.region,
        state: data.state,
        district: data.district,
        primaryPincode: data.primaryPincode,
        startDate: data.startDate,
        targetEndDate: data.targetEndDate,
        budget: data.budget,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load project details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const isAssignedPm = user?.role === 'PROJECT_MANAGER' && project?.projectManager?.id === user?.id;
  const canManage = isAdmin || isAssignedPm;

  // Open assign manager modal: fetch project managers
  const handleOpenAssignModal = async () => {
    setIsAssignModalOpen(true);
    try {
      const users = await userService.getUsers();
      const pms = users.filter((u) => u.role === 'PROJECT_MANAGER' && u.status === 'ACTIVE');
      setAvailableManagers(pms);
      if (pms.length > 0) {
        setSelectedManagerId(pms[0].id);
      }
    } catch (err) {
      console.error('Failed to load project managers', err);
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedManagerId) return;
    try {
      setAssignSubmitting(true);
      await projectService.assignManager(id, { managerId: selectedManagerId });
      setIsAssignModalOpen(false);
      await fetchProjectDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to assign project manager');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Open status modal
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setStatusSubmitting(true);
      await projectService.updateProjectStatus(id, {
        status: selectedStatus,
        reason: statusReason,
      });
      setIsStatusModalOpen(false);
      setStatusReason('');
      await fetchProjectDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update project status');
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Open associate vendor modal
  const handleOpenAssociateModal = async () => {
    setIsAssociateModalOpen(true);
    try {
      const res = await vendorService.getVendors({ status: 'ACTIVE', size: 50 });
      setActiveVendors(res.content);
      if (res.content.length > 0) {
        setSelectedVendorId(res.content[0].id);
      }
    } catch (err) {
      console.error('Failed to load active vendors', err);
    }
  };

  const handleAssociateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedVendorId) return;
    try {
      setAssociateSubmitting(true);
      await projectService.associateVendor(id, {
        vendorId: selectedVendorId,
        notes: associationNotes,
      });
      setIsAssociateModalOpen(false);
      setAssociationNotes('');
      await fetchProjectDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to associate vendor');
    } finally {
      setAssociateSubmitting(false);
    }
  };

  const handleRemoveAssociation = async () => {
    if (!id || !vendorToRemove) return;
    try {
      setRemoveSubmitting(true);
      await projectService.removeVendorAssociation(id, vendorToRemove);
      setVendorToRemove(null);
      await fetchProjectDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate vendor association');
    } finally {
      setRemoveSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setEditSubmitting(true);
      await projectService.updateProject(id, editForm);
      setIsEditModalOpen(false);
      await fetchProjectDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
          <p className="text-sm font-medium">Retrieving project dossier...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto mt-10">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-red-900 mb-1">Project Not Accessible</h2>
          <p className="text-xs text-red-700 mb-4">{error || 'Project record does not exist or access is restricted by policy.'}</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800"
          >
            Return to Projects
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Top Breadcrumb */}
      <div className="mb-4">
        <Link 
          to="/projects" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects Registry</span>
        </Link>
      </div>

      <PageHeader
        title={project.projectName}
        subtitle={project.description || 'Infrastructure lifecycle initiative under municipal jurisdiction.'}
        badge={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-teal-50 text-teal-800 rounded-md border border-teal-200">
              {project.projectCode}
            </span>
            <StatusBadge status={project.status} size="sm" />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-ink-primary rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Edit className="w-3.5 h-3.5 text-ink-muted" />
                <span>Edit Project</span>
              </button>
            )}
            {canManage && (
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-ink-primary rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-ink-muted" />
                <span>Change Status</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleOpenAssignModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-ink-primary rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Assign PM</span>
              </button>
            )}
            {canManage && (
              <button
                onClick={handleOpenAssociateModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-teal-400" />
                <span>Associate Vendor</span>
              </button>
            )}
          </div>
        }
      />

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Operational Spec & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Specs Card */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-sm font-bold text-ink-primary mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Project Specifications</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Infrastructure Type</span>
                <span className="font-bold text-ink-primary mt-0.5 block">{project.projectType}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Client Authority</span>
                <span className="font-bold text-ink-primary mt-0.5 block">{project.clientName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Primary PIN Code</span>
                <span className="font-mono font-bold text-teal-700 mt-0.5 block">{project.primaryPincode}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Region & State</span>
                <span className="font-semibold text-ink-primary mt-0.5 block">
                  {project.region}, {project.state}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Operational District</span>
                <span className="font-semibold text-ink-primary mt-0.5 block">{project.district}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Total Budget</span>
                <span className="font-bold text-teal-800 mt-0.5 block">
                  ₹{Number(project.budget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Timeline Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-ink-muted" />
                <span className="text-ink-secondary">
                  Schedule: <strong>{project.startDate}</strong> → <strong>{project.targetEndDate}</strong>
                </span>
              </div>
              {project.actualEndDate && (
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed on {project.actualEndDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Associated Vendors Card */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Associated Contractors & Vendors ({project.associatedVendors.filter(v => v.associationStatus === 'ACTIVE').length})</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">Empanelled contractors approved for works within this corridor.</p>
              </div>
              {canManage && (
                <button
                  onClick={handleOpenAssociateModal}
                  className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  + Add Vendor
                </button>
              )}
            </div>

            {project.associatedVendors.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                <Building2 className="w-8 h-8 text-ink-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-ink-primary">No Vendors Associated Yet</p>
                <p className="text-[11px] text-ink-muted mt-0.5">Associate active contractors to enable upcoming PIN-code parcel work allocation.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {project.associatedVendors.map((assoc) => (
                  <div key={assoc.id} className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/vendors/${assoc.vendorId}`}
                          className="font-bold text-sm text-ink-primary hover:text-teal-600 transition-colors"
                        >
                          {assoc.companyName}
                        </Link>
                        <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {assoc.vendorCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          assoc.associationStatus === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {assoc.associationStatus}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted mt-1">
                        <span>Contact: <strong>{assoc.contactPerson}</strong> ({assoc.phoneNumber})</span>
                        <span>•</span>
                        <span>Associated: {new Date(assoc.associatedAt).toLocaleDateString()}</span>
                        {assoc.notes && (
                          <>
                            <span>•</span>
                            <span className="italic">"{assoc.notes}"</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {assoc.serviceCategories.map((cat) => (
                          <span key={cat} className="text-[9px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {canManage && assoc.associationStatus === 'ACTIVE' && (
                      <button
                        onClick={() => setVendorToRemove(assoc.vendorId)}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                        title="Deactivate Association"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Deactivate</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Leadership, Lifecycle & Audit Trail */}
        <div className="space-y-6">
          {/* Project Manager Card */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Primary Project Manager</span>
              </h3>
              {isAdmin && (
                <button
                  onClick={handleOpenAssignModal}
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                >
                  Change
                </button>
              )}
            </div>

            {project.projectManager ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <p className="font-bold text-sm text-ink-primary">{project.projectManager.fullName}</p>
                <p className="text-ink-secondary text-[11px] mt-0.5">{project.projectManager.email}</p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-ink-muted">Designated Role</span>
                  <span className="font-mono font-semibold text-teal-800">{project.projectManager.role}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-800">
                <p className="font-semibold">No Project Manager Designated</p>
                <p className="text-[11px] text-amber-700 mt-1">Authorized admins may assign a Project Manager.</p>
                {isAdmin && (
                  <button
                    onClick={handleOpenAssignModal}
                    className="mt-2.5 px-3 py-1 bg-amber-700 text-white rounded text-xs font-semibold hover:bg-amber-800"
                  >
                    Assign Manager
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Work Lifecycle Stage Note */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-sm font-bold text-ink-primary mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Corridor Lifecycle Progress</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-ink-secondary">Stage 4 State</span>
                <span className="font-bold text-ink-primary">Database Persistent</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${project.progressPercentage}%` }} />
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed mt-2 p-2.5 bg-slate-50 rounded border border-slate-200">
                Corridor progress is registered at <strong className="text-ink-primary">0.0%</strong>. Work package parcel assignment, GIS PIN-code tracking, and sequential dependency verification will execute in <strong className="text-teal-700">Stage 5</strong>.
              </p>
            </div>
          </div>

          {/* Audit History Trail */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-sm font-bold text-ink-primary mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <span>Audit Trail ({project.auditTrail.length})</span>
            </h3>

            {project.auditTrail.length === 0 ? (
              <p className="text-xs text-ink-muted">No audit entries recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {project.auditTrail.map((event) => (
                  <div key={event.id} className="text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-teal-800">{event.eventType}</span>
                      <span className="text-ink-muted">{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-ink-primary font-medium mt-1 text-[11px]">{event.summary}</p>
                    {event.reason && (
                      <p className="text-ink-muted italic text-[10px] mt-0.5">Reason: {event.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Update Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Project Status"
        subtitle={`Current State: ${project.status}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Target Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            >
              <option value="PLANNED">PLANNED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Reason for Status Transition</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="e.g. Clearance granted by municipal public works division."
              rows={3}
              required
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={statusSubmitting}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {statusSubmitting ? 'Updating...' : 'Commit Status Change'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Assign Project Manager */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Project Manager"
        subtitle="Only active personnel with PROJECT_MANAGER role may be designated."
      >
        <form onSubmit={handleAssignManager} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Select Project Manager</label>
            {availableManagers.length === 0 ? (
              <p className="text-ink-muted">No active project managers found in system registry.</p>
            ) : (
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              >
                {availableManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignSubmitting || availableManagers.length === 0}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {assignSubmitting ? 'Assigning...' : 'Assign Manager'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Associate Vendor */}
      <Modal
        isOpen={isAssociateModalOpen}
        onClose={() => setIsAssociateModalOpen(false)}
        title="Associate Certified Contractor"
        subtitle="Only ACTIVE vendors can participate in infrastructure corridors."
      >
        <form onSubmit={handleAssociateVendor} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Select Active Vendor</label>
            {activeVendors.length === 0 ? (
              <p className="text-ink-muted">No active vendors found. Activate pending vendors first.</p>
            ) : (
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              >
                {activeVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName} ({v.vendorCode}) • {v.serviceCategories.join(', ')}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Contractual / Operational Notes</label>
            <textarea
              value={associationNotes}
              onChange={(e) => setAssociationNotes(e.target.value)}
              placeholder="e.g. Empanelled for optical trenching and duct installation."
              rows={3}
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAssociateModalOpen(false)}
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={associateSubmitting || activeVendors.length === 0}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {associateSubmitting ? 'Associating...' : 'Confirm Association'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMATION MODAL: Deactivate Vendor Association */}
      <Modal
        isOpen={!!vendorToRemove}
        onClose={() => setVendorToRemove(null)}
        title="Deactivate Vendor Association"
        subtitle="Confirm revocation of contractor association from this infrastructure corridor."
      >
        <div className="space-y-3 text-xs">
          <p className="text-ink-secondary">
            Are you sure you want to deactivate this contractor's association? The historical record of work and participation will be preserved in the audit database.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setVendorToRemove(null)}
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Keep Association
            </button>
            <button
              onClick={handleRemoveAssociation}
              disabled={removeSubmitting}
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {removeSubmitting ? 'Deactivating...' : 'Yes, Deactivate'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Edit Project */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Infrastructure Project"
        subtitle={`Updating ${project.projectCode}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Project Name</label>
            <input
              type="text"
              value={editForm.projectName}
              onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
              required
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Project Type</label>
              <select
                value={editForm.projectType}
                onChange={(e) => setEditForm({ ...editForm, projectType: e.target.value as ProjectType })}
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
              <label className="block font-semibold text-ink-primary mb-1">Client Name</label>
              <input
                type="text"
                value={editForm.clientName}
                onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Region</label>
              <input
                type="text"
                value={editForm.region}
                onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">District</label>
              <input
                type="text"
                value={editForm.district}
                onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Postal PIN Code</label>
              <input
                type="text"
                value={editForm.primaryPincode}
                onChange={(e) => setEditForm({ ...editForm, primaryPincode: e.target.value })}
                pattern="^[1-9][0-9]{5}$"
                title="6-digit Indian PIN code"
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Start Date</label>
              <input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Target End Date</label>
              <input
                type="date"
                value={editForm.targetEndDate}
                onChange={(e) => setEditForm({ ...editForm, targetEndDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Budget (₹ INR)</label>
            <input
              type="number"
              min="1"
              value={editForm.budget}
              onChange={(e) => setEditForm({ ...editForm, budget: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {editSubmitting ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
