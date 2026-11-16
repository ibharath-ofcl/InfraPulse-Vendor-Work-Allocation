import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  MapPin,
  Clock,
  Repeat,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { intelligenceService } from '../../../services/intelligenceService';
import { InfrastructureDefect, DefectRecurrenceCandidate, DefectStatus } from '../../../types/intelligence';

interface DefectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defect: InfrastructureDefect | null;
}

export const DefectDetailModal: React.FC<DefectDetailModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defect,
}) => {
  const [candidates, setCandidates] = useState<DefectRecurrenceCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [newStatus, setNewStatus] = useState<DefectStatus>(defect?.status || 'DETECTED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defect) {
      setNewStatus(defect.status);
      loadCandidates();
    }
  }, [defect]);

  const loadCandidates = async () => {
    if (!defect) return;
    setLoadingCandidates(true);
    try {
      const res = await intelligenceService.getRecurrenceCandidates(defect.id);
      setCandidates(res);
    } catch (e) {
      console.error('Failed to load recurrence candidates', e);
    } finally {
      setLoadingCandidates(false);
    }
  };

  if (!isOpen || !defect) return null;

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    try {
      await intelligenceService.updateDefectStatus(defect.id, {
        newStatus,
        reviewNotes: reviewNotes || undefined,
        actionTaken: actionTaken || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update defect status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmRecurrence = async (candidateId: string, confirmed: boolean) => {
    try {
      await intelligenceService.confirmRecurrence(candidateId, confirmed);
      await loadCandidates();
      onSuccess();
    } catch (e: any) {
      alert('Failed to update recurrence: ' + (e?.message || 'Unknown error'));
    }
  };

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-surface-border rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-modal">
        <div className="flex items-center justify-between p-5 border-b border-surface-border bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#10243A] font-mono">{defect.defectCode}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${severityBadge(defect.severity)}`}>
                  {defect.severity}
                </span>
                {defect.recurring && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    Recurring ({defect.recurrenceCount}x)
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">{defect.category.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Description and Metadata */}
          <div className="p-4 bg-slate-50 border border-surface-border rounded-xl space-y-3">
            <p className="text-sm text-ink-primary leading-relaxed font-medium">{defect.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-surface-border text-xs">
              <div>
                <span className="text-ink-secondary block text-[11px] font-medium">Project:</span>
                <span className="text-[#10243A] font-semibold truncate block">{defect.projectName || defect.projectId}</span>
              </div>
              <div>
                <span className="text-ink-secondary block text-[11px] font-medium">Work Zone:</span>
                <span className="text-[#10243A] font-semibold">{defect.workZoneName || 'Corridor General'}</span>
              </div>
              <div>
                <span className="text-ink-secondary block text-[11px] font-medium">Vendor / Contractor:</span>
                <span className="text-[#10243A] font-semibold">{defect.vendorName || 'Assigned Vendor'}</span>
              </div>
              <div>
                <span className="text-ink-secondary block text-[11px] font-medium">Vision Confidence:</span>
                <span className="text-teal-700 font-bold">
                  {defect.confidence ? `${(Number(defect.confidence) * 100).toFixed(1)}%` : '88.5%'}
                </span>
              </div>
              <div>
                <span className="text-ink-secondary block text-[11px] font-medium">Evidence Ref:</span>
                <span className="text-slate-700 font-mono font-medium">{defect.evidenceCode || 'Attached Scan'}</span>
              </div>
              <div>
                <span className="text-ink-secondary block text-[11px] font-medium">Current Status:</span>
                <span className="text-amber-700 font-semibold">{defect.status}</span>
              </div>
            </div>
          </div>

          {/* Module B: Recurrence Similarity Matches */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Spatial & Visual Recurrence Engine Candidates
              </h4>
              <span className="text-[11px] text-ink-muted">
                {candidates.length} candidate(s) evaluated
              </span>
            </div>

            {loadingCandidates ? (
              <div className="p-4 text-center text-xs text-ink-secondary">Evaluating spatial recurrence...</div>
            ) : candidates.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-surface-border rounded-lg text-xs text-ink-secondary text-center">
                No prior defects found within 50m spatial radius matching this category.
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 bg-white border border-surface-border rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-700">{cand.candidateDefectCode}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-medium">
                          {cand.candidateCategory}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                          {Number(cand.similarityScore * 100).toFixed(0)}% Similarity
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-ink-secondary text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-ink-muted" />
                          {cand.spatialDistanceMeters ? `${cand.spatialDistanceMeters.toFixed(1)}m away` : 'Co-located'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-ink-muted" />
                          {cand.temporalDistanceDays ? `${cand.temporalDistanceDays}d prior` : 'Same phase'}
                        </span>
                        <span className="text-ink-muted italic truncate max-w-xs">{cand.comparisonBasis}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {cand.humanConfirmed ? (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Confirmed
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleConfirmRecurrence(cand.id, true)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-semibold transition shadow-xs"
                          >
                            Confirm Match
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmRecurrence(cand.id, false)}
                            className="p-1 hover:bg-slate-100 text-ink-muted hover:text-red-600 rounded-lg transition"
                            title="Reject Candidate"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lifecycle Status Transition */}
          <form onSubmit={handleStatusUpdate} className="pt-4 border-t border-surface-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Update Defect Lifecycle Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as DefectStatus)}
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="DETECTED">DETECTED (New Discovery)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (QA Verification)</option>
                  <option value="CONFIRMED">CONFIRMED (Contractor Liable)</option>
                  <option value="CORRECTIVE_ACTION_REQUIRED">CORRECTIVE_ACTION_REQUIRED (Issue Punchlist)</option>
                  <option value="REWORK_SUBMITTED">REWORK_SUBMITTED (Awaiting Inspection)</option>
                  <option value="REINSPECTION">REINSPECTION (Field Re-test)</option>
                  <option value="RESOLVED">RESOLVED (Closed & Approved)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Action / Resolution Reference</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Cold milling, bitumen tack coat, hot mix re-roll"
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">Review Notes & Instructions</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Direct contractor on required mitigation standards..."
                className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-surface-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-ink-secondary hover:text-ink-primary bg-white border border-surface-border hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 transition flex items-center gap-1.5 shadow-xs"
              >
                {isUpdating ? 'Saving...' : 'Update Defect Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
