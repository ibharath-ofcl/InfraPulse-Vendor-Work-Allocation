import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../auth/useAuth';
import { UserRole, UserStatus } from '../types';
import { recordAuditEvent, getAllMergedAuditEvents } from '../data/mockAuditEvents';
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
  Landmark,
  Pencil,
  RotateCcw,
  Sparkles,
  Search,
  X,
  Save,
  MapPin,
  Shield,
  Layers
} from 'lucide-react';

interface PersonaOption {
  role: UserRole;
  name: string;
  email: string;
  department: string;
  dutyStation: string;
  phone: string;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  permCount: number;
  description: string;
}

const AVAILABLE_PERSONAS: PersonaOption[] = [
  {
    role: 'FIELD_ENGINEER',
    name: 'Kavita Reddy (Field QA)',
    email: 'field@infrapulse.gov.in',
    department: 'Infrastructure Operations & Governance',
    dutyStation: 'Bengaluru Urban Corridor (HQ)',
    phone: '+91 80 2297 5000',
    title: 'Field Engineering & Civil Works Supervisor',
    badge: 'FIELD_ENGINEER',
    icon: HardHat,
    permCount: 8,
    description: 'Field civil supervision, utility prerequisite checks, and physical measurements.'
  },
  {
    role: 'PLATFORM_ADMIN',
    name: 'Platform Administrator',
    email: 'admin@infrapulse.gov.in',
    department: 'Platform Enterprise Governance & Architecture',
    dutyStation: 'Central Command Operations',
    phone: '+91 80 2297 5001',
    title: 'Infrastructure Platform Administrator',
    badge: 'PLATFORM_ADMIN',
    icon: ShieldCheck,
    permCount: 13,
    description: 'Platform-wide governance, operator role provisioning, and cryptographic audit integrity.'
  },
  {
    role: 'PROJECT_MANAGER',
    name: 'Priya Sharma (PM)',
    email: 'pm@infrapulse.gov.in',
    department: 'Municipal Urban Works & Project Management',
    dutyStation: 'Regional Infrastructure PMO',
    phone: '+91 80 2297 5002',
    title: 'Infrastructure Project Manager',
    badge: 'PROJECT_MANAGER',
    icon: Building,
    permCount: 8,
    description: 'Project portfolio lifecycle, contractor allocation, and DAG prerequisite conflict resolution.'
  },
  {
    role: 'FINANCE_OFFICER',
    name: 'Rohan Mehta (Finance)',
    email: 'finance@infrapulse.gov.in',
    department: 'Municipal Finance & Commercial Governance',
    dutyStation: 'Fiscal Oversight Directorate',
    phone: '+91 80 2297 5003',
    title: 'Municipal Finance & Commercial Governance Officer',
    badge: 'FINANCE_OFFICER',
    icon: Landmark,
    permCount: 6,
    description: 'Fiscal governance of contracts, invoice auditing, and simulated milestone disbursements.'
  },
  {
    role: 'VENDOR',
    name: 'Apex Infrastructure Ltd (Vendor)',
    email: 'vendor@infrapulse.gov.in',
    department: 'Apex Infrastructure Prime Contracting Division',
    dutyStation: 'Field Operations Unit - East',
    phone: '+91 80 2297 5004',
    title: 'Authorized Infrastructure Contractor',
    badge: 'VENDOR',
    icon: HardHat,
    permCount: 3,
    description: 'Field work package execution, photographic evidence capture, and milestone completion.'
  }
];

