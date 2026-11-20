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
  Layers,
  MapPin
} from 'lucide-react';
import { mockProjects } from '../../data/mockProjects';
import { useAuth } from '../../auth/useAuth';
import { BrandLogo } from '../common/BrandLogo';

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
      case '/human-review': return 'Quality Inspection & Human Review';
      case '/corrective-actions': return 'Corrective Action & Rework Ledger';
      case '/my-corrective-actions': return 'Vendor Remediation & Rework Portal';
      case '/evidence': return 'Photo Evidence Vault';
      case '/milestones': return 'Milestones & Payments';
      case '/analytics': return 'Performance Analytics';
      case '/audit-trail': return 'Compliance Audit Trail';
      case '/intelligence': return 'Intelligence Suite & Quality Gates';
      case '/workertrust': return 'WorkerTrust Workforce & Site Safety';
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
    <header className={`sticky top-0 z-30 h-16 bg-[#0c1827] border-b border-slate-800/80 transition-all duration-300 ${
      collapsed ? 'lg:pl-20' : 'lg:pl-64'
    }`}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:hidden flex items-center">
            <BrandLogo size="xs" showText={false} theme="dark" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#13A89E]" />
                Infrastructure Operations
              </span>
              <span className="text-xs text-slate-600 hidden sm:inline">&rsaquo;</span>
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-xs xl:max-w-md hidden lg:block">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 bg-[#132537]/80 hover:bg-[#162d42] border border-slate-700/60 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-teal-400" />
              <span>Search PIN code, zone (e.g. 560001), or vendor...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-300 shadow-xs">
              Cmd+K
            </kbd>
          </button>
        </div>

        {/* Right Section: Project Scope, Notifications, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          {/* Project Scope Selector */}
          <div className="relative" ref={projectRef}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 text-xs text-slate-200 bg-[#132537]/80 hover:bg-[#162d42] border border-slate-700/60 rounded-lg transition-colors max-w-[140px] sm:max-w-[180px] lg:max-w-[220px]"
              title="Filter by Project Scope"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate font-medium">{selectedProjectName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-[#0c1827] rounded-lg shadow-2xl border border-slate-800 py-1 z-50 text-xs">
                <div className="px-3 py-1.5 font-semibold text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Select Project Scope
                </div>
                <button
                  onClick={() => { setSelectedProjectId('ALL'); setProjectDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800/70 transition-colors ${
                    selectedProjectId === 'ALL' ? 'text-teal-300 font-semibold bg-teal-500/10' : 'text-slate-200'
                  }`}
                >
                  <span>All Active Projects</span>
                  {selectedProjectId === 'ALL' && <Check className="w-3.5 h-3.5 text-teal-400" />}
                </button>
                {mockProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => { setSelectedProjectId(proj.id); setProjectDropdownOpen(false); }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800/70 transition-colors ${
                      selectedProjectId === proj.id ? 'text-teal-300 font-semibold bg-teal-500/10' : 'text-slate-200'
                    }`}
                  >
                    <div className="truncate">
                      <p className="truncate font-medium">{proj.name}</p>
                      <p className="text-[10px] text-slate-400">{proj.pinCode} &bull; {proj.code}</p>
                    </div>
                    {selectedProjectId === proj.id && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0c1827]" />
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-1 w-80 bg-[#0c1827] rounded-xl shadow-2xl border border-slate-800 py-2 z-50 text-xs animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-[#08121d]">
                  <span className="font-bold text-white">Operational Alerts</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                    2 Pending
                  </span>
                </div>
                <div className="divide-y divide-slate-800/80 max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <p className="font-semibold text-rose-400 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Sequential Dependency Conflict
                    </p>
                    <p className="text-slate-300 mt-0.5 text-[11px]">
                      Road Resurfacing blocked in WZ-002: Trenching requires prior QA sign-off.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">12 mins ago</span>
                  </div>
                  <div className="p-3 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <p className="font-semibold text-teal-300 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Field Evidence Verified
                    </p>
                    <p className="text-slate-300 mt-0.5 text-[11px]">
                      Apex Infra submitted 3 Trenching depth photos for PIN 560001.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">42 mins ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-800/80" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#13A89E] to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-white/10">
                {user?.fullName?.charAt(0) || 'K'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">
                  {user?.fullName || 'Platform Administrator'}
                </div>
                <div className="text-[10px] text-teal-400 font-bold tracking-wide">
                  {user?.role || 'PLATFORM_ADMIN'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-[#0c1827] rounded-xl shadow-2xl border border-slate-800 py-1 z-50 text-xs animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-800 bg-[#08121d]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#13A89E] to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white/10">
                      {user?.fullName?.charAt(0) || 'K'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Platform User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email || 'field@infrapulse.gov.in'}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
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
                    className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-teal-400" />
                    <span>My Operator Profile</span>
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-[#08121d]/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-xl bg-[#0c1827] rounded-xl shadow-2xl border border-slate-800 overflow-hidden text-slate-200">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-teal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PIN code (e.g. 560001), vendor name, or zone..."
                className="w-full text-sm outline-none bg-transparent text-white placeholder-slate-400"
                autoFocus
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="px-2 py-0.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded"
              >
                ESC
              </button>
            </div>
            <div className="p-3 text-xs text-slate-300 max-h-60 overflow-y-auto">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Quick Jump Targets
              </p>
              <div className="space-y-1">
                <div 
                  onClick={() => setSearchModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800/70 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="font-medium text-white">Zone WZ-001 (PIN 560001) &mdash; MG Road</span>
                  <span className="text-[10px] text-teal-300 font-semibold bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded">Trenching</span>
                </div>
                <div 
                  onClick={() => setSearchModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800/70 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="font-medium text-white">Zone WZ-002 (PIN 560001) &mdash; Residency Rd</span>
                  <span className="text-[10px] text-rose-300 font-semibold bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">BLOCKED</span>
                </div>
                <div 
                  onClick={() => setSearchModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800/70 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="font-medium text-white">Vendor: Apex Infra Utilities Ltd</span>
                  <span className="text-[10px] text-blue-300 font-semibold bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded">4 Zones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
