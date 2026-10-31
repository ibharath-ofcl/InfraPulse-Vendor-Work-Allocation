import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  MapPin, 
  Plus
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchInput } from '../components/common/SearchInput';
import { Modal } from '../components/common/Modal';
import { mockAssignments } from '../data/mockAssignments';
import { mockProjects } from '../data/mockProjects';
import { mockWorkZones } from '../data/mockWorkZones';
import { mockVendors } from '../data/mockVendors';
import { WorkAssignment, WorkType } from '../types';

export const WorkAllocationPage: React.FC = () => {
  const [assignments, setAssignments] = useState<WorkAssignment[]>(mockAssignments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Interactive Allocation Form State
  const [selectedPin, setSelectedPin] = useState('560001');
  const [selectedProjectId, setSelectedProjectId] = useState(mockProjects[0].id);
  const [selectedZoneId, setSelectedZoneId] = useState('WZ-002');
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType>('Road Resurfacing');
  const [selectedVendorId, setSelectedVendorId] = useState(mockVendors[1].id);
  const [startDate, setStartDate] = useState('2026-11-05');
  const [dueDate, setDueDate] = useState('2026-11-20');
  const [notes, setNotes] = useState('Scheduled bituminous macadam layer.');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [detailsModalAssignment, setDetailsModalAssignment] = useState<WorkAssignment | null>(null);

  // Check if current form inputs trigger the demonstration dependency conflict
  const isConflictScenario = 
    selectedPin === '560001' && 
    (selectedWorkType === 'Road Resurfacing' || selectedZoneId === 'WZ-002');

  const filteredAssignments = assignments.filter((asn) => {
    const matchesSearch = 
      asn.id.toLowerCase().includes(search.toLowerCase()) ||
      asn.pinCode.includes(search) ||
      asn.workZoneName.toLowerCase().includes(search.toLowerCase()) ||
      asn.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      asn.workType.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || asn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSimulateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConflictScenario) {
      alert('Allocation Blocked! Sequential Dependency Violation: Road Resurfacing cannot be assigned while Trenching in Zone 560001-A is pending approval.');
      return;
    }

    const newAsn: WorkAssignment = {
      id: `ASN-${Math.floor(100 + Math.random() * 900)}`,
      pinCode: selectedPin,
      workZoneId: selectedZoneId,
      workZoneName: mockWorkZones.find(z => z.id === selectedZoneId)?.name || 'Custom Zone',
      workType: selectedWorkType,
      vendorId: selectedVendorId,
      vendorName: mockVendors.find(v => v.id === selectedVendorId)?.companyName || 'Contractor',
      startDate,
      dueDate,
      status: 'ASSIGNED',
      progress: 0,
      notes,
    };

    setAssignments([newAsn, ...assignments]);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Vendor Work Allocation & Conflict Prevention"
        subtitle="Centralized PIN-code work package allocation with automated spatial and sequential dependency blocking."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">
            Core Dependency Engine
          </span>
        }
      />

      {/* Main 2-Column Section: Allocation Form + Conflict Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column (7 cols): Allocation Form */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary">
                Allocate Infrastructure Work Package
              </h3>
              <p className="text-xs text-ink-secondary">
                Configure zone assignment, vendor eligibility, and schedule
              </p>
            </div>
            <span className="text-[11px] text-ink-muted">Interactive Form Demo</span>
          </div>

          <form onSubmit={handleSimulateAllocation} className="space-y-4 text-xs">
            {/* PIN Code & Project */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Postal PIN Code
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={selectedPin}
                    onChange={(e) => setSelectedPin(e.target.value)}
                    placeholder="Enter 6-digit PIN code"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Master Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white outline-none cursor-pointer"
                >
                  {mockProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Zone & Work Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Work Zone (GIS Parcel)
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white outline-none cursor-pointer"
                >
                  {mockWorkZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.code} — {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Infrastructure Work Type
                </label>
                <select
                  value={selectedWorkType}
                  onChange={(e) => setSelectedWorkType(e.target.value as WorkType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white outline-none cursor-pointer"
                >
                  <option value="Trenching">Trenching</option>
                  <option value="Underground Cable Installation">Underground Cable Installation</option>
                  <option value="Backfilling">Backfilling</option>
                  <option value="Road Resurfacing">Road Resurfacing</option>
                  <option value="Final Inspection">Final Inspection</option>
                </select>
              </div>
            </div>

            {/* Vendor Selector */}
            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Contracted Vendor
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary focus:bg-white outline-none cursor-pointer"
              >
                {mockVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName} (Completion: {v.completionRate}% • QA: {v.qualityScore}/100)
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Planned Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-ink-primary mb-1">
                Assignment Directives & Specifications
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific traffic clearances, night-time hours, or equipment requirements..."
                className="w-full px-3 py-2 bg-slate-50 border border-surface-border rounded-lg text-ink-primary outline-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">
                Pre-allocation checks evaluate GIS overlap and prerequisite gates.
              </span>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                  isConflictScenario
                    ? 'bg-rose-600 text-white hover:bg-rose-700 cursor-not-allowed'
                    : 'bg-navy-900 text-white hover:bg-navy-800'
                }`}
              >
                {isConflictScenario ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Attempt Allocation (Blocked)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-teal-400" />
                    <span>Issue Work Package</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {showSuccessToast && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Work allocation successfully recorded in active assignment ledger!</span>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Conflict Preview & Demonstration Engine */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dependency Conflict Warning Panel */}
          {isConflictScenario ? (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-5 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider">
                      Blocked
                    </span>
                    <h4 className="font-bold text-sm text-rose-900">
                      Sequential Dependency Violation
                    </h4>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed mt-1">
                    <strong>Road Resurfacing</strong> cannot proceed because <strong>Trenching</strong> in corridor parcel <strong>560001-A</strong> has not yet been completed, inspected, and approved.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-200/80 text-xs text-rose-900 space-y-2">
                <div className="flex justify-between">
                  <span className="text-rose-700">Conflicting Zone:</span>
                  <strong className="font-mono">WZ-BLR-560001-B</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700">Blocking Preceding Task:</span>
                  <span className="font-semibold">ASN-101 (Trenching by Apex)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700">Required Prerequisite Status:</span>
                  <span className="font-semibold text-emerald-700">APPROVED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700">Current Task Status:</span>
                  <span className="font-semibold text-amber-700">IN PROGRESS (75%)</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/80 rounded-lg border border-rose-200 text-[11px] text-rose-800">
                💡 <em>Rule Enforced:</em> Prevents asphalt paving over unfinished underground utilities, eliminating costly road excavation rework.
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">
                    Dependency Checks Satisfied
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    No active spatial or sequential conflicts detected in zone <strong>{selectedZoneId}</strong>. Work package is eligible for immediate allocation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Core Sequence Blueprint Card */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card text-xs">
            <h4 className="font-bold text-ink-primary mb-1">
              Deterministic Dependency Flow
            </h4>
            <p className="text-ink-secondary mb-3">
              Standard civil infrastructure lifecycle order enforced by InfraPulse AI:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                <span className="font-semibold text-ink-primary">Trenching</span>
                <span className="text-ink-muted ml-auto">Must be verified & approved</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                <span className="font-semibold text-ink-primary">Conduit / Cable Laying</span>
                <span className="text-ink-muted ml-auto">Requires open trench clearance</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                <span className="font-semibold text-ink-primary">Backfilling & Compaction</span>
                <span className="text-ink-muted ml-auto">Requires proctor test &ge; 95%</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                <span className="font-semibold text-ink-primary">Road Resurfacing</span>
                <span className="text-rose-600 font-bold ml-auto">STRICT GATE: Blocked if 1-3 incomplete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Ledger Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-ink-primary">
              Active Work Assignment Ledger
            </h3>
            <p className="text-xs text-ink-secondary">
              Real-time multi-vendor allocations across municipal PIN codes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-surface-border rounded-lg bg-slate-50 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="APPROVED">Approved</option>
            </select>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search assignments..."
              className="w-48 sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-surface-border text-ink-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Assignment ID</th>
                <th className="py-3 px-4">PIN Code</th>
                <th className="py-3 px-4">Work Zone</th>
                <th className="py-3 px-4">Work Type</th>
                <th className="py-3 px-4">Contracted Vendor</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-ink-primary">
              {filteredAssignments.map((asn) => (
                <tr key={asn.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-teal-700">
                    {asn.id}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    {asn.pinCode}
                  </td>
                  <td className="py-3 px-4 max-w-[180px] truncate" title={asn.workZoneName}>
                    {asn.workZoneName}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {asn.workType}
                  </td>
                  <td className="py-3 px-4">
                    {asn.vendorName}
                  </td>
                  <td className="py-3 px-4 text-ink-secondary text-[11px] whitespace-nowrap">
                    {asn.startDate} → {asn.dueDate}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={asn.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setDetailsModalAssignment(asn)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Details Modal */}
      {detailsModalAssignment && (
        <Modal
          isOpen={!!detailsModalAssignment}
          onClose={() => setDetailsModalAssignment(null)}
          title={`Assignment Specification: ${detailsModalAssignment.id}`}
          subtitle={`Zone: ${detailsModalAssignment.workZoneName} (PIN: ${detailsModalAssignment.pinCode})`}
          footer={
            <button
              onClick={() => setDetailsModalAssignment(null)}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-ink-muted">Contracted Vendor</p>
                <p className="font-bold text-sm text-ink-primary">{detailsModalAssignment.vendorName}</p>
              </div>
              <div>
                <p className="text-ink-muted">Status</p>
                <StatusBadge status={detailsModalAssignment.status} size="sm" />
              </div>
              <div>
                <p className="text-ink-muted">Work Type</p>
                <p className="font-bold text-ink-primary">{detailsModalAssignment.workType}</p>
              </div>
              <div>
                <p className="text-ink-muted">Progress Recorded</p>
                <p className="font-bold text-ink-primary">{detailsModalAssignment.progress}%</p>
              </div>
            </div>

            {detailsModalAssignment.conflictReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Conflict Logged</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  {detailsModalAssignment.conflictReason}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-ink-primary mb-1">Field Directives</h4>
              <p className="text-ink-secondary bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {detailsModalAssignment.notes || 'No custom directives specified for this package.'}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