const PERMISSION_DESCRIPTIONS: Record<string, { label: string; desc: string; category: 'VIEW' | 'MANAGE' | 'APPROVE' | 'FINANCE' }> = {
  VIEW_OVERVIEW: { label: 'Operations Command Center', desc: 'Read access to operations metrics & KPIs', category: 'VIEW' },
  MANAGE_USERS: { label: 'User Provisioning & Roles', desc: 'Manage platform accounts & authorization', category: 'MANAGE' },
  MANAGE_PROJECTS: { label: 'Project Portfolio Lifecycle', desc: 'Register initiatives and define corridors', category: 'MANAGE' },
  VIEW_PROJECTS: { label: 'View Project Portfolio', desc: 'Access civil project registries & contracts', category: 'VIEW' },
  VIEW_WORK_ZONES: { label: 'Geographical Work Zones', desc: 'Discover PIN-code mapped sub-zones & bounds', category: 'VIEW' },
  ALLOCATE_WORK: { label: 'Allocate Work Packages', desc: 'Issue work orders & enforce DAG sequences', category: 'MANAGE' },
  VIEW_ASSIGNED_WORK: { label: 'View Work Orders', desc: 'Monitor utility trenching & cable work orders', category: 'VIEW' },
  SUBMIT_EVIDENCE: { label: 'Submit Field Evidence', desc: 'Upload geotagged field photos with EXIF GPS', category: 'MANAGE' },
  REVIEW_EVIDENCE: { label: 'Audit Photo Evidence', desc: 'Inspect optical tamper checks & pHash collision', category: 'APPROVE' },
  APPROVE_QUALITY_REVIEW: { label: 'Authorize Quality Sign-offs', desc: 'Sign off AI computer vision QA & rework orders', category: 'APPROVE' },
  VIEW_MILESTONES: { label: 'View Commercial Milestones', desc: 'Access milestone stages & escrow accounts', category: 'VIEW' },
  AUTHORIZE_PAYMENTS: { label: 'Authorize Milestone Payments', desc: 'Trigger cryptographically verified payouts', category: 'FINANCE' },
  VIEW_AUDIT_TRAIL: { label: 'Compliance Audit Trail', desc: 'Inspect SHA-256 hash-chained immutable ledger', category: 'VIEW' },
  DEFECT_VIEW: { label: 'Inspect Defect Clusters', desc: 'Review computer vision defect recurrence', category: 'VIEW' },
  DEFECT_MANAGE: { label: 'Remediation Management', desc: 'Issue corrective action rework orders', category: 'MANAGE' },
  RISK_VIEW: { label: 'Predictive Risk Models', desc: 'Monitor multi-factor contractor risk indices', category: 'VIEW' },
  RISK_MANAGE: { label: 'Risk Mitigation Policies', desc: 'Configure threshold triggers and SLA alerts', category: 'MANAGE' }
};

