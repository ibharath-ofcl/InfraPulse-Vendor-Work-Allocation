import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  HardHat, 
  ShieldCheck, 
  User 
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();

  // Dynamic route depending on role for primary work management
  const workRoute = user?.role === 'VENDOR' ? '/my-work' : '/work-allocation';
  const inspectionRoute = (user?.role === 'FIELD_ENGINEER' || user?.role === 'PLATFORM_ADMIN')
    ? '/human-review' 
    : '/quality-inspection';

  const navItems = [
    { label: 'Overview', path: '/overview', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Work', path: workRoute, icon: HardHat },
    { label: 'Quality', path: inspectionRoute, icon: ShieldCheck },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#DCE3E8] shadow-[0_-4px_16px_rgba(16,36,58,0.06)]"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 touch-target
                ${isActive 
                  ? 'text-[#10243A] font-bold scale-105' 
                  : 'text-[#718096] hover:text-[#202B36] font-medium'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-[#10243A] text-[#F5A623] shadow-sm' 
                      : 'text-[#718096]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] tracking-tight mt-0.5 ${
                    isActive ? 'font-bold text-[#10243A]' : 'font-medium text-[#718096]'
                  }`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
