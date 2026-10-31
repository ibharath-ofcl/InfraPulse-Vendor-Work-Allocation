import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  Code2,
  Lock,
  Hash,
  User,
  Clock
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { auditService } from '../services/auditService';
import { AuditEventItem, AuditOutcome, AuditCategory } from '../types/analytics';

export const ProjectActivityPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<AuditOutcome | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'ALL'>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<{ [id: string]: 'idle' | 'verifying' | 'valid' | 'invalid' }>({});

  const fetchActivity = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await auditService.getProjectActivity(projectId, page, pageSize);
      setEvents(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Failed to load project activity:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, page, pageSize]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleVerifyEvent = async (eventItem: AuditEventItem) => {
    setVerifyStatus((prev) => ({ ...prev, [eventItem.id]: 'verifying' }));
    try {
      const isValid = await auditService.verifySingleEvent(eventItem.id);
      setVerifyStatus((prev) => ({ ...prev, [eventItem.id]: isValid ? 'valid' : 'invalid' }));
    } catch {
      setVerifyStatus((prev) => ({ ...prev, [eventItem.id]: 'invalid' }));
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedOutcome !== 'ALL' && e.outcome !== selectedOutcome) return false;
    if (selectedCategory !== 'ALL' && e.eventCategory !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.action?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.actorName?.toLowerCase().includes(q) ||
        e.eventCode?.toLowerCase().includes(q) ||
        e.entityType?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getOutcomeBadge = (outcome: AuditOutcome) => {
    switch (outcome) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Blocked
          </span>
        );
      case 'FAILURE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Failure
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {outcome}
          </span>
        );
    }
  };

  return (
    <PageContainer>
      <div className="mb-4">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Project Detail</span>
        </Link>
      </div>

      <PageHeader
        title="Project Activity & Audit Timeline"
        subtitle={`Cryptographic audit log trail and immutable activity feed for Project #${projectId}`}
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            {totalElements} Events Recorded
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/audit-trail"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Global Audit Trail
            </Link>
            <button
              onClick={fetchActivity}
              disabled={loading}
              className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search actions, actors, descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value as AuditOutcome | 'ALL')}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">Success</option>
              <option value="BLOCKED">Blocked</option>
              <option value="FAILURE">Failure</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as AuditCategory | 'ALL')}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="ALL">All Categories</option>
              <option value="PROJECT_MANAGEMENT">Project Management</option>
              <option value="WORK_ALLOCATION">Work Allocation</option>
              <option value="EVIDENCE_AI">Evidence &amp; AI</option>
              <option value="HUMAN_REVIEW">Quality &amp; Inspection</option>
              <option value="FINANCIAL_WORKFLOW">Financial Workflow</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-12 text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading project audit trail...
          </div>
        )}

        {!loading && filteredEvents.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-surface-border shadow-card">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">No Activity Events Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              No audit events match the current filter criteria for this project.
            </p>
          </div>
        )}

        {!loading && filteredEvents.map((eventItem) => {
          const status = verifyStatus[eventItem.id] || 'idle';
          return (
            <div
              key={eventItem.id}
              className="bg-white rounded-xl p-4 border border-surface-border shadow-card hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {eventItem.eventCode || eventItem.action}
                      </span>
                      {getOutcomeBadge(eventItem.outcome)}
                      <span className="text-xs text-slate-500">
                        Entity: <span className="font-semibold text-slate-700">{eventItem.entityType}</span> ({eventItem.entityId?.slice(0, 8)})
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1">
                      {eventItem.description || eventItem.action}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {eventItem.actorName || 'System'} ({eventItem.actorRole || 'SYSTEM'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(eventItem.createdAt).toLocaleString()}
                      </span>
                      {eventItem.sequenceNumber !== undefined && (
                        <span className="flex items-center gap-1 font-mono">
                          <Hash className="w-3 h-3" />
                          Seq #{eventItem.sequenceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verification & Payload Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {status === 'valid' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SHA-256 Valid
                    </span>
                  )}
                  {status === 'invalid' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Tampered
                    </span>
                  )}
                  {status === 'idle' && (
                    <button
                      onClick={() => handleVerifyEvent(eventItem)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1"
                      title="Verify event cryptographic signature"
                    >
                      <Lock className="w-3 h-3 text-slate-500" />
                      Verify Hash
                    </button>
                  )}
                  {status === 'verifying' && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 px-2 py-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-teal-600" />
                      Verifying...
                    </span>
                  )}

                  <button
                    onClick={() => setSelectedEvent(eventItem)}
                    className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 flex items-center gap-1"
                  >
                    <Code2 className="w-3 h-3 text-teal-600" />
                    Payload
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalElements > pageSize && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-700">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= totalElements}
              className="px-3 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Raw Event Payload Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  Canonical Audit Payload &amp; Cryptographic Proof
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block">Event Code:</span>
                  <span className="font-bold text-slate-700">{selectedEvent.eventCode || selectedEvent.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Chain Scope:</span>
                  <span className="font-bold text-slate-700">{selectedEvent.chainScope}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sequence Number:</span>
                  <span className="font-bold text-slate-700">#{selectedEvent.sequenceNumber ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Outcome:</span>
                  <span className="font-bold text-slate-700">{selectedEvent.outcome}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Event Hash (SHA-256):</span>
                  <span className="text-teal-700 break-all">{selectedEvent.eventHash || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Previous Hash:</span>
                  <span className="text-slate-600 break-all">{selectedEvent.previousHash || 'GENESIS'}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Normalized Event Payload:</span>
                <pre className="p-3 bg-slate-900 text-teal-400 rounded-lg overflow-x-auto text-[11px] font-mono whitespace-pre-wrap">
                  {selectedEvent.eventPayload
                    ? JSON.stringify(JSON.parse(selectedEvent.eventPayload), null, 2)
                    : JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
export default ProjectActivityPage;
