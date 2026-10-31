import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { TopNavbar } from '../components/layout/TopNavbar';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F5F6] text-[#202B36] flex flex-col antialiased selection:bg-[#13A89E] selection:text-white blueprint-grid">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          collapsed={collapsed}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className={`flex-1 transition-all duration-300 pb-20 lg:pb-8 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile-First Bottom Navigation Bar for Field Operators */}
      <MobileBottomNav />
    </div>
  );
};

