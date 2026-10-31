import React, { useState, useEffect, useCallback } from 'react';
import { 
  FolderKanban, 
  MapPin, 
  HardHat, 
  ShieldCheck, 
  ShieldAlert, 
  Landmark, 
  RefreshCw, 
  Calendar, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Clock,
  Layers
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { InfrastructureOverview } from '../components/dashboard/InfrastructureOverview';
import { WorkZoneMap } from '../components/maps/WorkZoneMap';
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline';
import { VendorPerformancePreview } from '../components/dashboard/VendorPerformancePreview';
import { mockWorkZones } from '../data/mockWorkZones';
import { WorkZone } from '../types';
import { workAssignmentService } from '../services/workAssignmentService';
import { WorkAssignmentItem } from '../types/workAssignment';

export const OverviewPage: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<WorkZone | undefined>(mockWorkZones[0]);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stage 6 Real Backend Assignments State
  const [assignments, setAssignments] = useState<WorkAssignmentItem[]>([]);

  const fetchLiveMetrics = useCallback(async () => {
    try {
      const data = await workAssignmentService.getAssignments({ size: 100 });
      setAssignments(data.content || []);
    } catch (err) {
      console.error('Failed to load live assignments for metrics', err);
    }
  }, []);

  useEffect(() => {
    fetchLiveMetrics();
  }, [fetchLiveMetrics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveMetrics();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Real backend calculations for Stage 6:
  const blockedAssignmentsCount = assignments.filter(
    (a) => a.releaseStatus === 'REJECTED' || a.status === 'REJECTED'
  ).length;

  const awaitingReleaseCount = assignments.filter(
    (a) => a.releaseStatus === 'PENDING_RELEASE' || (a.status === 'COMPLETED' && a.releaseStatus !== 'RELEASED')
  ).length;

  const dependencyReadyCount = assignments.filter(
    (a) => a.releaseStatus === 'RELEASED' || a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS'
  ).length;

  // Real conflict calculation: detect overlapping active assignments in the exact same work zone
  const activeZoneMap = new Map<string, number>();
  assignments.forEach((a) => {
    if (['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(a.status)) {
      activeZoneMap.set(a.workZoneId, (activeZoneMap.get(a.workZoneId) || 0) + 1);
    }
  });
  let schedulingConflictsCount = 0;
  activeZoneMap.forEach((count) => {
    if (count > 1) schedulingConflictsCount += (count - 1);
  });

  return (
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title="Infrastructure Command Center"
        subtitle="Monitor infrastructure execution, vendor activity, and quality compliance across operational zones."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Live Operations Grid
          </span>
        }
        actions={
          <>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-surface-border text-xs text-ink-secondary shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-ink-muted" />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent font-medium text-ink-primary outline-none cursor-pointer"
              >
                <option value="Today">Today (Real-time)</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Quarter">This Quarter (Q4 2026)</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-border rounded-lg text-xs font-semibold text-ink-primary hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </>
        }
      />

      {/* Stage 6: Dependency & Conflict Prevention Intelligence Grid */}
      <div className="mb-6 bg-gradient-to-r from-slate-900 to-navy-900 rounded-xl p-4 text-white shadow-card border border-navy-800">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Stage 06 Dependency & Conflict Prevention Engine — Real-time Metrics
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            PostgreSQL Persisted
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-navy-800/80 border border-navy-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Blocked Assignments</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">{blockedAssignmentsCount}</div>
            <div className="text-[10px] text-rose-400 mt-0.5">
              {blockedAssignmentsCount > 0 ? 'Clearance rejected / dependencies unreleased' : 'Zero blocked packages'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-navy-800/80 border border-navy-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Awaiting Prerequisite Release</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">{awaitingReleaseCount}</div>
            <div className="text-[10px] text-amber-400 mt-0.5">
              Requires field engineer authorization
            </div>
          </div>

          <div className="p-3 rounded-lg bg-navy-800/80 border border-navy-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Dependency-Ready Assignments</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">{dependencyReadyCount}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              All predecessor activities satisfied
            </div>
          </div>

          <div className="p-3 rounded-lg bg-navy-800/80 border border-navy-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Scheduling Conflicts</span>
              <AlertTriangle className={`w-4 h-4 ${schedulingConflictsCount > 0 ? 'text-rose-400' : 'text-teal-400'}`} />
            </div>
            <div className="text-xl font-bold text-white font-mono">{schedulingConflictsCount}</div>
            <div className={`text-[10px] mt-0.5 ${schedulingConflictsCount > 0 ? 'text-rose-400' : 'text-teal-400'}`}>
              {schedulingConflictsCount > 0 ? 'Overlapping zone occupancy detected' : 'Zero spatial conflicts detected'}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Active Projects"
          value="4"
          subtitle="All municipal zones"
          icon={FolderKanban}
          accentColor="navy"
          trend={{ value: '+1 this mo', isPositive: true }}
        />
        <MetricCard
          title="Active Work Zones"
          value="6"
          subtitle="4 PIN corridors"
          icon={MapPin}
          accentColor="blue"
        />
        <MetricCard
          title="Assigned Vendors"
          value="4"
          subtitle="92% avg on-time"
          icon={HardHat}
          accentColor="teal"
        />
        <MetricCard
          title="Pending Inspections"
          value="3"
          subtitle="Awaiting sign-off"
          icon={ShieldCheck}
          accentColor="amber"
          alertBadge="Action Needed"
        />
        <MetricCard
          title="Blocked Packages"
          value={String(blockedAssignmentsCount)}
          subtitle="Dependency conflict"
          icon={ShieldAlert}
          accentColor="rose"
          alertBadge={blockedAssignmentsCount > 0 ? 'BLOCKED' : undefined}
        />
        <MetricCard
          title="Milestone Releases"
          value="₹ 1.85 Cr"
          subtitle="1 pending sign-off"
          icon={Landmark}
          accentColor="emerald"
        />
      </div>

      {/* Main Grid: GIS Map & Infrastructure Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left 7 Columns: Work Zone GIS Map */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary">
                Geographical Work Zone Command
              </h3>
              <p className="text-xs text-ink-secondary">
                Spatial PIN-code allocation and active corridor mapping
              </p>
            </div>
            {selectedZone && (
              <span className="text-xs font-semibold text-navy-800 bg-slate-100 px-2.5 py-1 rounded-md">
                Selected: {selectedZone.code}
              </span>
            )}
          </div>

          <WorkZoneMap
            zones={mockWorkZones}
            selectedZoneId={selectedZone?.id}
            onSelectZone={(zone) => setSelectedZone(zone)}
            height="380px"
          />

          {/* Selected Zone Quick Bar */}
          {selectedZone && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-ink-primary">{selectedZone.name}</span>
                <span className="text-ink-muted ml-2">PIN: {selectedZone.pinCode}</span>
                <p className="text-[11px] text-ink-secondary mt-0.5">
                  Work Type: <strong>{selectedZone.currentWorkType}</strong> • Contractor: <strong>{selectedZone.assignedVendorName || 'Unassigned'}</strong>
                </p>
              </div>
              <div>
                {selectedZone.blockingReason ? (
                  <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 block text-center">
                    Blocked by Dependency
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 block text-center">
                    Workflow Active
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Infrastructure Pipeline */}
        <div className="lg:col-span-5 space-y-6">
          <InfrastructureOverview />

          {/* Quality Assurance Snapshot */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-border">
              <h4 className="font-bold text-sm text-ink-primary">
                Quality Assurance Snapshot
              </h4>
              <span className="text-[11px] text-ink-muted font-medium">
                Last 30 Days
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center justify-between text-emerald-700 font-semibold mb-1">
                  <span>Passed QA</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-emerald-800">18</div>
                <p className="text-[10px] text-emerald-600 mt-0.5">Milestone released</p>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-100">
                <div className="flex items-center justify-between text-rose-700 font-semibold mb-1">
                  <span>Failed QA</span>
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-rose-800">2</div>
                <p className="text-[10px] text-rose-600 mt-0.5">Rework required</p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100">
                <div className="flex items-center justify-between text-amber-700 font-semibold mb-1">
                  <span>Review Queue</span>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-amber-800">3</div>
                <p className="text-[10px] text-amber-600 mt-0.5">AI Flagged cases</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                  <span>Pending Evidence</span>
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-slate-800">4</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Awaiting contractor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Activity & Vendor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ActivityTimeline />
        </div>
        <div className="lg:col-span-6">
          <VendorPerformancePreview />
        </div>
      </div>
    </PageContainer>
  );
};
