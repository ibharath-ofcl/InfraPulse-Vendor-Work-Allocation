import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search by keyword, ID, or PIN...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-surface-border rounded-lg text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 p-0.5 rounded text-ink-muted hover:text-ink-primary"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
