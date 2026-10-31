import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { TopNavbar } from '../components/layout/TopNavbar';

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-main text-ink-primary flex flex-col antialiased selection:bg-teal-500 selection:text-white">
      {/* Sidebar */}
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

        <main className={`flex-1 transition-all duration-300 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
