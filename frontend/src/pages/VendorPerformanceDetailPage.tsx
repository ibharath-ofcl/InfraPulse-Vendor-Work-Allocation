import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  HardHat, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Activity, 
  Sliders, 
  Award,
  Layers,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { analyticsService } from '../services/analyticsService';
import { VendorPerformance, ScoringConfiguration } from '../types/analytics';

export const VendorPerformanceDetailPage: React.FC = () => {
  const { id: vendorId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<VendorPerformance | null>(null);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfiguration | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const [perf, config] = await Promise.all([
        analyticsService.getVendorPerformance(vendorId),
        analyticsService.getActiveScoringConfiguration().catch(() => null),
      ]);
      setPerformance(perf);
      setScoringConfig(config);
    } catch (err) {
      console.error('Failed to load contractor performance detail:', err);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCsv = async () => {
    if (!vendorId) return;
    setExporting(true);
    try {
      const job = await analyticsService.exportReport({
        reportType: 'VENDOR_PERFORMANCE',
        format: 'CSV',
        vendorId,
      });
      const blob = await analyticsService.downloadReportContent(job.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contractor_${performance?.vendorCode || 'perf'}_report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export contractor report:', err);
      alert('Failed to export contractor report');
    } finally {
      setExporting(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-600" /> PLATINUM TIER
          </span>
        );
      case 'GOLD':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" /> GOLD TIER
          </span>
        );
      case 'SILVER':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-600" /> SILVER TIER
          </span>
        );
      case 'BRONZE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-orange-600" /> BRONZE TIER
          </span>
        );
      case 'PROBATION':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> PROBATION STATUS
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {tier}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-24 text-center text-slate-400 text-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
          Loading real contractor KPI analytics and scoring weights...
        </div>
      </PageContainer>
    );
  }

  if (!performance) {
    return (
      <PageContainer>
        <div className="py-16 text-center text-slate-500">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Contractor Analytics Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">Unable to locate records for vendor #{vendorId}</p>
          <Link
            to="/analytics/vendors"
            className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold"
          >
            Return to Vendor Directory
          </Link>
        </div>
      </PageContainer>
    );
  }

  const score = performance.overallScore ?? 0;
  const qW = scoringConfig?.qualityWeight ?? 30;
  const oW = scoringConfig?.onTimeWeight ?? 25;
  const eW = scoringConfig?.evidenceWeight ?? 15;
  const rW = scoringConfig?.reworkWeight ?? 15;
  const cW = scoringConfig?.completionWeight ?? 15;

  return (
    <PageContainer>
      <div className="mb-4">
        <Link
          to="/analytics/vendors"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Contractor Directory</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-xl p-6 border border-surface-border shadow-card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <HardHat className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900">{performance.companyName}</h1>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                  {performance.vendorCode}
                </span>
                {getTierBadge(performance.rankingTier)}
              </div>
              <p className="text-xs text-slate-500">
                Vendor ID: <span className="font-mono">{performance.vendorId}</span> &bull; Scoring Version: v{performance.scoringConfigurationVersion}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/vendors/${vendorId}/activity`}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-slate-600" />
              Activity Log
            </Link>
            <Link
              to={`/analytics/vendor-comparison?vendors=${vendorId}`}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Compare
            </Link>
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Insufficient Data Warning Banner (if applicable) */}
      {performance.dataSufficiencyStatus === 'INSUFFICIENT_DATA' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900/90 leading-relaxed">
            <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5 text-amber-800">
              Provisional Status &mdash; Insufficient Data Sample
            </span>
            This contractor has completed {performance.sampleCounts?.completedAssignments ?? 0} work assignments, which is below the minimum statistical confidence threshold (3 completed assignments). Calculated rates are provisional indicators and should not be used for definitive contractual penalties.
          </div>
        </div>
      )}

      {/* Prominent Financial Simulation Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900/90 leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5 text-blue-800">
            Simulated Settlement Ledger Notice
          </span>
          {performance.simulationDisclaimer ||
            'Payment authorizations and settlements displayed are simulated workflow records for governance simulation. No actual banking transfers or statutory disbursements are executed.'}
        </div>
      </div>

      {/* Explainable Weighted Scoring Formula Card */}
      <div className="bg-white rounded-xl p-6 border border-surface-border shadow-card mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Explainable Scoring Engine Breakdown (v{performance.scoringConfigurationVersion})
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Overall Weighted Score:</span>
            <span className="text-2xl font-black text-teal-700">{score.toFixed(1)} / 100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">1. Quality Pass</div>
            <div className="font-bold text-slate-800 text-sm mt-1">
              {performance.qualityPassRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-teal-600 font-mono mt-1">
              &times; {qW}% = {((performance.qualityPassRate * qW) / 100).toFixed(1)} pts
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">2. On-Time Delivery</div>
            <div className="font-bold text-slate-800 text-sm mt-1">
              {performance.onTimeRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-teal-600 font-mono mt-1">
              &times; {oW}% = {((performance.onTimeRate * oW) / 100).toFixed(1)} pts
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">3. Evidence Compliance</div>
            <div className="font-bold text-slate-800 text-sm mt-1">
              {performance.evidenceComplianceRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-teal-600 font-mono mt-1">
              &times; {eW}% = {((performance.evidenceComplianceRate * eW) / 100).toFixed(1)} pts
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">4. Rework Inverse</div>
            <div className="font-bold text-slate-800 text-sm mt-1">
              {(100 - performance.reworkRate).toFixed(1)}%
            </div>
            <div className="text-[11px] text-teal-600 font-mono mt-1">
              &times; {rW}% = {(((100 - performance.reworkRate) * rW) / 100).toFixed(1)} pts
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">5. Work Completion</div>
            <div className="font-bold text-slate-800 text-sm mt-1">
              {performance.completionRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-teal-600 font-mono mt-1">
              &times; {cW}% = {((performance.completionRate * cW) / 100).toFixed(1)} pts
            </div>
          </div>
        </div>
      </div>

      {/* 10 KPIs Grid */}
      <div className="mb-6">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          <span>10 Empirical Performance KPIs</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 1 &bull; Completion Rate
            </div>
            <div className="text-xl font-bold text-slate-900">
              {performance.completionRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Approved completed / Eligible
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 2 &bull; On-Time Delivery
            </div>
            <div className="text-xl font-bold text-slate-900">
              {performance.onTimeRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Completed before due date
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 3 &bull; Quality Pass Rate
            </div>
            <div className="text-xl font-bold text-teal-700">
              {performance.qualityPassRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              First-pass QA approval
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 4 &bull; Rework Rate
            </div>
            <div className="text-xl font-bold text-rose-700">
              {performance.reworkRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Failed inspections / total
            </div>
          </div>

          {/* KPI 5 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 5 &bull; Evidence Compliance
            </div>
            <div className="text-xl font-bold text-blue-700">
              {performance.evidenceComplianceRate?.toFixed(1) ?? '0.0'}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Compliant photo / GPS evidence
            </div>
          </div>

          {/* KPI 6 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 6 &bull; Avg Turnaround Time
            </div>
            <div className="text-xl font-bold text-slate-900">
              {performance.avgInspectionTurnaroundHours?.toFixed(1) ?? '0.0'}h
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Inspection review elapsed
            </div>
          </div>

          {/* KPI 7 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 7 &bull; Corrective Action Time
            </div>
            <div className="text-xl font-bold text-slate-900">
              {performance.avgCorrectiveActionResolutionHours?.toFixed(1) ?? '0.0'}h
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Rework resolution elapsed
            </div>
          </div>

          {/* KPI 8 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 8 &bull; Overdue Assignments
            </div>
            <div className="text-xl font-bold text-rose-700">
              {performance.overdueAssignmentsCount ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Breached target delivery date
            </div>
          </div>

          {/* KPI 9 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 9 &bull; Delay Magnitude
            </div>
            <div className="text-xl font-bold text-slate-900">
              {performance.avgDelayDays?.toFixed(1) ?? '0.0'} days
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Mean days over deadline
            </div>
          </div>

          {/* KPI 10 */}
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              KPI 10 &bull; Simulated Settlement
            </div>
            <div className="text-xl font-bold text-emerald-700 font-mono">
              ₹{((performance.totalSimulatedSettled || 0) / 100000).toFixed(2)} L
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">
              Simulated payment records
            </div>
          </div>
        </div>
      </div>

      {/* Sample Count Diagnostics */}
      <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
          Statistical Sample Diagnostics &amp; Entity Volume
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block">Total Work Orders</span>
            <span className="font-bold text-slate-800 text-sm">
              {performance.sampleCounts?.totalAssignments ?? 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block">Completed Work Orders</span>
            <span className="font-bold text-slate-800 text-sm">
              {performance.sampleCounts?.completedAssignments ?? 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block">Inspections Evaluated</span>
            <span className="font-bold text-slate-800 text-sm">
              {performance.sampleCounts?.inspectedAssignments ?? 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block">Corrective Action Tickets</span>
            <span className="font-bold text-slate-800 text-sm">
              {performance.sampleCounts?.correctiveActionsTotal ?? 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block">Milestone Claims Filed</span>
            <span className="font-bold text-slate-800 text-sm">
              {performance.sampleCounts?.financialRequestsTotal ?? 0}
            </span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
export default VendorPerformanceDetailPage;
