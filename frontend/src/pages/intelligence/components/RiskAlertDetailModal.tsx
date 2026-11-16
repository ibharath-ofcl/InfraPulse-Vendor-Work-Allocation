import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  HelpCircle,
  TrendingDown,
  Wrench,
  Database,
} from 'lucide-react';
import { intelligenceService } from '../../../services/intelligenceService';
import { ProjectRiskAlert, RiskAlertStatus } from '../../../types/intelligence';

interface RiskAlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  alert: ProjectRiskAlert | null;
}

export const RiskAlertDetailModal: React.FC<RiskAlertDetailModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  alert,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState<RiskAlertStatus>('ACKNOWLEDGED');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !alert) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      await intelligenceService.updateRiskAlertStatus(alert.id, {
        status: targetStatus,
        resolutionNotes: resolutionNotes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update risk alert');
    } finally {
      setIsUpdating(false);
    }
  };

  const levelColor = (lvl: string) => {
    switch (lvl) {
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
            <div className={`p-2 rounded-lg border ${alert.riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${levelColor(alert.riskLevel)}`}>
                  {alert.riskLevel}
                </span>
                <span className="text-xs text-ink-secondary font-medium">
                  {alert.riskCategory.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${alert.alertStatus === 'ACTIVE' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                  {alert.alertStatus}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#10243A] mt-1">{alert.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Six Explainability Cards Required by Intelligence Spec */}
          <div className="space-y-3">
            {/* 1. Problem Statement */}
            <div className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                1. Problem Statement
              </div>
              <p className="text-xs text-ink-primary font-medium leading-relaxed">{alert.problemStatement}</p>
            </div>

            {/* 2. Supporting Evidence Data */}
            <div className="p-3.5 bg-teal-50/50 border border-teal-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                <Database className="w-3.5 h-3.5" />
                2. Supporting Evidence & Verification Metrics
              </div>
              <p className="text-xs text-teal-900 font-mono leading-relaxed font-medium">{alert.supportingEvidenceData}</p>
            </div>

            {/* 3. Root Cause Reason */}
            <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                3. Root Cause Analysis
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">{alert.rootCauseReason}</p>
            </div>

            {/* 4. Operational Impact */}
            <div className="p-3.5 bg-purple-50/50 border border-purple-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
                <TrendingDown className="w-3.5 h-3.5" />
                4. Operational, Financial & Safety Impact
              </div>
              <p className="text-xs text-purple-950 font-medium leading-relaxed">{alert.operationalImpact}</p>
            </div>

            {/* 5. Recommended Action */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/90 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                <Wrench className="w-3.5 h-3.5" />
                5. Prescriptive Mitigation Action
              </div>
              <p className="text-xs text-emerald-950 font-semibold leading-relaxed">{alert.recommendedAction}</p>
            </div>

            {/* 6. Missing Data Notes */}
            {alert.missingDataNotes && (
              <div className="p-3 bg-slate-50 border border-surface-border rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-1">
                  <Info className="w-3 h-3 text-ink-muted" />
                  6. Model Assumptions & Unmonitored Data Notes
                </div>
                <p className="text-[11px] text-ink-secondary italic">{alert.missingDataNotes}</p>
              </div>
            )}
          </div>

          {/* Alert Resolution Form */}
          <form onSubmit={handleUpdate} className="pt-4 border-t border-surface-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Mitigate / Resolve Risk Alert
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Alert Decision Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as RiskAlertStatus)}
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED (Under Monitoring)</option>
                  <option value="RESOLVED">RESOLVED (Mitigation Verified)</option>
                  <option value="DISMISSED">DISMISSED (Exception Granted)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Resolution Summary / Order No.</label>
                <input
                  type="text"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Core test validated 41mm, shift re-sequenced"
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
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
                {isUpdating ? 'Saving...' : 'Update Risk Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function AlertCircle(props: any) {
  return <AlertOctagon {...props} />;
}
