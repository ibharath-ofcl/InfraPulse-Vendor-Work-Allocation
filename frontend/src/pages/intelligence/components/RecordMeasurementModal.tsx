import React, { useState } from 'react';
import { X, Ruler, CheckCircle, AlertTriangle } from 'lucide-react';
import { intelligenceService } from '../../../services/intelligenceService';
import { RequirementEvidenceLink } from '../../../types/intelligence';

interface RecordMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  evidenceLink: RequirementEvidenceLink | null;
}

export const RecordMeasurementModal: React.FC<RecordMeasurementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  evidenceLink,
}) => {
  const [measuredValue, setMeasuredValue] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState(evidenceLink?.measurementUnit || 'mm');
  const [physicalMeasurementTool, setPhysicalMeasurementTool] = useState('Digital Vernier Caliper (Calibrated)');
  const [measurementNotes, setMeasurementNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !evidenceLink) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!measuredValue.trim()) {
      setError('Measured value is required');
      return;
    }
    if (!physicalMeasurementTool.trim()) {
      setError('Measurement tool / calibration device is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await intelligenceService.recordPhysicalMeasurement(evidenceLink.id, {
        measuredValue,
        measurementUnit: measurementUnit || 'mm',
        physicalMeasurementTool,
        measurementNotes: measurementNotes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to record physical measurement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-surface-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="flex items-center justify-between p-5 border-b border-surface-border bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#10243A]">Record Calibrated Physical Measurement</h3>
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

          <div className="p-3.5 bg-slate-50 border border-surface-border rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-ink-secondary">
              <span className="font-medium">Attached Evidence:</span>
              <span className="font-mono text-teal-700 font-bold">{evidenceLink.evidenceCode || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <span className="font-medium">Work Assignment:</span>
              <span className="font-mono text-[#10243A] font-semibold">{evidenceLink.assignmentCode || 'General Project Scope'}</span>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <span className="font-medium">Current Status:</span>
              <span className="text-amber-700 font-bold">{evidenceLink.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Measured Value *
              </label>
              <input
                type="text"
                required
                value={measuredValue}
                onChange={(e) => setMeasuredValue(e.target.value)}
                placeholder="e.g. 41.5"
                className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Measurement Unit *
              </label>
              <input
                type="text"
                required
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value)}
                placeholder="e.g. mm, %, cm, MPa"
                className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Calibrated Measurement Tool / Serial Number *
            </label>
            <input
              type="text"
              required
              value={physicalMeasurementTool}
              onChange={(e) => setPhysicalMeasurementTool(e.target.value)}
              placeholder="e.g. Mitutoyo Vernier Caliper S/N 8934, Nuclear Gauge Troxler 3440"
              className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Verification & Field Sampling Notes
            </label>
            <textarea
              rows={3}
              value={measurementNotes}
              onChange={(e) => setMeasurementNotes(e.target.value)}
              placeholder="Record sample extraction station (e.g. Ch 1+240 LHS), ambient temperature, compaction pass count, and test certificate reference..."
              className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
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
              className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 transition flex items-center gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify & Submit Measurement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
