import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  MapPin, 
  Sliders, 
  HardHat, 
  ShieldCheck, 
  Camera, 
  Landmark, 
  BarChart3, 
  History,
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
  Briefcase,
  ExternalLink,
  GitFork,
  ClipboardCheck,
  Wrench
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Permission } from '../../types';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemDef {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  requiredPermission?: Permission;
}

const allNavItems: NavItemDef[] = [
  { label: 'Overview', path: '/overview', icon: LayoutDashboard, requiredPermission: 'VIEW_OVERVIEW' },
  { label: 'Projects', path: '/projects', icon: FolderKanban, requiredPermission: 'VIEW_PROJECTS' },
  { label: 'Work Zones', path: '/work-zones', icon: MapPin, requiredPermission: 'VIEW_WORK_ZONES' },
  { label: 'Work Allocation', path: '/work-allocation', icon: Sliders, highlight: true, requiredPermission: 'VIEW_ASSIGNED_WORK' },
  { label: 'Work Dependencies', path: '/work-dependencies', icon: GitFork, requiredPermission: 'DEPENDENCY_VIEW' },
  { label: 'My Work Orders', path: '/my-work', icon: Briefcase, highlight: true, requiredPermission: 'WORK_ASSIGNMENT_ACCEPT' },
  { label: 'My Rework Actions', path: '/my-corrective-actions', icon: Wrench, highlight: true, requiredPermission: 'WORK_ASSIGNMENT_ACCEPT' },
  { label: 'Vendors', path: '/vendors', icon: HardHat, requiredPermission: 'MANAGE_PROJECTS' },
  { label: 'Quality Inspection', path: '/quality-inspection', icon: ShieldCheck, requiredPermission: 'REVIEW_EVIDENCE' },
  { label: 'Human Review', path: '/human-review', icon: ClipboardCheck, highlight: true, requiredPermission: 'REVIEW_EVIDENCE' },
  { label: 'Corrective Actions', path: '/corrective-actions', icon: Wrench, requiredPermission: 'REVIEW_EVIDENCE' },
  { label: 'Evidence Center', path: '/evidence', icon: Camera, requiredPermission: 'SUBMIT_EVIDENCE' },
  { label: 'Milestones & Payments', path: '/milestones', icon: Landmark, requiredPermission: 'VIEW_MILESTONES' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, requiredPermission: 'VIEW_AUDIT_TRAIL' },
  { label: 'Audit Trail', path: '/audit-trail', icon: History, requiredPermission: 'VIEW_AUDIT_TRAIL' },
  { label: 'User Directory', path: '/users', icon: Users, requiredPermission: 'MANAGE_USERS' },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, hasPermission } = useAuth();

  // Filter items based on user's granted permissions
  const visibleNavItems = allNavItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 bg-navy-900 text-slate-300 flex flex-col border-r border-navy-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-navy-800 bg-navy-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-teal-400" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  <span>InfraPulse AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-teal-900/60 text-teal-300 border border-teal-700/50 rounded font-mono font-medium">
                    v1.0
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium tracking-wide">
                  Infrastructure Intelligence
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
          {!collapsed && (
            <div className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations &amp; Governance
            </div>
          )}

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) => `
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-navy-800 text-white font-semibold shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/50'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-teal-400 rounded-r-full" />
                    )}

                    <Icon 
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`} 
                    />

                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!collapsed && item.highlight && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-700/60">
                        Core
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Identity & Bottom Section */}
        <div className="p-3 border-t border-navy-800 space-y-2 bg-navy-950/40">
          {!collapsed && user && (
            <div className="p-2.5 rounded-lg bg-navy-900/80 border border-navy-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Session</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="font-semibold text-white truncate mt-1">{user.fullName}</p>
              <div className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800/60">
                {user.role}
              </div>
            </div>
          )}

          <a 
            href="https://github.com/ibharath-ofcl/InfraPulse-Vendor-Work-Allocation" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-navy-800 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Repository Documentation"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Help &amp; Documentation</span>}
          </a>

          {/* Desktop Collapse Toggle */}
          <div className="pt-2 border-t border-navy-800 hidden lg:block">
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors text-xs"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Navigation</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
