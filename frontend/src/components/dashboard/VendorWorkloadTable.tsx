import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VendorWorkloadItem } from '../../types/dashboard';
import { HardHat, ExternalLink, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface VendorWorkloadTableProps {
  vendors: VendorWorkloadItem[];
}

export const VendorWorkloadTable: React.FC<VendorWorkloadTableProps> = ({ vendors }) => {
  const navigate = useNavigate();

  if (vendors.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col items-center justify-center h-80 text-center">
        <HardHat className="w-8 h-8 text-ink-muted mb-2" />
        <p className="font-semibold text-sm text-ink-primary">No Contractors Found</p>
        <p className="text-xs text-ink-secondary mt-1">
          No active vendors match the current scope or user role permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
        <div>
          <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
            <HardHat className="w-4 h-4 text-amber-600" />
            Vendor Capacity & Real-Time Operational Workload
          </h3>
          <p className="text-xs text-ink-secondary">
            Factual operational metrics derived from persisted work assignments
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          {vendors.length} Contractors
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-ink-secondary border-b border-slate-200">
              <th className="py-2.5 px-3 font-semibold">Vendor Code</th>
              <th className="py-2.5 px-3 font-semibold">Contractor / Company Name</th>
              <th className="py-2.5 px-3 font-semibold">Service Categories</th>
              <th className="py-2.5 px-2 font-semibold text-center text-teal-700">Active Workload</th>
              <th className="py-2.5 px-2 font-semibold text-center text-amber-700">Pending</th>
              <th className="py-2.5 px-2 font-semibold text-center text-rose-700">Blocked</th>
              <th className="py-2.5 px-2 font-semibold text-center text-emerald-700">Done</th>
              <th className="py-2.5 px-3 font-semibold text-right">Workload Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v) => {
              const workloadLevel =
                v.currentWorkload >= 5
                  ? { label: 'High Load', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
                  : v.currentWorkload > 0
                  ? { label: 'Active', bg: 'bg-teal-50 text-teal-700 border-teal-200' }
                  : { label: 'Available', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

              return (
                <tr
                  key={v.vendorId}
                  onClick={() => navigate(`/vendors/${v.vendorId}`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-navy-800 group-hover:text-blue-600 flex items-center gap-1">
                    {v.vendorCode}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-ink-primary">{v.companyName}</div>
                    <div className="text-[11px] text-ink-muted">Contact: {v.contactPerson}</div>
                  </td>

                  <td className="py-2.5 px-3 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {v.serviceCategories && v.serviceCategories.length > 0 ? (
                        v.serviceCategories.slice(0, 2).map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-ink-muted">General Civil</span>
                      )}
                      {v.serviceCategories && v.serviceCategories.length > 2 && (
                        <span className="text-[10px] text-ink-muted">
                          +{v.serviceCategories.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-700 text-sm">
                    {v.activeAssignments}
                  </td>

                  <td className="py-2.5 px-2 text-center font-mono text-amber-700">
                    {v.pendingAcceptance > 0 ? (
                      <span className="inline-flex items-center gap-0.5 font-bold">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {v.pendingAcceptance}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="py-2.5 px-2 text-center font-mono text-rose-700">
                    {v.blockedAssignments > 0 ? (
                      <span className="inline-flex items-center gap-0.5 font-bold">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        {v.blockedAssignments}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="py-2.5 px-2 text-center font-mono text-emerald-700">
                    {v.completedAssignments > 0 ? (
                      <span className="inline-flex items-center gap-0.5 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {v.completedAssignments}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${workloadLevel.bg}`}
                    >
                      {workloadLevel.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
