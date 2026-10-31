import React, { useState } from 'react';
import { WorkZoneOverviewItem } from '../../types/dashboard';
import { MapPin, Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface WorkZoneTableProps {
  workZones: WorkZoneOverviewItem[];
  onSelectZone?: (zone: WorkZoneOverviewItem) => void;
  selectedZoneId?: string;
}

export const WorkZoneTable: React.FC<WorkZoneTableProps> = ({
  workZones,
  onSelectZone,
  selectedZoneId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredZones = workZones.filter((z) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      z.zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      z.zoneCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      z.pincode.includes(searchTerm) ||
      z.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      z.projectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || z.operationalStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-surface-border gap-3">
        <div>
          <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Work-Zone Operational Deployment Overview
          </h3>
          <p className="text-xs text-ink-secondary">
            Geographic corridor tracking across discrete work zones (independent multi-zone PIN corridors)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter zones, PIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 w-36 sm:w-44"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-ink-primary font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Work</option>
            <option value="BLOCKED">Blocked</option>
            <option value="AVAILABLE">Available</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-ink-secondary border-b border-slate-200">
              <th className="py-2.5 px-3 font-semibold">Zone Code</th>
              <th className="py-2.5 px-3 font-semibold">Zone Name & Locality</th>
              <th className="py-2.5 px-3 font-semibold">PIN Code</th>
              <th className="py-2.5 px-3 font-semibold">Project</th>
              <th className="py-2.5 px-2 font-semibold text-center">Total</th>
              <th className="py-2.5 px-2 font-semibold text-center text-teal-700">Active</th>
              <th className="py-2.5 px-2 font-semibold text-center text-rose-700">Blocked</th>
              <th className="py-2.5 px-2 font-semibold text-center text-emerald-700">Done</th>
              <th className="py-2.5 px-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredZones.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-ink-muted">
                  No operational work zones matching the criteria.
                </td>
              </tr>
            ) : (
              filteredZones.map((z) => {
                const isSelected = selectedZoneId === z.workZoneId;

                return (
                  <tr
                    key={z.workZoneId}
                    onClick={() => onSelectZone && onSelectZone(z)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-navy-800">
                      {z.zoneCode}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-ink-primary">{z.zoneName}</div>
                      <div className="text-[11px] text-ink-muted">{z.locality}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {z.pincode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[160px] truncate text-ink-secondary">
                      {z.projectName}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-medium text-ink-primary">
                      {z.totalAssignments}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-700">
                      {z.activeWork}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-700">
                      {z.blockedWork > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-rose-600">
                          <AlertCircle className="w-3 h-3" /> {z.blockedWork}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">
                      {z.completedWork > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> {z.completedWork}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {z.operationalStatus === 'BLOCKED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> BLOCKED
                        </span>
                      ) : z.operationalStatus === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {z.operationalStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
