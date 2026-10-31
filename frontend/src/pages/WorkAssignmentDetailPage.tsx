import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  MapPin,
  HardHat,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  Ban,
  Layers,
  Camera,
  FileCheck2,
  Landmark,
  Sparkles,
  Info,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { workAssignmentService } from '../services/workAssignmentService';
import { useAuth } from '../auth/useAuth';
import { WorkAssignmentItem, AssignmentStatusEnum, ReleaseStatusEnum } from '../types/workAssignment';
import { EvidenceUploadPanel } from '../components/evidence/EvidenceUploadPanel';
import { EvidenceGallery } from '../components/evidence/EvidenceGallery';

export const WorkAssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [assignment, setAssignment] = useState<WorkAssignmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evidenceRefreshKey, setEvidenceRefreshKey] = useState(0);

  // Status Action Modal (Reject / Cancel)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'CANCEL' | 'REJECT' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Stage 6 Prerequisite Release Modal State
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseDecision, setReleaseDecision] = useState<ReleaseStatusEnum>('RELEASED');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  const fetchAssignment = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await workAssignmentService.getAssignmentById(id);
      setAssignment(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load assignment details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleStatusTransition = async (newStatus: AssignmentStatusEnum, reason?: string) => {
    if (!id) return;
    try {
      setActionSubmitting(true);
      setActionError(null);
      if (newStatus === 'CANCELLED') {
        await workAssignmentService.cancelAssignment(id, { reason: reason || 'Administrative schedule cancellation' });
      } else {
        await workAssignmentService.updateAssignmentStatus(id, { status: newStatus, reason });
      }
      setIsActionModalOpen(false);
      setActionReason('');
      setActionType(null);
      await fetchAssignment();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || `Failed to transition status to ${newStatus}.`);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Stage 6: Prerequisite Release Action
  const handlePrerequisiteRelease = async () => {
    if (!id) return;
    if (!releaseNotes.trim()) {
      setReleaseError('A mandatory review note is required to record this operational release decision.');
      return;
    }
    try {
      setReleaseSubmitting(true);
      setReleaseError(null);
      await workAssignmentService.releasePrerequisite(id, {
        decision: releaseDecision,
        notes: releaseNotes.trim(),
      });
      setIsReleaseModalOpen(false);
      setReleaseNotes('');
      await fetchAssignment();
    } catch (err: any) {
      setReleaseError(err?.response?.data?.message || 'Failed to record prerequisite release decision.');
    } finally {
      setReleaseSubmitting(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const isTerminal = assignment?.status === 'COMPLETED' || assignment?.status === 'CANCELLED';
  const isVendor = user?.role === 'VENDOR';
  const canCancel = (hasPermission('WORK_ASSIGNMENT_CANCEL') || user?.role === 'PLATFORM_ADMIN' || user?.role === 'PROJECT_MANAGER') && !isTerminal;
  const canRelease = !isVendor && (
    user?.role === 'PLATFORM_ADMIN' ||
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'FIELD_ENGINEER' ||
    hasPermission('WORK_ASSIGNMENT_RELEASE')
  );

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Loading infrastructure work assignment...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !assignment) {
    return (
      <PageContainer>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center max-w-xl mx-auto my-12">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Assignment Not Accessible</h2>
          <p className="text-sm text-slate-600 mb-6">{error || 'Work assignment could not be found or you do not have permission to view it.'}</p>
          <button
            onClick={() => navigate('/work-allocation')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Work Allocation
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back button and quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          to={isVendor ? '/my-work' : '/work-allocation'}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isVendor ? 'Back to My Work' : 'Back to Work Allocation Ledger'}</span>
        </Link>

        {/* Operational Actions */}
        <div className="flex items-center gap-3">
          {/* Vendor Actions */}
          {isVendor && assignment.status === 'ASSIGNED' && (
            <>
              <button
                onClick={() => handleStatusTransition('ACCEPTED')}
                disabled={actionSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept Assignment
              </button>
              <button
                onClick={() => {
                  setActionType('REJECT');
                  setIsActionModalOpen(true);
                }}
                disabled={actionSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          {isVendor && assignment.status === 'ACCEPTED' && (
            <button
              onClick={() => handleStatusTransition('IN_PROGRESS')}
              disabled={actionSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Work
            </button>
          )}

          {/* Vendor Submit Completion */}
          {isVendor && assignment.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusTransition('COMPLETED', 'Vendor completed work and submitted for prerequisite release review')}
              disabled={actionSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete & Submit Work
            </button>
          )}

          {/* Authorized Operational Clearance Release */}
          {canRelease && (
            <button
              onClick={() => {
                setReleaseDecision(assignment.releaseStatus === 'REJECTED' ? 'RELEASED' : (assignment.releaseStatus || 'RELEASED'));
                setIsReleaseModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Review Prerequisite Release
            </button>
          )}

          {/* Admin / PM Cancel */}
          {canCancel && (
            <button
              onClick={() => {
                setActionType('CANCEL');
                setIsActionModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel Assignment
            </button>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                {assignment.assignmentCode}
              </span>
              <StatusBadge status={assignment.status} />
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getPriorityBadgeClass(assignment.priority)}`}>
                {assignment.priority} PRIORITY
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {assignment.workTypeDisplayName}
              </span>
              {assignment.releaseStatus && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  assignment.releaseStatus === 'RELEASED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : assignment.releaseStatus === 'PENDING_RELEASE'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  PREREQUISITE: {assignment.releaseStatus}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{assignment.title}</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              {assignment.description || 'No detailed scope description provided.'}
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end justify-center p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 shrink-0">
            <div>
              Assigned to: <strong className="text-slate-900">{assignment.vendorName}</strong>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Vendor Code: {assignment.vendorCode}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Project, Zone, Specs & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Geographical & Project Coordinates */}
          <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-teal-600" />
              Project & Geographical Work Zone
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Project Context</span>
                <span className="text-slate-900 font-semibold text-sm block mt-1">{assignment.projectName}</span>
                <span className="text-[11px] font-mono text-slate-500">{assignment.projectCode}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Allocated Work Zone</span>
                <span className="text-slate-900 font-semibold text-sm block mt-1">{assignment.zoneName}</span>
                <span className="text-[11px] font-mono text-slate-500">{assignment.zoneCode}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">PIN Code Area</span>
                <span className="text-slate-900 font-semibold text-sm block mt-1 font-mono">{assignment.pincode}</span>
                <span className="text-[11px] text-slate-500">{assignment.locality}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Work Category</span>
                <span className="text-slate-900 font-semibold text-sm block mt-1">{assignment.workTypeDisplayName}</span>
                <span className="text-[11px] font-mono text-slate-500">{assignment.workType}</span>
              </div>
            </div>
          </div>

          {/* Schedule & Timing */}
          <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-teal-600" />
              Execution Schedule
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Planned Start Date</span>
                <span className="text-slate-900 font-semibold text-sm block mt-1 font-mono">{assignment.plannedStartDate}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Target Completion Date</span>
                <span className="text-slate-900 font-semibold text-sm block mt-1 font-mono">{assignment.targetEndDate}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Actual Commencement</span>
                <span className="text-slate-900 font-semibold text-sm block mt-1 font-mono">
                  {assignment.actualStartDate || 'Not Yet Commenced'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Actual Completion</span>
                <span className="text-slate-900 font-semibold text-sm block mt-1 font-mono">
                  {assignment.actualEndDate || 'Incomplete'}
                </span>
              </div>
            </div>
          </div>

          {/* Work Instructions */}
          {assignment.instructions && (
            <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-teal-600" />
                Work Execution & Safety Instructions
              </h2>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                {assignment.instructions}
              </div>
            </div>
          )}

          {/* Rejection / Cancellation Notes */}
          {(assignment.cancellationReason || assignment.rejectionReason) && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {assignment.cancellationReason ? 'Cancellation Justification' : 'Vendor Rejection Rationale'}
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                {assignment.cancellationReason || assignment.rejectionReason}
              </p>
            </div>
          )}

          {/* Stage 6: Prerequisite Release & Work Dependency Governance */}
          <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Prerequisite Release & Dependency Governance
                </h2>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                assignment.releaseStatus === 'RELEASED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : assignment.releaseStatus === 'PENDING_RELEASE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {assignment.releaseStatus || 'PENDING_RELEASE'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-slate-500 font-medium block">Prerequisite Clearance State</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {assignment.releaseStatus === 'RELEASED'
                        ? 'Authorized Operational Clearance Granted'
                        : assignment.releaseStatus === 'REJECTED'
                        ? 'Prerequisite Clearance Denied (Remediation Required)'
                        : 'Awaiting Authorized Field Review & Release'}
                    </span>
                  </div>
                  {assignment.releaseStatus === 'RELEASED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : assignment.releaseStatus === 'REJECTED' ? (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                </div>

                {assignment.releasedBy && (
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Authorized Reviewer:</span>{' '}
                      <strong className="text-slate-800">{assignment.releasedBy.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Decision Recorded:</span>{' '}
                      <span className="font-mono text-slate-700">{assignment.releasedAt}</span>
                    </div>
                  </div>
                )}

                {assignment.releaseNotes && (
                  <div className="mt-2.5 p-2.5 rounded bg-white border border-slate-200 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-0.5">Authorization Review Note:</span>
                    <p className="italic text-slate-600">{assignment.releaseNotes}</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-teal-50/50 border border-teal-200/70 rounded-lg text-teal-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Backend Dependency Rule:</strong> Dependent infrastructure activities in work zone <strong>{assignment.zoneName}</strong> (such as Backfilling or Road Resurfacing) remain strictly blocked until this prerequisite work package has been completed and authorized for release.
                </div>
              </div>

              {canRelease && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setReleaseDecision(assignment.releaseStatus === 'REJECTED' ? 'RELEASED' : (assignment.releaseStatus || 'RELEASED'));
                      setIsReleaseModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>Record Prerequisite Release Decision</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stage 6 & Future Stages Placeholders */}
          <div className="bg-gradient-to-br from-slate-900 to-navy-900 rounded-xl p-6 text-white shadow-card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-sm text-white">Upcoming Lifecycle Modules</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Architectural Placeholders
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-teal-950/60 border border-teal-500/40">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                    <Layers className="w-3.5 h-3.5" />
                    Stage 6: Dependency Engine
                  </div>
                  <span className="text-[9px] font-bold text-teal-400 bg-teal-900/60 px-1.5 py-0.2 rounded border border-teal-500/30">
                    LIVE ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/70 leading-tight">
                  Sequential activity gating, transactional work zone locking, and authorized operational clearance verification.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-1">
                  <Camera className="w-3.5 h-3.5" />
                  Stage 8: Photo Evidence Vault
                </div>
                <p className="text-[11px] text-teal-100/70 leading-tight">
                  Cryptographic SHA-256 verified field photography with GPS telemetry and EXIF metadata preservation.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-1">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Stage 9 & 10: Quality Assessment
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  AI-assisted computer vision defect detection and explainable compliance findings.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-1">
                  <Landmark className="w-3.5 h-3.5" />
                  Stage 11: Human Inspection Review
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Field engineer review queue, physical measurement verification, and corrective actions.
                </p>
              </div>
            </div>
          </div>

          {/* Photo Evidence Management Section */}
          <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card space-y-6" id="work-assignment-evidence-section">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Photographic Field Evidence & Verification
                  </h2>
                  <p className="text-xs text-slate-500">
                    High-resolution site documentation with cryptographic SHA-256 integrity checks.
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Upload Panel */}
            <EvidenceUploadPanel
              assignmentId={assignment.id}
              onUploadSuccess={() => setEvidenceRefreshKey((k) => k + 1)}
            />

            {/* Evidence Gallery Grid */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Submitted Photographic Records
              </h3>
              <EvidenceGallery
                assignmentId={assignment.id}
                refreshKey={evidenceRefreshKey}
              />
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Vendor Profile & Activity Timeline */}
        <div className="space-y-6">
          {/* Vendor Card */}
          <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
              <HardHat className="w-4 h-4 text-teal-600" />
              Assigned Vendor
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Vendor Enterprise</span>
                <span className="text-slate-900 font-bold text-sm block mt-0.5">{assignment.vendorName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <span className="text-slate-500">Vendor Code</span>
                <span className="font-mono font-semibold text-slate-800">{assignment.vendorCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Primary Contact</span>
                <span className="font-medium text-slate-800">Authorized Personnel</span>
              </div>
              <div className="pt-2">
                <Link
                  to={`/vendors/${assignment.vendorId}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  View Vendor Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Activity Timeline (Real Events) */}
          <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-teal-600" />
              Recorded Audit Events
            </h2>
            <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
              {/* Event 1: Creation */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-teal-500 border-2 border-white ring-2 ring-teal-100"></span>
                <div className="font-semibold text-slate-900">Work Package Created</div>
                <div className="text-[11px] text-slate-500">
                  By {assignment.createdBy?.fullName || 'Project Admin'} ({assignment.createdBy?.email || 'System'})
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{assignment.createdAt}</div>
              </div>

              {/* Event 2: Vendor Assigned */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100"></span>
                <div className="font-semibold text-slate-900">Vendor Assigned</div>
                <div className="text-[11px] text-slate-500">Allocated to {assignment.vendorName}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{assignment.createdAt}</div>
              </div>

              {/* Event 3: Accepted / Rejected */}
              {(assignment.status === 'ACCEPTED' || assignment.status === 'IN_PROGRESS' || assignment.status === 'COMPLETED') && (
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-100"></span>
                  <div className="font-semibold text-slate-900">Assignment Accepted</div>
                  <div className="text-[11px] text-slate-500">Acknowledged by contractor</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{assignment.updatedAt}</div>
                </div>
              )}

              {assignment.status === 'REJECTED' && (
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-100"></span>
                  <div className="font-semibold text-slate-900">Assignment Rejected</div>
                  <div className="text-[11px] text-rose-600">Contractor declined assignment</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{assignment.updatedAt}</div>
                </div>
              )}

              {/* Event 4: Work Started */}
              {(assignment.status === 'IN_PROGRESS' || assignment.status === 'COMPLETED' || assignment.actualStartDate) && (
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white ring-2 ring-indigo-100"></span>
                  <div className="font-semibold text-slate-900">Physical Work Commenced</div>
                  <div className="text-[11px] text-slate-500">Field operations initiated</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{assignment.actualStartDate || assignment.updatedAt}</div>
                </div>
              )}

              {/* Event 5: Cancelled */}
              {assignment.status === 'CANCELLED' && (
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-100"></span>
                  <div className="font-semibold text-slate-900">Assignment Cancelled</div>
                  <div className="text-[11px] text-rose-600">Work package deactivated</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{assignment.updatedAt}</div>
                </div>
              )}

              {/* Event 6: Stage 6 Prerequisite Release Decision */}
              {assignment.releaseStatus && assignment.releaseStatus !== 'PENDING_RELEASE' && (
                <div className="relative">
                  <span className={`absolute -left-6 top-0.5 w-3 h-3 rounded-full border-2 border-white ring-2 ${
                    assignment.releaseStatus === 'RELEASED' ? 'bg-emerald-500 ring-emerald-100' : 'bg-rose-500 ring-rose-100'
                  }`} />
                  <div className="font-semibold text-slate-900">
                    Prerequisite Release {assignment.releaseStatus === 'RELEASED' ? 'Approved' : 'Rejected'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    By {assignment.releasedBy?.fullName || 'Authorized Field Engineer'} ({assignment.releasedBy?.email || 'System'})
                  </div>
                  {assignment.releaseNotes && (
                    <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded mt-1 border border-slate-200">
                      <strong>Review Note:</strong> {assignment.releaseNotes}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{assignment.releasedAt || assignment.updatedAt}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal (Cancel / Reject) */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setActionReason('');
          setActionType(null);
          setActionError(null);
        }}
        title={actionType === 'CANCEL' ? 'Cancel Work Assignment' : 'Reject Work Assignment'}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            {actionType === 'CANCEL'
              ? 'Please specify a valid operational reason for cancelling this infrastructure assignment. This action will be permanently recorded in the audit trail.'
              : 'Please provide the vendor rationale for declining this work assignment. Project administrators will be notified.'}
          </p>

          {actionError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {actionType === 'CANCEL' ? 'Cancellation Justification *' : 'Rejection Reason *'}
            </label>
            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Provide a detailed explanation..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsActionModalOpen(false)}
              disabled={actionSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                if (actionType === 'CANCEL') {
                  handleStatusTransition('CANCELLED', actionReason);
                } else if (actionType === 'REJECT') {
                  handleStatusTransition('REJECTED', actionReason);
                }
              }}
              disabled={actionSubmitting || !actionReason.trim()}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
            >
              {actionSubmitting ? 'Processing...' : actionType === 'CANCEL' ? 'Confirm Cancellation' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stage 6: Prerequisite Release Decision Modal */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => {
          setIsReleaseModalOpen(false);
          setReleaseNotes('');
          setReleaseError(null);
        }}
        title="Authorized Prerequisite Release Clearance"
      >
        <div className="space-y-4">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 leading-relaxed">
            <span className="font-semibold block mb-0.5">Operational Release Directive</span>
            Record an authorized operational clearance decision for <strong>{assignment.workTypeDisplayName}</strong> ({assignment.assignmentCode}) in work zone <strong>{assignment.zoneName}</strong>. Only released activities allow successor infrastructure work to proceed.
          </div>

          {releaseError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {releaseError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clearance Decision <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReleaseDecision('RELEASED')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  releaseDecision === 'RELEASED'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>RELEASED</span>
                </div>
                <span className="text-[11px] text-slate-600">
                  Grant operational clearance. Authorize dependent activities.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReleaseDecision('REJECTED')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  releaseDecision === 'REJECTED'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-950 ring-1 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-800">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>REJECTED</span>
                </div>
                <span className="text-[11px] text-slate-600">
                  Deny clearance. Block dependent work until remediated.
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Review Note / Field Verification Log <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="Record physical trenching inspection observations, municipal depth verification, clearance reference numbers..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsReleaseModalOpen(false)}
              disabled={releaseSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrerequisiteRelease}
              disabled={releaseSubmitting || !releaseNotes.trim()}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-sm transition-colors ${
                releaseDecision === 'RELEASED'
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
                  : 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
              }`}
            >
              {releaseSubmitting ? 'Recording Clearance...' : releaseDecision === 'RELEASED' ? 'Confirm Release Clearance' : 'Reject Prerequisite Clearance'}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
