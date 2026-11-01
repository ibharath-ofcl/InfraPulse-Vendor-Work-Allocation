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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Record Calibrated Physical Measurement</h3>
              <p className="text-xs text-slate-400 mt-0.5">{evidenceLink.requirementCode}: {evidenceLink.requirementTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Attached Evidence:</span>
              <span className="font-mono text-cyan-400 font-semibold">{evidenceLink.evidenceCode || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Work Assignment:</span>
              <span className="font-mono text-slate-200">{evidenceLink.assignmentCode || 'General Project Scope'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Current Status:</span>
              <span className="text-amber-400 font-medium">{evidenceLink.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Measured Value *
              </label>
              <input
                type="text"
                required
                value={measuredValue}
                onChange={(e) => setMeasuredValue(e.target.value)}
                placeholder="e.g. 41.5"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Measurement Unit *
              </label>
              <input
                type="text"
                required
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value)}
                placeholder="e.g. mm, %, cm, MPa"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Calibrated Measurement Tool / Serial Number *
            </label>
            <input
              type="text"
              required
              value={physicalMeasurementTool}
              onChange={(e) => setPhysicalMeasurementTool(e.target.value)}
              placeholder="e.g. Mitutoyo Vernier Caliper S/N 8934, Nuclear Gauge Troxler 3440"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Verification & Field Sampling Notes
            </label>
            <textarea
              rows={3}
              value={measurementNotes}
              onChange={(e) => setMeasurementNotes(e.target.value)}
              placeholder="Record sample extraction station (e.g. Ch 1+240 LHS), ambient temperature, compaction pass count, and test certificate reference..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 transition flex items-center gap-1.5 shadow-md shadow-cyan-950"
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

