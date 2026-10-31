import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  HardHat, 
  PieChart as PieIcon, 
  RefreshCw,
  FolderKanban,
  ClipboardCheck,
  Wrench,
  IndianRupee,
  AlertCircle,
  Sliders,
  History,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { analyticsService } from '../services/analyticsService';
import { 
  OperationalDashboardSummary, 
  ScoringConfiguration 
} from '../types/analytics';

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: '#3B82F6',
  IN_PROGRESS: '#0D9488',
  SUBMITTED: '#F59E0B',
  APPROVED: '#10B981',
  REJECTED: '#EF4444',
  BLOCKED: '#6B7280',
};

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<OperationalDashboardSummary | null>(null);
  const [, setScoringConfigs] = useState<ScoringConfiguration[]>([]);
  const [activeConfig, setActiveConfig] = useState<ScoringConfiguration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newQualityWeight, setNewQualityWeight] = useState(30);
  const [newOnTimeWeight, setNewOnTimeWeight] = useState(25);
  const [newEvidenceWeight, setNewEvidenceWeight] = useState(15);
  const [newReworkWeight, setNewReworkWeight] = useState(15);
  const [newCompletionWeight, setNewCompletionWeight] = useState(15);
  const [configSaving, setConfigSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashData, configs, activeConf] = await Promise.all([
        analyticsService.getOperationalDashboard(),
        analyticsService.getScoringConfigurations(),
        analyticsService.getActiveScoringConfiguration().catch(() => null),
      ]);
      setDashboard(dashData);
      setScoringConfigs(configs);
      setActiveConfig(activeConf);
    } catch (err) {
      console.error('Failed to load operational analytics dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCreateScoringConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const sum = newQualityWeight + newOnTimeWeight + newEvidenceWeight + newReworkWeight + newCompletionWeight;
    if (sum !== 100) {
      alert(`Weights must sum to 100%. Current sum: ${sum}%`);
      return;
    }
    setConfigSaving(true);
    try {
      const created = await analyticsService.createScoringConfiguration({
        configurationName: newConfigName || 'Custom Scoring Matrix',
        qualityWeight: newQualityWeight,
        onTimeWeight: newOnTimeWeight,
        evidenceWeight: newEvidenceWeight,
        reworkWeight: newReworkWeight,
        completionWeight: newCompletionWeight,
        isActive: true,
      });
      await analyticsService.activateScoringConfiguration(created.id);
      setShowConfigModal(false);
      await loadDashboard();
    } catch (err) {
      console.error('Failed to save scoring configuration:', err);
      alert('Failed to save scoring configuration');
    } finally {
      setConfigSaving(false);
    }
  };

  const workStatusData = dashboard?.workStatusDistribution 
    ? Object.entries(dashboard.workStatusDistribution).map(([status, count]) => ({
        name: status.replace('_', ' '),
        rawStatus: status,
        count,
      }))
    : [];

  const financialFlowData = [
    { stage: 'Requested', amount: (dashboard?.totalRequestedSimulatedAmount || 0) / 100000, fill: '#3B82F6' },
    { stage: 'Authorized', amount: (dashboard?.totalAuthorizedSimulatedAmount || 0) / 100000, fill: '#F59E0B' },
    { stage: 'Settled', amount: (dashboard?.totalSettledSimulatedAmount || 0) / 100000, fill: '#10B981' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Operational Analytics & Command Center"
        subtitle="Live cross-project telemetry, contractor delivery velocity, and cryptographic governance."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live DB Telemetry
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              Scoring Weights (v{activeConfig?.version ?? 1})
            </button>
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Prominent Simulated Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900/90 leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5 text-amber-700">
            Enterprise Financial Simulation Notice
          </span>
          Financial amounts, milestones, payment authorizations, and settlements displayed in this analytics dashboard are simulated workflow figures for demonstration and governance testing only. No actual legal disbursement or bank transaction has occurred.
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Link
          to="/analytics/vendors"
          className="p-3 bg-white rounded-xl border border-surface-border shadow-card hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <HardHat className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-800">Vendors</div>
          <div className="text-[10px] text-slate-400">KPI Directory</div>
        </Link>

        <Link
          to="/analytics/vendor-comparison"
          className="p-3 bg-white rounded-xl border border-surface-border shadow-card hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-800">Comparison</div>
          <div className="text-[10px] text-slate-400">Multi-Vendor</div>
        </Link>

        <Link
          to="/analytics/projects"
          className="p-3 bg-white rounded-xl border border-surface-border shadow-card hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-800">Projects</div>
          <div className="text-[10px] text-slate-400">Delivery Velocity</div>
        </Link>

        <Link
          to="/audit-trail"
          className="p-3 bg-white rounded-xl border border-surface-border shadow-card hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <History className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-800">Audit Trail</div>
          <div className="text-[10px] text-slate-400">SHA-256 Proofs</div>
        </Link>

        <Link
          to="/reports"
          className="p-3 bg-white rounded-xl border border-surface-border shadow-card hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-800">Reports</div>
          <div className="text-[10px] text-slate-400">Export CSV</div>
        </Link>

        <button
          onClick={() => setShowConfigModal(true)}
          className="p-3 bg-white rounded-xl border border-surface-border shadow-card hover:border-teal-400 hover:shadow-md transition-all group text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-slate-800">Scoring</div>
          <div className="text-[10px] text-slate-400">Active v{activeConfig?.version ?? 1}</div>
        </button>
      </div>

      {/* Operational KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : dashboard?.activeProjectsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Infrastructure initiatives</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Work Allocations</span>
            <HardHat className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : dashboard?.totalWorkAssignmentsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all zones</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Quality QA</span>
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {loading ? '...' : dashboard?.pendingQualityReviewsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Requiring human sign-off</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Corrective</span>
            <Wrench className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {loading ? '...' : dashboard?.openCorrectiveActionsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active rework tickets</div>
        </div>
      </div>

      {/* Simulated Financial Telemetry Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Requested Payments</span>
            <IndianRupee className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            ₹{((dashboard?.totalRequestedSimulatedAmount || 0) / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Simulated claim records</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Authorized Payments</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            ₹{((dashboard?.totalAuthorizedSimulatedAmount || 0) / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Simulated finance clearances</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled Payments</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            ₹{((dashboard?.totalSettledSimulatedAmount || 0) / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Simulated ledger settlements</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Work Allocation Status Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-600" />
                <span>Work Allocation Status Distribution</span>
              </h3>
              <p className="text-xs text-ink-secondary">
                Real database tally of work order states
              </p>
            </div>
            <span className="text-xs text-ink-muted">
              {dashboard?.totalWorkAssignmentsCount ?? 0} Orders
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {workStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {workStatusData.map((entry, idx) => (
                      <Cell 
                        key={`cell-${idx}`} 
                        fill={STATUS_COLORS[entry.rawStatus] || '#94A3B8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      borderRadius: '8px', 
                      border: 'none', 
                      color: '#FFF', 
                      fontSize: '12px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No work orders recorded</div>
            )}
          </div>
        </div>

        {/* Chart 2: Financial Workflow Funnel */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Simulated Financial Velocity (₹ Lakhs)</span>
              </h3>
              <p className="text-xs text-ink-secondary">
                Requested vs Authorized vs Settled stages
              </p>
            </div>
            <span className="text-xs text-amber-600 font-semibold">Simulated Figures</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  formatter={(val: number) => [`₹${val.toFixed(2)} Lakhs`, 'Amount']}
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '8px', 
                    border: 'none', 
                    color: '#FFF', 
                    fontSize: '12px' 
                  }} 
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#0D9488" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Scoring Matrix Preview Card */}
      <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Active Vendor Scoring Weights (Configuration v{activeConfig?.version ?? 1})
            </h3>
          </div>
          <Link
            to="/analytics/vendors"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            Inspect Vendor Scores <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
            <div className="text-[10px] uppercase font-bold text-teal-800">Quality Weight</div>
            <div className="text-lg font-bold text-teal-900">{activeConfig?.qualityWeight ?? 30}%</div>
            <div className="text-[10px] text-teal-700">QA first-pass score</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-[10px] uppercase font-bold text-blue-800">On-Time Weight</div>
            <div className="text-lg font-bold text-blue-900">{activeConfig?.onTimeWeight ?? 25}%</div>
            <div className="text-[10px] text-blue-700">Delivery schedule</div>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
            <div className="text-[10px] uppercase font-bold text-indigo-800">Evidence Weight</div>
            <div className="text-lg font-bold text-indigo-900">{activeConfig?.evidenceWeight ?? 15}%</div>
            <div className="text-[10px] text-indigo-700">Photo / Geo audit</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-[10px] uppercase font-bold text-amber-800">Rework Weight</div>
            <div className="text-lg font-bold text-amber-900">{activeConfig?.reworkWeight ?? 15}%</div>
            <div className="text-[10px] text-amber-700">(100 - rework rate)</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="text-[10px] uppercase font-bold text-purple-800">Completion Weight</div>
            <div className="text-lg font-bold text-purple-900">{activeConfig?.completionWeight ?? 15}%</div>
            <div className="text-[10px] text-purple-700">Assigned vs finished</div>
          </div>
        </div>
      </div>

      {/* Scoring Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-800">
                  Configure Vendor Scoring Framework
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateScoringConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Configuration Name / Version Label
                </label>
                <input
                  type="text"
                  required
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  placeholder="e.g. Q4 2026 Strict Quality Weighting"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Quality Pass Weight:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newQualityWeight}
                    onChange={(e) => setNewQualityWeight(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">On-Time Completion Weight:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newOnTimeWeight}
                    onChange={(e) => setNewOnTimeWeight(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Evidence Compliance Weight:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newEvidenceWeight}
                    onChange={(e) => setNewEvidenceWeight(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Rework Rate Inverse Weight:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newReworkWeight}
                    onChange={(e) => setNewReworkWeight(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Completion Rate Weight:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newCompletionWeight}
                    onChange={(e) => setNewCompletionWeight(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>

              {/* Total Check */}
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs font-bold">
                <span>Total Weights Sum:</span>
                <span
                  className={
                    newQualityWeight + newOnTimeWeight + newEvidenceWeight + newReworkWeight + newCompletionWeight === 100
                      ? 'text-emerald-700 font-mono'
                      : 'text-rose-600 font-mono'
                  }
                >
                  {newQualityWeight + newOnTimeWeight + newEvidenceWeight + newReworkWeight + newCompletionWeight}% / 100%
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={configSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
                >
                  {configSaving ? 'Activating...' : 'Activate New Weights'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
export default AnalyticsPage;
