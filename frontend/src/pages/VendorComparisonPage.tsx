import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  RefreshCw, 
  Plus, 
  X, 
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { analyticsService } from '../services/analyticsService';
import { VendorPerformance, VendorComparison } from '../types/analytics';

export const VendorComparisonPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [allVendors, setAllVendors] = useState<VendorPerformance[]>([]);
  const [comparison, setComparison] = useState<VendorComparison | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addVendorId, setAddVendorId] = useState('');

  // Read vendorIds from searchParams
  useEffect(() => {
    const raw = searchParams.get('vendors');
    if (raw) {
      const ids = raw.split(',').filter(Boolean);
      setSelectedIds(ids);
    }
  }, [searchParams]);

  // Load all vendors for the dropdown
  useEffect(() => {
    analyticsService.getAllVendorsPerformance()
      .then((data) => {
        setAllVendors(data);
        if (selectedIds.length === 0 && data.length >= 2) {
          const initial = [data[0].vendorId, data[1].vendorId];
          setSelectedIds(initial);
          setSearchParams({ vendors: initial.join(',') });
        }
      })
      .catch((err) => console.error('Failed to load vendors list:', err));
  }, []);

  const fetchComparison = useCallback(async () => {
    if (selectedIds.length === 0) {
      setComparison(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await analyticsService.compareVendors(selectedIds);
      setComparison(data);
    } catch (err) {
      console.error('Failed to compare vendors:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedIds]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const handleAddVendor = () => {
    if (!addVendorId || selectedIds.includes(addVendorId)) return;
    const next = [...selectedIds, addVendorId];
    setSelectedIds(next);
    setSearchParams({ vendors: next.join(',') });
    setAddVendorId('');
  };

  const handleRemoveVendor = (id: string) => {
    const next = selectedIds.filter((vId) => vId !== id);
    setSelectedIds(next);
    setSearchParams({ vendors: next.join(',') });
  };

  const vendors = comparison?.vendors || [];

  // Chart data: compare scores and key rates
  const chartData = vendors.map((v) => ({
    name: v.companyName.split(' ')[0],
    OverallScore: Number((v.overallScore ?? 0).toFixed(1)),
    QualityPass: Number((v.qualityPassRate ?? 0).toFixed(1)),
    OnTime: Number((v.onTimeRate ?? 0).toFixed(1)),
    Completion: Number((v.completionRate ?? 0).toFixed(1)),
    Rework: Number((v.reworkRate ?? 0).toFixed(1)),
  }));

  // Best performer detectors
  const bestScore = Math.max(...vendors.map((v) => v.overallScore ?? 0), 0);
  const bestQuality = Math.max(...vendors.map((v) => v.qualityPassRate ?? 0), 0);
  const bestOnTime = Math.max(...vendors.map((v) => v.onTimeRate ?? 0), 0);
  const lowestRework = Math.min(...vendors.map((v) => v.reworkRate ?? 100), 100);

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

      <PageHeader
        title="Multi-Contractor Benchmark &amp; Comparison Matrix"
        subtitle="Side-by-side empirical performance evaluation across 10 KPIs and active scoring frameworks."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            {vendors.length} Contractors Compared
          </span>
        }
        actions={
          <button
            onClick={fetchComparison}
            disabled={loading}
            className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Selector Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Add to Comparison:</span>
          <select
            value={addVendorId}
            onChange={(e) => setAddVendorId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Select a contractor...</option>
            {allVendors
              .filter((v) => !selectedIds.includes(v.vendorId))
              .map((v) => (
                <option key={v.vendorId} value={v.vendorId}>
                  {v.companyName} ({v.vendorCode}) - Score: {v.overallScore?.toFixed(1) ?? 'N/A'}
                </option>
              ))}
          </select>
          <button
            onClick={handleAddVendor}
            disabled={!addVendorId}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {vendors.map((v) => (
            <span
              key={v.vendorId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium border border-slate-200"
            >
              {v.companyName}
              <button
                onClick={() => handleRemoveVendor(v.vendorId)}
                className="hover:text-rose-600"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Prominent Simulated Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Simulated Figures:</span> Financial settlement figures shown in this comparison represent testbed records for governance workflow demonstration.
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card mb-6">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Score &amp; Rate Benchmark Overview (%)</span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="OverallScore" fill="#0D9488" name="Overall Score" radius={[4, 4, 0, 0]} />
                <Bar dataKey="QualityPass" fill="#3B82F6" name="Quality Pass %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="OnTime" fill="#F59E0B" name="On-Time Delivery %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completion" fill="#10B981" name="Completion Rate %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rework" fill="#EF4444" name="Rework %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold text-slate-700 w-56">Metric / KPI</th>
                {vendors.map((v) => (
                  <th key={v.vendorId} className="py-3.5 px-4 font-bold text-slate-800 text-right">
                    <div>{v.companyName}</div>
                    <span className="font-mono text-[10px] text-slate-400 font-normal">
                      {v.vendorCode}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Overall Score */}
              <tr className="bg-teal-50/20 font-bold">
                <td className="py-3 px-4 text-teal-900">Overall Weighted Score</td>
                {vendors.map((v) => {
                  const isWinner = (v.overallScore ?? 0) === bestScore && bestScore > 0;
                  return (
                    <td key={v.vendorId} className="py-3 px-4 text-right">
                      <span className={`text-sm ${isWinner ? 'text-teal-700 font-black' : 'text-slate-800'}`}>
                        {v.overallScore?.toFixed(1) ?? '0.0'}
                      </span>
                      {isWinner && (
                        <span className="ml-1 text-[10px] text-teal-600 uppercase font-bold">&bull; Best</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Tier */}
              <tr>
                <td className="py-3 px-4 text-slate-600 font-semibold">Ranking Tier</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right">
                    <span className="font-bold text-slate-800">{v.rankingTier}</span>
                  </td>
                ))}
              </tr>

              {/* Data Sufficiency */}
              <tr>
                <td className="py-3 px-4 text-slate-600 font-semibold">Data Sufficiency</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right">
                    {v.dataSufficiencyStatus === 'SUFFICIENT_DATA' ? (
                      <span className="text-emerald-700 font-semibold">Sufficient (3+)</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">Provisional (&lt;3)</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* KPI 1 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 1: Completion Rate</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right font-medium">
                    {v.completionRate?.toFixed(1) ?? '0.0'}%
                  </td>
                ))}
              </tr>

              {/* KPI 2 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 2: On-Time Delivery Rate</td>
                {vendors.map((v) => {
                  const isWinner = (v.onTimeRate ?? 0) === bestOnTime && bestOnTime > 0;
                  return (
                    <td key={v.vendorId} className={`py-3 px-4 text-right font-medium ${isWinner ? 'text-blue-700 font-bold' : ''}`}>
                      {v.onTimeRate?.toFixed(1) ?? '0.0'}%
                    </td>
                  );
                })}
              </tr>

              {/* KPI 3 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 3: Quality Pass Rate</td>
                {vendors.map((v) => {
                  const isWinner = (v.qualityPassRate ?? 0) === bestQuality && bestQuality > 0;
                  return (
                    <td key={v.vendorId} className={`py-3 px-4 text-right font-medium ${isWinner ? 'text-teal-700 font-bold' : ''}`}>
                      {v.qualityPassRate?.toFixed(1) ?? '0.0'}%
                    </td>
                  );
                })}
              </tr>

              {/* KPI 4 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 4: Rework Rate (Lower is better)</td>
                {vendors.map((v) => {
                  const isWinner = (v.reworkRate ?? 100) === lowestRework;
                  return (
                    <td key={v.vendorId} className={`py-3 px-4 text-right font-medium ${isWinner ? 'text-emerald-700 font-bold' : 'text-rose-700'}`}>
                      {v.reworkRate?.toFixed(1) ?? '0.0'}%
                    </td>
                  );
                })}
              </tr>

              {/* KPI 5 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 5: Evidence Compliance Rate</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right font-medium">
                    {v.evidenceComplianceRate?.toFixed(1) ?? '0.0'}%
                  </td>
                ))}
              </tr>

              {/* KPI 6 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 6: Turnaround Time (hours)</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right font-medium">
                    {v.avgInspectionTurnaroundHours?.toFixed(1) ?? '0.0'}h
                  </td>
                ))}
              </tr>

              {/* KPI 7 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 7: CA Resolution Time (hours)</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right font-medium">
                    {v.avgCorrectiveActionResolutionHours?.toFixed(1) ?? '0.0'}h
                  </td>
                ))}
              </tr>

              {/* KPI 8 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 8: Overdue Work Assignments</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right font-medium">
                    {v.overdueAssignmentsCount ?? 0}
                  </td>
                ))}
              </tr>

              {/* KPI 9 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 9: Delay Magnitude (days)</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right font-medium">
                    {v.avgDelayDays?.toFixed(1) ?? '0.0'}d
                  </td>
                ))}
              </tr>

              {/* KPI 10 */}
              <tr>
                <td className="py-3 px-4 text-slate-600">KPI 10: Simulated Settlement</td>
                {vendors.map((v) => (
                  <td key={v.vendorId} className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                    ₹{((v.totalSimulatedSettled || 0) / 100000).toFixed(2)} L
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
};
export default VendorComparisonPage;
