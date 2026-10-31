import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  CheckCircle2, 
  MapPin, 
  Plus, 
  Search, 
  Eye, 
  AlertCircle,
  RefreshCw,
  Layers,
  Info
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { projectService } from '../services/projectService';
import { workZoneService } from '../services/workZoneService';
import { workAssignmentService } from '../services/workAssignmentService';
import { ProjectResponse, ProjectDetailResponse, ProjectVendorAssociation } from '../types/project';
import { WorkZoneItem } from '../types/workZone';
import { 
  WorkAssignmentItem, 
  WorkTypeEnum, 
  AssignmentPriorityEnum, 
  AssignmentStatusEnum 
} from '../types/workAssignment';
import { useAuth } from '../auth/useAuth';

const WORK_TYPE_OPTIONS: Array<{ code: WorkTypeEnum; label: string; desc: string }> = [
  { code: 'TRENCHING', label: 'Trenching', desc: 'Excavation and trench preparation' },
  { code: 'UNDERGROUND_CABLE_INSTALLATION', label: 'Underground Cable Installation', desc: 'Cable laying and installation' },
  { code: 'BACKFILLING', label: 'Backfilling', desc: 'Filling and restoration of excavated trenches' },
  { code: 'ROAD_RESURFACING', label: 'Road Resurfacing', desc: 'Road surface restoration' },
  { code: 'FINAL_INSPECTION', label: 'Final Inspection', desc: 'Final infrastructure verification' },
];

