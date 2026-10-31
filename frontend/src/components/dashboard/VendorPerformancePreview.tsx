import React from 'react';
import { mockVendors } from '../../data/mockVendors';
import { Award, CheckCircle, AlertCircle } from 'lucide-react';

export const VendorPerformancePreview: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
        <div>
          <h3 className="font-bold text-sm text-ink-primary">
            Contractor Execution & Quality Metrics
          </h3>
          <p className="text-xs text-ink-secondary">
            Verified delivery indicators based on completed inspections
          </p>
        </div>
        <span className="text-[11px] text-ink-muted">
          {mockVendors.length} Contracted Entities
        </span>
      </div>

      <div className="space-y-3.5">
        {mockVendors.map((vendor) => (
          <div 
            key={vendor.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink-primary">
                  {vendor.companyName}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                  vendor.status === 'ACTIVE' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {vendor.status}
                </span>
              </div>
              <p className="text-[11px] text-ink-secondary">
                {vendor.assignedZonesCount} assigned zones • {vendor.serviceCategories.slice(0, 2).join(', ')}
              </p>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
                  On-Time Rate
                </p>
                <div className="flex items-center justify-end gap-1 text-xs font-bold text-ink-primary">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>{vendor.completionRate}%</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
                  QA Pass Index
                </p>
                <div className="flex items-center justify-end gap-1 text-xs font-bold text-ink-primary">
                  {vendor.qualityScore >= 80 ? (
                    <Award className="w-3 h-3 text-teal-600" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                  )}
                  <span>{vendor.qualityScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
