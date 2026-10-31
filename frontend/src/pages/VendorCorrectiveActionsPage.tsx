import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  ShieldAlert
} from 'lucide-react';
import { humanReviewService } from '../services/humanReviewService';
import { CorrectiveActionDto } from '../types/humanReview';

export const VendorCorrectiveActionsPage: React.FC = () => {
  const [actions, setActions] = useState<CorrectiveActionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Submit proof modal state
  const [submittingAction, setSubmittingAction] = useState<CorrectiveActionDto | null>(null);
  const [evidenceIdInput, setEvidenceIdInput] = useState<string>('');
  const [vendorNotes, setVendorNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchMyActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await humanReviewService.getMyVendorCorrectiveActions();
      setActions(data || []);
    } catch (err: unknown) {
      console.error('Failed to load vendor corrective actions:', err);
      setError('Unable to fetch your corrective rework notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyActions();
  }, []);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAction || !evidenceIdInput.trim()) return;

    try {
      setIsSubmitting(true);
      await humanReviewService.submitReworkEvidence(submittingAction.id, {
        evidenceId: evidenceIdInput.trim(),
        vendorReworkNotes: vendorNotes.trim() || undefined,
        submissionComment: 'Vendor submitted remediation proof for engineering verification.'
      });
      setSubmittingAction(null);
      setEvidenceIdInput('');
      setVendorNotes('');
      await fetchMyActions();
    } catch (err: any) {
      console.error('Failed to submit rework proof:', err);
      alert(err.response?.data?.message || 'Failed to submit proof. Please ensure evidence ID is valid.');
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Vendor Remediation & Rework Portal</h1>
            <p className="text-sm text-slate-400">
              Review engineer defect notices, implement field remediation, and upload photo evidence for inspector verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMyActions()}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-600 rounded-lg text-sm font-medium transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
          Refresh Notices
        </button>
      </div>

      {/* Strict Vendor Governance Notice */}
      <div className="bg-navy-900 border border-orange-500/40 rounded-xl p-4 flex items-start gap-3 shadow-md">
        <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-orange-300">Engineering Governance & Verification Policy</div>
          <p className="text-slate-300 leading-relaxed">
            As an assigned vendor, you may review engineer defect descriptions and submit photographic proof of remediation. 
            Per compliance standards, <strong className="text-white">vendors cannot self-approve or close corrective actions</strong>. 
            Once you submit proof, a certified Field Engineer or Project Manager will verify compliance onsite and clear the notice.
          </p>
        </div>
      </div>

      {/* Rework Notices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
            <span className="text-sm">Fetching your rework notices...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : actions.length === 0 ? (
          <div className="p-12 bg-navy-800/40 border border-navy-700/60 rounded-xl text-center text-slate-400 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80" />
            <div className="text-base font-semibold text-slate-200">No Outstanding Corrective Actions</div>
            <p className="text-xs text-slate-400 max-w-md">
              Congratulations! All your submitted work assignments are compliant with no open defect notices.
            </p>
          </div>
        ) : (
          actions.map((ca) => (
            <div
              key={ca.id}
              className={`bg-navy-800/80 border rounded-xl p-5 space-y-4 shadow transition ${
                ca.status === 'SUBMITTED_FOR_VERIFICATION'
                  ? 'border-sky-500/40'
                  : ca.status === 'VERIFIED_CLOSED'
                  ? 'border-emerald-500/30'
                  : 'border-orange-500/40 ring-1 ring-orange-500/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-300 px-2 py-0.5 bg-navy-950 rounded border border-orange-500/30">
                      {ca.actionCode}
                    </span>
                    <span className="font-bold text-white text-base">{ca.actionType.replace(/_/g, ' ')}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      ca.status === 'VERIFIED_CLOSED'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : ca.status === 'SUBMITTED_FOR_VERIFICATION'
                        ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {ca.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-rose-300 font-medium mt-1">
                    Defect Identified by Inspector: {ca.problemDescription}
                  </div>

                  <div className="text-xs text-slate-200 leading-relaxed">
                    Required Rework: <strong className="text-white">{ca.requiredAction}</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  {ca.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Due: {new Date(ca.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {ca.status !== 'VERIFIED_CLOSED' && (
                    <button
                      onClick={() => setSubmittingAction(ca)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-navy-950 font-bold rounded-lg text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      Submit Rework Proof
                    </button>
                  )}

                  {ca.status === 'VERIFIED_CLOSED' && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified & Cleared by Inspector</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submitted Proof Section */}
              {ca.evidenceList && ca.evidenceList.length > 0 && (
                <div className="bg-navy-950/70 rounded-lg p-3 border border-navy-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    Uploaded Proofs Pending Engineering Sign-off ({ca.evidenceList.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {ca.evidenceList.map((ev) => (
                      <div key={ev.id} className="p-2 bg-navy-900 rounded border border-navy-800 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-teal-300 font-semibold">{ev.evidenceCode}</span>
                          <span className="text-slate-500">{new Date(ev.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-slate-300 text-xs">{ev.vendorNotes || 'Proof submitted'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Submit Rework Proof Modal */}
      {submittingAction && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-navy-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-400" />
                Submit Remediation Proof
              </h3>
              <button onClick={() => setSubmittingAction(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Provide photographic proof of completed rework for defect notice <strong className="text-orange-300">{submittingAction.actionCode}</strong>.
            </p>

            <form onSubmit={handleSubmitProof} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Work Evidence ID / Storage Key (Mandatory)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Evidence ID from Evidence Center"
                  value={evidenceIdInput}
                  onChange={(e) => setEvidenceIdInput(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Upload photographic proof to Evidence Center first, then enter its Evidence ID here.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Vendor Remediation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the corrective steps performed onsite (e.g., excavated to 1.25m depth, installed warning tape 30cm above conduit)..."
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-navy-800">
                <button
                  type="button"
                  onClick={() => setSubmittingAction(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-navy-950 font-bold rounded-lg text-xs shadow-md transition"
                >
                  {isSubmitting ? 'Submitting Proof...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorCorrectiveActionsPage;
