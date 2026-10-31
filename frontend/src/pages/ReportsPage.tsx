import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { analyticsService } from '../services/analyticsService';
import { ReportType, ReportJobResponse, ExportReportRequest } from '../types/analytics';

const REPORT_TYPES: { type: ReportType; label: string; description: string }[] = [
  {
    type: 'VENDOR_PERFORMANCE',
    label: 'Contractor Performance & 10-KPI Evaluation',
    description: 'Empirical KPI rates, explainable weighted scores, ranking tiers, and sample counts.',
  },
  {
    type: 'PROJECT_PERFORMANCE',
    label: 'Master Project Delivery Velocity & Progress',
    description: 'Corridor completion velocity, work order tallies, milestone disbursements, and rates.',
  },
  {
    type: 'WORK_ASSIGNMENT',
    label: 'Operational Work Allocation Ledger',
    description: 'All work assignment orders across zones, dates, contractors, and live statuses.',
  },
  {
    type: 'QUALITY_INSPECTION',
    label: 'Quality Inspection & AI Evidence Verification',
    description: 'First-pass inspection results, checklist evaluations, and human sign-off history.',
  },
  {
    type: 'CORRECTIVE_ACTION',
    label: 'Corrective Action & Rework Tracking',
    description: 'Defect remediation tickets, vendor response times, and verification outcomes.',
  },
  {
    type: 'AUDIT_EVENT',
    label: 'Cryptographic Enterprise Audit Trail',
    description: 'Tamper-evident audit log with canonical SHA-256 hashes and sequence chaining.',
  },
  {
    type: 'MILESTONE_FINANCIAL',
    label: 'Milestone Claims & Simulated Settlements',
    description: 'Commercial agreements, payment authorizations, and simulated financial settlements.',
  },
];

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<ReportJobResponse[]>([]);
  const [selectedType, setSelectedType] = useState<ReportType>('VENDOR_PERFORMANCE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const pageData = await analyticsService.getReportJobs(0, 20);
      setJobs(pageData.content || []);
    } catch (err) {
      console.error('Failed to load report export jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    try {
      const req: ExportReportRequest = {
        reportType: selectedType,
        format: 'CSV',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const job = await analyticsService.exportReport(req);
      // Trigger instant direct download
      await handleDownload(job.id, job.fileName);
      await fetchJobs();
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report export');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async (jobId: string, fileName?: string) => {
    setDownloadingId(jobId);
    try {
      const blob = await analyticsService.downloadReportContent(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `infrapulse_export_${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report content:', err);
      alert('Failed to download report file');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
          </span>
        );
      case 'GENERATING':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Failed
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Enterprise Data Reports &amp; Export Center"
        subtitle="Export cryptographic audit logs, empirical 10-KPI vendor analytics, and operational ledgers in standard CSV format."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            CSV Export Engine
          </span>
        }
        actions={
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            title="Refresh Jobs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Prominent Simulated Financial Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900/90 leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5 text-amber-700">
            Exported Financial Data Simulation Notice
          </span>
          All financial figures, payment authorizations, and settlement amounts exported in these reports represent simulated testbed records for workflow validation. They are not legal accounting records.
        </div>
      </div>

      {/* Export Configuration Form Card */}
      <div className="bg-white rounded-xl p-6 border border-surface-border shadow-card mb-8">
        <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-teal-600" />
          <span>Generate New CSV Report</span>
        </h3>

        <form onSubmit={handleGenerateReport} className="space-y-6">
          {/* Report Type Selector Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Dataset to Export:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REPORT_TYPES.map((rt) => {
                const isSelected = selectedType === rt.type;
                return (
                  <div
                    key={rt.type}
                    onClick={() => setSelectedType(rt.type)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{rt.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {rt.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Export Format
              </label>
              <input
                type="text"
                disabled
                value="Comma Separated Values (.CSV)"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={exporting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Generating & Downloading...' : 'Generate & Export CSV Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Historical Report Jobs Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Report Generation History &amp; Downloads
          </h4>
          <span className="text-xs text-slate-400 font-mono">{jobs.length} Reports Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-3 px-4">Report Code &amp; File</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Records</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No export jobs executed yet. Generate your first report above!
                  </td>
                </tr>
              )}

              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="font-mono font-bold text-teal-800">{job.reportCode}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{job.fileName}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {job.reportType}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                    {job.format}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(job.status)}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                    {job.recordCount} rows
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDownload(job.id, job.fileName)}
                      disabled={job.status !== 'COMPLETED' || downloadingId === job.id}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 disabled:opacity-40"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingId === job.id ? 'animate-bounce' : ''}`} />
                      Download
                    </button>
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
export default ReportsPage;
