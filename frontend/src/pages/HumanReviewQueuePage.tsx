import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Ruler, 
  Wrench, 
  RefreshCw, 
  UserCheck, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { humanReviewService } from '../services/humanReviewService';
import { HumanReviewSummaryDto, ReviewStatus, ReviewPriority } from '../types/humanReview';
import { useAuth } from '../auth/useAuth';

export const HumanReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reviews, setReviews] = useState<HumanReviewSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reviewer assignment modal state
  const [assigningReview, setAssigningReview] = useState<HumanReviewSummaryDto | null>(null);
  const [reviewerIdInput, setReviewerIdInput] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (activeTab !== 'ALL') params.status = activeTab;
      if (selectedPriority !== 'ALL') params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await humanReviewService.getReviewQueue(params);
      setReviews(res.content || []);
    } catch (err: unknown) {
      console.error('Failed to load review queue:', err);
      setError('Unable to load inspection review queue. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReview) return;
    try {
      setIsAssigning(true);
      const assignedId = reviewerIdInput.trim() || user?.id || '';
      await humanReviewService.assignReviewer(assigningReview.id, assignedId);
      setAssigningReview(null);
      setReviewerIdInput('');
      await fetchQueue();
    } catch (err: unknown) {
      console.error('Failed to assign reviewer:', err);
      alert('Failed to assign reviewer. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Quick metrics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'PENDING').length;
    const inReview = reviews.filter(r => r.status === 'IN_REVIEW').length;
    const pendingMeasurements = reviews.reduce((acc, r) => acc + (r.pendingMeasurementsCount || 0), 0);
    const openRework = reviews.reduce((acc, r) => acc + (r.openCorrectiveActionsCount || 0), 0);
    const escalated = reviews.filter(r => r.status === 'ESCALATED' || r.priority === 'CRITICAL').length;
    return { total, pending, inReview, pendingMeasurements, openRework, escalated };
  }, [reviews]);

  const getPriorityBadge = (p: ReviewPriority) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-600/30">LOW</span>;
    }
  };

  const getStatusBadge = (s: ReviewStatus) => {
    switch (s) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30"><Clock className="w-3 h-3" /> PENDING</span>;
      case 'IN_REVIEW':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30"><RefreshCw className="w-3 h-3 animate-spin" /> IN REVIEW</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> COMPLETED</span>;
      case 'ESCALATED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30"><ShieldAlert className="w-3 h-3" /> ESCALATED</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-800 text-slate-400">{s}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Quality Inspection & Human Review</h1>
              <p className="text-sm text-slate-400">
                Authoritative human engineering decisions, onsite physical measurement verification, and corrective rework governance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchQueue()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-600 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Queue</span>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-400">Total assessments</span>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending</span>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.pending}</div>
          <span className="text-[11px] text-slate-400">Awaiting reviewer</span>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">In Review</span>
          <div className="text-2xl font-bold text-sky-300 mt-1">{stats.inReview}</div>
          <span className="text-[11px] text-slate-400">Actively evaluating</span>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Measurements</span>
          <div className="text-2xl font-bold text-purple-300 mt-1">{stats.pendingMeasurements}</div>
          <span className="text-[11px] text-slate-400">Dipstick / tests needed</span>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Open Rework</span>
          <div className="text-2xl font-bold text-orange-300 mt-1">{stats.openRework}</div>
          <span className="text-[11px] text-slate-400">Active corrective actions</span>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Escalated</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{stats.escalated}</div>
          <span className="text-[11px] text-slate-400">Critical / Dispute</span>
        </div>
      </div>

      {/* Filtering Bar */}
      <div className="bg-navy-800/90 border border-navy-700 rounded-xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-navy-900/80 p-1 rounded-lg border border-navy-700/60">
            {['ALL', 'PENDING', 'IN_REVIEW', 'COMPLETED', 'ESCALATED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === tab
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-navy-800'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search & Priority Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search code, zone, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </form>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                aria-label="Filter by priority"
                className="bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Queue List Table */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
            <span className="text-sm">Fetching human inspection reviews...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80" />
            <div className="text-base font-semibold text-slate-200">No Inspection Reviews Found</div>
            <p className="text-xs text-slate-400 max-w-md">
              There are currently no reviews matching your filters. When quality assessments are generated from submitted vendor evidence, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Review ID</th>
                  <th className="py-3 px-4">Work Zone / Project</th>
                  <th className="py-3 px-4">Vendor & Work Type</th>
                  <th className="py-3 px-4">Evidence & Findings</th>
                  <th className="py-3 px-4">Onsite Requirements</th>
                  <th className="py-3 px-4">Status & Priority</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60 text-xs">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-700/30 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-teal-300">
                      <div>{r.reviewCode}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">{r.assignmentCode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white truncate max-w-[180px]">{r.workZoneName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {r.projectName} ({r.pincode})
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{r.vendorName}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-navy-900 text-teal-400 border border-teal-500/20 rounded text-[10px]">
                        {r.workType?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 font-semibold">{r.evidenceCompletenessScore?.toFixed(0)}%</span>
                        <span className="text-[10px] text-slate-400">completeness</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[11px]">
                        <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold">
                          {r.passedCount}P
                        </span>
                        <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold">
                          {r.flaggedCount}F
                        </span>
                        <span className="px-1.5 py-0.2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-semibold">
                          {r.failedCount}X
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1 text-[11px]">
                        {r.pendingMeasurementsCount > 0 ? (
                          <div className="flex items-center gap-1.5 text-purple-300">
                            <Ruler className="w-3.5 h-3.5" />
                            <span>{r.pendingMeasurementsCount} measurement(s)</span>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-[10px]">No pending measurements</div>
                        )}

                        {r.openCorrectiveActionsCount > 0 && (
                          <div className="flex items-center gap-1.5 text-orange-400 font-medium">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{r.openCorrectiveActionsCount} rework notice(s)</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div>{getStatusBadge(r.status)}</div>
                        <div className="mt-0.5">{getPriorityBadge(r.priority)}</div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {r.assignedReviewerName ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-200">
                          <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                          <span>{r.assignedReviewerName}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssigningReview(r)}
                          className="px-2 py-1 bg-navy-900 hover:bg-navy-700 text-teal-400 border border-teal-500/30 rounded text-[11px] font-medium transition"
                        >
                          + Assign Reviewer
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/human-review/${r.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-semibold transition group shadow-sm"
                      >
                        Open Workspace
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Reviewer Modal */}
      {assigningReview && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-navy-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                Assign Reviewer
              </h3>
              <button
                onClick={() => setAssigningReview(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Assign inspection review <strong className="text-teal-300">{assigningReview.reviewCode}</strong> to a Field Engineer or Project Manager for authoritative assessment.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reviewer User ID (or assign to self)</label>
                <input
                  type="text"
                  placeholder={user?.fullName ? `Assign to me (${user.fullName})` : 'Enter Reviewer User ID'}
                  value={reviewerIdInput}
                  onChange={(e) => setReviewerIdInput(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank to self-assign as current operator ({user?.fullName || 'Current User'}).
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-navy-800">
                <button
                  type="button"
                  onClick={() => setAssigningReview(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg text-xs shadow-md disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HumanReviewQueuePage;
