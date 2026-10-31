import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Camera, 
  UserCheck, 
  RefreshCw, 
  Calendar
} from 'lucide-react';
import { humanReviewService } from '../services/humanReviewService';
import { CorrectiveActionDto, CorrectiveActionStatus } from '../types/humanReview';

export const CorrectiveActionsPage: React.FC = () => {
  const [actions, setActions] = useState<CorrectiveActionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Verification modal state
  const [verifyingAction, setVerifyingAction] = useState<CorrectiveActionDto | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (activeTab !== 'ALL') params.status = activeTab;
      if (selectedPriority !== 'ALL') params.priority = selectedPriority;

      const res = await humanReviewService.getCorrectiveActions(params);
      setActions(res.content || []);
    } catch (err: unknown) {
      console.error('Failed to load corrective actions:', err);
      setError('Unable to fetch corrective rework notices from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [activeTab, selectedPriority]);

  const handleVerifySubmit = async (approved: boolean) => {
    if (!verifyingAction) return;
    try {
      setIsVerifying(true);
      await humanReviewService.verifyCorrectiveAction(verifyingAction.id, {
        approved,
        resolutionNotes: resolutionNotes || (approved ? 'Rework verified and compliant' : 'Rework rejected - re-work required')
      });
      setVerifyingAction(null);
      setResolutionNotes('');
      await fetchActions();
    } catch (err: any) {
      console.error('Failed to verify corrective action:', err);
      alert(err.response?.data?.message || 'Failed to submit verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return actions;
    const q = searchQuery.toLowerCase();
    return actions.filter(
      (a) =>
        a.actionCode.toLowerCase().includes(q) ||
        a.actionType.toLowerCase().includes(q) ||
        a.problemDescription.toLowerCase().includes(q)
    );
  }, [actions, searchQuery]);

  const stats = useMemo(() => {
    const total = actions.length;
    const open = actions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length;
    const awaitingVerification = actions.filter((a) => a.status === 'SUBMITTED_FOR_VERIFICATION').length;
    const closed = actions.filter((a) => a.status === 'VERIFIED_CLOSED').length;
    return { total, open, awaitingVerification, closed };
  }, [actions]);

  const getStatusBadge = (s: CorrectiveActionStatus) => {
    switch (s) {
      case 'OPEN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30"><Clock className="w-3 h-3" /> OPEN</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30"><Wrench className="w-3 h-3" /> IN PROGRESS</span>;
      case 'SUBMITTED_FOR_VERIFICATION':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30"><Camera className="w-3 h-3" /> AWAITING INSPECTOR</span>;
      case 'VERIFIED_CLOSED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> VERIFIED & CLOSED</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/30"><AlertTriangle className="w-3 h-3" /> REJECTED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">{s}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700/60 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Corrective Action & Rework Ledger</h1>
            <p className="text-sm text-slate-400">
              Field Engineer and Project Manager oversight of civil defects, warning tape remediation, and vendor rework proof.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchActions()}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-600 rounded-lg text-sm font-medium transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Notices</span>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-400">Across all projects</span>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Open / In Progress</span>
          <div className="text-2xl font-bold text-rose-300 mt-1">{stats.open}</div>
          <span className="text-[11px] text-slate-400">Vendor remediation required</span>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Awaiting Verification</span>
          <div className="text-2xl font-bold text-sky-300 mt-1">{stats.awaitingVerification}</div>
          <span className="text-[11px] text-slate-400">Vendor uploaded proof</span>
        </div>

        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Verified & Closed</span>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.closed}</div>
          <span className="text-[11px] text-slate-400">Remediation cleared</span>
        </div>
      </div>

      {/* Filtering Bar */}
      <div className="bg-navy-800/90 border border-navy-700 rounded-xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-navy-900/80 p-1 rounded-lg border border-navy-700/60">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'SUBMITTED_FOR_VERIFICATION', 'VERIFIED_CLOSED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === tab
                    ? 'bg-orange-500 text-navy-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-navy-800'
                }`}
              >
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action code, defect..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                aria-label="Filter by priority"
                className="bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
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

      {/* Corrective Actions Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
            <span className="text-sm">Loading corrective actions...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="p-12 bg-navy-800/40 border border-navy-700/60 rounded-xl text-center text-slate-400 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80" />
            <div className="text-base font-semibold text-slate-200">No Corrective Actions Found</div>
            <p className="text-xs text-slate-400 max-w-md">
              No rework notices match your active filters. All inspection criteria are either compliant or have already been resolved.
            </p>
          </div>
        ) : (
          filteredActions.map((ca) => (
            <div
              key={ca.id}
              className={`bg-navy-800/80 border rounded-xl p-5 space-y-4 shadow-md transition ${
                ca.status === 'SUBMITTED_FOR_VERIFICATION'
                  ? 'border-sky-500/40 ring-1 ring-sky-500/20'
                  : ca.status === 'OPEN'
                  ? 'border-rose-500/40'
                  : 'border-navy-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-300 px-2 py-0.5 bg-navy-950 rounded border border-orange-500/20">
                      {ca.actionCode}
                    </span>
                    <span className="font-bold text-white text-base">{ca.actionType.replace(/_/g, ' ')}</span>
                    <div>{getStatusBadge(ca.status)}</div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-navy-900 text-slate-300 border border-navy-700">
                      Priority: {ca.priority}
                    </span>
                  </div>

                  <div className="text-xs text-rose-300 font-medium mt-1">
                    Defect Identified: {ca.problemDescription}
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed">
                    Required Remediation: <strong className="text-white">{ca.requiredAction}</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  {ca.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Due: {new Date(ca.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {ca.status === 'SUBMITTED_FOR_VERIFICATION' && (
                    <button
                      onClick={() => setVerifyingAction(ca)}
                      className="px-3.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      Verify Vendor Proof
                    </button>
                  )}

                  {ca.status === 'VERIFIED_CLOSED' && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Closed by {ca.verifiedByName || 'Field Engineer'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Submitted Evidence Gallery */}
              {ca.evidenceList && ca.evidenceList.length > 0 && (
                <div className="bg-navy-950/70 rounded-lg p-3.5 border border-navy-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-teal-400" />
                    Submitted Vendor Proof Documents ({ca.evidenceList.length})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {ca.evidenceList.map((ev) => (
                      <div key={ev.id} className="p-2.5 bg-navy-900 rounded border border-navy-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-teal-300 text-[11px] font-semibold">{ev.evidenceCode}</span>
                          <span className="text-[10px] text-slate-500">{new Date(ev.submittedAt).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-200 text-xs">{ev.vendorNotes || 'Remediation proof uploaded by vendor.'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Verify Action Modal */}
      {verifyingAction && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-navy-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                Sign-off Corrective Action
              </h3>
              <button onClick={() => setVerifyingAction(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Evaluating remediation proof submitted for notice <strong className="text-orange-300">{verifyingAction.actionCode}</strong>.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Inspector Sign-off Comments</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail verification results, physical inspection observations, or reasons for rejection..."
                className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-navy-800">
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleVerifySubmit(false)}
                className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition"
              >
                Reject Rework
              </button>
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleVerifySubmit(true)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold rounded-lg text-xs shadow-md transition"
              >
                {isVerifying ? 'Verifying...' : 'Approve & Close Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CorrectiveActionsPage;
