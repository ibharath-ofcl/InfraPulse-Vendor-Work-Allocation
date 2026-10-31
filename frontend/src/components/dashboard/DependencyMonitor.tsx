import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlockedDependencyItem, ReadyDependencyItem } from '../../types/dashboard';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Lock,
  Unlock,
  UserCheck
} from 'lucide-react';

interface DependencyMonitorProps {
  blockedAssignments: BlockedDependencyItem[];
  readyAssignments: ReadyDependencyItem[];
  totalBlocked: number;
  totalReady: number;
}

export const DependencyMonitor: React.FC<DependencyMonitorProps> = ({
  blockedAssignments,
  readyAssignments,
  totalBlocked,
  totalReady,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'BLOCKED' | 'READY'>('BLOCKED');

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-surface-border gap-3">
        <div>
          <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Dependency & Work Readiness Monitor
          </h3>
          <p className="text-xs text-ink-secondary">
            Stage 06 Engine: Real-time prerequisite validation and structural clearance tracking
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('BLOCKED')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
              activeTab === 'BLOCKED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-ink-primary'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Blocked ({totalBlocked})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('READY')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
              activeTab === 'READY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-ink-primary'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Ready for Next Stage ({totalReady})</span>
          </button>
        </div>
      </div>

      {/* Tab Content: BLOCKED */}
      {activeTab === 'BLOCKED' && (
        <div className="space-y-3">
          {blockedAssignments.length === 0 ? (
            <div className="text-center py-8 text-xs text-ink-muted bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
              <p className="font-semibold text-ink-primary">Zero Blocked Assignments</p>
              <p className="text-[11px] mt-0.5">All work packages have their prerequisites satisfied and cleared.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-50/60 text-rose-900 border-b border-rose-200">
                    <th className="py-2.5 px-3 font-semibold">Current Activity</th>
                    <th className="py-2.5 px-3 font-semibold">Required Prerequisite</th>
                    <th className="py-2.5 px-3 font-semibold">Work Zone & Corridor</th>
                    <th className="py-2.5 px-3 font-semibold">Predecessor Status</th>
                    <th className="py-2.5 px-3 font-semibold">Blocking Reason</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {blockedAssignments.map((item, idx) => (
                    <tr
                      key={`${item.assignmentId}-${idx}`}
                      onClick={() => navigate(`/work-assignments/${item.assignmentId}`)}
                      className="hover:bg-rose-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[11px] font-bold text-navy-800 flex items-center gap-1 group-hover:text-blue-600">
                          {item.assignmentCode}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="font-medium text-ink-primary">{item.title}</div>
                        <div className="text-[10px] text-ink-muted">Vendor: {item.assignedVendorName}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-bold text-ink-primary block">
                          {item.requiredPredecessorWorkTypeDisplayName}
                        </span>
                        {item.predecessorAssignmentCode && item.predecessorAssignmentCode !== 'NONE' && (
                          <span className="font-mono text-[10px] text-ink-muted block mt-0.5">
                            Code: {item.predecessorAssignmentCode}
                          </span>
                        )}
                        {item.predecessorVendorName && item.predecessorVendorName !== 'Unassigned' && (
                          <span className="text-[10px] text-ink-secondary block">
                            By: {item.predecessorVendorName}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-ink-primary">{item.workZoneName}</div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          PIN {item.pincode}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {item.predecessorStatus}
                          </span>
                          <span className={`block text-[10px] font-semibold ${
                            item.releaseStatus === 'REJECTED'
                              ? 'text-rose-600'
                              : item.releaseStatus === 'PENDING_RELEASE'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}>
                            {item.releaseStatus}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-[220px]">
                        <p className="text-[11px] text-rose-700 line-clamp-2">
                          {item.blockingReason}
                        </p>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 text-[10px] text-left">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{item.requiredAction}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: READY */}
      {activeTab === 'READY' && (
        <div className="space-y-3">
          {readyAssignments.length === 0 ? (
            <div className="text-center py-8 text-xs text-ink-muted bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="font-semibold text-ink-primary">No Ready Packages</p>
              <p className="text-[11px] mt-0.5">No unstarted assignments with cleared prerequisites currently exist.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-50/60 text-emerald-900 border-b border-emerald-200">
                    <th className="py-2.5 px-3 font-semibold">Ready Activity</th>
                    <th className="py-2.5 px-3 font-semibold">Work Type</th>
                    <th className="py-2.5 px-3 font-semibold">Zone & PIN</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Vendor</th>
                    <th className="py-2.5 px-3 font-semibold">Prerequisite Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readyAssignments.map((item, idx) => (
                    <tr
                      key={`${item.assignmentId}-${idx}`}
                      onClick={() => navigate(`/work-assignments/${item.assignmentId}`)}
                      className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[11px] font-bold text-navy-800 flex items-center gap-1 group-hover:text-emerald-700">
                          {item.assignmentCode}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="font-medium text-ink-primary">{item.title}</div>
                      </td>

                      <td className="py-2.5 px-3 font-medium text-ink-primary">
                        {item.workTypeDisplayName}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-ink-primary">{item.workZoneName}</div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          PIN {item.pincode}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-ink-secondary">
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-teal-600" />
                          <span>{item.assignedVendorName}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          PREREQUISITES CLEARED
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[10px]">
                          <span>{item.action}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
