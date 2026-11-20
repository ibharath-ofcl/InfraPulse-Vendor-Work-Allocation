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
  Briefcase,
  ExternalLink,
  GitFork,
  ClipboardCheck,
  Wrench,
  FileSpreadsheet,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Permission } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

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

interface NavGroupDef {
  groupTitle: string;
  items: NavItemDef[];
}

const navGroups: NavGroupDef[] = [
  {
    groupTitle: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/overview', icon: LayoutDashboard, requiredPermission: 'VIEW_OVERVIEW' },
    ],
  },
  {
    groupTitle: 'PROJECT MANAGEMENT',
    items: [
      { label: 'Projects', path: '/projects', icon: FolderKanban, requiredPermission: 'VIEW_PROJECTS' },
      { label: 'Vendors', path: '/vendors', icon: HardHat, requiredPermission: 'VENDOR_VIEW' },
      { label: 'Work Zones', path: '/work-zones', icon: MapPin, requiredPermission: 'VIEW_WORK_ZONES' },
      { label: 'Work Allocation', path: '/work-allocation', icon: Sliders, highlight: true, requiredPermission: 'VIEW_ASSIGNED_WORK' },
      { label: 'Work Dependencies', path: '/work-dependencies', icon: GitFork, requiredPermission: 'DEPENDENCY_VIEW' },
    ],
  },
  {
    groupTitle: 'INTELLIGENCE SUITE',
    items: [
      { label: 'Intelligence Suite', path: '/intelligence', icon: Sparkles, highlight: true, requiredPermission: 'VIEW_PROJECTS' },
    ],
  },
  {
    groupTitle: 'WORKERTRUST & SAFETY',
    items: [
      { label: 'WorkerTrust Workforce', path: '/workertrust', icon: ShieldCheck, highlight: true, requiredPermission: 'WORKER_VIEW' },
    ],
  },
  {
    groupTitle: 'FIELD OPERATIONS',
    items: [
      { label: 'My Work Orders', path: '/my-work', icon: Briefcase, highlight: true, requiredPermission: 'WORK_ASSIGNMENT_ACCEPT' },
      { label: 'My Rework Actions', path: '/my-corrective-actions', icon: Wrench, highlight: true, requiredPermission: 'WORK_ASSIGNMENT_ACCEPT' },
      { label: 'Quality Inspection', path: '/quality-inspection', icon: ShieldCheck, requiredPermission: 'REVIEW_EVIDENCE' },
      { label: 'Human Review', path: '/human-review', icon: ClipboardCheck, highlight: true, requiredPermission: 'REVIEW_EVIDENCE' },
      { label: 'Corrective Actions', path: '/corrective-actions', icon: Wrench, requiredPermission: 'REVIEW_EVIDENCE' },
      { label: 'Evidence Center', path: '/evidence', icon: Camera, requiredPermission: 'SUBMIT_EVIDENCE' },
    ],
  },
  {
    groupTitle: 'FINANCIAL MANAGEMENT',
    items: [
      { label: 'Milestones & Payments', path: '/milestones', icon: Landmark, requiredPermission: 'VIEW_MILESTONES' },
    ],
  },
  {
    groupTitle: 'INSIGHTS & GOVERNANCE',
    items: [
      { label: 'Analytics & Scoring', path: '/analytics', icon: BarChart3, highlight: true, requiredPermission: 'VIEW_ANALYTICS' },
      { label: 'Reports Export', path: '/reports', icon: FileSpreadsheet, requiredPermission: 'EXPORT_REPORTS' },
      { label: 'Audit Trail', path: '/audit-trail', icon: History, requiredPermission: 'VIEW_AUDIT_TRAIL' },
    ],
  },
  {
    groupTitle: 'SYSTEM',
    items: [
      { label: 'User Management', path: '/users', icon: Users, requiredPermission: 'MANAGE_USERS' },
      { label: 'Operator Profile', path: '/profile', icon: User },
    ],
  },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, hasPermission, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#0c1827]/80 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Primary Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0c1827] text-slate-200 flex flex-col border-r border-slate-800/80 transition-all duration-300 ease-in-out shadow-2xl ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#08121d]/90 backdrop-blur-md shrink-0">
          <BrandLogo 
            size={collapsed ? 'sm' : 'md'} 
            showText={!collapsed} 
            showTagline={false} 
            theme="dark" 
          />
          {!collapsed && (
            <span className="text-[10px] font-mono tracking-wider text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/50">
              v2.4
            </span>
          )}
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 sidebar-scrollbar">
          {navGroups.map((group, groupIdx) => {
            // Filter group items based on permissions
            const visibleItems = group.items.filter((item) => {
              if (!item.requiredPermission) return true;
              return hasPermission(item.requiredPermission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div 
                key={group.groupTitle} 
                className={`space-y-1 ${groupIdx > 0 ? 'pt-2 border-t border-slate-800/40' : ''}`}
              >
                {!collapsed && (
                  <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none flex items-center justify-between">
                    <span>{group.groupTitle}</span>
                  </div>
                )}

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) => `
                        group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
                        ${isActive 
                          ? 'bg-gradient-to-r from-teal-500/15 via-teal-500/8 to-transparent text-white font-semibold border border-teal-500/30 shadow-xs' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                        }
                        ${collapsed ? 'justify-center px-0' : ''}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active Indicator Glow Bar */}
                          {isActive && (
                            <span 
                              className={`absolute top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(20,184,166,0.8)] ${
                                collapsed ? 'left-1' : 'left-0.5'
                              }`} 
                            />
                          )}

                          <Icon 
                            className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                              isActive 
                                ? 'text-teal-300 drop-shadow-[0_0_6px_rgba(20,184,166,0.6)]' 
                                : 'text-slate-400 group-hover:text-teal-300 group-hover:scale-110'
                            }`} 
                          />

                          {!collapsed && (
                            <span className="truncate flex-1 tracking-wide">{item.label}</span>
                          )}

                          {!collapsed && item.highlight && (
                            <span 
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider transition-colors ${
                                isActive 
                                  ? 'bg-teal-400/20 text-teal-200 border border-teal-400/40 shadow-[0_0_6px_rgba(20,184,166,0.3)]' 
                                  : 'bg-teal-500/10 text-teal-300 border border-teal-500/30 group-hover:border-teal-400/50'
                              }`}
                            >
                              Core
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Identity & Bottom Section */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#08121d]/90 backdrop-blur-md shrink-0">
          {!collapsed && user && (
            <div className="p-3 rounded-xl bg-gradient-to-b from-[#132537] to-[#0c1827] border border-slate-700/60 shadow-lg shadow-black/20 hover:border-teal-500/30 transition-all duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  Active Operator
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 font-mono">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  ONLINE
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10 shrink-0 shadow-sm">
                  {user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'OP'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate text-xs leading-snug">{user.fullName}</p>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    <ShieldCheck className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span className="truncate">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {collapsed && user && (
            <div className="flex justify-center py-1">
              <div 
                className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-xs font-bold ring-1 ring-teal-400/30 shadow-md relative group cursor-pointer"
                title={`${user.fullName} (${user.role})`}
              >
                {user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'OP'}
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0c1827]" />
              </div>
            </div>
          )}

          <div className="pt-1 space-y-1">
            <button
              type="button"
              onClick={logout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-150 group ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-rose-400 transition-colors" />
              {!collapsed && <span>Sign Out</span>}
            </button>

            <a 
              href="https://github.com/ibharath-ofcl/InfraPulse-Vendor-Work-Allocation" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all duration-150 group ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Repository Documentation"
            >
              <ExternalLink className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-teal-300 transition-colors" />
              {!collapsed && <span>System Documentation</span>}
            </a>
          </div>

          {/* Desktop Collapse Toggle */}
          <div className="pt-2 border-t border-slate-800/80 hidden lg:block">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-slate-700/50 transition-all duration-150 text-xs font-medium"
              title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-teal-400" />
              ) : (
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4 text-teal-400" />
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