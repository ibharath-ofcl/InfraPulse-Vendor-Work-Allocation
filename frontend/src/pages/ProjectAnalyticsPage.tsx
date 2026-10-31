import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  Search, 
  Download, 
  RefreshCw, 
  Activity, 
  AlertCircle
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { analyticsService } from '../services/analyticsService';
import { ProjectPerformance } from '../types/analytics';

export const ProjectAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectPerformance[]>([]);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getAllProjectsPerformance();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load project performance analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const job = await analyticsService.exportReport({
        reportType: 'PROJECT_PERFORMANCE',
        format: 'CSV',
      });
      const blob = await analyticsService.downloadReportContent(job.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_performance_report_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export project analytics CSV:', err);
      alert('Failed to export project analytics CSV');
    } finally {
      setExporting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.projectName.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  });

  const totalBudget = projects.reduce((acc, curr) => acc + (curr.budget || 0), 0);
  const totalSettled = projects.reduce((acc, curr) => acc + (curr.simulatedSettledTotal || 0), 0);
  const totalOrders = projects.reduce((acc, curr) => acc + (curr.totalAssignments || 0), 0);

  return (
    <PageContainer>
      <PageHeader
        title="Project Performance &amp; Delivery Velocity"
        subtitle="Empirical operational progress, milestone execution velocity, and simulated financial governance."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-teal-600" />
            {projects.length} Master Projects
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={exporting || projects.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
              Export Projects CSV
            </button>
            <button
              onClick={fetchProjects}
              disabled={loading}
              className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Prominent Simulated Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900/90 leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5 text-amber-700">
            Financial Simulation Notice
          </span>
          Milestone values, approved payments, and settled amounts are simulated workflow records for governance simulation. No actual banking transfers or statutory disbursements are executed.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Initiatives
          </span>
          <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Managed corridors</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Work Orders
          </span>
          <div className="text-2xl font-bold text-teal-700">{totalOrders}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all zones</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Aggregate Budget
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ₹{(totalBudget / 100000).toFixed(2)} L
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Allocated project funds</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Simulated Settled
          </span>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            ₹{(totalSettled / 100000).toFixed(2)} L
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Simulated disbursements</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card mb-6 flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search project name, code, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-3 px-4">Project &amp; Code</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Work Orders</th>
                <th className="py-3 px-4 text-right">Completion %</th>
                <th className="py-3 px-4 text-right">On-Time %</th>
                <th className="py-3 px-4 text-right">QA Pass %</th>
                <th className="py-3 px-4 text-right">Rework %</th>
                <th className="py-3 px-4 text-right">Milestones</th>
                <th className="py-3 px-4 text-right">Simulated Settled</th>
                <th className="py-3 px-4 text-center">Audit Feed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Aggregating project performance data...
                  </td>
                </tr>
              )}

              {!loading && filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No projects found matching criteria.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredProjects.map((p) => {
                  return (
                    <tr key={p.projectId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <Link
                          to={`/projects/${p.projectId}`}
                          className="font-bold hover:text-teal-600 hover:underline block"
                        >
                          {p.projectName}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">
                          {p.projectCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          {p.projectStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-slate-800">{p.totalAssignments}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.completedAssignments} done / {p.overdueCount} overdue
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {p.completionRate?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {p.onTimeRate?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-teal-700">
                        {p.qualityPassRate?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-rose-700">
                        {p.reworkRate?.toFixed(1) ?? '0.0'}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-slate-800">
                          {p.completedMilestones} / {p.totalMilestones}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Val: ₹{((p.totalMilestoneValue || 0) / 100000).toFixed(1)}L
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{((p.simulatedSettledTotal || 0) / 100000).toFixed(2)} L
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/projects/${p.projectId}/activity`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
                          title="Cryptographic Project Audit Trail"
                        >
                          <Activity className="w-3.5 h-3.5 text-teal-600" />
                          Activity
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
};
export default ProjectAnalyticsPage;
