import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HardHat, 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Eye, 
  Activity
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { analyticsService } from '../services/analyticsService';
import { VendorPerformance } from '../types/analytics';

export const VendorAnalyticsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<VendorPerformance[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [sufficiencyFilter, setSufficiencyFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'quality' | 'onTime' | 'rework' | 'completion'>('score');
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getAllVendorsPerformance();
      setVendors(data);
    } catch (err) {
      console.error('Failed to load vendor performance metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const toggleSelectVendor = (id: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const job = await analyticsService.exportReport({
        reportType: 'VENDOR_PERFORMANCE',
        format: 'CSV',
      });
      // Download directly
      const blob = await analyticsService.downloadReportContent(job.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor_performance_report_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export vendor performance report:', err);
      alert('Failed to generate vendor performance report');
    } finally {
      setExporting(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            PLATINUM
          </span>
        );
      case 'GOLD':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            GOLD
          </span>
        );
      case 'SILVER':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            SILVER
          </span>
        );
      case 'BRONZE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
            BRONZE
          </span>
        );
      case 'PROBATION':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            PROBATION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
            {tier || 'STANDARD'}
          </span>
        );
    }
  };

  const filteredVendors = vendors
    .filter((v) => {
      if (tierFilter !== 'ALL' && v.rankingTier !== tierFilter) return false;
      if (sufficiencyFilter !== 'ALL' && v.dataSufficiencyStatus !== sufficiencyFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          v.companyName.toLowerCase().includes(q) ||
          v.vendorCode.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.overallScore ?? 0) - (a.overallScore ?? 0);
      if (sortBy === 'quality') return (b.qualityPassRate ?? 0) - (a.qualityPassRate ?? 0);
      if (sortBy === 'onTime') return (b.onTimeRate ?? 0) - (a.onTimeRate ?? 0);
      if (sortBy === 'rework') return (a.reworkRate ?? 0) - (b.reworkRate ?? 0); // lower is better
      if (sortBy === 'completion') return (b.completionRate ?? 0) - (a.completionRate ?? 0);
      return 0;
    });

  const avgScore = vendors.length
    ? (vendors.reduce((acc, curr) => acc + (curr.overallScore ?? 0), 0) / vendors.length).toFixed(1)
    : '0';

  const sufficientCount = vendors.filter((v) => v.dataSufficiencyStatus === 'SUFFICIENT_DATA').length;

  return (
    <PageContainer>
      <PageHeader
        title="Contractor Performance Directory &amp; Rankings"
        subtitle="Objective 10-KPI evaluation engine, explainable weighted scoring, and empirical tier allocations."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5 text-teal-600" />
            {vendors.length} Contractors Evaluated
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={exporting || vendors.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
              Export Directory CSV
            </button>
            <button
              onClick={fetchVendors}
              disabled={loading}
              className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Directory Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Evaluated
          </span>
          <div className="text-2xl font-bold text-slate-900">{vendors.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Empanelled contractors</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Mean Performance Score
          </span>
          <div className="text-2xl font-bold text-teal-700">{avgScore} / 100</div>
          <div className="text-[11px] text-slate-400 mt-1">Weighted governance index</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Data Sufficiency
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {sufficientCount} / {vendors.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Meets sample threshold (3+ jobs)</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Scoring Framework
          </span>
          <div className="text-2xl font-bold text-blue-700">
            v{vendors[0]?.scoringConfigurationVersion ?? 1}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active enterprise matrix</div>
        </div>
      </div>

      {/* Filter and Compare Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter contractor name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Tier:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-medium"
              >
                <option value="ALL">All Tiers</option>
                <option value="PLATINUM">Platinum</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
                <option value="PROBATION">Probation</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Sufficiency:</span>
              <select
                value={sufficiencyFilter}
                onChange={(e) => setSufficiencyFilter(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-medium"
              >
                <option value="ALL">All</option>
                <option value="SUFFICIENT_DATA">Sufficient Data (3+)</option>
                <option value="INSUFFICIENT_DATA">Insufficient Data</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-medium"
              >
                <option value="score">Overall Score</option>
                <option value="quality">Quality Pass %</option>
                <option value="onTime">On-Time %</option>
                <option value="rework">Lowest Rework %</option>
                <option value="completion">Completion %</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selected Compare Bar */}
        {selectedVendorIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs">
            <span className="font-semibold text-teal-800">
              {selectedVendorIds.length} vendor(s) selected for side-by-side comparison
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedVendorIds([])}
                className="text-slate-500 hover:text-slate-700 underline text-xs"
              >
                Deselect All
              </button>
              <button
                disabled={selectedVendorIds.length < 2}
                onClick={() =>
                  navigate(`/analytics/vendor-comparison?vendors=${selectedVendorIds.join(',')}`)
                }
                className="px-3 py-1.5 bg-teal-600 text-white rounded font-bold hover:bg-teal-700 disabled:opacity-50"
              >
                Launch Side-by-Side Comparison ({selectedVendorIds.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contractor Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredVendors.length > 0 &&
                      selectedVendorIds.length === filteredVendors.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVendorIds(filteredVendors.map((v) => v.vendorId));
                      } else {
                        setSelectedVendorIds([]);
                      }
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="py-3 px-3">Contractor &amp; Code</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3">Data Status</th>
                <th className="py-3 px-3 text-right">Overall Score</th>
                <th className="py-3 px-3 text-right">Quality %</th>
                <th className="py-3 px-3 text-right">On-Time %</th>
                <th className="py-3 px-3 text-right">Rework %</th>
                <th className="py-3 px-3 text-right">Turnaround</th>
                <th className="py-3 px-3 text-right">Simulated Settled</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Calculating real database analytics metrics...
                  </td>
                </tr>
              )}

              {!loading && filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No contractors match filter criteria.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredVendors.map((v) => {
                  const isSelected = selectedVendorIds.includes(v.vendorId);
                  const score = v.overallScore ?? 0;
                  return (
                    <tr
                      key={v.vendorId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-teal-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectVendor(v.vendorId)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        <Link
                          to={`/analytics/vendors/${v.vendorId}`}
                          className="hover:text-teal-600 hover:underline font-bold block"
                        >
                          {v.companyName}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">
                          {v.vendorCode}
                        </span>
                      </td>
                      <td className="py-3 px-3">{getTierBadge(v.rankingTier)}</td>
                      <td className="py-3 px-3">
                        {v.dataSufficiencyStatus === 'SUFFICIENT_DATA' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sufficient ({v.sampleCounts?.completedAssignments ?? 0})
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                            title="Sample size under 3 completed assignments"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Provisional
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-900 text-sm">
                          {score.toFixed(1)}
                        </div>
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              score >= 85
                                ? 'bg-emerald-500'
                                : score >= 70
                                ? 'bg-teal-500'
                                : score >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        {v.qualityPassRate?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        {v.onTimeRate?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {v.reworkRate?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {v.avgInspectionTurnaroundHours?.toFixed(1) ?? '0.0'}h
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-mono">
                        ₹{((v.totalSimulatedSettled || 0) / 100000).toFixed(2)} L
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/analytics/vendors/${v.vendorId}`}
                            className="p-1 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded"
                            title="Detailed 10-KPI Dashboard"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/vendors/${v.vendorId}/activity`}
                            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Contractor Audit Activity"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Financial Footnote */}
      <div className="text-[11px] text-amber-700 bg-amber-50/60 border border-amber-200/60 p-3 rounded-lg">
        <span className="font-bold">Operational Note:</span> Financial settlement figures (Simulated Settled) shown above are simulated workflow metrics. They represent verified milestone completion values recorded in the database, with no actual banking transactions.
      </div>
    </PageContainer>
  );
};
export default VendorAnalyticsDirectoryPage;
