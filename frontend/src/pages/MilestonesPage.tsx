import React, { useState } from 'react';
import { 
  Landmark, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Info
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchInput } from '../components/common/SearchInput';
import { Modal } from '../components/common/Modal';
import { mockMilestones } from '../data/mockMilestones';
import { Milestone } from '../types';

export const MilestonesPage: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [confirmModalMilestone, setConfirmModalMilestone] = useState<Milestone | null>(null);

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const disbursedAmount = milestones
    .filter(m => m.paymentStatus === 'DISBURSED')
    .reduce((sum, m) => sum + m.amount, 0);
  const pendingAmount = milestones
    .filter(m => m.approvalStatus === 'ELIGIBLE' || m.approvalStatus === 'LOCKED')
    .reduce((sum, m) => sum + m.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAuthorizeMilestone = () => {
    if (!confirmModalMilestone) return;
    const updated = milestones.map((m) =>
      m.id === confirmModalMilestone.id
        ? { ...m, approvalStatus: 'APPROVED' as const, paymentStatus: 'DISBURSED' as const }
        : m
    );
    setMilestones(updated);
    setAuthSuccess(`Payment of ${formatCurrency(confirmModalMilestone.amount)} authorized for ${confirmModalMilestone.vendorName}!`);
    setConfirmModalMilestone(null);
    setTimeout(() => setAuthSuccess(null), 4000);
  };

  const filtered = milestones.filter((m) => {
    const matchesSearch = 
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.milestoneName.toLowerCase().includes(search.toLowerCase()) ||
      m.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      m.workZoneName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Milestone & Payment Authorization Gate"
        subtitle="Financial disbursement engine linked directly to AI visual inspection and municipal engineer sign-off."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            Escrow Gate Active
          </span>
        }
      />

      {/* Demonstration Disclaimer */}
      <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-ink-secondary">
        <Info className="w-4 h-4 text-teal-600 shrink-0" />
        <div>
          <span className="font-bold text-ink-primary">Stage 2 Financial Gateway Simulation:</span> Payment triggers simulate municipal escrow authorization. Production disbursement APIs and treasury accounting integration are planned for Stage 12.
        </div>
      </div>

      {authSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{authSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <MetricCard
          title="Total Contract Value"
          value={formatCurrency(totalAmount)}
          subtitle="4 active milestone tranches"
          icon={Landmark}
          accentColor="navy"
        />
        <MetricCard
          title="Disbursed Funds"
          value={formatCurrency(disbursedAmount)}
          subtitle="Certified completed works"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <MetricCard
          title="Pending Approval"
          value={formatCurrency(pendingAmount)}
          subtitle="Awaiting inspection sign-off"
          icon={Clock}
          accentColor="amber"
        />
        <MetricCard
          title="Blocked Milestones"
          value="₹ 14.0 Lakh"
          subtitle="1 failed quality gate"
          icon={Lock}
          accentColor="rose"
          alertBadge="LOCKED"
        />
      </div>

      {/* Milestones Ledger Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-ink-primary">
              Milestone Payment Authorization Queue
            </h3>
            <p className="text-xs text-ink-secondary">
              Strict payment gates release funds only after physical work verification
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-surface-border rounded-lg bg-slate-50 outline-none"
            >
              <option value="ALL">All Approvals</option>
              <option value="ELIGIBLE">Eligible (Ready)</option>
              <option value="LOCKED">Locked</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search milestone, vendor, zone..."
              className="w-48 sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-surface-border text-ink-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Milestone ID</th>
                <th className="py-3 px-4">Milestone Scope</th>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4">Tranche Value</th>
                <th className="py-3 px-4">QA Inspection</th>
                <th className="py-3 px-4">Approval State</th>
                <th className="py-3 px-4">Payment State</th>
                <th className="py-3 px-4 text-right">Authorize</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-ink-primary">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-teal-700">
                    {m.id}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-ink-primary">{m.milestoneName}</p>
                    <p className="text-[11px] text-ink-muted">{m.workZoneName} (PIN: {m.pinCode})</p>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {m.vendorName}
                  </td>
                  <td className="py-3 px-4 font-bold text-ink-primary">
                    {formatCurrency(m.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.inspectionStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.approvalStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.paymentStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {m.approvalStatus === 'ELIGIBLE' ? (
                      <button
                        onClick={() => setConfirmModalMilestone(m)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-lg shadow-sm transition-colors"
                      >
                        Authorize Release
                      </button>
                    ) : m.approvalStatus === 'APPROVED' ? (
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold text-[11px] flex items-center justify-end gap-1">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorization Confirmation Modal */}
      {confirmModalMilestone && (
        <Modal
          isOpen={!!confirmModalMilestone}
          onClose={() => setConfirmModalMilestone(null)}
          title="Authorize Milestone Disbursement"
          subtitle={`Release of funds for Milestone ${confirmModalMilestone.id}`}
          footer={
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModalMilestone(null)}
                className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleAuthorizeMilestone}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Confirm & Disburse {formatCurrency(confirmModalMilestone.amount)}
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-ink-secondary">
              You are authorizing digital disbursement for verified infrastructure deliverables:
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-ink-muted">Milestone:</span>
                <span className="font-bold text-ink-primary">{confirmModalMilestone.milestoneName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Contractor Entity:</span>
                <span className="font-semibold text-ink-primary">{confirmModalMilestone.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">QA Verification:</span>
                <span className="text-emerald-700 font-bold">100% Passed</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-ink-muted">Total Release Amount:</span>
                <span className="font-bold text-ink-primary text-sm">{formatCurrency(confirmModalMilestone.amount)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
