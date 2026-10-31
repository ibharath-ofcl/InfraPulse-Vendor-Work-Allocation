import React, { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-surface-border">
      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-ink-muted mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-ink-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-ink-secondary max-w-sm mb-6">
        {description}
      </p>
      {action}
    </div>
  );
};
