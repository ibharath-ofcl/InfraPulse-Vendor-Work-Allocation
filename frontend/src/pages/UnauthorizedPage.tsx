import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { UserRole } from '../types';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleLandingRoute = (role?: UserRole): string => {
    switch (role) {
      case 'PLATFORM_ADMIN': return '/overview';
      case 'PROJECT_MANAGER': return '/overview';
      case 'VENDOR': return '/work-allocation';
      case 'FIELD_ENGINEER': return '/quality-inspection';
      case 'FINANCE_OFFICER': return '/milestones';
      default: return '/login';
    }
  };

  const handleReturn = () => {
    navigate(getRoleLandingRoute(user?.role), { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-6 text-ink-primary">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-surface-border p-8 shadow-card text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>HTTP 403 &mdash; Access Restricted</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
            Insufficient Role Permissions
          </h1>
          <p className="text-xs text-ink-secondary leading-relaxed max-w-md mx-auto">
            Your current platform role is <span className="font-bold text-navy-900">{user?.role || 'UNAUTHENTICATED'}</span>. 
            This area requires elevated operational privileges that are not granted to your account profile.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-surface-border rounded-xl text-left space-y-2 text-xs">
          <p className="font-semibold text-ink-primary">Account Details:</p>
          <div className="flex justify-between text-ink-secondary">
            <span>Signed In As:</span>
            <span className="font-medium text-ink-primary">{user?.fullName || 'Guest'}</span>
          </div>
          <div className="flex justify-between text-ink-secondary">
            <span>Official Email:</span>
            <span className="font-medium text-ink-primary">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-ink-secondary">
            <span>Assigned Role:</span>
            <span className="font-semibold text-teal-700">{user?.role || 'NONE'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleReturn}
            className="w-full sm:w-auto px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Assigned Workspace</span>
          </button>

          <button
            onClick={logout}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-surface-border text-rose-600 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
