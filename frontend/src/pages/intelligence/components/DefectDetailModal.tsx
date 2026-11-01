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
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white font-mono">{defect.defectCode}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${severityBadge(defect.severity)}`}>
                  {defect.severity}
                </span>
                {defect.recurring && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    Recurring ({defect.recurrenceCount}x)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{defect.category.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Description and Metadata */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
            <p className="text-sm text-slate-200 leading-relaxed">{defect.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Project:</span>
                <span className="text-slate-200 font-medium truncate block">{defect.projectName || defect.projectId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Work Zone:</span>
                <span className="text-slate-200 font-medium">{defect.workZoneName || 'Corridor General'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Vendor / Contractor:</span>
                <span className="text-slate-200 font-medium">{defect.vendorName || 'Assigned Vendor'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Vision Confidence:</span>
                <span className="text-cyan-400 font-semibold">
                  {defect.confidence ? `${(Number(defect.confidence) * 100).toFixed(1)}%` : '88.5%'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Evidence Ref:</span>
                <span className="text-slate-300 font-mono">{defect.evidenceCode || 'Attached Scan'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current Status:</span>
                <span className="text-amber-400 font-semibold">{defect.status}</span>
              </div>
            </div>
          </div>

          {/* Module B: Recurrence Similarity Matches */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Spatial & Visual Recurrence Engine Candidates
              </h4>
              <span className="text-[11px] text-slate-500">
                {candidates.length} candidate(s) evaluated
              </span>
            </div>

            {loadingCandidates ? (
              <div className="p-4 text-center text-xs text-slate-500">Evaluating spatial recurrence...</div>
            ) : candidates.length === 0 ? (
              <div className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-lg text-xs text-slate-500 text-center">
                No prior defects found within 50m spatial radius matching this category.
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-cyan-400">{cand.candidateDefectCode}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-300">
                          {cand.candidateCategory}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-950 text-purple-300 border border-purple-800">
                          {Number(cand.similarityScore * 100).toFixed(0)}% Similarity
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {cand.spatialDistanceMeters ? `${cand.spatialDistanceMeters.toFixed(1)}m away` : 'Co-located'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {cand.temporalDistanceDays ? `${cand.temporalDistanceDays}d prior` : 'Same phase'}
                        </span>
                        <span className="text-slate-500 italic truncate max-w-xs">{cand.comparisonBasis}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {cand.humanConfirmed ? (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Confirmed
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleConfirmRecurrence(cand.id, true)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-medium transition"
                          >
                            Confirm Match
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmRecurrence(cand.id, false)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition"
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
          <form onSubmit={handleStatusUpdate} className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Update Defect Lifecycle Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as DefectStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Action / Resolution Reference</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Cold milling, bitumen tack coat, hot mix re-roll"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Review Notes & Instructions</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Direct contractor on required mitigation standards..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 transition flex items-center gap-1.5 shadow-md shadow-cyan-950"
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
