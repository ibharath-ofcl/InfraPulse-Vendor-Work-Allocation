import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  HardHat,
  PlayCircle,
  FileCheck,
  ShieldAlert,
  Award,
  RefreshCw,
  Building,
  Shield,
  ArrowRight,
  MapPin,
  Sliders,
  Landmark,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/dashboard/MetricCard';
import { AssignmentStatusChart } from '../components/dashboard/AssignmentStatusChart';
import { ProjectProgressList } from '../components/dashboard/ProjectProgressList';
import { WorkZoneTable } from '../components/dashboard/WorkZoneTable';
import { DependencyMonitor } from '../components/dashboard/DependencyMonitor';
import { VendorWorkloadTable } from '../components/dashboard/VendorWorkloadTable';
import { RecentActivityTimeline } from '../components/dashboard/RecentActivityTimeline';
import { DashboardFilters } from '../components/dashboard/DashboardFilters';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { WorkZoneMap, MapZoneData } from '../components/maps/WorkZoneMap';
import { useAuth } from '../auth/useAuth';
import { dashboardService } from '../services/dashboardService';
import { projectService } from '../services/projectService';
import { vendorService } from '../services/vendorService';
import { mockMilestones } from '../data/mockMilestones';
import {
  DashboardSummary,
  AssignmentDistributionItem,
  ProjectProgressItem,
  WorkZoneOverviewItem,
  BlockedDependencyItem,
  ReadyDependencyItem,
  VendorWorkloadItem,
  RecentActivityItem,
  DashboardFilterParams,
} from '../types/dashboard';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<DashboardFilterParams>({});
  const [projectsList, setProjectsList] = useState<{ id: string; code: string; name: string }[]>([]);

  // Analytics data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [distribution, setDistribution] = useState<AssignmentDistributionItem[]>([]);
  const [distributionTotal, setDistributionTotal] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [projectsProgress, setProjectsProgress] = useState<ProjectProgressItem[]>([]);
  const [workZones, setWorkZones] = useState<WorkZoneOverviewItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<WorkZoneOverviewItem | undefined>(undefined);
  const [blockedDependencies, setBlockedDependencies] = useState<BlockedDependencyItem[]>([]);
  const [readyDependencies, setReadyDependencies] = useState<ReadyDependencyItem[]>([]);
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [totalReady, setTotalReady] = useState(0);
  const [vendorsWorkload, setVendorsWorkload] = useState<VendorWorkloadItem[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentActivityItem[]>([]);
  const [recentTotal, setRecentTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [isLoadingMoreActivity, setIsLoadingMoreActivity] = useState(false);
  const [registeredVendors, setRegisteredVendors] = useState<number>(3);

  // Load project options for the global selector
  useEffect(() => {
    projectService.getProjects({ size: 100 })
      .then((res) => {
        const options = (res.content || []).map((p) => ({
          id: p.id,
          code: p.projectCode,
          name: p.projectName,
        }));
        setProjectsList(options);
      })
      .catch((err) => console.error('Failed to load project list for selector', err));
  }, []);

  // Fetch all dashboard data backed by real database records
  const loadDashboardData = useCallback(async (currentFilters: DashboardFilterParams, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [
        summaryData,
        distData,
        progressData,
        zonesData,
        depData,
        workloadData,
        activityData,
        vendorsData,
      ] = await Promise.all([
        dashboardService.getSummary(currentFilters),
        dashboardService.getAssignmentDistribution(currentFilters),
        dashboardService.getProjectProgress(currentFilters.projectId),
        dashboardService.getWorkZones({ ...currentFilters, size: 50 }),
        dashboardService.getDependencyMonitoring(currentFilters.projectId, currentFilters.workZoneId),
        dashboardService.getVendorWorkload(currentFilters.projectId),
        dashboardService.getRecentActivity(currentFilters.projectId, 0, 10),
        vendorService.getVendors({ size: 100 }).catch(() => ({ totalElements: 3, content: [] })),
      ]);

      setSummary(summaryData);
      setDistribution(distData.distribution || []);
      setDistributionTotal(distData.total || 0);
      setProjectsProgress(progressData.projects || []);
      setWorkZones(zonesData.workZones || []);
      if (zonesData.workZones && zonesData.workZones.length > 0) {
        setSelectedZone(zonesData.workZones[0]);
      }
      setBlockedDependencies(depData.blockedAssignments || []);
      setReadyDependencies(depData.readyAssignments || []);
      setTotalBlocked(depData.totalBlocked || 0);
      setTotalReady(depData.totalReady || 0);
      setVendorsWorkload(workloadData.vendors || []);
      setRecentEvents(activityData.events || []);
      setRecentTotal(activityData.totalElements || 0);
      setActivityPage(0);
      setHasMoreEvents(activityData.page + 1 < activityData.totalPages);
      setRegisteredVendors(vendorsData?.totalElements || workloadData.vendors?.length || 3);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(filters, true);
  }, [loadDashboardData, filters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData(filters, false);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleApplyFilters = (newFilters: DashboardFilterParams) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleLoadMoreActivity = async () => {
    setIsLoadingMoreActivity(true);
    try {
      const nextPage = activityPage + 1;
      const data = await dashboardService.getRecentActivity(filters.projectId, nextPage, 10);
      setRecentEvents((prev) => [...prev, ...(data.events || [])]);
      setActivityPage(nextPage);
      setHasMoreEvents(nextPage + 1 < data.totalPages);
    } catch (err) {
      console.error('Failed to load more activity events', err);
    } finally {
      setIsLoadingMoreActivity(false);
    }
  };

  // Convert WorkZoneOverviewItem to MapZoneData for the GIS Leaflet Map
  const mapZones: MapZoneData[] = useMemo(() => {
    return workZones
      .filter((z) => z.centerLatitude !== null && z.centerLongitude !== null)
      .map((z) => ({
        id: z.workZoneId,
        code: z.zoneCode,
        name: z.zoneName,
        pinCode: z.pincode,
        projectName: z.projectName,
        status: z.operationalStatus,
        activeWork: z.activeWork,
        blockedWork: z.blockedWork,
        completedWork: z.completedWork,
        lat: Number(z.centerLatitude),
        lng: Number(z.centerLongitude),
      }));
  }, [workZones]);

  // Active filters count
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== 'ALL'
  ).length;

  const currentDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isVendorRole = user?.role === 'VENDOR';
  const isFieldEngineer = user?.role === 'FIELD_ENGINEER';

  const activeProjectsCount = projectsProgress.filter(p => p.projectStatus === 'ACTIVE').length || (summary?.totalProjects ?? 0);
  const pendingMilestonesCount = mockMilestones.filter(m => m.approvalStatus === 'ELIGIBLE' || m.approvalStatus === 'LOCKED').length;
  const pendingPaymentsCount = mockMilestones.filter(m => m.approvalStatus === 'ELIGIBLE').length;

  return (
    <PageContainer>
      {/* Global Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#DCE3E8]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#10243A]">
              Infrastructure Operations Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#13A89E]/10 text-[#0E827B] border border-[#13A89E]/30">
              <span className="w-2 h-2 rounded-full bg-[#13A89E] animate-pulse" />
              Live Operations Command
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-1 font-medium">
            Monitor projects, coordinate vendors, track work execution and verify infrastructure quality.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Current Date */}
          <span className="text-xs font-medium text-ink-muted hidden md:inline">
            {currentDateFormatted}
          </span>

          {/* Project Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-surface-border rounded-lg shadow-sm text-xs text-ink-primary">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filters.projectId || 'ALL'}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? undefined : e.target.value;
                setFilters((prev) => ({ ...prev, projectId: val }));
              }}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">All Authorized Projects</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Profile Chip */}
          {user && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE3E8] rounded-lg text-xs font-medium text-[#10243A] shadow-sm">
              <Shield className="w-3.5 h-3.5 text-[#13A89E]" />
              <span className="font-semibold">{user.fullName}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#10243A] text-white">
                {user.role}
              </span>
            </div>
          )}

          {/* Refresh Action */}
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-surface-border rounded-lg text-xs font-semibold text-ink-primary hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh operational data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <DashboardFilters
        filters={filters}
        projects={projectsList}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        activeCount={activeFilterCount}
      />

      {/* Role-Specific Alert Banner for Vendor */}
      {isVendorRole && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-900 to-navy-900 text-white shadow-card border border-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-800/80 border border-blue-700 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Contractor Work Allocation Hub</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Displaying only authorized work packages assigned directly to your organization.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/work-allocation')}
            className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-navy-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>My Work Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Role-Specific Alert Banner for Field Engineer */}
      {isFieldEngineer && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-teal-900 to-navy-900 text-white shadow-card border border-teal-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-800/80 border border-teal-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Field Engineering & Prerequisite Clearance Hub</h3>
              <p className="text-xs text-teal-200 mt-0.5">
                Review submitted work assignments and authorize release clearance for downstream activities.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/work-allocation?status=SUBMITTED_FOR_REVIEW')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-navy-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Section B: Operational KPI Cards (8 Official Metrics from Backend) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Projects"
              value={summary?.totalProjects ?? 0}
              subtitle="Portfolio scope"
              icon={FolderKanban}
              accentColor="navy"
              onClick={() => navigate('/projects')}
            />

            <MetricCard
              title="Active Projects"
              value={activeProjectsCount}
              subtitle="Under execution"
              icon={PlayCircle}
              accentColor="teal"
              onClick={() => navigate('/projects')}
            />

            <MetricCard
              title="Registered Vendors"
              value={registeredVendors}
              subtitle="Qualified contractors"
              icon={HardHat}
              accentColor="amber"
              onClick={() => navigate('/vendors')}
            />

            <MetricCard
              title="Active Work Assignments"
              value={summary?.activeAssignments ?? 0}
              subtitle="Field work orders"
              icon={Sliders}
              accentColor="blue"
              onClick={() => navigate('/work-allocation')}
            />

            <MetricCard
              title="Work Awaiting Inspection"
              value={summary?.awaitingReview ?? 0}
              subtitle="Submitted packages"
              icon={FileCheck}
              accentColor="purple"
              alertBadge={summary && summary.awaitingReview > 0 ? 'Review' : undefined}
              onClick={() => navigate('/quality-inspection')}
            />

            <MetricCard
              title="Quality Issues"
              value={summary?.dependencyBlocked ?? 0}
              subtitle="Dependency blockers"
              icon={ShieldAlert}
              accentColor="rose"
              alertBadge={summary && summary.dependencyBlocked > 0 ? 'BLOCKED' : undefined}
              onClick={() => {
                const el = document.getElementById('dependency-monitor-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <MetricCard
              title="Pending Milestones"
              value={pendingMilestonesCount}
              subtitle="Approval checkpoints"
              icon={Landmark}
              accentColor="amber"
              onClick={() => navigate('/milestones')}
            />

            <MetricCard
              title="Pending Payments"
              value={pendingPaymentsCount}
              subtitle="Eligible for release"
              icon={Award}
              accentColor="emerald"
              onClick={() => navigate('/milestones')}
            />
          </div>

          {/* Section C & D: Assignment Status Distribution + Project Progress Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <AssignmentStatusChart
                data={distribution}
                total={distributionTotal}
                selectedStatus={selectedStatus}
                onSelectStatus={(status) => {
                  setSelectedStatus(status === selectedStatus ? undefined : status);
                  navigate(`/work-allocation?status=${status}`);
                }}
              />
            </div>

            <div className="lg:col-span-7">
              <ProjectProgressList projects={projectsProgress} />
            </div>
          </div>

          {/* Section F: Dedicated Dependency & Work Readiness Monitor */}
          <div id="dependency-monitor-section">
            <DependencyMonitor
              blockedAssignments={blockedDependencies}
              readyAssignments={readyDependencies}
              totalBlocked={totalBlocked}
              totalReady={totalReady}
            />
          </div>

          {/* Section E & Section 5: Work-Zone Deployment & Operational GIS Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* GIS Map */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between h-full">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
                  <div>
                    <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Spatial Operational Work-Zone Grid
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      Leaflet GIS mapping with persisted coordinates
                    </p>
                  </div>
                  {selectedZone && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-navy-800 font-bold">
                      {selectedZone.zoneCode}
                    </span>
                  )}
                </div>

                <WorkZoneMap
                  zones={mapZones}
                  selectedZoneId={selectedZone?.workZoneId}
                  onSelectZone={(zone) => {
                    const match = workZones.find((z) => z.workZoneId === zone.id);
                    if (match) setSelectedZone(match);
                  }}
                  height="340px"
                />

                {selectedZone && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-ink-primary">{selectedZone.zoneName}</div>
                      <div className="text-[11px] text-ink-muted">
                        PIN: <strong>{selectedZone.pincode}</strong> • {selectedZone.locality}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedZone.operationalStatus === 'BLOCKED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : selectedZone.operationalStatus === 'ACTIVE'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedZone.operationalStatus}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Work Zone Table */}
            <div className="lg:col-span-7">
              <WorkZoneTable
                workZones={workZones}
                selectedZoneId={selectedZone?.workZoneId}
                onSelectZone={(zone) => setSelectedZone(zone)}
              />
            </div>
          </div>

          {/* Section G & H: Vendor Workload + Recent Activity Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <VendorWorkloadTable vendors={vendorsWorkload} />
            </div>

            <div className="lg:col-span-6">
              <RecentActivityTimeline
                events={recentEvents}
                totalElements={recentTotal}
                hasMore={hasMoreEvents}
                onLoadMore={handleLoadMoreActivity}
                isLoadingMore={isLoadingMoreActivity}
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
