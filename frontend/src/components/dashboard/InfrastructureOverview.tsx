import React from 'react';
import { Shovel, Cable, Layers, Truck, CheckSquare } from 'lucide-react';

interface CategoryProgress {
  category: string;
  totalLength: string;
  completedPercent: number;
  activeZones: number;
  blockedZones: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const categories: CategoryProgress[] = [
  {
    category: 'Trenching',
    totalLength: '18.4 km',
    completedPercent: 72,
    activeZones: 5,
    blockedZones: 0,
    icon: Shovel,
    color: '#0D9488', // Teal
  },
  {
    category: 'Underground Cable Installation',
    totalLength: '14.2 km',
    completedPercent: 58,
    activeZones: 4,
    blockedZones: 1,
    icon: Cable,
    color: '#2563EB', // Blue
  },
  {
    category: 'Backfilling',
    totalLength: '11.8 km',
    completedPercent: 44,
    activeZones: 3,
    blockedZones: 1,
    icon: Layers,
    color: '#D97706', // Amber
  },
  {
    category: 'Road Resurfacing',
    totalLength: '9.6 km',
    completedPercent: 28,
    activeZones: 2,
    blockedZones: 2,
    icon: Truck,
    color: '#DC2626', // Danger/Blocked
  },
  {
    category: 'Final Inspection',
    totalLength: '8.1 km',
    completedPercent: 85,
    activeZones: 3,
    blockedZones: 0,
    icon: CheckSquare,
    color: '#16A34A', // Emerald
  },
];

export const InfrastructureOverview: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
        <div>
          <h3 className="font-bold text-sm text-ink-primary">
            Infrastructure Execution Pipeline
          </h3>
          <p className="text-xs text-ink-secondary">
            Sequential stages across active PIN-code corridors
          </p>
        </div>
        <span className="text-xs text-ink-muted">
          Active Corridor Scope: 42.1 km
        </span>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-ink-primary">
                    {cat.category}
                  </span>
                  <span className="text-ink-muted text-[11px]">
                    ({cat.totalLength})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {cat.blockedZones > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                      {cat.blockedZones} Blocked
                    </span>
                  )}
                  <span className="font-bold text-ink-primary">
                    {cat.completedPercent}%
                  </span>
                </div>
              </div>

              {/* Progress bar with status styling */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.completedPercent}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
