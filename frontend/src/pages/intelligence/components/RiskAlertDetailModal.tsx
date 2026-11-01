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
            <div className={`p-2 rounded-lg ${alert.riskLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${levelColor(alert.riskLevel)}`}>
                  {alert.riskLevel}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {alert.riskCategory.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${alert.alertStatus === 'ACTIVE' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'}`}>
                  {alert.alertStatus}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mt-1">{alert.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Six Explainability Cards Required by Intelligence Spec */}
          <div className="space-y-3">
            {/* 1. Problem Statement */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                1. Problem Statement
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{alert.problemStatement}</p>
            </div>

            {/* 2. Supporting Evidence Data */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                <Database className="w-3.5 h-3.5" />
                2. Supporting Evidence & Verification Metrics
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">{alert.supportingEvidenceData}</p>
            </div>

            {/* 3. Root Cause Reason */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                3. Root Cause Analysis
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{alert.rootCauseReason}</p>
            </div>

            {/* 4. Operational Impact */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                <TrendingDown className="w-3.5 h-3.5" />
                4. Operational, Financial & Safety Impact
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{alert.operationalImpact}</p>
            </div>

            {/* 5. Recommended Action */}
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-800/50 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                <Wrench className="w-3.5 h-3.5" />
                5. Prescriptive Mitigation Action
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">{alert.recommendedAction}</p>
            </div>

            {/* 6. Missing Data Notes */}
            {alert.missingDataNotes && (
              <div className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  <Info className="w-3 h-3 text-slate-500" />
                  6. Model Assumptions & Unmonitored Data Notes
                </div>
                <p className="text-[11px] text-slate-400 italic">{alert.missingDataNotes}</p>
              </div>
            )}
          </div>

          {/* Alert Resolution Form */}
          <form onSubmit={handleUpdate} className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mitigate / Resolve Risk Alert
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Alert Decision Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as RiskAlertStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED (Under Monitoring)</option>
                  <option value="RESOLVED">RESOLVED (Mitigation Verified)</option>
                  <option value="DISMISSED">DISMISSED (Exception Granted)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Resolution Summary / Order No.</label>
                <input
                  type="text"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Core test validated 41mm, shift re-sequenced"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>
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
