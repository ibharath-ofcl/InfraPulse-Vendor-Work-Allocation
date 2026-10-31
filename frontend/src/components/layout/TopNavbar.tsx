import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Menu, 
  ChevronDown, 
  User, 
  ShieldCheck, 
  LogOut, 
  Check, 
  Layers
} from 'lucide-react';
import { mockProjects } from '../../data/mockProjects';
import { useAuth } from '../../auth/useAuth';

interface TopNavbarProps {
  onOpenMobile: () => void;
  collapsed: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobile, collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const projectRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/overview': return 'Command Center';
      case '/projects': return 'Project Portfolio';
      case '/work-zones': return 'Geographical Work Zones';
      case '/work-allocation': return 'Vendor Work Allocation';
      case '/vendors': return 'Contractor Directory';
      case '/quality-inspection': return 'AI Quality Assurance';
      case '/evidence': return 'Photo Evidence Vault';
      case '/milestones': return 'Milestones & Payments';
      case '/analytics': return 'Performance Analytics';
      case '/audit-trail': return 'Compliance Audit Trail';
      case '/users': return 'Platform User Management';
      case '/profile': return 'Operator Profile & Identity';
      default: return 'Command Center';
    }
  };

  const selectedProjectName = selectedProjectId === 'ALL'
    ? 'All Active Projects'
    : mockProjects.find(p => p.id === selectedProjectId)?.name || 'Project Scope';

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-30 h-16 bg-white border-b border-surface-border transition-all duration-300 ${
      collapsed ? 'lg:pl-20' : 'lg:pl-64'
    }`}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="p-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted hidden sm:inline">Platform</span>
              <span className="text-xs text-ink-muted hidden sm:inline">&rsaquo;</span>
              <h1 className="text-sm md:text-base font-bold text-ink-primary tracking-tight">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-ink-muted bg-slate-50 hover:bg-slate-100 border border-surface-border rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-ink-secondary" />
              <span>Search PIN code, zone (e.g. 560001), or vendor...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-surface-border rounded text-ink-secondary shadow-xs">
              Cmd+K
            </kbd>
          </button>
        </div>

        {/* Right Section: Project Scope, Notifications, User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Project Scope Selector */}
          <div className="relative" ref={projectRef}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-ink-primary bg-slate-50 hover:bg-slate-100 border border-surface-border rounded-lg transition-colors max-w-[180px] sm:max-w-[220px]"
              title="Filter by Project Scope"
            >
              <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate font-medium">{selectedProjectName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted shrink-0" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-modal border border-surface-border py-1 z-50 text-xs">
                <div className="px-3 py-1.5 font-semibold text-[11px] text-ink-muted uppercase tracking-wider border-b border-surface-border">
                  Select Project Scope
                </div>
                <button
                  onClick={() => { setSelectedProjectId('ALL'); setProjectDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 ${
                    selectedProjectId === 'ALL' ? 'text-teal-700 font-semibold bg-teal-50/50' : 'text-ink-primary'
                  }`}
                >
                  <span>All Active Projects</span>
                  {selectedProjectId === 'ALL' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
                {mockProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => { setSelectedProjectId(proj.id); setProjectDropdownOpen(false); }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 ${
                      selectedProjectId === proj.id ? 'text-teal-700 font-semibold bg-teal-50/50' : 'text-ink-primary'
                    }`}
                  >
                    <div className="truncate">
                      <p className="truncate font-medium">{proj.name}</p>
                      <p className="text-[10px] text-ink-muted">{proj.pinCode} &bull; {proj.code}</p>
                    </div>
                    {selectedProjectId === proj.id && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-modal border border-surface-border py-2 z-50 text-xs animate-fadeIn">
                <div className="px-4 py-2 border-b border-surface-border flex items-center justify-between">
                  <span className="font-bold text-ink-primary">Operational Alerts</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                    2 Pending
                  </span>
                </div>
                <div className="divide-y divide-surface-border max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <p className="font-semibold text-rose-600 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Sequential Dependency Conflict
                    </p>
                    <p className="text-ink-secondary mt-0.5 text-[11px]">
                      Road Resurfacing blocked in WZ-002: Trenching requires prior QA sign-off.
                    </p>
                    <span className="text-[10px] text-ink-muted mt-1 block">12 mins ago</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <p className="font-semibold text-teal-700 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Field Evidence Verified
                    </p>
                    <p className="text-ink-secondary mt-0.5 text-[11px]">
                      Apex Infra submitted 3 Trenching depth photos for PIN 560001.
                    </p>
                    <span className="text-[10px] text-ink-muted mt-1 block">42 mins ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-surface-border" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-lg bg-navy-900 text-teal-300 font-bold text-xs flex items-center justify-center border border-navy-700">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-ink-primary leading-tight">
                  {user?.fullName || 'Platform Administrator'}
                </div>
                <div className="text-[10px] text-teal-700 font-medium">
                  {user?.role || 'PLATFORM_ADMIN'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-modal border border-surface-border py-1 z-50 text-xs animate-fadeIn">
                <div className="px-4 py-3 border-b border-surface-border bg-slate-50/50">
                  <p className="text-xs font-bold text-ink-primary">{user?.fullName || 'Platform User'}</p>
                  <p className="text-[11px] text-ink-muted truncate">{user?.email || 'admin@infrapulse.gov.in'}</p>
                  <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-navy-900 text-teal-300">
                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                    <span>{user?.role || 'PLATFORM_ADMIN'}</span>
                  </div>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-ink-secondary hover:text-ink-primary hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>My Operator Profile</span>
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-modal border border-surface-border overflow-hidden">
            <div className="p-3 border-b border-surface-border flex items-center gap-2.5">
              <Search className="w-4 h-4 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PIN code (e.g. 560001), vendor name, or zone..."
                className="w-full text-sm outline-none text-ink-primary placeholder-ink-muted"
                autoFocus
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="px-2 py-0.5 text-xs text-ink-muted hover:text-ink-primary bg-slate-100 rounded"
              >
                ESC
              </button>
            </div>
            <div className="p-3 text-xs text-ink-secondary max-h-60 overflow-y-auto">
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Quick Jump Targets
              </p>
              <div className="space-y-1">
                <div 
                  onClick={() => setSearchModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-ink-primary">Zone WZ-001 (PIN 560001) &mdash; MG Road</span>
                  <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded">Trenching</span>
                </div>
                <div 
                  onClick={() => setSearchModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-ink-primary">Zone WZ-002 (PIN 560001) &mdash; Residency Rd</span>
                  <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">BLOCKED</span>
                </div>
                <div 
                  onClick={() => setSearchModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-ink-primary">Vendor: Apex Infra Utilities Ltd</span>
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">4 Zones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
