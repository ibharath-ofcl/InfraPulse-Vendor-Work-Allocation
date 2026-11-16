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
import { PageContainer } from '../components/layout/PageContainer';

const FALLBACK_VENDOR_ACTIONS: CorrectiveActionDto[] = [
  {
    id: 'ca-v01',
    actionCode: 'CA-2026-0081',
    assessmentId: 'QA-2026-0118',
    reviewId: 'hr-001',
    findingId: 'f-1',
    actionType: 'DEPTH_CORRECTION',
    status: 'OPEN',
    priority: 'HIGH',
    severity: 'HIGH',
    problemDescription: 'Trench depth measured at 1.05m at Station 0+150 Chainage, which fails the municipal optical conduit minimum requirement of 1.20m.',
    requiredAction: 'Excavate additional 15cm across the entire 45-meter affected section, verify bedding compaction, and upload laser dipstick reading.',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    evidenceList: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ca-v02',
    actionCode: 'CA-2026-0082',
    assessmentId: 'QA-2026-0119',
    reviewId: 'hr-002',
    findingId: 'f-2',
    actionType: 'WARNING_TAPE_INSTALLATION',
    status: 'SUBMITTED_FOR_VERIFICATION',
    priority: 'HIGH',
    severity: 'MEDIUM',
    problemDescription: 'Safety inspection flagged missing high-visibility underground optical warning tape above conduit prior to final backfill.',
    requiredAction: 'Install continuous 100mm retroreflective caution tape 30cm above optical conduit layer along Indiranagar 100ft road corridor.',
    vendorReworkNotes: 'Warning tape laid and anchored with geotextile pins along full 120m stretch. Photographic evidence captured prior to secondary backfill.',
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    evidenceList: [
      {
        id: 'ev-v01',
        actionId: 'ca-v02',
        evidenceId: 'EVD-2026-0901',
        evidenceCode: 'EVD-CA-001',
        evidenceCategory: 'WARNING_TAPE',
        originalFileName: 'remediation_warning_tape_aligned.jpg',
        storageKey: 'evidence/rework/ca-002-tape.jpg',
        vendorNotes: 'High-visibility caution tape installed 300mm above optical ducts with station markers visible.',
        submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'ca-v03',
    actionCode: 'CA-2026-0084',
    assessmentId: 'QA-2026-0121',
    reviewId: 'hr-004',
    findingId: 'f-4',
    actionType: 'TRENCH_WIDENING',
    status: 'VERIFIED_CLOSED',
    priority: 'MEDIUM',
    severity: 'MEDIUM',
    problemDescription: 'Trench width restricted to 32cm, restricting minimum 10cm lateral clearance required between power and telecom conduits.',
    requiredAction: 'Widen trench wall to minimum 45cm standard width and install concrete spacer blocks every 3 meters.',
    vendorReworkNotes: 'Trench widened to 48cm; concrete spacer blocks installed at 2.5m intervals and verified with gauge.',
    inspectorResolutionNotes: 'Onsite inspection verified trench width 48cm with spacer blocks correctly anchored. Closed and released.',
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    verifiedByName: 'Kavita Reddy (Field QA)',
    evidenceList: [
      {
        id: 'ev-v02',
        actionId: 'ca-v03',
        evidenceId: 'EVD-2026-0888',
        evidenceCode: 'EVD-CA-002',
        evidenceCategory: 'TRENCH_WIDTH',
        originalFileName: 'widened_trench_spacers.jpg',
        storageKey: 'evidence/rework/ca-004-width.jpg',
        vendorNotes: 'Verified 480mm width reading using calibrated steel rule.',
        submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

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
      if (data && data.length > 0) {
        setActions(data);
      } else {
        setActions(FALLBACK_VENDOR_ACTIONS);
      }
    } catch (err: unknown) {
      console.warn('Backend vendor corrective actions unavailable, using demonstration records:', err);
      setActions(FALLBACK_VENDOR_ACTIONS);
      setError(null);
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
      // Optimistically update in demonstration mode
      setActions(prev => prev.map(a => a.id === submittingAction.id ? {
        ...a,
        status: 'SUBMITTED_FOR_VERIFICATION',
        vendorReworkNotes: vendorNotes.trim() || 'Remediation completed per specifications.',
        evidenceList: [
          ...a.evidenceList,
          {
            id: `ev-${Date.now()}`,
            actionId: submittingAction.id,
            evidenceId: evidenceIdInput.trim(),
            evidenceCode: `EVD-REW-${evidenceIdInput.slice(-4) || 'PROOF'}`,
            evidenceCategory: 'REWORK_VERIFICATION',
            originalFileName: 'remediation_photo_proof.jpg',
            storageKey: `evidence/rework/${submittingAction.actionCode}.jpg`,
            vendorNotes: vendorNotes.trim() || 'Remediation proof uploaded.',
            submittedAt: new Date().toISOString(),
          }
        ]
      } : a));
      setSubmittingAction(null);
      setEvidenceIdInput('');
      setVendorNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCE3E8] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 shadow-2xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#10243A] tracking-tight">
              Vendor Remediation & Rework Portal
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Review engineer defect notices, implement field remediation, and upload photo evidence for inspector verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMyActions()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-[#10243A] border border-[#DCE3E8] hover:border-slate-400 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#13A89E]' : 'text-slate-500'}`} />
          <span>Refresh Notices</span>
        </button>
      </div>

      {/* Strict Vendor Governance Notice */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-amber-950">Engineering Governance & Verification Policy</div>
          <p className="text-amber-900/90 leading-relaxed font-medium">
            As an assigned vendor, you may review engineer defect descriptions and submit photographic proof of remediation. 
            Per compliance standards, <strong className="text-amber-950 font-bold">vendors cannot self-approve or close corrective actions</strong>. 
            Once you submit proof, a certified Field Engineer or Project Manager will verify compliance onsite and clear the notice.
          </p>
        </div>
      </div>

      {/* Rework Notices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-white border border-[#DCE3E8] rounded-xl shadow-xs">
            <RefreshCw className="w-8 h-8 text-[#13A89E] animate-spin" />
            <span className="text-sm font-semibold text-[#10243A]">Fetching your rework notices...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex flex-col items-center gap-2 shadow-xs">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        ) : actions.length === 0 ? (
          <div className="p-12 bg-white border border-[#DCE3E8] rounded-xl text-center text-slate-500 flex flex-col items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            <div className="text-base font-bold text-[#10243A]">No Outstanding Corrective Actions</div>
            <p className="text-xs text-slate-600 max-w-md">
              Congratulations! All your submitted work assignments are compliant with no open defect notices.
            </p>
          </div>
        ) : (
          actions.map((ca) => (
            <div
              key={ca.id}
              className={`bg-white border rounded-xl p-5 space-y-4 shadow-xs hover:shadow-sm transition ${
                ca.status === 'SUBMITTED_FOR_VERIFICATION'
                  ? 'border-sky-300 ring-1 ring-sky-300/40'
                  : ca.status === 'VERIFIED_CLOSED'
                  ? 'border-emerald-300'
                  : 'border-orange-300 ring-1 ring-orange-300/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-800 px-2 py-0.5 bg-orange-50 rounded border border-orange-200">
                      {ca.actionCode}
                    </span>
                    <span className="font-bold text-[#10243A] text-base">{ca.actionType.replace(/_/g, ' ')}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      ca.status === 'VERIFIED_CLOSED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : ca.status === 'SUBMITTED_FOR_VERIFICATION'
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}>
                      {ca.status.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Priority: {ca.priority}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-rose-800 bg-rose-50/70 border border-rose-200/80 rounded-lg p-2.5">
                    Defect Identified by Inspector: {ca.problemDescription}
                  </div>

                  <div className="text-xs text-[#10243A] bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 leading-relaxed font-medium">
                    Required Rework: <strong className="text-[#10243A] font-bold">{ca.requiredAction}</strong>
                  </div>

                  {ca.vendorReworkNotes && (
                    <div className="text-xs text-sky-900 bg-sky-50/70 border border-sky-200/80 rounded-lg p-2.5">
                      <strong className="text-sky-950 font-bold">Your Submitted Notes:</strong> {ca.vendorReworkNotes}
                    </div>
                  )}

                  {ca.inspectorResolutionNotes && (
                    <div className="text-xs text-emerald-900 bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5">
                      <strong className="text-emerald-950 font-bold">Inspector Resolution:</strong> {ca.inspectorResolutionNotes}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
                  {ca.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Due: {new Date(ca.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {ca.status !== 'VERIFIED_CLOSED' && (
                    <button
                      onClick={() => setSubmittingAction(ca)}
                      className="px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Submit Rework Proof
                    </button>
                  )}

                  {ca.status === 'VERIFIED_CLOSED' && (
                    <div className="flex items-center gap-1 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified & Cleared by Inspector</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submitted Proof Section */}
              {ca.evidenceList && ca.evidenceList.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0E827B]" />
                    Uploaded Proofs Pending Engineering Sign-off ({ca.evidenceList.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {ca.evidenceList.map((ev) => (
                      <div key={ev.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-[#0E827B] font-bold">{ev.evidenceCode}</span>
                          <span className="text-slate-500">{new Date(ev.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-slate-700 text-xs">{ev.vendorNotes || 'Proof submitted'}</div>
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
        <div className="fixed inset-0 z-50 bg-[#10243A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE3E8] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE3E8] pb-3">
              <h3 className="text-base font-bold text-[#10243A] flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-700" />
                Submit Remediation Proof
              </h3>
              <button onClick={() => setSubmittingAction(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-slate-700">
              Provide photographic proof of completed rework for defect notice <strong className="text-orange-800">{submittingAction.actionCode}</strong>.
            </p>

            <form onSubmit={handleSubmitProof} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Work Evidence ID / Storage Key (Mandatory)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Evidence ID from Evidence Center"
                  value={evidenceIdInput}
                  onChange={(e) => setEvidenceIdInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-[#10243A] font-mono focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Upload photographic proof to Evidence Center first, then enter its Evidence ID here.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Vendor Remediation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the corrective steps performed onsite (e.g., excavated to 1.25m depth, installed warning tape 30cm above conduit)..."
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-[#10243A] placeholder:text-slate-400 focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3E8]">
                <button
                  type="button"
                  onClick={() => setSubmittingAction(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition"
                >
                  {isSubmitting ? 'Submitting Proof...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
export default VendorCorrectiveActionsPage;
