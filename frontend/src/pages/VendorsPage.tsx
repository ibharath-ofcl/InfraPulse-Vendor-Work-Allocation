import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Building2
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { mockVendors } from '../data/mockVendors';
import { mockAssignments } from '../data/mockAssignments';
import { Vendor } from '../types';

export const VendorsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const filterOptions = [
    { label: 'All Contractors', value: 'ALL', count: mockVendors.length },
    { label: 'Active', value: 'ACTIVE', count: mockVendors.filter(v => v.status === 'ACTIVE').length },
    { label: 'Probation', value: 'PROBATION', count: mockVendors.filter(v => v.status === 'PROBATION').length },
  ];

  const filteredVendors = mockVendors.filter((v) => {
    const matchesSearch = 
      v.companyName.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      v.registrationNo.toLowerCase().includes(search.toLowerCase()) ||
      v.serviceCategories.some(c => c.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Contractor & Vendor Management"
        subtitle="Empanelled infrastructure vendors, service qualifications, completion track records, and inspection ratings."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            {mockVendors.length} Certified Contractors
          </span>
        }
      />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <FilterBar
          options={filterOptions}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by vendor name, registration, or capability..."
          className="w-full sm:w-80"
        />
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            onClick={() => setSelectedVendor(vendor)}
            className="bg-white rounded-xl p-5 border border-surface-border shadow-card hover:shadow-card-hover hover:border-teal-500/30 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {vendor.registrationNo}
                    </span>
                    <span className="text-xs text-ink-muted">Joined {vendor.joinedDate}</span>
                  </div>
                  <h3 className="text-base font-bold text-ink-primary mt-1 group-hover:text-teal-600 transition-colors">
                    {vendor.companyName}
                  </h3>
                </div>
                <StatusBadge status={vendor.status} size="sm" />
              </div>

              <div className="text-xs text-ink-secondary space-y-1 mt-3 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Contact: <strong>{vendor.contactPerson}</strong></span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-ink-muted" />
                    <span>{vendor.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-ink-muted" />
                    <span>{vendor.phone}</span>
                  </span>
                </div>
              </div>

              {/* Service Categories Chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {vendor.serviceCategories.map((cat) => (
                  <span 
                    key={cat}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Performance Stats Footer */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-ink-muted">Active Zones</p>
                <p className="text-sm font-bold text-ink-primary mt-0.5">{vendor.assignedZonesCount}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-ink-muted">On-Time</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{vendor.completionRate}%</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-ink-muted">QA Score</p>
                <p className="text-sm font-bold text-teal-700 mt-0.5">{vendor.qualityScore}/100</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor Profile Modal */}
      {selectedVendor && (
        <Modal
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          title={selectedVendor.companyName}
          subtitle={`Registration: ${selectedVendor.registrationNo} • Primary Officer: ${selectedVendor.contactPerson}`}
          footer={
            <button
              onClick={() => setSelectedVendor(null)}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800"
            >
              Close Dossier
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-ink-muted">Email Address</p>
                <p className="font-semibold text-ink-primary">{selectedVendor.email}</p>
              </div>
              <div>
                <p className="text-ink-muted">Official Phone</p>
                <p className="font-semibold text-ink-primary">{selectedVendor.phone}</p>
              </div>
              <div>
                <p className="text-ink-muted">Historical On-Time Rate</p>
                <p className="font-bold text-emerald-700 text-sm">{selectedVendor.completionRate}%</p>
              </div>
              <div>
                <p className="text-ink-muted">Quality Assurance Rating</p>
                <p className="font-bold text-teal-700 text-sm">{selectedVendor.qualityScore} / 100</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-ink-primary mb-2">Active Work Packages Allocated</h4>
              <div className="space-y-2">
                {mockAssignments
                  .filter((a) => a.vendorId === selectedVendor.id)
                  .map((a) => (
                    <div key={a.id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-700">{a.id}</span>
                          <span className="font-semibold text-ink-primary">{a.workType}</span>
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5">{a.workZoneName} (PIN: {a.pinCode})</p>
                      </div>
                      <StatusBadge status={a.status} size="sm" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
