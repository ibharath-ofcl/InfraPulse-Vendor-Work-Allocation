import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AssignmentDistributionItem } from '../../types/dashboard';
import { Layers } from 'lucide-react';

interface AssignmentStatusChartProps {
  data: AssignmentDistributionItem[];
  total: number;
  onSelectStatus?: (status: string) => void;
  selectedStatus?: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94A3B8',
  ASSIGNED: '#F59E0B',
  ACCEPTED: '#3B82F6',
  IN_PROGRESS: '#0D9488',
  SUBMITTED_FOR_REVIEW: '#8B5CF6',
  COMPLETED: '#10B981',
  REJECTED: '#EF4444',
  CANCELLED: '#64748B',
};

export const AssignmentStatusChart: React.FC<AssignmentStatusChartProps> = ({
  data,
  total,
  onSelectStatus,
  selectedStatus,
}) => {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: d.statusDisplayName,
      status: d.status,
      value: d.count,
      percentage: d.percentage,
      color: STATUS_COLORS[d.status] || '#64748B',
    }));

  if (total === 0 || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col items-center justify-center h-80 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-ink-muted mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <p className="font-semibold text-sm text-ink-primary">No Assignments Recorded</p>
        <p className="text-xs text-ink-secondary mt-1 max-w-xs">
          There are no assignments matching the current project or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-surface-border">
        <div>
          <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            Assignment Lifecycle Status Distribution
          </h3>
          <p className="text-xs text-ink-secondary">
            Real-time breakdown of {total} total infrastructure assignments
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {total} Total
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-auto">
        {/* Donut Chart */}
        <div className="md:col-span-6 h-56 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                onClick={(entry) => onSelectStatus && onSelectStatus(entry.status)}
                className="cursor-pointer outline-none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={selectedStatus === entry.status ? '#0F172A' : '#ffffff'}
                    strokeWidth={selectedStatus === entry.status ? 3 : 1.5}
                    opacity={selectedStatus && selectedStatus !== entry.status ? 0.4 : 1}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-navy-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-navy-700">
                        <div className="font-semibold flex items-center gap-1.5 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </div>
                        <div className="font-mono text-teal-300 font-bold">
                          {item.value} assignments ({item.percentage}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold font-mono text-ink-primary leading-none">
              {total}
            </span>
            <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider mt-0.5">
              Assignments
            </span>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="md:col-span-6 space-y-1.5">
          {data.map((item) => {
            const isSelected = selectedStatus === item.status;
            const color = STATUS_COLORS[item.status] || '#64748B';
            return (
              <button
                key={item.status}
                type="button"
                onClick={() => onSelectStatus && onSelectStatus(item.status)}
                className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'bg-slate-100 border-navy-800 font-bold shadow-sm'
                    : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/80 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-ink-primary">{item.statusDisplayName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span className="font-semibold text-ink-primary">{item.count}</span>
                  <span className="text-ink-muted w-10 text-right">({item.percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
