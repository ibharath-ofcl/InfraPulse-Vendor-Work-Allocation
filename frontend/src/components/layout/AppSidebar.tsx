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
  LogOut
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
          className="fixed inset-0 z-40 bg-[#10243A]/70 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Primary Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#10243A] text-slate-200 flex flex-col border-r border-[#24445F]/80 transition-all duration-300 ease-in-out shadow-xl ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-[#24445F] bg-[#0B1928]/80 shrink-0">
          <BrandLogo 
            size={collapsed ? 'sm' : 'md'} 
            showText={!collapsed} 
            showTagline={false} 
            theme="dark" 
          />
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
          {navGroups.map((group) => {
            // Filter group items based on permissions
            const visibleItems = group.items.filter((item) => {
              if (!item.requiredPermission) return true;
              return hasPermission(item.requiredPermission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#718096]">
                    {group.groupTitle}
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
                          ? 'bg-[#24445F] text-white font-semibold shadow-sm border-l-4 border-[#F5A623]' 
                          : 'text-slate-300 hover:text-white hover:bg-[#1B3550]'
                        }
                        ${collapsed ? 'justify-center px-0 border-l-0' : ''}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon 
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-[#F5A623]' : 'text-slate-400 group-hover:text-white'
                            }`} 
                          />

                          {!collapsed && (
                            <span className="truncate flex-1">{item.label}</span>
                          )}

                          {!collapsed && item.highlight && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-[#13A89E]/20 text-[#13A89E] border border-[#13A89E]/40">
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
        <div className="p-3 border-t border-[#24445F] space-y-2 bg-[#0B1928]/60 shrink-0">
          {!collapsed && user && (
            <div className="p-2.5 rounded-lg bg-[#10243A] border border-[#24445F] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Operator</span>
                <span className="w-2 h-2 rounded-full bg-[#13A89E] animate-pulse" title="System Connected" />
              </div>
              <p className="font-semibold text-white truncate mt-1">{user.fullName}</p>
              <div className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/40">
                {user.role}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-rose-300 hover:text-white hover:bg-rose-900/30 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
            {!collapsed && <span>Sign Out</span>}
          </button>

          <a 
            href="https://github.com/ibharath-ofcl/InfraPulse-Vendor-Work-Allocation" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#1B3550] transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Repository Documentation"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>System Documentation</span>}
          </a>

          {/* Desktop Collapse Toggle */}
          <div className="pt-2 border-t border-[#24445F] hidden lg:block">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B3550] transition-colors text-xs"
              title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
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
