import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RecentActivityItem } from '../../types/dashboard';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  ShieldAlert,
  FolderKanban,
  HardHat,
  MapPin,
  ChevronDown
} from 'lucide-react';

interface RecentActivityTimelineProps {
  events: RecentActivityItem[];
  totalElements: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  events,
  totalElements,
  hasMore,
  onLoadMore,
  isLoadingMore,
}) => {
  const navigate = useNavigate();

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'WORK_ASSIGNMENT_CREATED':
      case 'VENDOR_ASSOCIATED':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-teal-600" />,
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
        };
      case 'VENDOR_ACCEPTED_ASSIGNMENT':
      case 'WORK_STARTED':
        return {
          icon: <HardHat className="w-3.5 h-3.5 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
        };
      case 'WORK_COMPLETED':
      case 'PREREQUISITE_RELEASED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        };
      case 'PREREQUISITE_RELEASE_REJECTED':
      case 'ASSIGNMENT_VALIDATION_BLOCKED':
      case 'SCHEDULING_CONFLICT_DETECTED':
      case 'VENDOR_REJECTED_ASSIGNMENT':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />,
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
        };
      case 'PROJECT_CREATED':
        return {
          icon: <FolderKanban className="w-3.5 h-3.5 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
        };
      case 'WORK_ZONE_CREATED':
        return {
          icon: <MapPin className="w-3.5 h-3.5 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-600" />,
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
        };
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
        <div>
          <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Operational Activity & Audit Trail
          </h3>
          <p className="text-xs text-ink-secondary">
            Immutable chronological event log directly backed by PostgreSQL audit engine
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {totalElements} Events
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-xs text-ink-muted">
          <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-ink-primary">No Activity Recorded</p>
          <p className="text-[11px] mt-0.5">Audit events will appear as actions occur across projects and zones.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 max-h-[380px] overflow-y-auto pr-1">
          {events.map((ev) => {
            const badge = getEventBadge(ev.eventType);

            return (
              <div key={ev.id} className="relative group">
                {/* Timeline Node Icon */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center bg-white ${badge.bg}`}
                >
                  {badge.icon}
                </div>

                <div className="bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-ink-primary">{ev.eventTitle}</span>
                      {ev.assignmentCode && (
                        <button
                          type="button"
                          onClick={() => {
                            if (ev.entityType === 'WORK_ASSIGNMENT') {
                              navigate(`/work-assignments/${ev.entityId}`);
                            }
                          }}
                          className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 hover:underline"
                        >
                          {ev.assignmentCode}
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-ink-muted shrink-0">
                      {formatRelativeTime(ev.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                    {ev.summary}
                  </p>

                  {/* Metadata Tags */}
                  <div className="flex items-center gap-3 text-[10px] text-ink-muted mt-2 pt-1.5 border-t border-slate-200/40 flex-wrap">
                    <span>
                      Actor: <strong>{ev.actorName}</strong> ({ev.actorRole})
                    </span>

                    {ev.projectReference && (
                      <span>
                        Project: <strong>{ev.projectReference}</strong>
                      </span>
                    )}

                    {ev.workZoneReference && (
                      <span>
                        Zone: <strong>{ev.workZoneReference}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && onLoadMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{isLoadingMore ? 'Loading more events...' : 'Load Older Events'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
