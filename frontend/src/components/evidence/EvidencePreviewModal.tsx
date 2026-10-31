import React, { useState } from 'react';
import {
  X,
  Download,
  Calendar,
  MapPin,
  Camera,
  HardHat,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Shield,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { EvidenceDetail, EvidenceReviewStatus } from '../../types/evidence';
import { EvidenceIntegrityIndicator } from './EvidenceIntegrityIndicator';
import { evidenceService } from '../../services/evidenceService';
import { useAuth } from '../../auth/useAuth';

interface EvidencePreviewModalProps {
  evidence: EvidenceDetail;
  onClose: () => void;
  onEvidenceUpdated?: (updated: EvidenceDetail) => void;
}

export const EvidencePreviewModal: React.FC<EvidencePreviewModalProps> = ({
  evidence,
  onClose,
  onEvidenceUpdated,
}) => {
  const { user } = useAuth();
  const [currentEvidence, setCurrentEvidence] = useState<EvidenceDetail>(evidence);
  const [reviewing, setReviewing] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<EvidenceReviewStatus>(
    evidence.reviewStatus === 'NOT_REVIEWED' ? 'APPROVED' : evidence.reviewStatus
  );
  const [reviewNotes, setReviewNotes] = useState(evidence.reviewNotes || '');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const canReview =
    user?.role === 'PLATFORM_ADMIN' ||
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'FIELD_ENGINEER';

  let parsedMetadata: Record<string, any> = {};
  if (currentEvidence.metadataJson) {
    try {
      parsedMetadata = JSON.parse(currentEvidence.metadataJson);
    } catch (e) {
      // Ignored
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      setReviewError('A review note is required to record the decision.');
      return;
    }
    try {
      setReviewSubmitting(true);
      setReviewError(null);
      const updated = await evidenceService.reviewEvidence(
        currentEvidence.id,
        reviewStatus,
        reviewNotes.trim()
      );
      setCurrentEvidence(updated);
      setReviewing(false);
      if (onEvidenceUpdated) onEvidenceUpdated(updated);
    } catch (err: any) {
      setReviewError(err?.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-navy-900 border border-navy-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-950/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded border border-teal-500/30">
              {currentEvidence.evidenceCode}
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {currentEvidence.evidenceCategoryDisplayName}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                    currentEvidence.reviewStatus === 'APPROVED'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                      : currentEvidence.reviewStatus === 'REJECTED'
                      ? 'bg-red-950/60 text-red-300 border-red-500/30'
                      : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {currentEvidence.reviewStatusDisplayName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Assignment: {currentEvidence.assignmentCode} • {currentEvidence.workTypeDisplayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={evidenceService.getFileUrl(currentEvidence.id)}
              download={currentEvidence.originalFileName}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors"
              title="Download original image"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3">
          {/* Main Photo Viewer (2 Cols) */}
          <div className="lg:col-span-2 p-6 flex flex-col items-center justify-center bg-black/40 min-h-[350px]">
            <img
              src={evidenceService.getFileUrl(currentEvidence.id)}
              alt={currentEvidence.originalFileName}
              className="max-h-[60vh] max-w-full object-contain rounded-lg border border-navy-800 shadow-lg"
            />
            {currentEvidence.description && (
              <p className="mt-4 text-xs text-slate-300 italic text-center max-w-xl">
                "{currentEvidence.description}"
              </p>
            )}
          </div>

          {/* Metadata & Audit Sidebar (1 Col) */}
          <div className="p-6 bg-navy-900/60 border-t lg:border-t-0 lg:border-l border-navy-800 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-5">
              {/* File Technical Spec */}
              <div>
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Technical Properties
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-navy-800/60 border border-navy-700/60">
                    <span className="text-[10px] text-slate-400 block">Resolution</span>
                    <span className="font-semibold text-slate-200">
                      {currentEvidence.imageWidth && currentEvidence.imageHeight
                        ? `${currentEvidence.imageWidth} × ${currentEvidence.imageHeight} px`
                        : 'Standard'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-navy-800/60 border border-navy-700/60">
                    <span className="text-[10px] text-slate-400 block">File Size</span>
                    <span className="font-semibold text-slate-200">{currentEvidence.fileSizeFormatted}</span>
                  </div>
                  <div className="p-2 rounded bg-navy-800/60 border border-navy-700/60">
                    <span className="text-[10px] text-slate-400 block">Format</span>
                    <span className="font-semibold text-slate-200">{currentEvidence.mimeType}</span>
                  </div>
                  <div className="p-2 rounded bg-navy-800/60 border border-navy-700/60">
                    <span className="text-[10px] text-slate-400 block">Camera</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {parsedMetadata.cameraModel || parsedMetadata.cameraMake || 'Field Mobile'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamp & Location */}
              <div>
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Temporal & Spatial Data
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Uploaded: {new Date(currentEvidence.uploadedAt).toLocaleString()}</span>
                  </div>
                  {currentEvidence.captureTimestamp && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      <span>Captured: {new Date(currentEvidence.captureTimestamp).toLocaleString()}</span>
                    </div>
                  )}
                  {currentEvidence.latitude && currentEvidence.longitude && (
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        GPS: {currentEvidence.latitude.toFixed(6)}, {currentEvidence.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-300">
                    <HardHat className="w-3.5 h-3.5 text-slate-400" />
                    <span>Vendor: {currentEvidence.vendorName} ({currentEvidence.vendorCode})</span>
                  </div>
                </div>
              </div>

              {/* SHA-256 Cryptographic Checksum */}
              <div>
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Data Integrity Audit
                </h4>
                <EvidenceIntegrityIndicator
                  evidenceId={currentEvidence.id}
                  checksum={currentEvidence.checksumSha256}
                />
              </div>

              {/* Review Decision & Notes */}
              <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 text-xs space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Field Certification Status
                </span>
                <p className="font-medium text-slate-200">
                  {currentEvidence.reviewStatus === 'APPROVED' ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved by {currentEvidence.reviewedByName || 'Field Engineer'}
                    </span>
                  ) : currentEvidence.reviewStatus === 'REJECTED' ? (
                    <span className="text-red-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Rejected by {currentEvidence.reviewedByName || 'Field Engineer'}
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" /> Awaiting Field Engineer Review
                    </span>
                  )}
                </p>
                {currentEvidence.reviewNotes && (
                  <p className="text-[11px] text-slate-400 italic">
                    "{currentEvidence.reviewNotes}"
                  </p>
                )}
              </div>
            </div>

            {/* Review Action Form (for authorized personnel) */}
            {canReview && (
              <div className="pt-4 border-t border-navy-800">
                {!reviewing ? (
                  <button
                    onClick={() => setReviewing(true)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-navy-950 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileCheck2 className="w-4 h-4" /> Certify or Review Evidence
                  </button>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewStatus('APPROVED')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                          reviewStatus === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : 'bg-navy-800 text-slate-400 border-navy-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewStatus('REJECTED')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                          reviewStatus === 'REJECTED'
                            ? 'bg-red-950 text-red-300 border-red-500'
                            : 'bg-navy-800 text-slate-400 border-navy-700'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>

                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Enter certification findings or rejection rationale..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />

                    {reviewError && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {reviewError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewing(false)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-navy-800 text-slate-300 hover:bg-navy-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-navy-950 flex items-center justify-center gap-1.5"
                      >
                        {reviewSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Decision'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
