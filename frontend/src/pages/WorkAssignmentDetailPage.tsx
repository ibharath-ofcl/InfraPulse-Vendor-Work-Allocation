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
  Info
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { workAssignmentService } from '../services/workAssignmentService';
import { useAuth } from '../auth/useAuth';
import { WorkAssignmentItem, AssignmentStatusEnum } from '../types/workAssignment';

export const WorkAssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [assignment, setAssignment] = useState<WorkAssignmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Action Modal (Reject / Cancel)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'CANCEL' | 'REJECT' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
              <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  Stage 6: Dependency Engine
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Predecessor verification ensures road resurfacing follows completed trenching without overlapping conflicts.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-1">
                  <Camera className="w-3.5 h-3.5" />
                  Stage 7: Evidence Submission
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Geo-tagged photographic evidence capture with automated spatial verification for field compliance.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-1">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Stage 7: Quality Inspection
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  AI-assisted computer vision defect detection and field engineer multi-point certification.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-1">
                  <Landmark className="w-3.5 h-3.5" />
                  Stage 8: Milestone Approval
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Deliverable-linked milestone signoff with automated financial release authorization.
                </p>
              </div>
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
    </PageContainer>
  );
};