export const ProfilePage: React.FC = () => {
  const { user, permissions, logout, updateUser, switchRole } = useAuth();
  const navigate = useNavigate();

  // Component state
  const [copiedId, setCopiedId] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
  
  // Permission filtering state
  const [permSearch, setPermSearch] = useState('');
  const [permCategoryFilter, setPermCategoryFilter] = useState<'ALL' | 'VIEW' | 'MANAGE' | 'APPROVE' | 'FINANCE'>('ALL');

  // Toast / notification banner state
  const [notification, setNotification] = useState<{
    type: 'success' | 'info';
    title: string;
    description: string;
  } | null>(null);

  // Form state initialized from active user
  const [formName, setFormName] = useState(user?.fullName || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formPhone, setFormPhone] = useState(user?.phoneNumber || '+91 80 2297 5000');
  const [formDepartment, setFormDepartment] = useState(user?.department || 'Infrastructure Operations & Governance');
  const [formDutyStation, setFormDutyStation] = useState(user?.dutyStation || 'Bengaluru Urban Corridor (HQ)');
  const [formStatus, setFormStatus] = useState<UserStatus>(user?.status || 'ACTIVE');

  // Sync form when user changes
  useEffect(() => {
    if (user) {
      setFormName(user.fullName || '');
      setFormEmail(user.email || '');
      setFormPhone(user.phoneNumber || '+91 80 2297 5000');
      setFormDepartment(user.department || 'Infrastructure Operations & Governance');
      setFormDutyStation(user.dutyStation || 'Bengaluru Urban Corridor (HQ)');
      setFormStatus(user.status || 'ACTIVE');
    }
  }, [user]);

  // Auto-dismiss notification after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
            { label: 'Compliance Audit Trail', path: '/audit-trail' },
            { label: 'Project Portfolio', path: '/projects' }
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
            { label: 'Project Portfolio', path: '/projects' },
            { label: 'Compliance Audit Trail', path: '/audit-trail' },
            { label: 'Vendor Work Allocation', path: '/work-allocation' }
          ]
        };
      case 'PROJECT_MANAGER':
        return {
          title: 'Infrastructure Project Manager',
          icon: Building,
          accent: 'teal',
          summary: 'Responsible for infrastructure project portfolio lifecycle management, contractor qualification, geographic work-zone scheduling, DAG prerequisite conflict resolution, and work order allocations.',
          shortcuts: [
            { label: 'Project Portfolio', path: '/projects' },
            { label: 'Vendor Work Allocation', path: '/work-allocation' },
            { label: 'Contractor Directory', path: '/vendors' },
            { label: 'Geographical Work Zones', path: '/work-zones' }
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
      case 'VENDOR':
        return {
          title: 'Authorized Infrastructure Contractor',
          icon: HardHat,
          accent: 'blue',
          summary: 'Authorized primary contractor responsible for field work execution, photographic evidence capture, milestone progress updates, and payment request submissions.',
          shortcuts: [
            { label: 'Photo Evidence Vault', path: '/evidence' },
            { label: 'Remediation Portal', path: '/my-corrective-actions' },
            { label: 'Milestones & Payments', path: '/milestones' }
          ]
        };
      default:
        return {
          title: 'Authorized Platform Operator',
          icon: Briefcase,
          accent: 'teal',
          summary: 'Authenticated operator with authorized operational privileges for municipal infrastructure development and monitoring.',
          shortcuts: [
            { label: 'Operations Command Center', path: '/overview' },
            { label: 'Compliance Audit Trail', path: '/audit-trail' }
          ]
        };
    }
  };

  const roleConfig = getRoleConfig(user?.role);
  const RoleIcon = roleConfig.icon;

  // Handle saving edited profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const updatedData = {
        fullName: formName.trim(),
        email: formEmail.trim(),
        phoneNumber: formPhone.trim(),
        department: formDepartment.trim(),
        dutyStation: formDutyStation.trim(),
        status: formStatus
      };

      // 1. Update active AuthProvider context and localStorage
      updateUser(updatedData);

      // 2. Record cryptographically chained audit event
      await recordAuditEvent({
        eventCategory: 'SECURITY_AUTH',
        eventType: 'OPERATOR_PROFILE_UPDATED',
        entityType: 'OPERATOR_IDENTITY',
        entityId: user?.id || 'usr-operator',
        entityReference: `${updatedData.fullName} (${user?.role || 'OPERATOR'})`,
        action: 'UPDATE_OPERATOR_CREDENTIALS',
        outcome: 'SUCCESS',
        description: `Operator credentials updated for ${updatedData.fullName}: Phone ${updatedData.phoneNumber}, Department: ${updatedData.department}, Station: ${updatedData.dutyStation}. Replicated across platform.`,
        actorId: user?.id || 'usr-operator',
        actorName: updatedData.fullName,
        actorRole: user?.role || 'OPERATOR',
        eventPayload: JSON.stringify({
          previous: {
            fullName: user?.fullName,
            email: user?.email,
            phoneNumber: user?.phoneNumber,
            department: user?.department,
            status: user?.status
          },
          updated: updatedData,
          replicatedTargets: ['TOP_NAVBAR', 'APP_SIDEBAR', 'CENTRAL_AUDIT_LEDGER', 'LOCAL_STORAGE'],
          timestamp: new Date().toISOString()
        })
      });

      // 3. Show confirmation feedback
      setNotification({
        type: 'success',
        title: 'Operator Profile Successfully Updated & Replicated',
        description: `Changes for "${updatedData.fullName}" are now active in Top Navbar, App Sidebar, and recorded into the Centralized Enterprise Audit Trail.`
      });

      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update operator profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle switching persona / role
  const handleSelectPersona = async (persona: PersonaOption) => {
    if (user?.role === persona.role && user?.fullName === persona.name) return;

    setIsSwitchingPersona(true);
    try {
      // 1. Switch role in AuthProvider
      switchRole(persona.role, persona.name, persona.email);
      updateUser({
        phoneNumber: persona.phone,
        department: persona.department,
        dutyStation: persona.dutyStation
      });

      // 2. Record audit trail event for persona switch
      await recordAuditEvent({
        eventCategory: 'SECURITY_AUTH',
        eventType: 'OPERATOR_ROLE_SWITCHED',
        entityType: 'OPERATOR_IDENTITY',
        entityId: `usr-${persona.role.toLowerCase()}`,
        entityReference: `${persona.name} (${persona.role})`,
        action: 'SIMULATE_ROLE_TRANSITION',
        outcome: 'SUCCESS',
        description: `Active operator persona switched to ${persona.name} with role ${persona.role} (${persona.permCount} permissions granted). Live UI replicated across platform.`,
        actorId: `usr-${persona.role.toLowerCase()}`,
        actorName: persona.name,
        actorRole: persona.role,
        eventPayload: JSON.stringify({
          role: persona.role,
          name: persona.name,
          email: persona.email,
          permissionsCount: persona.permCount,
          replicatedTargets: ['TOP_NAVBAR', 'APP_SIDEBAR', 'CENTRAL_AUDIT_LEDGER', 'LOCAL_STORAGE'],
          switchedAt: new Date().toISOString()
        })
      });

      // 3. Show notification
      setNotification({
        type: 'info',
        title: `Switched Persona to ${persona.name}`,
        description: `Platform role updated to ${persona.role}. Navigation menu items and operational workspaces dynamically adjusted.`
      });
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsSwitchingPersona(false);
    }
  };

  // Reset to default Field QA operator
  const handleResetDefaults = async () => {
    const defaultPersona = AVAILABLE_PERSONAS[0]; // Field Engineer
    await handleSelectPersona(defaultPersona);
  };

  // Filter permissions based on search and category
  const filteredPermissions = useMemo(() => {
    return permissions.filter((perm) => {
      const meta = PERMISSION_DESCRIPTIONS[perm] || { label: perm, desc: '', category: 'VIEW' };
      const matchesSearch = 
        perm.toLowerCase().includes(permSearch.toLowerCase()) ||
        meta.label.toLowerCase().includes(permSearch.toLowerCase()) ||
        meta.desc.toLowerCase().includes(permSearch.toLowerCase());

      const matchesCat = 
        permCategoryFilter === 'ALL' ? true : meta.category === permCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [permissions, permSearch, permCategoryFilter]);

  // Fetch 3 most recent audit events for this operator
  const recentOperatorAuditEvents = useMemo(() => {
    try {
      const allEvents = getAllMergedAuditEvents();
      return allEvents
        .filter(e => e.eventCategory === 'SECURITY_AUTH' || e.actorName === user?.fullName)
        .slice(-3)
        .reverse();
    } catch {
      return [];
    }
  }, [user?.fullName, notification]);

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-[#13A89E] hover:bg-[#0E827B] text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              title="Edit Operator Profile Credentials"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile Details</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-[#10243A] border border-[#DCE3E8] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Reset to default Field QA credentials"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out Session</span>
            </button>
          </div>
        }
      />

      {/* Real-time Platform Replication Live Beacon Banner */}
      <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50/50 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#13A89E]/15 border border-[#13A89E]/30 flex items-center justify-center text-[#13A89E] shrink-0 mt-0.5 md:mt-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#10243A]">Real-Time Platform Replication Active</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                LIVE SYNC
              </span>
            </div>
            <p className="text-[11px] text-[#556987] mt-0.5">
              Identity modifications and role switches immediately propagate to Top Navbar, App Sidebar RBAC navigation, and append SHA-256 hash-chained compliance audit records.
            </p>
          </div>
        </div>

        {/* Sync Target Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="px-2.5 py-1 rounded-md bg-white border border-[#DCE3E8] text-[11px] font-medium text-[#10243A] flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-[10px] uppercase font-semibold text-slate-500">Navbar:</span>
            <span className="font-bold">{user?.fullName?.split(' ')[0] || 'Admin'}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-white border border-[#DCE3E8] text-[11px] font-medium text-[#10243A] flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] uppercase font-semibold text-slate-500">Sidebar:</span>
            <span className="font-bold">{user?.role || 'FIELD_ENGINEER'}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-white border border-[#DCE3E8] text-[11px] font-medium text-[#10243A] flex items-center gap-1.5 shadow-2xs">
            <Shield className="w-3 h-3 text-[#13A89E]" />
            <span className="text-[10px] uppercase font-semibold text-slate-500">Audit:</span>
            <span className="font-bold text-teal-700">SHA-256</span>
          </div>
        </div>
      </div>

      {/* Floating or Embedded Toast Notification */}
      {notification && (
        <div 
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 shadow-md animate-fadeIn transition-all ${
            notification.type === 'success' 
              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950' 
              : 'bg-teal-50/95 border-teal-300 text-teal-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${notification.type === 'success' ? 'text-emerald-600' : 'text-teal-600'}`} />
            <div>
              <p className="text-xs font-bold">{notification.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{notification.description}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="p-1 rounded hover:bg-black/5 text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Balanced 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Operator Identity & Persona Controls (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Operator Identity Card */}
          <div className="bg-white rounded-xl border border-[#DCE3E8] p-6 shadow-sm space-y-6 relative overflow-hidden">
            {/* Identity Header */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#DCE3E8]">
              <div className="flex items-start gap-4">
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

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 rounded-lg border border-[#DCE3E8] hover:bg-slate-50 text-slate-600 hover:text-[#10243A] transition-colors"
                title="Edit Identity Details"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {/* Department & Session Sync */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-[#DCE3E8] text-xs space-y-2">
              <div className="flex items-center justify-between text-[#718096]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Department</span>
                <span className="text-[#10243A] font-medium text-right max-w-[240px] truncate">
                  {user?.department || 'Infrastructure Operations & Governance'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#718096] pt-2 border-t border-[#DCE3E8]/60">
                <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#13A89E]" />
                  <span>Duty Station</span>
                </span>
                <span className="text-[#10243A] font-medium text-right max-w-[240px] truncate">
                  {user?.dutyStation || 'Bengaluru Urban Corridor (HQ)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#718096] pt-2 border-t border-[#DCE3E8]/60">
                <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#13A89E]" />
                  <span>Last Active Session</span>
                </span>
                <span className="text-[#10243A] font-medium">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '20/11/2026, 9:36:38 AM'}
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
                <p className="font-medium text-[#10243A] pl-6 break-all">{user?.email || 'field@infrapulse.gov.in'}</p>
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
                <p className="font-mono text-[11px] text-[#10243A] pl-6 truncate select-all">{user?.id || 'usr-field_engineer'}</p>
              </div>
            </div>
          </div>

          {/* Interactive Persona & Role Switcher */}
          <div className="bg-white rounded-xl border border-[#DCE3E8] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3E8]">
              <div>
                <h3 className="text-sm font-bold text-[#10243A] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#13A89E]" />
                  <span>Switch Operator Persona</span>
                </h3>
                <p className="text-[11px] text-[#718096] mt-0.5">
                  Test live role-based access control, menu permissions, and operational mandates.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {AVAILABLE_PERSONAS.map((persona) => {
                const isSelected = user?.role === persona.role && user?.fullName === persona.name;
                const PIcon = persona.icon;

                return (
                  <div
                    key={persona.role}
                    onClick={() => !isSwitchingPersona && handleSelectPersona(persona)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSwitchingPersona ? 'opacity-70 pointer-events-none' : ''
                    } ${
                      isSelected
                        ? 'bg-teal-50/70 border-[#13A89E] shadow-xs ring-1 ring-[#13A89E]/20'
                        : 'bg-white hover:bg-slate-50 border-[#DCE3E8]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected 
                          ? 'bg-[#10243A] text-teal-400 border-[#10243A]' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        <PIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#10243A] truncate">{persona.name}</p>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#13A89E] text-white">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{persona.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {persona.permCount} Perms
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#13A89E]" />
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-slate-600">
                          &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Governance Notice */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-3 shadow-sm">
            <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Security Governance &amp; Compliance Policy</p>
              <p className="mt-1 text-amber-800 leading-relaxed text-[11px]">
                Platform operational roles and authorization matrices are governed centrally in accordance with municipal infrastructure management standards. 
                Any simulated role changes or credential modifications are cryptographically signed and recorded into the Centralized Enterprise Audit Trail.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Operational Mandate, Permissions & Audit Activity (7 Columns) */}
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

          {/* Active Assigned Permissions Card with Search & Filtering */}
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

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="Filter permissions (e.g., VIEW, APPROVE, WORK)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3E8] outline-none focus:border-[#13A89E] text-[#10243A]"
                />
                {permSearch && (
                  <button 
                    type="button" 
                    onClick={() => setPermSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'VIEW', 'MANAGE', 'APPROVE', 'FINANCE'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPermCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors shrink-0 ${
                      permCategoryFilter === cat
                        ? 'bg-[#10243A] text-white border-[#10243A]'
                        : 'bg-slate-50 text-slate-600 border-[#DCE3E8] hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map((perm) => {
                  const meta = PERMISSION_DESCRIPTIONS[perm] || { label: perm, desc: 'Authorized operational action', category: 'VIEW' };
                  return (
                    <div 
                      key={perm} 
                      className="p-3 rounded-lg border border-[#DCE3E8] bg-slate-50/60 hover:bg-slate-50 flex items-start gap-2.5 text-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#13A89E] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] font-bold text-[#10243A] truncate" title={perm}>
                          {perm}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                          {meta.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {meta.desc}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-[#DCE3E8]">
                  No permissions matching &ldquo;{permSearch}&rdquo; in category {permCategoryFilter}
                </div>
              )}
            </div>
          </div>

          {/* Recent Operator Audit Activities */}
          <div className="bg-white rounded-xl border border-[#DCE3E8] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3E8]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#13A89E]" />
                <h3 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
                  Recent Cryptographic Audit Trail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/audit-trail')}
                className="text-xs font-semibold text-[#13A89E] hover:text-[#0E827B] flex items-center gap-1"
              >
                <span>View Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {recentOperatorAuditEvents.length > 0 ? (
                recentOperatorAuditEvents.map((evt) => (
                  <div key={evt.id} className="p-3 rounded-lg bg-slate-50/70 border border-[#DCE3E8] text-xs flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {evt.eventCode}
                        </span>
                        <span className="font-semibold text-[#10243A] truncate">{evt.eventType}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">{evt.description}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        Hash: {evt.eventHash ? evt.eventHash.slice(0, 16) : 'N/A'}...
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  No recent audit activities recorded for this operator.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#DCE3E8] shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-[#DCE3E8] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#13A89E]/15 border border-[#13A89E]/30 flex items-center justify-center text-[#13A89E]">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#10243A]">Edit Operator Credentials</h3>
                  <p className="text-[11px] text-[#718096]">Modify identity details; changes replicate across platform</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#10243A] mb-1">
                  Full Operator Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE3E8] outline-none focus:border-[#13A89E] text-[#10243A]"
                  placeholder="e.g. Kavita Reddy (Field QA)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#10243A] mb-1">
                    Registered Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#DCE3E8] outline-none focus:border-[#13A89E] text-[#10243A]"
                    placeholder="e.g. field@infrapulse.gov.in"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#10243A] mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#DCE3E8] outline-none focus:border-[#13A89E] text-[#10243A]"
                    placeholder="e.g. +91 80 2297 5000"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#10243A] mb-1">
                  Operational Department
                </label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE3E8] outline-none focus:border-[#13A89E] text-[#10243A]"
                  placeholder="e.g. Infrastructure Operations & Governance"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#10243A] mb-1">
                    Assigned Duty Station
                  </label>
                  <input
                    type="text"
                    value={formDutyStation}
                    onChange={(e) => setFormDutyStation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#DCE3E8] outline-none focus:border-[#13A89E] text-[#10243A]"
                    placeholder="e.g. Bengaluru Urban Corridor (HQ)"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#10243A] mb-1">
                    Operational Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-[#DCE3E8] outline-none focus:border-[#13A89E] text-[#10243A] bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Operational)</option>
                    <option value="INACTIVE">INACTIVE (Standby)</option>
                    <option value="LOCKED">LOCKED (Restricted)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <p>
                  Saving writes to your local storage session and computes a new SHA-256 hash block for the Centralized Compliance Audit Ledger. Top Navbar &amp; Sidebar will reflect changes immediately.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#DCE3E8] text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#13A89E] hover:bg-[#0E827B] text-white font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save & Replicate Identity'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
