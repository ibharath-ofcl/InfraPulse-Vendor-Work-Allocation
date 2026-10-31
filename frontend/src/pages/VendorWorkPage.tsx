import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Play,
  XCircle,
  AlertCircle,
  Search,
  MapPin,
  Calendar,
  RotateCw,
  HardHat,
  ChevronRight
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { workAssignmentService } from '../services/workAssignmentService';
import { WorkAssignmentItem, AssignmentStatusEnum } from '../types/workAssignment';

export const VendorWorkPage: React.FC = () => {
  const [assignments, setAssignments] = useState<WorkAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Action modal
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignmentItem | null>(null);
  const [actionType, setActionType] = useState<'ACCEPT' | 'REJECT' | 'START' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMyAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workAssignmentService.getVendorMyAssignments();
      setAssignments(data.content);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch vendor work assignments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyAssignments();
  }, [fetchMyAssignments]);

  const metrics = useMemo(() => {
    return {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === 'ASSIGNED').length,
      accepted: assignments.filter((a) => a.status === 'ACCEPTED').length,
      inProgress: assignments.filter((a) => a.status === 'IN_PROGRESS').length,
      closed: assignments.filter((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'REJECTED').length,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && a.status === 'ASSIGNED') ||
        (statusFilter === 'ACCEPTED' && a.status === 'ACCEPTED') ||
        (statusFilter === 'IN_PROGRESS' && a.status === 'IN_PROGRESS') ||
        (statusFilter === 'CLOSED' && (a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'REJECTED'));

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.assignmentCode.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.projectName.toLowerCase().includes(q) ||
        a.zoneName.toLowerCase().includes(q) ||
        a.pincode.includes(q) ||
        a.workTypeDisplayName.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [assignments, statusFilter, search]);

  const handleActionConfirm = async () => {
    if (!selectedAssignment || !actionType) return;
    try {
      setActionSubmitting(true);
      setActionError(null);

      let targetStatus: AssignmentStatusEnum = 'ACCEPTED';
      let reason: string | undefined = undefined;

      if (actionType === 'ACCEPT') {
        targetStatus = 'ACCEPTED';
      } else if (actionType === 'REJECT') {
        targetStatus = 'REJECTED';
        reason = rejectReason.trim();
      } else if (actionType === 'START') {
        targetStatus = 'IN_PROGRESS';
      }

      await workAssignmentService.updateAssignmentStatus(selectedAssignment.id, {
        status: targetStatus,
        reason,
      });

      setSelectedAssignment(null);
      setActionType(null);
      setRejectReason('');
      await fetchMyAssignments();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to update work assignment status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Vendor Work Orders"
        subtitle="Manage and execute assigned infrastructure work packages across authorized geographical zones."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5" />
            Vendor Portal
          </span>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white border-surface-border hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80">Total Orders</div>
          <div className="text-2xl font-bold mt-1">{metrics.total}</div>
        </button>

        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white border-surface-border hover:border-amber-300'
          }`}
        >
          <div className={`text-xs font-medium ${statusFilter === 'PENDING' ? 'text-amber-100' : 'text-amber-700'}`}>
            Pending Acceptance
          </div>
          <div className={`text-2xl font-bold mt-1 ${statusFilter === 'PENDING' ? 'text-white' : 'text-amber-600'}`}>
            {metrics.pending}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('ACCEPTED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'ACCEPTED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white border-surface-border hover:border-emerald-300'
          }`}
        >
          <div className={`text-xs font-medium ${statusFilter === 'ACCEPTED' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Accepted Work
          </div>
          <div className={`text-2xl font-bold mt-1 ${statusFilter === 'ACCEPTED' ? 'text-white' : 'text-emerald-600'}`}>
            {metrics.accepted}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white border-surface-border hover:border-blue-300'
          }`}
        >
          <div className={`text-xs font-medium ${statusFilter === 'IN_PROGRESS' ? 'text-blue-100' : 'text-blue-700'}`}>
            In Progress
          </div>
          <div className={`text-2xl font-bold mt-1 ${statusFilter === 'IN_PROGRESS' ? 'text-white' : 'text-blue-600'}`}>
            {metrics.inProgress}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('CLOSED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'CLOSED'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md'
              : 'bg-white border-surface-border hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium text-slate-500">Completed / Closed</div>
          <div className="text-2xl font-bold mt-1 text-slate-700">{metrics.closed}</div>
        </button>
      </div>

      {/* Search Bar & Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, project, work zone, or PIN..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>

        <button
          onClick={fetchMyAssignments}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Orders
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-medium">Fetching authorized work orders...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-6 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Unable to load vendor orders</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAssignments.length === 0 && (
        <div className="bg-white rounded-xl border border-surface-border p-12 text-center shadow-card">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No Work Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'No assignments match your current search or filter criteria.'
              : 'There are currently no active infrastructure work packages assigned to your vendor profile.'}
          </p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && filteredAssignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-xl border border-surface-border p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Code & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {assignment.assignmentCode}
                  </span>
                  <StatusBadge status={assignment.status} />
                </div>

                {/* Title & Priority */}
                <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">{assignment.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityStyle(assignment.priority)}`}>
                    {assignment.priority}
                  </span>
                  <span className="text-[10px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {assignment.workTypeDisplayName}
                  </span>
                </div>

                {/* Project & Geographical Context */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{assignment.projectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono text-slate-800">
                      PIN: {assignment.pincode} • {assignment.zoneName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {assignment.plannedStartDate} → {assignment.targetEndDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* If ASSIGNED: Vendor can Accept or Reject */}
                {assignment.status === 'ASSIGNED' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setActionType('ACCEPT');
                        handleActionConfirm();
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setActionType('REJECT');
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}

                {/* If ACCEPTED: Vendor can Start Work */}
                {assignment.status === 'ACCEPTED' && (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setActionType('START');
                      handleActionConfirm();
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Work Operations
                  </button>
                )}

                {/* If IN_PROGRESS: In field notice */}
                {assignment.status === 'IN_PROGRESS' && (
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center text-[11px] font-medium text-blue-800">
                    Operations in Progress on Site
                  </div>
                )}

                {/* View Detail Link */}
                <Link
                  to={`/work-allocation/${assignment.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  View Details & Instructions
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={actionType === 'REJECT'}
        onClose={() => {
          setActionType(null);
          setSelectedAssignment(null);
          setRejectReason('');
          setActionError(null);
        }}
        title="Decline Work Assignment"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide a valid rationale for rejecting assignment{' '}
            <strong className="text-slate-900">{selectedAssignment?.assignmentCode}</strong>.
            This explanation will be shared with the project director.
          </p>

          {actionError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Resource constraints in specified work zone during the scheduled dates..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActionType(null);
                setSelectedAssignment(null);
                setRejectReason('');
              }}
              disabled={actionSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleActionConfirm}
              disabled={actionSubmitting || !rejectReason.trim()}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
            >
              {actionSubmitting ? 'Declining...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
