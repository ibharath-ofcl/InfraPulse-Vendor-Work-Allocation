import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'teal' | 'emerald' | 'amber' | 'rose' | 'blue' | 'navy' | 'purple';
  alertBadge?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'navy',
  alertBadge,
  onClick,
}) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    navy: 'bg-slate-100 text-navy-800 border-slate-200',
  }[accentColor];

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-surface-border shadow-card hover:shadow-card-hover transition-all ${
        onClick ? 'cursor-pointer hover:border-teal-300 hover:-translate-y-0.5 active:translate-y-0' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-secondary tracking-wide uppercase">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-2xl font-bold tracking-tight text-ink-primary">
              {value}
            </h2>
            {alertBadge && (
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                {alertBadge}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2.5 rounded-lg border ${colorMap}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-secondary mt-3 pt-3 border-t border-slate-100">
        <span>{subtitle}</span>
        {trend && (
          <span className={`inline-flex items-center font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
