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
    teal: 'bg-[#13A89E]/10 text-[#0E827B] border-[#13A89E]/30',
    emerald: 'bg-[#219653]/10 text-[#219653] border-[#219653]/30',
    amber: 'bg-[#F5A623]/15 text-[#E0921B] border-[#F5A623]/30',
    rose: 'bg-[#D64545]/10 text-[#D64545] border-[#D64545]/30',
    blue: 'bg-[#24445F]/10 text-[#24445F] border-[#24445F]/30',
    purple: 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30',
    navy: 'bg-[#10243A]/10 text-[#10243A] border-[#10243A]/20',
  }[accentColor];

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-4 sm:p-5 border border-[#DCE3E8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group ${
        onClick ? 'cursor-pointer hover:border-[#13A89E] hover:-translate-y-0.5 active:translate-y-0' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-[#718096] uppercase tracking-wider truncate flex-1" title={title}>
            {title}
          </p>
          <div className={`p-2 rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${colorMap}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mt-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10243A]">
            {value}
          </h2>
          {alertBadge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
              {alertBadge}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#718096] mt-4 pt-3 border-t border-[#DCE3E8]/80">
        <span className="truncate text-[11px] font-medium">{subtitle}</span>
        {trend && (
          <span className={`inline-flex items-center text-[11px] font-bold shrink-0 ml-2 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
