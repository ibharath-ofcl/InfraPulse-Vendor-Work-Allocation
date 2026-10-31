import React, { useState } from 'react';
import { 
  ShieldAlert 
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { WorkZoneMap } from '../components/maps/WorkZoneMap';
import { mockWorkZones } from '../data/mockWorkZones';
import { WorkZone } from '../types';

export const WorkZonesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState<WorkZone>(mockWorkZones[0]);

  const filterOptions = [
    { label: 'All Zones', value: 'ALL', count: mockWorkZones.length },
    { label: 'In Progress', value: 'IN_PROGRESS', count: mockWorkZones.filter(z => z.status === 'IN_PROGRESS').length },
    { label: 'Blocked by Dependency', value: 'BLOCKED', count: mockWorkZones.filter(z => z.status === 'BLOCKED').length },
    { label: 'Active', value: 'ACTIVE', count: mockWorkZones.filter(z => z.status === 'ACTIVE').length },
    { label: 'Completed', value: 'COMPLETED', count: mockWorkZones.filter(z => z.status === 'COMPLETED').length },
  ];

  const filteredZones = mockWorkZones.filter((z) => {
    const matchesSearch = 
      z.name.toLowerCase().includes(search.toLowerCase()) ||
      z.pinCode.includes(search) ||
      z.code.toLowerCase().includes(search.toLowerCase()) ||
      (z.assignedVendorName && z.assignedVendorName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || z.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Geographical Work Zones"
        subtitle="PIN-code mapped spatial parcels coordinating vendor boundaries and dependency sequencing."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {mockWorkZones.length} Spatial Parcels
          </span>
        }
      />

      {/* Filter and PIN Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <FilterBar
          options={filterOptions}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by PIN code (e.g. 560001), zone name..."
          className="w-full sm:w-80"
        />
      </div>

      {/* Two Column Grid: GIS Map & Zone List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-border">
              <div>
                <h3 className="font-bold text-sm text-ink-primary">
                  GIS Spatial Parcels Map
                </h3>
                <p className="text-xs text-ink-secondary">
                  Interactive parcel boundaries with real-time dependency status
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Click marker to inspect
              </span>
            </div>

            <WorkZoneMap
              zones={filteredZones}
              selectedZoneId={selectedZone.id}
              onSelectZone={(zone) => setSelectedZone(zone)}
              height="430px"
            />
          </div>

          {/* Prominent Dependency Callout if Blocked */}
          {selectedZone.status === 'BLOCKED' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 shadow-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                  Sequential Dependency Conflict Detected
                </h4>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  {selectedZone.blockingReason}
                </p>
                <div className="mt-2 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <span>Enforced Rule: Strict finish-to-start gate prevents premature asphalt paving.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Work Zone List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Zone Inventory ({filteredZones.length})
              </span>
              <span className="text-xs text-ink-secondary">
                Select to view GIS details
              </span>
            </div>

            <div className="space-y-2.5 mt-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {filteredZones.map((zone) => {
                const isSelected = zone.id === selectedZone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50 border-teal-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {zone.code}
                        </span>
                        <h4 className="text-xs font-bold text-ink-primary mt-1">
                          {zone.name}
                        </h4>
                      </div>
                      <StatusBadge status={zone.status} size="sm" />
                    </div>

                    <div className="text-[11px] text-ink-secondary space-y-1 mt-2">
                      <div className="flex items-center justify-between">
                        <span>PIN Code: <strong className="text-ink-primary">{zone.pinCode}</strong></span>
                        <span className="text-ink-primary font-medium">{zone.currentWorkType}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-[11px]">
                        <span className="text-ink-muted truncate max-w-[160px]">
                          {zone.assignedVendorName || 'No Vendor Assigned'}
                        </span>
                        {zone.status === 'BLOCKED' ? (
                          <span className="text-rose-600 font-bold text-[10px]">LOCKED</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px]">READY</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
