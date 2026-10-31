import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  PieChart as PieIcon, 
  Clock
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { mockProjects } from '../data/mockProjects';
import { mockVendors } from '../data/mockVendors';
import { mockAssignments } from '../data/mockAssignments';

export const AnalyticsPage: React.FC = () => {
  // Chart 1: Project Progress vs Targets
  const projectTrendData = mockProjects.map(p => ({
    name: p.code,
    Completion: p.progressPercent,
    Zones: p.totalZones * 5, // normalized zone index
  }));

  // Chart 2: Vendor Performance Comparison
  const vendorPerformanceData = mockVendors.map(v => ({
    name: v.companyName.split(' ')[0],
    OnTime: v.completionRate,
    QAScore: v.qualityScore,
  }));

  // Chart 3: Work Type Distribution
  const workTypeCounts: { [key: string]: number } = {};
  mockAssignments.forEach(a => {
    workTypeCounts[a.workType] = (workTypeCounts[a.workType] || 0) + 1;
  });
  const workTypeData = Object.entries(workTypeCounts).map(([name, value]) => ({
    name: name.replace('Underground ', ''),
    value,
  }));

  const PIE_COLORS = ['#0D9488', '#2563EB', '#D97706', '#DC2626', '#16A34A'];

  // Chart 4: Monthly Milestone Disbursements (in Lakhs)
  const monthlyDisbursementData = [
    { month: 'Jul', target: 20, actual: 18 },
    { month: 'Aug', target: 35, actual: 30 },
    { month: 'Sep', target: 45, actual: 42 },
    { month: 'Oct', target: 60, actual: 55 },
    { month: 'Nov (Proj)', target: 75, actual: 68 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Infrastructure Performance & Vendor Analytics"
        subtitle="Empirical operational telemetry, milestone delivery velocity, and quality compliance metrics."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">
            Real-time Telemetry
          </span>
        }
      />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Project Progress */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Project Corridor Completion (%)</span>
              </h3>
              <p className="text-xs text-ink-secondary">
                Progress tracking across active master initiatives
              </p>
            </div>
            <span className="text-xs text-ink-muted">Q3 - Q4 2026</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '8px', 
                    border: 'none', 
                    color: '#FFF', 
                    fontSize: '12px' 
                  }} 
                />
                <Bar dataKey="Completion" fill="#0D9488" radius={[4, 4, 0, 0]} name="Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Vendor Performance Comparison */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Contractor Performance Matrix</span>
              </h3>
              <p className="text-xs text-ink-secondary">
                On-time milestone delivery vs. QA first-pass score
              </p>
            </div>
            <span className="text-xs text-ink-muted">Empanelled Contractors</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[50, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '8px', 
                    border: 'none', 
                    color: '#FFF', 
                    fontSize: '12px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="OnTime" fill="#2563EB" name="On-Time Delivery %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="QAScore" fill="#0D9488" name="QA Pass Score / 100" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Work Type Distribution */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-600" />
                <span>Active Work-Type Distribution</span>
              </h3>
              <p className="text-xs text-ink-secondary">
                Composition of active allocations by civil category
              </p>
            </div>
            <span className="text-xs text-ink-muted">{mockAssignments.length} Assignments</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {workTypeData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
          </div>
        </div>

        {/* Chart 4: Monthly Milestone Financial Velocity */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Milestone Disbursement Velocity (₹ Lakhs)</span>
              </h3>
              <p className="text-xs text-ink-secondary">
                Cumulative certified disbursements vs planned allocation
              </p>
            </div>
            <span className="text-xs text-ink-muted">Cumulative</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyDisbursementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '8px', 
                    border: 'none', 
                    color: '#FFF', 
                    fontSize: '12px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeDasharray="5 5" name="Budget Target" />
                <Line type="monotone" dataKey="actual" stroke="#16A34A" strokeWidth={2.5} name="Actual Disbursed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