export const WorkAllocationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const canAllocate = user?.role === 'PLATFORM_ADMIN' || user?.role === 'PROJECT_MANAGER' || hasPermission('WORK_ASSIGNMENT_CREATE') || hasPermission('ALLOCATE_WORK');
  const canCancel = user?.role === 'PLATFORM_ADMIN' || user?.role === 'PROJECT_MANAGER' || hasPermission('WORK_ASSIGNMENT_CANCEL');

  // Master Data
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ProjectDetailResponse | null>(null);

  // Allocation Form State
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formPinCode, setFormPinCode] = useState<string>('');
  const [matchingZones, setMatchingZones] = useState<WorkZoneItem[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [formZoneId, setFormZoneId] = useState<string>('');
  const [formWorkType, setFormWorkType] = useState<WorkTypeEnum>('TRENCHING');
  const [formVendorId, setFormVendorId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formPriority, setFormPriority] = useState<AssignmentPriorityEnum>('HIGH');
  const [formInstructions, setFormInstructions] = useState<string>('');

  // Allocation UI State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ code: string; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Assignment Ledger Table State
  const [assignments, setAssignments] = useState<WorkAssignmentItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Table Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatusEnum | 'ALL'>('ALL');
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeEnum | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<AssignmentPriorityEnum | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  // Cancellation Modal State
  const [cancelModalAssignment, setCancelModalAssignment] = useState<WorkAssignmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // 1. Fetch accessible projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const data = await projectService.getProjects({ size: 100, status: 'ACTIVE' });
        setProjects(data.content || []);
        if (data.content && data.content.length > 0) {
          setFormProjectId(data.content[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load projects', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // 2. Fetch project details when project changes (to get associated vendors and default PIN)
  useEffect(() => {
    if (!formProjectId) {
      setSelectedProjectDetail(null);
      return;
    }
    const fetchProjectDetails = async () => {
      try {
        const detail = await projectService.getProjectById(formProjectId);
        setSelectedProjectDetail(detail);
        if (detail.primaryPincode && !formPinCode) {
          setFormPinCode(detail.primaryPincode);
        }
      } catch (err) {
        console.error('Failed to load project details', err);
      }
    };
    fetchProjectDetails();
  }, [formProjectId]);

  // 3. Fetch matching work zones when project or PIN code changes
  useEffect(() => {
    if (!formProjectId || formPinCode.length !== 6) {
      setMatchingZones([]);
      setFormZoneId('');
      return;
    }

    const fetchZones = async () => {
      try {
        setLoadingZones(true);
        const data = await workZoneService.getWorkZones({
          projectId: formProjectId,
          pincode: formPinCode,
          size: 50,
        });
        setMatchingZones(data.content || []);
        if (data.content && data.content.length > 0) {
          setFormZoneId(data.content[0].id);
        } else {
          setFormZoneId('');
        }
      } catch (err) {
        console.error('Failed to load work zones for PIN', err);
        setMatchingZones([]);
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, [formProjectId, formPinCode]);

  // Compute eligible vendors: active project vendors qualified for selected work type
  const eligibleVendors: ProjectVendorAssociation[] = (selectedProjectDetail?.associatedVendors || []).filter((pv) => {
    if (pv.associationStatus !== 'ACTIVE' || pv.status !== 'ACTIVE') return false;
    // Check if vendor has the selected work type in serviceCategories
    return (pv.serviceCategories || []).includes(formWorkType);
  });

  // Automatically select first eligible vendor when list changes
  useEffect(() => {
    if (eligibleVendors.length > 0) {
      if (!formVendorId || !eligibleVendors.some(v => v.vendorId === formVendorId)) {
        setFormVendorId(eligibleVendors[0].vendorId);
      }
    } else {
      setFormVendorId('');
    }
  }, [eligibleVendors, formWorkType]);

  // 4. Fetch assignments ledger from backend
  const fetchAssignments = useCallback(async () => {
    try {
      setLoadingAssignments(true);
      setTableError(null);
      const data = await workAssignmentService.getAssignments({
        projectId: projectFilter !== 'ALL' ? projectFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        workType: workTypeFilter !== 'ALL' ? workTypeFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        search: search.trim() || undefined,
        page,
        size: pageSize,
      });
      setAssignments(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load assignments ledger from server';
      setTableError(msg);
    } finally {
      setLoadingAssignments(false);
    }
  }, [projectFilter, statusFilter, workTypeFilter, priorityFilter, search, page, pageSize]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Handle Form Submission Review Trigger
  const handleReviewSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formProjectId) {
      setFormError('Please select a master project.');
      return;
    }
    if (!formPinCode || formPinCode.length !== 6 || !/^\d{6}$/.test(formPinCode)) {
      setFormError('A valid 6-digit postal PIN code is mandatory.');
      return;
    }
    if (!formZoneId) {
      setFormError('Please select a specific work zone under this PIN code.');
      return;
    }
    if (!formVendorId) {
      setFormError('Please select an eligible, qualified vendor associated with this project.');
      return;
    }
    if (!formStartDate || !formEndDate) {
      setFormError('Both planned start date and target completion date are mandatory.');
      return;
    }
    if (new Date(formEndDate) < new Date(formStartDate)) {
      setFormError('Target completion date cannot be before planned start date.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Perform Real Assignment Creation
  const handleConfirmCreate = async () => {
    try {
      setSubmitting(true);
      setFormError(null);

      const zoneObj = matchingZones.find(z => z.id === formZoneId);
      const generatedTitle = formTitle.trim() || `${WORK_TYPE_OPTIONS.find(w => w.code === formWorkType)?.label || formWorkType} — ${zoneObj?.zoneName || 'Work Zone'}`;

      const res = await workAssignmentService.createAssignment({
        projectId: formProjectId,
        workZoneId: formZoneId,
        vendorId: formVendorId,
        workType: formWorkType,
        title: generatedTitle,
        description: formDescription.trim() || undefined,
        plannedStartDate: formStartDate,
        targetEndDate: formEndDate,
        priority: formPriority,
        instructions: formInstructions.trim() || undefined,
      });

      setShowConfirmModal(false);
      setSuccessToast({
        code: res.assignmentCode,
        message: `Work package ${res.assignmentCode} created and assigned to ${res.vendorName} successfully!`,
      });

      // Reset directives
      setFormTitle('');
      setFormDescription('');
      setFormInstructions('');

      // Refresh Table
      fetchAssignments();

      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err: any) {
      const backendMsg = err.response?.data?.message || err.message || 'Work assignment creation failed';
      setFormError(backendMsg);
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Assignment Cancellation
  const handleConfirmCancel = async () => {
    if (!cancelModalAssignment) return;
    if (!cancelReason.trim()) {
      setCancelError('A meaningful cancellation reason is required.');
      return;
    }

    try {
      setCancelling(true);
      setCancelError(null);
      await workAssignmentService.cancelAssignment(cancelModalAssignment.id, {
        reason: cancelReason.trim(),
      });
      setCancelModalAssignment(null);
      setCancelReason('');
      fetchAssignments();
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Failed to cancel work assignment.');
    } finally {
      setCancelling(false);
    }
  };

  const selectedZone = matchingZones.find(z => z.id === formZoneId);
  const selectedVendor = eligibleVendors.find(v => v.vendorId === formVendorId);

  return (
    <PageContainer>
      <PageHeader
        title="PIN-Code-Based Work Allocation & Assignment Management"
        subtitle="Centralized infrastructure package assignment engine with real PostgreSQL persistence, PIN-zone mapping, and vendor qualification validation."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Stage 05 Live Engine
          </span>
        }
      />

      {/* Success Notification Banner */}
      {successToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl shadow-sm text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Assignment Confirmed: {successToast.code}</p>
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

      {/* Main 2-Column Allocation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column (7 cols): Production Allocation Form */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Issue Infrastructure Work Assignment
              </h3>
              <p className="text-xs text-ink-secondary">
                Select project, PIN code, zone parcel, qualified vendor, and timeline
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-ink-muted uppercase tracking-wider">
              RBAC Verified
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Validation Error:</span> {formError}
              </div>
            </div>
          )}

          <form onSubmit={handleReviewSubmission} className="space-y-4 text-xs">
            {/* Step 1: Master Project Selection */}
            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Step 1 — Master Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                disabled={loadingProjects || !canAllocate}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} ({p.projectCode}) — {p.district}, {p.state} [{p.status}]
                  </option>
                ))}
              </select>
              {selectedProjectDetail && (
                <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-muted">
                  <span>Type: <strong>{selectedProjectDetail.projectType}</strong></span>
                  <span>•</span>
                  <span>Default PIN: <strong>{selectedProjectDetail.primaryPincode}</strong></span>
                  <span>•</span>
                  <span>Vendors: <strong>{selectedProjectDetail.associatedVendors?.length || 0} registered</strong></span>
                </div>
              )}
            </div>

            {/* Step 2 & 3: PIN Code & Geographical Work Zone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Step 2 — Postal PIN Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={formPinCode}
                    onChange={(e) => setFormPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 600040"
                    disabled={!canAllocate}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none font-mono"
                  />
                </div>
                <span className="text-[10px] text-ink-muted">
                  Enter 6 digits to discover sub-zones
                </span>
              </div>

              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Step 3 — Specific Work Zone <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formZoneId}
                  onChange={(e) => setFormZoneId(e.target.value)}
                  disabled={loadingZones || matchingZones.length === 0 || !canAllocate}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none cursor-pointer"
                >
                  {matchingZones.length === 0 ? (
                    <option value="">
                      {loadingZones ? 'Loading work zones...' : 'No zones mapped for this PIN'}
                    </option>
                  ) : (
                    matchingZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.zoneName} ({z.zoneCode}) — {z.locality} [{z.status}]
                      </option>
                    ))
                  )}
                </select>
                <span className="text-[10px] text-ink-muted">
                  {matchingZones.length} parcel(s) located in PIN {formPinCode}
                </span>
              </div>
            </div>

            {/* Step 4: Infrastructure Work Type */}
            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Step 4 — Infrastructure Work Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formWorkType}
                onChange={(e) => setFormWorkType(e.target.value as WorkTypeEnum)}
                disabled={!canAllocate}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none cursor-pointer font-medium"
              >
                {WORK_TYPE_OPTIONS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.label} — {w.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 5: Contracted Eligible Vendor */}
            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Step 5 — Contracted & Qualified Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                value={formVendorId}
                onChange={(e) => setFormVendorId(e.target.value)}
                disabled={eligibleVendors.length === 0 || !canAllocate}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none cursor-pointer"
              >
                {eligibleVendors.length === 0 ? (
                  <option value="">
                    No active associated vendor with '{formWorkType}' qualification
                  </option>
                ) : (
                  eligibleVendors.map((v) => (
                    <option key={v.vendorId} value={v.vendorId}>
                      {v.companyName} ({v.vendorCode}) • Contact: {v.contactPerson}
                    </option>
                  ))
                )}
              </select>
              {eligibleVendors.length === 0 && (
                <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    No vendors associated with this project possess the <strong>{formWorkType}</strong> capability. Associate a qualified vendor in Project Management first.
                  </span>
                </div>
              )}
            </div>

            {/* Step 6: Dates, Priority & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Planned Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  disabled={!canAllocate}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Target Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  disabled={!canAllocate}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Assignment Priority <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as AssignmentPriorityEnum)}
                  disabled={!canAllocate}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            {/* Directives & Instructions */}
            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Package Title (Optional)
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Primary Cable Trenching - Sector 1"
                disabled={!canAllocate}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Work Instructions & Directives
              </label>
              <textarea
                rows={2}
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                placeholder="Safety precautions, municipal clearance IDs, night shift allowances..."
                disabled={!canAllocate}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none focus:bg-white"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">
                Assignments are committed transactionally with sequence codes (INF-WA-YYYY-XXXXXX).
              </span>
              <button
                type="submit"
                disabled={!canAllocate || eligibleVendors.length === 0 || matchingZones.length === 0}
                className="px-5 py-2.5 bg-navy-900 text-white rounded-lg font-semibold text-xs hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-teal-400" />
                <span>Review & Create Assignment</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (5 cols): Work Zone Map & GIS Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
              <h4 className="font-bold text-sm text-ink-primary flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                Geographical Work Zones ({matchingZones.length})
              </h4>
              <span className="text-[11px] text-teal-700 font-mono">
                PIN: {formPinCode || '—'}
              </span>
            </div>

            {matchingZones.length === 0 ? (
              <div className="py-8 text-center text-ink-muted text-xs">
                <p>No work zones registered for PIN code <strong>{formPinCode || 'none'}</strong> in this project.</p>
                <button
                  onClick={() => navigate('/work-zones')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
                >
                  Manage / Register Work Zones
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {matchingZones.map((z) => {
                  const isSelected = z.id === formZoneId;
                  return (
                    <div
                      key={z.id}
                      onClick={() => setFormZoneId(z.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-teal-500 bg-teal-50/50 shadow-sm' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-800">{z.zoneCode}</span>
                            <span className="font-semibold text-ink-primary">{z.zoneName}</span>
                          </div>
                          <p className="text-[11px] text-ink-secondary mt-0.5">
                            {z.locality}, {z.district}
                          </p>
                        </div>
                        <StatusBadge status={z.status} size="sm" />
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-ink-muted">
                        <span>Active Tasks: <strong>{z.activeAssignmentsCount}</strong></span>
                        {z.centerLatitude && z.centerLongitude ? (
                          <span className="font-mono text-[10px]">
                            {z.centerLatitude.toFixed(4)}, {z.centerLongitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="italic text-[10px]">No GPS set</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Civil Infrastructure Lifecycle Blueprint */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card text-xs">
            <h4 className="font-bold text-ink-primary mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-navy-800" />
              Stage 6 Prerequisite Rules Preview
            </h4>
            <p className="text-ink-secondary mb-3">
              Prerequisite sequence rules enforced by upcoming Stage 6 Dependency Engine:
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                <span className="font-semibold text-ink-primary">Trenching</span>
                <span className="text-ink-muted ml-auto text-[11px]">Excavation phase</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                <span className="font-semibold text-ink-primary">Cable / Conduit Laying</span>
                <span className="text-ink-muted ml-auto text-[11px]">Prerequisite: Approved trench</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                <span className="font-semibold text-ink-primary">Backfilling</span>
                <span className="text-ink-muted ml-auto text-[11px]">Prerequisite: Cable installed</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                <span className="font-semibold text-ink-primary">Road Resurfacing</span>
                <span className="text-rose-600 font-bold ml-auto text-[11px]">Requires approved backfill</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Work Assignment Ledger Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-surface-border space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <span>Active Work Allocation Ledger</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-ink-secondary">
                  {totalElements} total
                </span>
              </h3>
              <p className="text-xs text-ink-secondary">
                Database-persisted infrastructure work assignments across geographical zones
              </p>
            </div>

            <button
              onClick={fetchAssignments}
              disabled={loadingAssignments}
              className="px-3 py-1.5 text-xs font-semibold text-ink-primary bg-slate-50 border border-surface-border rounded-lg hover:bg-slate-100 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAssignments ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
            <div>
              <select
                value={projectFilter}
                onChange={(e) => { setProjectFilter(e.target.value); setPage(0); }}
                className="w-full px-2.5 py-1.5 border border-surface-border rounded-lg bg-slate-50 outline-none"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(0); }}
                className="w-full px-2.5 py-1.5 border border-surface-border rounded-lg bg-slate-50 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="SUBMITTED_FOR_REVIEW">SUBMITTED_FOR_REVIEW</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <select
                value={workTypeFilter}
                onChange={(e) => { setWorkTypeFilter(e.target.value as any); setPage(0); }}
                className="w-full px-2.5 py-1.5 border border-surface-border rounded-lg bg-slate-50 outline-none"
              >
                <option value="ALL">All Work Types</option>
                {WORK_TYPE_OPTIONS.map((w) => (
                  <option key={w.code} value={w.code}>{w.label}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value as any); setPage(0); }}
                className="w-full px-2.5 py-1.5 border border-surface-border rounded-lg bg-slate-50 outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search code, zone, vendor..."
                className="w-full pl-8 pr-2.5 py-1.5 border border-surface-border rounded-lg bg-slate-50 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loadingAssignments ? (
          <div className="py-12 text-center text-ink-muted text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
            <p>Loading work assignments from PostgreSQL...</p>
          </div>
        ) : tableError ? (
          <div className="py-12 text-center text-rose-600 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p>{tableError}</p>
            <button
              onClick={fetchAssignments}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
            >
              Retry
            </button>
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-12 text-center text-ink-muted text-xs">
            <p className="font-semibold text-ink-primary">No work assignments found</p>
            <p className="mt-1">Try adjusting the filters or issue a new work package using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-surface-border text-ink-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Assignment ID</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">PIN / Zone</th>
                  <th className="py-3 px-4">Work Category</th>
                  <th className="py-3 px-4">Contracted Vendor</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-ink-primary">
                {assignments.map((asn) => (
                  <tr key={asn.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {asn.assignmentCode}
                    </td>
                    <td className="py-3 px-4 font-semibold max-w-[150px] truncate" title={asn.projectName}>
                      {asn.projectName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{asn.zoneName}</div>
                      <div className="text-[11px] text-ink-muted font-mono">PIN: {asn.pincode}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {asn.workTypeDisplayName || asn.workType}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{asn.vendorName}</div>
                      <div className="text-[10px] text-ink-muted">{asn.vendorCode}</div>
                    </td>
                    <td className="py-3 px-4 text-ink-secondary text-[11px] whitespace-nowrap">
                      {asn.plannedStartDate} → {asn.targetEndDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        asn.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        asn.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        asn.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {asn.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={asn.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/work-allocation/${asn.id}`)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors flex items-center gap-1"
                          title="Inspect Assignment Details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        {canCancel && asn.status !== 'CANCELLED' && asn.status !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setCancelModalAssignment(asn);
                              setCancelReason('');
                              setCancelError(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
                            title="Cancel Assignment"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted">
            <span>Page {page + 1} of {totalPages} ({totalElements} total assignments)</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-surface-border rounded bg-slate-50 disabled:opacity-50 hover:bg-slate-100 font-semibold"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-surface-border rounded bg-slate-50 disabled:opacity-50 hover:bg-slate-100 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Infrastructure Work Package Allocation"
          subtitle="Please verify the project and zone allocation details before committing to database."
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-surface-border rounded-lg text-xs font-semibold text-ink-secondary hover:bg-slate-50"
              >
                Go Back & Edit
              </button>
              <button
                onClick={handleConfirmCreate}
                disabled={submitting}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 flex items-center gap-1.5"
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Create</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-muted">Project:</span>
                <span className="font-semibold text-ink-primary">{selectedProjectDetail?.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">PIN Code & Zone:</span>
                <span className="font-semibold text-ink-primary">{selectedZone?.zoneName} (PIN: {formPinCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Work Category:</span>
                <span className="font-semibold text-teal-700">{WORK_TYPE_OPTIONS.find(w => w.code === formWorkType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Contracted Vendor:</span>
                <span className="font-semibold text-ink-primary">{selectedVendor?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Timeline:</span>
                <span className="font-semibold text-ink-primary">{formStartDate} → {formEndDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Priority:</span>
                <span className="font-bold text-ink-primary">{formPriority}</span>
              </div>
            </div>

            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded text-[11px] text-teal-800">
              💡 Upon creation, the vendor will immediately view this assignment in their <strong>My Work</strong> portal and can review/accept the package.
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {cancelModalAssignment && (
        <Modal
          isOpen={!!cancelModalAssignment}
          onClose={() => setCancelModalAssignment(null)}
          title={`Cancel Work Assignment: ${cancelModalAssignment.assignmentCode}`}
          subtitle="Cancelling will update the assignment lifecycle status and preserve full audit history."
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCancelModalAssignment(null)}
                disabled={cancelling}
                className="px-4 py-2 border border-surface-border rounded-lg text-xs font-semibold text-ink-secondary hover:bg-slate-50"
              >
                Abort
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling || !cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {cancelling && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            {cancelError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                {cancelError}
              </div>
            )}
            <p className="text-ink-secondary">
              Provide an administrative reason for cancelling <strong>{cancelModalAssignment.assignmentCode}</strong> ({cancelModalAssignment.workTypeDisplayName}):
            </p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Municipal road widening postponed; realignment approved by chief engineer..."
              className="w-full px-3 py-2 border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-xs"
            />
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
