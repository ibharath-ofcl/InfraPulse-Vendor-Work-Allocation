import React from 'react';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterBarProps {
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  options,
  selected,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 ${className}`}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              isSelected
                ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                : 'bg-white text-ink-secondary border-surface-border hover:bg-surface-hover hover:text-ink-primary'
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected
                    ? 'bg-navy-800 text-white'
                    : 'bg-slate-100 text-ink-secondary'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
