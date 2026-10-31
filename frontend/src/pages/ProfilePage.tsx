import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
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
  Lock,
  Briefcase,
  ArrowRight,
  Copy,
  Check,
  Building,
  HardHat,
  FileCheck,
  Landmark
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Role-specific operational mandates and navigation shortcuts
  const getRoleConfig = (role?: string) => {
    switch (role) {
      case 'FINANCE_OFFICER':
        return {
          title: 'Municipal Finance & Commercial Governance Officer',
          icon: Landmark,
          accent: 'amber',
          summary: 'Responsible for fiscal governance of municipal infrastructure contracts, commercial agreement execution, milestone verification, invoice auditing, and simulated payment disbursement authorization.',
          shortcuts: [
            { label: 'Milestones & Payments', path: '/milestones' },
            { label: 'Contracts & Agreements', path: '/agreements' },
            { label: 'Audit Trail & Compliance', path: '/audit' }
          ]
        };
      case 'PLATFORM_ADMIN':
        return {
          title: 'Infrastructure Platform Administrator',
          icon: ShieldCheck,
          accent: 'navy',
          summary: 'Responsible for platform-wide infrastructure governance, operator role provisioning, topology configuration, cryptographic audit integrity verification, and system security administration.',
          shortcuts: [
            { label: 'Operations Command Center', path: '/overview' },
            { label: 'Projects Portfolio', path: '/projects' },
            { label: 'Audit Trail & Integrity', path: '/audit' }
          ]
        };
      case 'PROJECT_MANAGER':
        return {
          title: 'Infrastructure Project Manager',
          icon: Building,
          accent: 'teal',
          summary: 'Responsible for infrastructure project portfolio lifecycle management, contractor qualification, geographic work-zone scheduling, DAG prerequisite conflict resolution, and work order allocations.',
          shortcuts: [
            { label: 'Projects Portfolio', path: '/projects' },
            { label: 'Work Allocation Engine', path: '/work-allocation' },
            { label: 'Contractor Directory', path: '/vendors' }
          ]
        };
      case 'FIELD_ENGINEER':
        return {
          title: 'Field Engineering & Civil Works Supervisor',
          icon: HardHat,
          accent: 'amber',
          summary: 'Responsible for on-site civil engineering supervision, utility prerequisite verification, physical measurement logging, and structural release clearance sign-offs.',
          shortcuts: [
            { label: 'Work Orders Queue', path: '/work-allocation' },
            { label: 'Quality Review Hub', path: '/quality-inspection' },
            { label: 'Geographic Work Zones', path: '/work-zones' }
          ]
        };
      case 'QUALITY_INSPECTOR':
        return {
          title: 'AI Vision & Infrastructure Quality Inspector',
          icon: FileCheck,
          accent: 'teal',
          summary: 'Responsible for computer vision defect validation, AI inference inspection analysis, asphalt & concrete compaction verification, and formal approval/rework decisions.',
          shortcuts: [
            { label: 'Quality Inspection Workspace', path: '/quality-inspection' },
            { label: 'Human Review Queue', path: '/human-review' },
            { label: 'Corrective Actions Hub', path: '/corrective-actions' }
          ]
        };
      case 'VENDOR':
        return {
          title: 'Authorized Infrastructure Contractor',
          icon: HardHat,
          accent: 'blue',
          summary: 'Authorized primary contractor responsible for field work execution, photographic evidence capture, milestone progress updates, and payment request submissions.',
          shortcuts: [
            { label: 'My Assigned Work Orders', path: '/my-work' },
            { label: 'Remediation Actions', path: '/my-rework' }
          ]
        };
      default:
        return {
          title: 'Authorized Platform Operator',
          icon: Briefcase,
          accent: 'teal',
          summary: 'Authenticated operator with authorized operational privileges for municipal infrastructure development and monitoring.',
          shortcuts: [
            { label: 'Operations Command Center', path: '/overview' }
          ]
        };
    }
  };

  const roleConfig = getRoleConfig(user?.role);
  const RoleIcon = roleConfig.icon;

  return (
    <PageContainer className="space-y-6">
      {/* Page Header spanning full container width */}
      <PageHeader
        title="Operator Profile & Identity"
        subtitle="View your authenticated infrastructure credentials, assigned platform role, and active operational permissions."
        badge={
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#13A89E]/10 text-[#0E827B] border border-[#13A89E]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#13A89E]" />
            <span>Cryptographically Verified Session</span>
          </div>
        }
        actions={
          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out Session</span>
          </button>
        }
      />

      {/* Balanced 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Operator Identity & Security Authority (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Operator Identity Card */}
          <div className="bg-white rounded-xl border border-[#DCE3E8] p-6 shadow-sm space-y-6">
            {/* Identity Header */}
            <div className="flex items-start gap-4 pb-6 border-b border-[#DCE3E8]">
              <div className="w-16 h-16 rounded-2xl bg-[#10243A] text-[#F5A623] border border-[#24445F] flex items-center justify-center text-2xl font-black shadow-inner shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[#10243A] truncate">{user?.fullName || 'Platform User'}</h2>
                  <StatusBadge status={user?.status || 'ACTIVE'} />
                </div>
                <p className="text-xs text-[#718096] truncate mt-0.5">{user?.email || 'N/A'}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#10243A] text-[#F5A623] border border-[#F5A623]/30">
                  <RoleIcon className="w-3.5 h-3.5" />
                  <span>{user?.role || 'OPERATOR'}</span>
                </div>
              </div>
            </div>

            {/* Department & Session Sync */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-[#DCE3E8] text-xs space-y-2">
              <div className="flex items-center justify-between text-[#718096]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Department</span>
                <span className="text-[#10243A] font-medium">Infrastructure Operations & Governance</span>
              </div>
              <div className="flex items-center justify-between text-[#718096] pt-2 border-t border-[#DCE3E8]/60">
                <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#13A89E]" />
                  <span>Last Active Session</span>
                </span>
                <span className="text-[#10243A] font-medium">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Current Active Session'}
                </span>
              </div>
            </div>

            {/* Account Details Matrix */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-white border border-[#DCE3E8] space-y-1">
                <div className="flex items-center gap-2 text-[#718096]">
                  <Mail className="w-4 h-4 text-[#24445F]" />
                  <span className="font-semibold text-[11px] uppercase tracking-wider">Registered Email Address</span>
                </div>
                <p className="font-medium text-[#10243A] pl-6 break-all">{user?.email || 'N/A'}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-[#DCE3E8] space-y-1">
                <div className="flex items-center gap-2 text-[#718096]">
                  <Phone className="w-4 h-4 text-[#24445F]" />
                  <span className="font-semibold text-[11px] uppercase tracking-wider">Emergency Contact Phone</span>
                </div>
                <p className="font-medium text-[#10243A] pl-6">{user?.phoneNumber || '+91 80 2297 5000'}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-[#DCE3E8] space-y-1">
                <div className="flex items-center gap-2 text-[#718096]">
                  <Key className="w-4 h-4 text-[#24445F]" />
                  <span className="font-semibold text-[11px] uppercase tracking-wider">Authentication Protocol</span>
                </div>
                <p className="font-medium text-[#10243A] pl-6">Stateless JWT + Rotating HttpOnly Cookies</p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-[#DCE3E8] space-y-1">
                <div className="flex items-center justify-between text-[#718096]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#24445F]" />
                    <span className="font-semibold text-[11px] uppercase tracking-wider">Account Identifier</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="flex items-center gap-1 text-[10px] text-[#13A89E] hover:text-[#0E827B] font-semibold"
                    title="Copy Account ID"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-[#10243A] pl-6 truncate select-all">{user?.id || 'sys-local-demo'}</p>
              </div>
            </div>
          </div>

          {/* Security Governance Notice */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-3 shadow-sm">
            <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Security Governance &amp; Compliance Policy</p>
              <p className="mt-1 text-amber-800 leading-relaxed text-[11px]">
                Platform operational roles and authorization matrices are governed centrally in accordance with municipal infrastructure management standards. 
                Operators cannot self-modify their role or elevate account privileges.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Operational Mandate & Authorization Matrix (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Operational Mandate Card */}
          <div className="bg-white rounded-xl border border-[#DCE3E8] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#DCE3E8]">
              <div className="w-9 h-9 rounded-lg bg-[#13A89E]/10 border border-[#13A89E]/30 flex items-center justify-center text-[#13A89E]">
                <RoleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#10243A]">{roleConfig.title}</h3>
                <p className="text-xs text-[#718096]">Municipal Infrastructure Operational Mandate</p>
              </div>
            </div>

            <p className="text-xs text-[#202B36] leading-relaxed">
              {roleConfig.summary}
            </p>

            {/* Quick Workflow Navigation Shortcuts */}
            <div className="pt-2">
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-2">
                Primary Authorized Workspaces
              </p>
              <div className="flex flex-wrap gap-2">
                {roleConfig.shortcuts.map((sc) => (
                  <button
                    key={sc.path}
                    type="button"
                    onClick={() => navigate(sc.path)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#10243A] text-[#10243A] hover:text-white border border-[#DCE3E8] text-xs font-semibold transition-all group"
                  >
                    <span>{sc.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#13A89E] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Assigned Permissions Card */}
          <div className="bg-white rounded-xl border border-[#DCE3E8] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3E8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#13A89E]" />
                <h3 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
                  Active Assigned Permissions
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#13A89E]/15 text-[#0E827B] border border-[#13A89E]/30">
                {permissions.length} Granted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              {permissions.map((perm) => (
                <div 
                  key={perm} 
                  className="p-3 rounded-lg border border-[#DCE3E8] bg-slate-50/60 hover:bg-slate-50 flex items-center gap-2.5 text-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#13A89E] shrink-0" />
                  <span className="font-mono text-[11px] font-bold text-[#10243A] truncate" title={perm}>
                    {perm}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
