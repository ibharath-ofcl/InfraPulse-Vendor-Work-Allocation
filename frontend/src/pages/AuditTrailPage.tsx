import React, { useState } from 'react';
import { 
  Download,
  Info
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { mockAuditEvents } from '../data/mockAuditEvents';

export const AuditTrailPage: React.FC = () => {
  const events = mockAuditEvents;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filterOptions = [
    { label: 'All Events', value: 'ALL', count: mockAuditEvents.length },
    { label: 'Success', value: 'SUCCESS', count: mockAuditEvents.filter(e => e.status === 'SUCCESS').length },
    { label: 'Blocked by Policy', value: 'BLOCKED', count: mockAuditEvents.filter(e => e.status === 'BLOCKED').length },
    { label: 'Warnings', value: 'WARNING', count: mockAuditEvents.filter(e => e.status === 'WARNING').length },
    { label: 'Critical QA', value: 'CRITICAL', count: mockAuditEvents.filter(e => e.status === 'CRITICAL').length },
  ];

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = 
      ev.id.toLowerCase().includes(search.toLowerCase()) ||
      ev.user.toLowerCase().includes(search.toLowerCase()) ||
      ev.action.toLowerCase().includes(search.toLowerCase()) ||
      ev.entityReference.toLowerCase().includes(search.toLowerCase()) ||
      ev.details.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportAuditLog = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Timestamp,User,Role,Action,Entity,Status,Details\n" +
      filteredEvents.map(e => `"${e.id}","${e.timestamp}","${e.user}","${e.role}","${e.action}","${e.entityReference}","${e.status}","${e.details}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `infrapulse_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Cryptographic Audit Trail & Compliance Log"
        subtitle="Immutable ledger recording vendor allocations, dependency checks, inspection verdicts, and payment authorizations."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            Append-Only Ledger
          </span>
        }
        actions={
          <button
            onClick={exportAuditLog}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-surface-border text-ink-primary hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Demonstration Notice */}
      <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-ink-secondary">
        <Info className="w-4 h-4 text-teal-600 shrink-0" />
        <span>Demonstration audit log entries reflect Stage 1 & 2 actions. Hardware security module (HSM) signing and database append-only tables are scheduled for Stage 13.</span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <FilterBar
          options={filterOptions}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by actor, action, reference..."
          className="w-full sm:w-80"
        />
      </div>

      {/* Audit Events Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-surface-border text-ink-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Entity Reference</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4 max-w-xs">Detailed Event Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-ink-primary">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700 whitespace-nowrap">
                    {ev.id}
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary whitespace-nowrap text-[11px]">
                    {ev.timestamp}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-ink-primary">{ev.user}</p>
                    <p className="text-[10px] text-ink-muted">{ev.role}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-[11px] text-navy-800">
                    {ev.action}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-teal-800">
                    {ev.entityReference}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={ev.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary text-[11px] leading-relaxed max-w-sm">
                    {ev.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
};
