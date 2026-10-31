import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-ink-secondary mt-1 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
