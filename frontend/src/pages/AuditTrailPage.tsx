import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Lock, 
  Key, 
  Hash, 
  ChevronRight
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { auditService } from '../services/auditService';
import { 
  AuditEventItem, 
  AuditCategory, 
  AuditOutcome, 
  AuditIntegrityReport 
} from '../types/analytics';
import { useAuth } from '../auth/useAuth';

export const AuditTrailPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AuditCategory | 'ALL'>('ALL');
  const [outcome, setOutcome] = useState<AuditOutcome | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);
  const [singleVerifyResult, setSingleVerifyResult] = useState<boolean | null>(null);
  const [singleVerifyLoading, setSingleVerifyLoading] = useState(false);

  // Chain integrity verification
  const [integrityReport, setIntegrityReport] = useState<AuditIntegrityReport | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditService.getAuditEvents({
        search: search.trim() || undefined,
        category,
        outcome,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: 15,
      });
      setEvents(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Failed to load audit events', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, outcome, startDate, endDate, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleVerifyChain = async () => {
    try {
      setVerifyingChain(true);
      const report = await auditService.verifyChainIntegrity('GLOBAL');
      setIntegrityReport(report);
      setShowIntegrityModal(true);
    } catch (err) {
      console.error('Failed to verify audit chain', err);
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleVerifySingle = async (eventId: string) => {
    try {
      setSingleVerifyLoading(true);
      const valid = await auditService.verifySingleEvent(eventId);
      setSingleVerifyResult(valid);
    } catch (err) {
      console.error('Failed to verify single event', err);
      setSingleVerifyResult(false);
    } finally {
      setSingleVerifyLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!events.length) return;
    const headers = ['Event Code', 'Category', 'Event Type', 'Entity Type', 'Entity ID', 'Actor', 'Outcome', 'Created At', 'Event Hash', 'Previous Hash'];
    const rows = events.map(e => [
      `"${e.eventCode}"`,
      `"${e.eventCategory}"`,
      `"${e.eventType}"`,
      `"${e.entityType}"`,
      `"${e.entityReference || e.entityId}"`,
      `"${e.actorName || e.actorId || 'SYSTEM'}"`,
      `"${e.outcome}"`,
      `"${e.createdAt}"`,
      `"${e.eventHash || ''}"`,
      `"${e.previousHash || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `infrapulse_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOutcomeBadge = (out: AuditOutcome) => {
    switch (out) {
      case 'SUCCESS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> SUCCESS</span>;
      case 'FAILURE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200"><XCircle className="w-3 h-3" /> FAILURE</span>;
      case 'BLOCKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Lock className="w-3 h-3" /> BLOCKED</span>;
      case 'WARNING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"><AlertTriangle className="w-3 h-3" /> WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{out}</span>;
    }
  };

  const getCategoryBadge = (cat: AuditCategory) => {
    const map: Record<AuditCategory, { bg: string; text: string }> = {
      SECURITY_AUTH: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'Auth & Security' },
      WORK_ALLOCATION: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Work Allocation' },
      CONFLICT_RESOLUTION: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Conflict Engine' },
      EVIDENCE_AI: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', text: 'Evidence & AI' },
      QUALITY_INSPECTION: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'Quality Inspection' },
      FINANCIAL_WORKFLOW: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Finance (Simulated)' },
      PROJECT_MANAGEMENT: { bg: 'bg-slate-100 text-slate-700 border-slate-300', text: 'Project Mgmt' },
      SYSTEM_ADMINISTRATION: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'System Admin' },
    };
    const c = map[cat] || { bg: 'bg-slate-100 text-slate-700 border-slate-300', text: cat };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${c.bg}`}>{c.text}</span>;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Centralized Enterprise Audit Trail"
        subtitle="Cryptographically verifiable, tamper-evident SHA-256 hash-chained compliance ledger across all platform domains."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            <Lock className="w-3.5 h-3.5" /> SHA-256 Hash Chained
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {hasPermission('VERIFY_AUDIT_INTEGRITY') && (
              <button
                onClick={handleVerifyChain}
                disabled={verifyingChain}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg shadow-sm bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 transition"
              >
                <ShieldCheck className={`w-4 h-4 ${verifyingChain ? 'animate-spin' : ''}`} />
                {verifyingChain ? 'Verifying Chain...' : 'Verify Cryptographic Integrity'}
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, event type, actor, or description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value as any); setPage(0); }}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="SECURITY_AUTH">Auth & Security</option>
              <option value="WORK_ALLOCATION">Work Allocation</option>
              <option value="CONFLICT_RESOLUTION">Conflict Resolution</option>
              <option value="EVIDENCE_AI">Evidence & AI</option>
              <option value="QUALITY_INSPECTION">Quality Inspection</option>
              <option value="FINANCIAL_WORKFLOW">Financial Workflow</option>
              <option value="PROJECT_MANAGEMENT">Project Management</option>
              <option value="SYSTEM_ADMINISTRATION">System Admin</option>
            </select>
          </div>

          <div>
            <select
              value={outcome}
              onChange={(e) => { setOutcome(e.target.value as any); setPage(0); }}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
              <option value="BLOCKED">Blocked</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              className="w-1/2 py-2 px-2 text-xs border border-slate-300 rounded-lg"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              className="w-1/2 py-2 px-2 text-xs border border-slate-300 rounded-lg"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="text-sm font-semibold text-slate-700">
            Recorded Ledger Entries <span className="ml-1 text-xs font-normal text-slate-500">({totalElements} total)</span>
          </div>
          <button
            onClick={() => fetchEvents()}
            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
            Loading cryptographic audit records...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No audit records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Event Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action & Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {events.map((e) => (
                  <tr 
                    key={e.id}
                    onClick={() => { setSelectedEvent(e); setSingleVerifyResult(null); }}
                    className="hover:bg-teal-50/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                      {e.eventCode}
                      {e.sequenceNumber && (
                        <span className="block text-[10px] text-slate-400">Seq #{e.sequenceNumber}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getCategoryBadge(e.eventCategory)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{e.eventType}</span>
                      <span className="block text-xs text-slate-500">{e.action}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">{e.actorName || 'SYSTEM'}</span>
                      {e.actorRole && (
                        <span className="block text-[11px] text-slate-400">{e.actorRole}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{e.entityType}</span>
                      <span className="block text-xs text-slate-500 truncate max-w-[150px]">{e.entityReference || e.entityId}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getOutcomeBadge(e.outcome)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 inline text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing page {page + 1} of {Math.max(1, Math.ceil(totalElements / 15))}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * 15 >= totalElements}
              className="px-3 py-1 rounded border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-semibold text-teal-600 uppercase tracking-wider">{selectedEvent.eventCode}</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedEvent.eventType}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-xs font-medium text-slate-400 block">Category</span>
                  <span className="font-semibold text-slate-700">{selectedEvent.eventCategory}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 block">Outcome</span>
                  {getOutcomeBadge(selectedEvent.outcome)}
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 block">Actor</span>
                  <span className="font-semibold text-slate-700">{selectedEvent.actorName || 'SYSTEM'} ({selectedEvent.actorRole || 'SYSTEM'})</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 block">Timestamp</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedEvent.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Description</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{selectedEvent.description}</p>
              </div>

              {/* Cryptographic Hash Chaining Block */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-2 border border-slate-800">
                <div className="flex justify-between items-center text-teal-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1 font-semibold"><Hash className="w-3.5 h-3.5" /> Cryptographic Integrity Proof</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Scope: {selectedEvent.chainScope}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">SHA-256 Event Hash:</span>
                  <span className="text-emerald-400 break-all select-all">{selectedEvent.eventHash || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Previous Linked Hash:</span>
                  <span className="text-amber-300 break-all select-all">{selectedEvent.previousHash || 'GENESIS'}</span>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={() => handleVerifySingle(selectedEvent.id)}
                    disabled={singleVerifyLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs transition"
                  >
                    <Key className="w-3 h-3" />
                    {singleVerifyLoading ? 'Verifying...' : 'Verify Event Hash Now'}
                  </button>

                  {singleVerifyResult !== null && (
                    <span className={`text-xs font-bold ${singleVerifyResult ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {singleVerifyResult ? '✓ Cryptographically Valid' : '✗ Hash Mismatch / Tampered'}
                    </span>
                  )}
                </div>
              </div>

              {/* Payload inspection */}
              {selectedEvent.eventPayload && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Raw Event Payload (Immutable)</span>
                  <pre className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-slate-800 overflow-x-auto max-h-40 border border-slate-200">
                    {JSON.stringify(JSON.parse(selectedEvent.eventPayload), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Chain Integrity Modal */}
      {showIntegrityModal && integrityReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
              {integrityReport.status === 'VALID' ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cryptographic Chain Verification</h3>
                <span className="text-xs text-slate-500">Partition Scope: {integrityReport.chainScope}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="block text-xs text-slate-400 font-medium">Status</span>
                  <span className={`text-sm font-bold ${integrityReport.status === 'VALID' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {integrityReport.status}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="block text-xs text-slate-400 font-medium">Events Checked</span>
                  <span className="text-sm font-bold text-slate-800">{integrityReport.totalEventsChecked}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="block text-xs text-slate-400 font-medium">Valid Blocks</span>
                  <span className="text-sm font-bold text-emerald-600">{integrityReport.validEventsCount}</span>
                </div>
              </div>

              {integrityReport.violations && integrityReport.violations.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
                  <span className="font-bold block">Chain Violations Detected:</span>
                  <ul className="list-disc list-inside">
                    {integrityReport.violations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Verified at: {new Date(integrityReport.verifiedAt).toLocaleString()}. Every audit event in the partition has been sequentially validated against its preceding SHA-256 hash digest.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowIntegrityModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition"
              >
                Close Verification Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
