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
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  ExternalLink
} from 'lucide-react';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { label: 'Overview', path: '/overview', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Work Zones', path: '/work-zones', icon: MapPin },
  { label: 'Work Allocation', path: '/work-allocation', icon: Sliders, highlight: true },
  { label: 'Vendors', path: '/vendors', icon: HardHat },
  { label: 'Quality Inspection', path: '/quality-inspection', icon: ShieldCheck },
  { label: 'Evidence Center', path: '/evidence', icon: Camera },
  { label: 'Milestones & Payments', path: '/milestones', icon: Landmark },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Audit Trail', path: '/audit-trail', icon: History },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
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
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-navy-800 bg-navy-950/40">
          <NavLink 
            to="/overview" 
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-500 to-brand-500 p-[1px] shadow-sm shrink-0">
              <div className="w-full h-full bg-navy-900 rounded-lg flex items-center justify-center group-hover:bg-navy-800 transition-colors">
                <Zap className="w-4 h-4 text-teal-400" />
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-bold text-white text-base tracking-tight leading-none">
                  <span>InfraPulse</span>
                  <span className="text-teal-400 font-extrabold text-sm">AI</span>
                </div>
                <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium mt-1">
                  Infrastructure Intelligence
                </span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Operations Navigation
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative
                  ${isActive 
                    ? 'bg-teal-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'}
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                    }`} />
                    {!collapsed && (
                      <span className="truncate">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.highlight && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    {/* Tooltip on collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-navy-950 text-white text-xs rounded-md shadow-dropdown opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-navy-800">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-navy-800 space-y-1 bg-navy-950/30">
          <button 
            onClick={() => alert('InfraPulse AI Configuration is managed via environment variables and administrative privileges.')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-navy-800 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>System Settings</span>}
          </button>

          <a 
            href="https://github.com/ibharath-ofcl/InfraPulse-Vendor-Work-Allocation" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-navy-800 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Repository Documentation"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="flex items-center justify-between flex-1">
                Help & Docs
                <ExternalLink className="w-3 h-3 opacity-60" />
              </span>
            )}
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
