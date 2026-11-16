import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { intelligenceService } from '../../../services/intelligenceService';
import { RequirementEvidenceLink } from '../../../types/intelligence';

interface WaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  evidenceLink: RequirementEvidenceLink | null;
}

export const WaiverModal: React.FC<WaiverModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  evidenceLink,
}) => {
  const [waiverReason, setWaiverReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !evidenceLink) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiverReason.trim() || waiverReason.trim().length < 15) {
      setError('A comprehensive engineering waiver justification (minimum 15 characters) is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await intelligenceService.requestWaiver(evidenceLink.id, {
        waiverReason: waiverReason.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit authorized waiver');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-surface-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="flex items-center justify-between p-5 border-b border-surface-border bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600 border border-purple-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#10243A]">Authorize Contract Specification Waiver</h3>
              <p className="text-xs text-ink-secondary mt-0.5">{evidenceLink.requirementCode}: {evidenceLink.requirementTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-900">
            <span className="font-bold block mb-1 text-purple-950">Administrative Audit Rule:</span>
            Waivers must be authorized by an Executive Engineer or Project Manager. All waivers create an irrevocable audit event and are factored into vendor quality scorecards.
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Engineering Waiver Justification & Technical Mitigation *
            </label>
            <textarea
              rows={4}
              required
              value={waiverReason}
              onChange={(e) => setWaiverReason(e.target.value)}
              placeholder="State the site constraint, structural equivalence assessment, laboratory test clearance, and executive approval dispatch reference..."
              className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-ink-secondary hover:text-ink-primary bg-white border border-surface-border hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition flex items-center gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Authorize Waiver</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
