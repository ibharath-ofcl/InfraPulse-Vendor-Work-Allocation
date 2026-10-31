import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectProgressItem } from '../../types/dashboard';
import { FolderKanban, ArrowRight, UserCheck, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProjectProgressListProps {
  projects: ProjectProgressItem[];
}

export const ProjectProgressList: React.FC<ProjectProgressListProps> = ({ projects }) => {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col items-center justify-center h-80 text-center">
        <FolderKanban className="w-8 h-8 text-ink-muted mb-2" />
        <p className="font-semibold text-sm text-ink-primary">No Projects Found</p>
        <p className="text-xs text-ink-secondary mt-1">
          No accessible infrastructure projects match the selected scope.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
        <div>
          <h3 className="font-bold text-sm text-ink-primary flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-blue-600" />
            Project Execution & Milestone Progress
          </h3>
          <p className="text-xs text-ink-secondary">
            Authorized completion percentage excluding cancelled packages
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          {projects.length} Projects
        </span>
      </div>

      <div className="space-y-3.5 overflow-y-auto max-h-[320px] pr-1">
        {projects.map((p) => {
          const isNotStarted = p.totalAssignments === 0;

          return (
            <div
              key={p.projectId}
              onClick={() => navigate(`/projects/${p.projectId}`)}
              className="p-3.5 rounded-lg border border-slate-200/80 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {p.projectCode}
                    </span>
                    <h4 className="font-bold text-sm text-ink-primary group-hover:text-blue-700 transition-colors">
                      {p.projectName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-ink-muted mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {p.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      PM: {p.projectManagerName}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold font-mono text-ink-primary group-hover:text-blue-600 transition-colors">
                    {isNotStarted ? 'Not started' : `${p.completionPercentage}%`}
                  </span>
                  <div className="text-[10px] text-ink-muted flex items-center justify-end gap-1 group-hover:text-blue-600">
                    <span>View project</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, p.completionPercentage))}%` }}
                />
              </div>

              {/* Assignment Stats Pill Row */}
              <div className="grid grid-cols-4 gap-2 text-[10px] text-center pt-1 border-t border-slate-200/60 font-mono">
                <div className="bg-white py-1 px-1.5 rounded border border-slate-100">
                  <span className="text-ink-muted block text-[9px] uppercase font-sans">Total</span>
                  <span className="font-bold text-ink-primary">{p.totalAssignments}</span>
                </div>
                <div className="bg-emerald-50/60 py-1 px-1.5 rounded border border-emerald-100 text-emerald-800">
                  <span className="text-emerald-600 block text-[9px] uppercase font-sans flex items-center justify-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Done
                  </span>
                  <span className="font-bold">{p.completedAssignments}</span>
                </div>
                <div className="bg-teal-50/60 py-1 px-1.5 rounded border border-teal-100 text-teal-800">
                  <span className="text-teal-600 block text-[9px] uppercase font-sans">Active</span>
                  <span className="font-bold">{p.inProgressAssignments}</span>
                </div>
                <div className={`py-1 px-1.5 rounded border ${
                  p.blockedAssignments > 0
                    ? 'bg-rose-50/60 border-rose-200 text-rose-700 font-bold'
                    : 'bg-white border-slate-100 text-ink-muted'
                }`}>
                  <span className="block text-[9px] uppercase font-sans flex items-center justify-center gap-0.5">
                    {p.blockedAssignments > 0 && <AlertCircle className="w-2.5 h-2.5 text-rose-600" />}
                    Blocked
                  </span>
                  <span>{p.blockedAssignments}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
