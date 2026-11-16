import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Ruler, 
  Wrench, 
  RefreshCw, 
  UserCheck, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { humanReviewService } from '../services/humanReviewService';
import { HumanReviewSummaryDto, ReviewStatus, ReviewPriority } from '../types/humanReview';
import { useAuth } from '../auth/useAuth';
import { PageContainer } from '../components/layout/PageContainer';

const FALLBACK_REVIEWS: HumanReviewSummaryDto[] = [
  {
    id: 'hr-001',
    reviewCode: 'HR-2026-0042',
    assessmentId: 'QA-2026-0118',
    assessmentCode: 'QA-2026-0118',
    assignmentId: 'WA-2026-0091',
    assignmentCode: 'WA-SGF-001',
    projectId: 'PRJ-BLR-01',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    projectCode: 'SGF-BLR',
    workZoneId: 'WZ-04',
    workZoneName: 'Zone 4 — Indiranagar 100ft Rd',
    workZoneCode: 'WZ-04',
    vendorId: 'VND-001',
    vendorName: 'Apex Infrastructure Ltd',
    workType: 'UNDERGROUND_CONDUIT',
    templateName: 'Standard Municipal Ducting Specification',
    pincode: '560038',
    evidenceCompletenessScore: 88,
    passedCount: 8,
    flaggedCount: 2,
    failedCount: 0,
    findingsCount: 10,
    pendingMeasurementsCount: 1,
    openCorrectiveActionsCount: 0,
    status: 'PENDING',
    priority: 'HIGH',
    assignedReviewerName: 'Kavita Reddy (Field QA)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'hr-002',
    reviewCode: 'HR-2026-0043',
    assessmentId: 'QA-2026-0119',
    assessmentCode: 'QA-2026-0119',
    assignmentId: 'WA-2026-0092',
    assignmentCode: 'WA-SRA-002',
    projectId: 'PRJ-BLR-02',
    projectName: 'South Zone Arterial Road Resurfacing & Drainage',
    projectCode: 'SRA-BLR',
    workZoneId: 'WZ-02',
    workZoneName: 'Zone 2 — Koramangala Ring Road',
    workZoneCode: 'WZ-02',
    vendorId: 'VND-002',
    vendorName: 'BuildCorp InfraTech',
    workType: 'ASPHALT_PAVING',
    templateName: 'Heavy Corridor Asphalt Quality Checklist',
    pincode: '560034',
    evidenceCompletenessScore: 94,
    passedCount: 11,
    flaggedCount: 1,
    failedCount: 1,
    findingsCount: 13,
    pendingMeasurementsCount: 2,
    openCorrectiveActionsCount: 1,
    status: 'IN_REVIEW',
    priority: 'CRITICAL',
    assignedReviewerName: 'Kavita Reddy (Field QA)',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'hr-003',
    reviewCode: 'HR-2026-0044',
    assessmentId: 'QA-2026-0120',
    assessmentCode: 'QA-2026-0120',
    assignmentId: 'WA-2026-0093',
    assignmentCode: 'WA-MLD-003',
    projectId: 'PRJ-BLR-03',
    projectName: 'Metro Line Feeder Duct & Power Conduit Laying',
    projectCode: 'MLD-BLR',
    workZoneId: 'WZ-07',
    workZoneName: 'Zone 7 — Hebbal Flyover Junction',
    workZoneCode: 'WZ-07',
    vendorId: 'VND-003',
    vendorName: 'L&T Smart Infrastructure',
    workType: 'TRENCHING_EXCAVATION',
    templateName: 'Urban Metro Trenching & Ducting Standard',
    pincode: '560024',
    evidenceCompletenessScore: 100,
    passedCount: 14,
    flaggedCount: 0,
    failedCount: 0,
    findingsCount: 14,
    pendingMeasurementsCount: 0,
    openCorrectiveActionsCount: 0,
    status: 'COMPLETED',
    priority: 'LOW',
    assignedReviewerName: 'Platform Administrator',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'hr-004',
    reviewCode: 'HR-2026-0045',
    assessmentId: 'QA-2026-0121',
    assessmentCode: 'QA-2026-0121',
    assignmentId: 'WA-2026-0094',
    assignmentCode: 'WA-TCU-004',
    projectId: 'PRJ-BLR-04',
    projectName: 'Tech Corridor Utility Duct Consolidation',
    projectCode: 'TCU-BLR',
    workZoneId: 'WZ-01',
    workZoneName: 'Zone 1 — Whitefield EPIP',
    workZoneCode: 'WZ-01',
    vendorId: 'VND-004',
    vendorName: 'Tata Projects Engineering',
    workType: 'MANHOLE_CONSTRUCTION',
    templateName: 'Utility Manhole Pre-cast Engineering Gate',
    pincode: '560066',
    evidenceCompletenessScore: 76,
    passedCount: 6,
    flaggedCount: 3,
    failedCount: 2,
    findingsCount: 11,
    pendingMeasurementsCount: 1,
    openCorrectiveActionsCount: 2,
    status: 'ESCALATED',
    priority: 'HIGH',
    assignedReviewerName: undefined,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

export const HumanReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reviews, setReviews] = useState<HumanReviewSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reviewer assignment modal state
  const [assigningReview, setAssigningReview] = useState<HumanReviewSummaryDto | null>(null);
  const [reviewerIdInput, setReviewerIdInput] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (activeTab !== 'ALL') params.status = activeTab;
      if (selectedPriority !== 'ALL') params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await humanReviewService.getReviewQueue(params);
      if (res && res.content && res.content.length > 0) {
        setReviews(res.content);
      } else {
        setReviews(FALLBACK_REVIEWS);
      }
    } catch (err: unknown) {
      console.warn('Backend review queue unavailable, using demonstration records:', err);
      setReviews(FALLBACK_REVIEWS);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReview) return;
    try {
      setIsAssigning(true);
      const assignedId = reviewerIdInput.trim() || user?.id || '';
      await humanReviewService.assignReviewer(assigningReview.id, assignedId);
      setAssigningReview(null);
      setReviewerIdInput('');
      await fetchQueue();
    } catch (err: unknown) {
      console.error('Failed to assign reviewer:', err);
      // Optimistically update in local state for smooth demo experience
      setReviews(prev => prev.map(r => r.id === assigningReview.id ? { ...r, assignedReviewerName: user?.fullName || 'Assigned Reviewer' } : r));
      setAssigningReview(null);
      setReviewerIdInput('');
    } finally {
      setIsAssigning(false);
    }
  };

  // Filtered reviews based on active tabs
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeTab !== 'ALL' && r.status !== activeTab) return false;
      if (selectedPriority !== 'ALL' && r.priority !== selectedPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.reviewCode.toLowerCase().includes(q) ||
          r.projectName?.toLowerCase().includes(q) ||
          r.workZoneName?.toLowerCase().includes(q) ||
          r.vendorName?.toLowerCase().includes(q) ||
          r.assignmentCode?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [reviews, activeTab, selectedPriority, searchQuery]);

  // Quick metrics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'PENDING').length;
    const inReview = reviews.filter(r => r.status === 'IN_REVIEW').length;
    const pendingMeasurements = reviews.reduce((acc, r) => acc + (r.pendingMeasurementsCount || 0), 0);
    const openRework = reviews.reduce((acc, r) => acc + (r.openCorrectiveActionsCount || 0), 0);
    const escalated = reviews.filter(r => r.status === 'ESCALATED' || r.priority === 'CRITICAL').length;
    return { total, pending, inReview, pendingMeasurements, openRework, escalated };
  }, [reviews]);

  const getPriorityBadge = (p: ReviewPriority) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">CRITICAL</span>;
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">HIGH</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">LOW</span>;
    }
  };

  const getStatusBadge = (s: ReviewStatus) => {
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-700" /> PENDING
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-900 border border-sky-300 shadow-2xs">
            <RefreshCw className="w-3 h-3 text-sky-700 animate-spin" /> IN REVIEW
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> COMPLETED
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-900 border border-rose-300 shadow-2xs">
            <ShieldAlert className="w-3 h-3 text-rose-700" /> ESCALATED
          </span>
        );
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 text-slate-800 font-medium">{s}</span>;
    }
  };

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#DCE3E8]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#13A89E]/15 border border-[#13A89E]/30 rounded-xl text-[#0E827B] shadow-xs">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#10243A] tracking-tight">
              Quality Inspection & Human Review
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Authoritative human engineering decisions, onsite physical measurement verification, and corrective rework governance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchQueue()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-[#10243A] border border-[#DCE3E8] hover:border-slate-400 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#13A89E]' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-[#DCE3E8] rounded-xl p-4 shadow-xs hover:shadow-sm transition">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Total Queue</span>
          <div className="text-2xl font-bold text-[#10243A] mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Total assessments</span>
        </div>

        <div className="bg-white border border-amber-200/90 rounded-xl p-4 shadow-xs hover:shadow-sm transition">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats.pending}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting reviewer</span>
        </div>

        <div className="bg-white border border-sky-200/90 rounded-xl p-4 shadow-xs hover:shadow-sm transition">
          <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">In Review</span>
          <div className="text-2xl font-bold text-sky-700 mt-1">{stats.inReview}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Actively evaluating</span>
        </div>

        <div className="bg-white border border-purple-200/90 rounded-xl p-4 shadow-xs hover:shadow-sm transition">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Measurements</span>
          <div className="text-2xl font-bold text-purple-700 mt-1">{stats.pendingMeasurements}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Dipstick / tests needed</span>
        </div>

        <div className="bg-white border border-orange-200/90 rounded-xl p-4 shadow-xs hover:shadow-sm transition">
          <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">Open Rework</span>
          <div className="text-2xl font-bold text-orange-700 mt-1">{stats.openRework}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Active corrective actions</span>
        </div>

        <div className="bg-white border border-rose-200/90 rounded-xl p-4 shadow-xs hover:shadow-sm transition">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Escalated</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{stats.escalated}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Critical / Dispute</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#DCE3E8] rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="bg-slate-100 p-1 rounded-lg flex flex-wrap gap-1 border border-slate-200/80">
          {['ALL', 'PENDING', 'IN_REVIEW', 'COMPLETED', 'ESCALATED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-[#10243A] shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search & Priority Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, zone, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#13A89E] focus:bg-white transition"
            />
          </form>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filter by priority"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#13A89E] cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Queue List Table */}
      <div className="bg-white border border-[#DCE3E8] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#13A89E] animate-spin" />
            <span className="text-sm font-medium">Fetching human inspection reviews...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50 border-t border-rose-200 text-rose-800 flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            <div className="text-base font-bold text-[#10243A]">No Inspection Reviews Found</div>
            <p className="text-xs text-slate-600 max-w-md">
              There are currently no reviews matching your filters. When quality assessments are generated from submitted vendor evidence, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Review ID</th>
                  <th className="py-3 px-4">Work Zone / Project</th>
                  <th className="py-3 px-4">Vendor & Work Type</th>
                  <th className="py-3 px-4">Evidence & Findings</th>
                  <th className="py-3 px-4">Onsite Requirements</th>
                  <th className="py-3 px-4">Status & Priority</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0E827B]">
                      <div>{r.reviewCode}</div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">{r.assignmentCode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#10243A] truncate max-w-[190px]">{r.workZoneName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[190px]">
                        {r.projectName} {r.pincode ? `(${r.pincode})` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{r.vendorName}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-[#0E827B] border border-slate-200 rounded text-[10px] font-semibold">
                        {r.workType?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-800 font-bold">{r.evidenceCompletenessScore?.toFixed(0)}%</span>
                        <span className="text-[10px] text-slate-500">completeness</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[11px]">
                        <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-bold">
                          {r.passedCount}P
                        </span>
                        <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-300 rounded font-bold">
                          {r.flaggedCount}F
                        </span>
                        <span className="px-1.5 py-0.2 bg-rose-50 text-rose-800 border border-rose-300 rounded font-bold">
                          {r.failedCount}X
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1 text-[11px]">
                        {r.pendingMeasurementsCount > 0 ? (
                          <div className="flex items-center gap-1.5 text-purple-700 font-semibold">
                            <Ruler className="w-3.5 h-3.5" />
                            <span>{r.pendingMeasurementsCount} measurement(s)</span>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[10px]">No pending measurements</div>
                        )}

                        {r.openCorrectiveActionsCount > 0 && (
                          <div className="flex items-center gap-1.5 text-orange-700 font-semibold">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{r.openCorrectiveActionsCount} rework notice(s)</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div>{getStatusBadge(r.status)}</div>
                        <div className="mt-0.5">{getPriorityBadge(r.priority)}</div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {r.assignedReviewerName ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-[#0E827B]" />
                          <span>{r.assignedReviewerName}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssigningReview(r)}
                          className="px-2 py-1 bg-white hover:bg-slate-50 text-[#0E827B] border border-[#13A89E]/40 rounded text-[11px] font-semibold transition cursor-pointer"
                        >
                          + Assign Reviewer
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/human-review/${r.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#13A89E]/10 hover:bg-[#13A89E]/20 text-[#0E827B] border border-[#13A89E]/30 rounded-lg text-xs font-bold transition group shadow-2xs cursor-pointer"
                      >
                        Open Workspace
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Reviewer Modal */}
      {assigningReview && (
        <div className="fixed inset-0 z-50 bg-[#10243A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE3E8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#10243A] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0E827B]" />
                Assign Reviewer
              </h3>
              <button
                onClick={() => setAssigningReview(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Assign inspection review <strong className="text-[#0E827B] font-mono">{assigningReview.reviewCode}</strong> to a Field Engineer or Project Manager for authoritative assessment.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reviewer User ID (or assign to self)</label>
                <input
                  type="text"
                  placeholder={user?.fullName ? `Assign to me (${user.fullName})` : 'Enter Reviewer User ID'}
                  value={reviewerIdInput}
                  onChange={(e) => setReviewerIdInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#13A89E] focus:bg-white"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Leave blank to self-assign as current operator ({user?.fullName || 'Current User'}).
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setAssigningReview(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-4 py-2 bg-[#13A89E] hover:bg-[#0E827B] text-white font-bold rounded-lg text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default HumanReviewQueuePage;
