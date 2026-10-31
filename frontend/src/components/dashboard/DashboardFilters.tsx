import React, { useState } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Calendar,
  Building,
  MapPin,
  Briefcase,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { DashboardFilterParams } from '../../types/dashboard';

interface ProjectOption {
  id: string;
  code: string;
  name: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilterParams;
  projects: ProjectOption[];
  onApplyFilters: (filters: DashboardFilterParams) => void;
  onClearFilters: () => void;
  activeCount: number;
}

const WORK_TYPES = [
  { value: 'TRENCHING', label: 'Trenching' },
  { value: 'UNDERGROUND_CABLE_INSTALLATION', label: 'Underground Cable' },
  { value: 'BACKFILLING', label: 'Backfilling' },
  { value: 'ROAD_RESURFACING', label: 'Road Resurfacing' },
  { value: 'FINAL_INSPECTION', label: 'Final Inspection' },
];

const STATUSES = [
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'SUBMITTED_FOR_REVIEW', label: 'Awaiting Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  projects,
  onApplyFilters,
  onClearFilters,
  activeCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<DashboardFilterParams>(filters);

  const handleChange = (key: keyof DashboardFilterParams, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value === 'ALL' || value === '' ? undefined : value,
    }));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onClearFilters();
  };

  return (
    <div className="bg-white rounded-xl border border-surface-border shadow-card mb-6">
      {/* Primary Bar */}
      <form onSubmit={handleApply} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          {/* Global Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by assignment code, contractor name, work zone..."
              value={localFilters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 font-medium text-ink-primary"
            />
          </div>

          {/* Quick Project Select */}
          <div className="hidden sm:flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-xs text-ink-primary">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={localFilters.projectId || 'ALL'}
              onChange={(e) => {
                handleChange('projectId', e.target.value);
                onApplyFilters({ ...localFilters, projectId: e.target.value === 'ALL' ? undefined : e.target.value });
              }}
              className="bg-transparent font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Controls & Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              isOpen || activeCount > 0
                ? 'bg-slate-100 text-navy-800 border-navy-800'
                : 'bg-white text-ink-secondary border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="submit"
            className="px-3.5 py-2 bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            Apply
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              title="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </form>

      {/* Expanded Multi-Faceted Filter Panel */}
      {isOpen && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* PIN Code */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-secondary mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              PIN Code Corridor
            </label>
            <input
              type="text"
              placeholder="e.g. 600040, 560001"
              value={localFilters.pincode || ''}
              onChange={(e) => handleChange('pincode', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          {/* Work Type */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-secondary mb-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-400" />
              Work Type Category
            </label>
            <select
              value={localFilters.workType || 'ALL'}
              onChange={(e) => handleChange('workType', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">All Work Types</option>
              {WORK_TYPES.map((wt) => (
                <option key={wt.value} value={wt.value}>
                  {wt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-secondary mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              Assignment Status
            </label>
            <select
              value={localFilters.status || 'ALL'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">All Lifecycle Statuses</option>
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-secondary mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Time Horizon
            </label>
            <select
              value={localFilters.dateRange || 'ALL'}
              onChange={(e) => {
                const range = e.target.value;
                let start: string | undefined = undefined;
                const now = new Date();

                if (range === 'TODAY') {
                  start = now.toISOString().split('T')[0];
                } else if (range === '7_DAYS') {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  start = d.toISOString().split('T')[0];
                } else if (range === '30_DAYS') {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  start = d.toISOString().split('T')[0];
                }

                setLocalFilters((prev) => ({
                  ...prev,
                  dateRange: range === 'ALL' ? undefined : range,
                  startDate: start,
                }));
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">All Recorded Dates</option>
              <option value="TODAY">Today Only</option>
              <option value="7_DAYS">Last 7 Days</option>
              <option value="30_DAYS">Last 30 Days</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
