import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../auth/useAuth';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Clock, 
  Key, 
  LogOut, 
  CheckCircle2,
  Lock
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, permissions, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Operator Profile &amp; Identity"
        subtitle="View your authenticated infrastructure credentials, assigned platform role, and active operational permissions."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Cryptographically Verified Session</span>
          </div>
        }
        actions={
          <button
            onClick={logout}
            className="px-3.5 py-2 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        }
      />

      {/* Main Profile Card */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy-900 text-teal-300 border border-navy-700 flex items-center justify-center text-xl font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-primary">{user?.fullName || 'Platform User'}</h2>
              <p className="text-xs text-ink-secondary">{user?.email || 'N/A'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-navy-900 text-teal-300">
                  {user?.role || 'OPERATOR'}
                </span>
                <StatusBadge status={user?.status || 'ACTIVE'} />
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-ink-muted">
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Active:</span>
            </div>
            <p className="font-medium text-ink-primary mt-0.5">
              {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Current Session'}
            </p>
          </div>
        </div>

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-surface-border space-y-1">
            <div className="flex items-center gap-2 text-ink-muted">
              <Mail className="w-4 h-4 text-ink-secondary" />
              <span className="font-medium">Registered Email Address</span>
            </div>
            <p className="font-semibold text-ink-primary pl-6">{user?.email || 'N/A'}</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-surface-border space-y-1">
            <div className="flex items-center gap-2 text-ink-muted">
              <Phone className="w-4 h-4 text-ink-secondary" />
              <span className="font-medium">Emergency Contact Phone</span>
            </div>
            <p className="font-semibold text-ink-primary pl-6">{user?.phoneNumber || '+91 80 2297 5000'}</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-surface-border space-y-1">
            <div className="flex items-center gap-2 text-ink-muted">
              <Key className="w-4 h-4 text-ink-secondary" />
              <span className="font-medium">Authentication Authority</span>
            </div>
            <p className="font-semibold text-ink-primary pl-6">Stateless JWT + Rotating HttpOnly Cookies</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-surface-border space-y-1">
            <div className="flex items-center gap-2 text-ink-muted">
              <User className="w-4 h-4 text-ink-secondary" />
              <span className="font-medium">Account Identifier</span>
            </div>
            <p className="font-mono text-[11px] text-ink-primary pl-6 truncate">{user?.id || 'sys-local-demo'}</p>
          </div>
        </div>

        {/* Governance Notice */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
          <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-semibold">Security Governance Notice</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed text-[11px]">
              Platform roles are governed centrally in accordance with municipal infrastructure management compliance standards. 
              Operators cannot self-modify their role or elevate account privileges.
            </p>
          </div>
        </div>

        {/* Granted Operational Permissions */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-3">
            Active Assigned Permissions ({permissions.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {permissions.map((perm) => (
              <div 
                key={perm} 
                className="p-2.5 rounded-lg border border-surface-border bg-white flex items-center gap-2 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-mono text-[11px] text-ink-primary truncate">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
