import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

interface TopNavbarProps {
  onOpenMobile: () => void;
  collapsed: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobile, collapsed }) => {
  const location = useLocation();
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
      default: return 'Overview';
    }
  };

  const selectedProjectName = selectedProjectId === 'ALL'
    ? 'All Active Projects'
    : mockProjects.find(p => p.id === selectedProjectId)?.name || 'Project Scope';

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
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span>InfraPulse AI</span>
              <span>/</span>
              <span className="text-teal-700 font-semibold">{getPageTitle(location.pathname)}</span>
            </div>
            <h2 className="text-sm md:text-base font-bold text-ink-primary tracking-tight">
              {getPageTitle(location.pathname)}
            </h2>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-50 border border-surface-border rounded-lg text-ink-muted text-xs hover:border-slate-300 hover:bg-white transition-all shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-ink-muted" />
              <span>Search PIN codes, vendors, work zones, or milestones...</span>
            </span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3">
          {/* Project Selector Dropdown */}
          <div className="relative hidden sm:block" ref={projectRef}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-border bg-white text-xs font-medium text-ink-primary hover:bg-slate-50 transition-all shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span className="max-w-[130px] truncate text-left">{selectedProjectName}</span>
              <ChevronDown className="w-3 h-3 text-ink-muted" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-dropdown border border-surface-border py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider border-b border-slate-100">
                  Select Project Scope
                </div>
                <button
                  onClick={() => {
                    setSelectedProjectId('ALL');
                    setProjectDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-ink-primary hover:bg-slate-50 flex items-center justify-between"
                >
                  <span className="font-semibold">All Active Projects</span>
                  {selectedProjectId === 'ALL' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
                {mockProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setProjectDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-ink-primary hover:bg-slate-50 flex items-center justify-between border-t border-slate-50"
                  >
                    <div className="truncate pr-2">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-ink-muted">PIN: {p.pinCode} • {p.code}</p>
                    </div>
                    {selectedProjectId === p.id && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
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
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-surface-border py-2 z-50">
                <div className="px-4 py-2 border-b border-surface-border flex items-center justify-between">
                  <h4 className="text-xs font-bold text-ink-primary">Platform Alerts</h4>
                  <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
                    3 New
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  <div className="p-3 text-xs hover:bg-slate-50 cursor-pointer">
                    <p className="font-semibold text-rose-600">Dependency Block Triggered</p>
                    <p className="text-ink-secondary text-[11px] mt-0.5">Road Resurfacing in Zone 560001-B blocked pending Trenching.</p>
                    <span className="text-[10px] text-ink-muted mt-1 block">12m ago</span>
                  </div>
                  <div className="p-3 text-xs hover:bg-slate-50 cursor-pointer">
                    <p className="font-semibold text-amber-600">AI Inspection Flagged</p>
                    <p className="text-ink-secondary text-[11px] mt-0.5">Granular bedding anomaly detected on Sector 4B.</p>
                    <span className="text-[10px] text-ink-muted mt-1 block">2h ago</span>
                  </div>
                  <div className="p-3 text-xs hover:bg-slate-50 cursor-pointer">
                    <p className="font-semibold text-emerald-600">Milestone Disbursed</p>
                    <p className="text-ink-secondary text-[11px] mt-0.5">₹ 42,00,000 released for Yelahanka road reinstatement.</p>
                    <span className="text-[10px] text-ink-muted mt-1 block">4h ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative pl-2 border-l border-surface-border" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-navy-900 text-teal-400 font-bold text-xs flex items-center justify-center border border-navy-800 shadow-sm">
                AK
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-ink-primary leading-tight">Arun Kumar</span>
                <span className="text-[10px] text-ink-muted leading-tight">Platform Administrator</span>
              </div>
              <ChevronDown className="w-3 h-3 text-ink-muted hidden xl:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-surface-border py-1 z-50">
                <div className="px-4 py-2.5 border-b border-surface-border">
                  <p className="text-xs font-bold text-ink-primary">Arun Kumar</p>
                  <p className="text-[11px] text-ink-muted">arun.kumar@infrapulse.gov.in</p>
                  <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-navy-50 text-navy-800">
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>Platform Administrator</span>
                  </div>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => {
                      alert('User profile settings are locked during Stage 2 presentation.');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-ink-secondary hover:text-ink-primary hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Account Settings</span>
                  </button>
                  <button 
                    onClick={() => {
                      alert('Sign out is simulated for this Stage 2 demonstration.');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
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
                  <span className="font-medium text-ink-primary">Zone WZ-001 (PIN 560001) — MG Road</span>
                  <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded">Trenching</span>
                </div>
                <div 
                  onClick={() => setSearchModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-ink-primary">Zone WZ-002 (PIN 560001) — Residency Rd</span>
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
