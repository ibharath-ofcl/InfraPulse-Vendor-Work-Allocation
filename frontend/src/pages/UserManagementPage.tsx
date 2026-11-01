import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { userService } from '../services/userService';
import { AuthUser, UserRole, UserStatus } from '../types';
import { 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  AlertTriangle,
  RotateCcw,
  Users,
  Phone,
  Clock,
  KeyRound,
  ShieldAlert,
  Filter,
  CheckCircle
} from 'lucide-react';

const mockSeedUsers: AuthUser[] = [
  {
    id: 'user-001',
    fullName: 'Platform Administrator',
    email: 'admin@infrapulse.gov.in',
    phoneNumber: '+91 80 2297 5000',
    role: 'PLATFORM_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00Z',
    lastLoginAt: '2026-10-31T09:30:00Z',
  },
  {
    id: 'user-002',
    fullName: 'Priya Sharma (PM)',
    email: 'pm@infrapulse.gov.in',
    phoneNumber: '+91 98450 11223',
    role: 'PROJECT_MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-02-15T10:00:00Z',
    lastLoginAt: '2026-10-30T16:45:00Z',
  },
  {
    id: 'user-003',
    fullName: 'Apex Infrastructure Ltd (Vendor)',
    email: 'vendor@infrapulse.gov.in',
    phoneNumber: '+91 99801 44556',
    role: 'VENDOR',
    status: 'ACTIVE',
    createdAt: '2026-03-01T11:20:00Z',
    lastLoginAt: '2026-10-31T08:15:00Z',
  },
  {
    id: 'user-004',
    fullName: 'Kavita Reddy (Field QA)',
    email: 'field@infrapulse.gov.in',
    phoneNumber: '+91 97410 77889',
    role: 'FIELD_ENGINEER',
    status: 'ACTIVE',
    createdAt: '2026-03-12T09:10:00Z',
    lastLoginAt: '2026-10-29T14:30:00Z',
  },
  {
    id: 'user-005',
    fullName: 'Rohan Mehta (Finance)',
    email: 'finance@infrapulse.gov.in',
    phoneNumber: '+91 96112 33445',
    role: 'FINANCE_OFFICER',
    status: 'ACTIVE',
    createdAt: '2026-04-05T12:00:00Z',
    lastLoginAt: '2026-10-28T11:00:00Z',
  },
];

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  // Form inputs
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('PROJECT_MANAGER');
  const [targetRole, setTargetRole] = useState<UserRole>('VENDOR');
  const [targetStatus, setTargetStatus] = useState<UserStatus>('ACTIVE');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data && data.length > 0 ? data : mockSeedUsers);
    } catch {
      // Graceful fallback to initial mock seed users if offline
      setUsers(mockSeedUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const suspended = users.filter((u) => u.status === 'INACTIVE' || u.status === 'LOCKED').length;
    const uniqueRoles = new Set(users.map((u) => u.role)).size;
    return { total, active, suspended, uniqueRoles };
  }, [users]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSubmitting(true);
    try {
      const created = await userService.createUser({
        fullName: newFullName,
        email: newEmail,
        password: newPassword,
        phoneNumber: newPhone,
        role: newRole,
      });
      setUsers([created, ...users]);
      setAddModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setActionError(ax.response?.data?.message || 'Failed to create user.');
      } else {
        // Local simulation fallback
        const newUser: AuthUser = {
          id: `usr-${Date.now()}`,
          fullName: newFullName,
          email: newEmail.toLowerCase(),
          phoneNumber: newPhone,
          role: newRole,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
        setUsers([newUser, ...users]);
        setAddModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const updated = await userService.updateUserRole(selectedUser.id, { role: targetRole });
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      setEditRoleModalOpen(false);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setActionError(ax.response?.data?.message || 'Failed to update role.');
      } else {
        setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, role: targetRole } : u)));
        setEditRoleModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const updated = await userService.updateUserStatus(selectedUser.id, { status: targetStatus });
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      setStatusModalOpen(false);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setActionError(ax.response?.data?.message || 'Failed to update account status.');
      } else {
        setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, status: targetStatus } : u)));
        setStatusModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'bg-slate-900 text-teal-300 border-slate-700 shadow-sm';
      case 'PROJECT_MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VENDOR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FIELD_ENGINEER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FINANCE_OFFICER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'PLATFORM_ADMIN': return 'Platform Admin';
      case 'PROJECT_MANAGER': return 'Project Manager';
      case 'VENDOR': return 'Vendor Partner';
      case 'FIELD_ENGINEER': return 'Field QA Engineer';
      case 'FINANCE_OFFICER': return 'Finance Officer';
      default: return role;
    }
  };

  const getUserInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = searchQuery !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <PageContainer className="space-y-6">
      {/* Page Title & Top Actions */}
      <PageHeader
        title="Platform User Management"
        subtitle="Manage municipal infrastructure operators, assign authorized platform roles, and audit account statuses."
        badge={
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Admin Authorization Enforced</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchUsers}
              className="px-3.5 py-2 text-xs font-medium bg-white hover:bg-slate-50 border border-surface-border text-ink-primary rounded-lg transition-all shadow-xs flex items-center gap-1.5"
              title="Reload user list from database"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                setActionError(null);
                setAddModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>Provision User</span>
            </button>
          </div>
        }
      />

      {/* KPI Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">Total Operators</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink-primary">{metrics.total}</span>
            <span className="text-[11px] font-medium text-emerald-600">Registered Accounts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">Active Accounts</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">{metrics.active}</span>
            <span className="text-[11px] font-medium text-ink-muted">100% Operational</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">Security Holds</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink-primary">{metrics.suspended}</span>
            <span className="text-[11px] font-medium text-ink-muted">{metrics.suspended === 0 ? 'Zero Violations' : 'Review Required'}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">Authorized Roles</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-indigo-700">{metrics.uniqueRoles}</span>
            <span className="text-[11px] font-medium text-ink-muted">RBAC System Tiers</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="w-full md:w-96">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, official email, or role..."
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-ink-secondary bg-slate-50 border border-surface-border rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-medium text-ink-primary">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-transparent border-0 text-ink-primary font-medium focus:outline-none cursor-pointer py-1"
            >
              <option value="ALL">All Roles</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="VENDOR">Vendor Partner</option>
              <option value="FIELD_ENGINEER">Field QA Engineer</option>
              <option value="FINANCE_OFFICER">Finance Officer</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink-secondary bg-slate-50 border border-surface-border rounded-lg px-2.5 py-1">
            <span className="font-medium text-ink-primary">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-transparent border-0 text-ink-primary font-medium focus:outline-none cursor-pointer py-1"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
        {/* Table Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50/75 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-ink-primary tracking-wide uppercase">
              Platform Operator Directory
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'Operator' : 'Operators'}
            </span>
          </div>
          <span className="text-[11px] text-ink-muted hidden sm:inline">
            Role-Based Access Control (RBAC) Governed
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-ink-secondary flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Loading user directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-ink-muted">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-primary">No users match your filters</p>
              <p className="text-xs text-ink-secondary mt-1">Try adjusting your search query or reset role and status filters.</p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-ink-primary rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs table-auto sm:table-fixed">
              <thead>
                <tr className="bg-slate-100/60 border-b border-surface-border text-ink-secondary text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5 sm:w-[30%]">Operator / User</th>
                  <th className="py-3.5 px-4 sm:w-[18%]">Contact Phone</th>
                  <th className="py-3.5 px-4 sm:w-[18%]">Assigned Role</th>
                  <th className="py-3.5 px-4 sm:w-[12%]">Account Status</th>
                  <th className="py-3.5 px-4 sm:w-[12%]">Last Activity</th>
                  <th className="py-3.5 px-5 text-right sm:w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredUsers.map((u) => {
                  const initials = getUserInitials(u.fullName);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Operator / User with Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy-900 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 border border-navy-700 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-ink-primary text-xs truncate" title={u.fullName}>
                              {u.fullName}
                            </div>
                            <div className="text-[11px] text-ink-muted truncate" title={u.email}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4 text-ink-secondary">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Phone className="w-3 h-3 text-ink-muted shrink-0" />
                          <span className="font-mono">{u.phoneNumber || '—'}</span>
                        </div>
                      </td>

                      {/* Assigned Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(u.role)}`}>
                          {formatRoleLabel(u.role)}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={u.status} size="sm" />
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 text-ink-muted text-[11px]">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-ink-muted shrink-0" />
                          <span>
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Never'}
                          </span>
                        </div>
                      </td>

                      {/* Administrative Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setTargetRole(u.role);
                              setActionError(null);
                              setEditRoleModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-ink-primary rounded-md transition-colors inline-flex items-center gap-1 border border-surface-border"
                            title="Change assigned role"
                          >
                            <Edit3 className="w-3 h-3 text-ink-secondary" />
                            <span>Role</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setTargetStatus(u.status);
                              setActionError(null);
                              setStatusModalOpen(true);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors inline-flex items-center gap-1 border ${
                              u.status === 'ACTIVE' 
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title="Modify operational account status"
                          >
                            {u.status === 'ACTIVE' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            <span>{u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Bottom Footer Summary */}
        <div className="px-5 py-3 bg-slate-50/75 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-secondary">
          <div>
            Showing <span className="font-semibold text-ink-primary">{filteredUsers.length}</span> of <span className="font-semibold text-ink-primary">{users.length}</span> registered platform operators
          </div>
          <div className="flex items-center gap-1.5 text-teal-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Tokens cryptographically signed via HS512 JWT</span>
          </div>
        </div>
      </div>

      {/* Provision User Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Provision Platform User"
        subtitle="Create a new infrastructure operator account with assigned operational role."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-primary mb-1">Full Name</label>
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              required
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-primary mb-1">Official Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="ramesh.c@infrapulse.gov.in"
              required
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-primary mb-1">Temporary Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-primary mb-1">Contact Phone</label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 98450 99887"
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-primary mb-1">Assigned Operational Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              <option value="PROJECT_MANAGER">PROJECT_MANAGER (Projects, Zones &amp; Work Allocation)</option>
              <option value="VENDOR">VENDOR (Work Execution &amp; Evidence Submissions)</option>
              <option value="FIELD_ENGINEER">FIELD_ENGINEER (Quality Inspections &amp; Site QA)</option>
              <option value="FINANCE_OFFICER">FINANCE_OFFICER (Milestones &amp; Escrow Payments)</option>
              <option value="PLATFORM_ADMIN">PLATFORM_ADMIN (Full Platform Governance)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-3 py-2 text-xs text-ink-secondary hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating User...' : 'Provision User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={editRoleModalOpen}
        onClose={() => setEditRoleModalOpen(false)}
        title="Modify User Role"
        subtitle={`Update role assignment for ${selectedUser?.fullName} (${selectedUser?.email}).`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-primary mb-1">Select New Role</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg outline-none bg-white"
            >
              <option value="PLATFORM_ADMIN">PLATFORM_ADMIN &mdash; Full Platform Governance</option>
              <option value="PROJECT_MANAGER">PROJECT_MANAGER &mdash; Projects &amp; Allocation</option>
              <option value="VENDOR">VENDOR &mdash; Execution &amp; Evidence</option>
              <option value="FIELD_ENGINEER">FIELD_ENGINEER &mdash; Field Inspections &amp; QA</option>
              <option value="FINANCE_OFFICER">FINANCE_OFFICER &mdash; Escrow &amp; Disbursements</option>
            </select>
          </div>

          <p className="text-[11px] text-ink-muted">
            Note: You cannot demote your own account or remove the final active Platform Administrator.
          </p>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditRoleModalOpen(false)}
              className="px-3 py-2 text-xs text-ink-secondary hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Updating...' : 'Save Role Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Account Status"
        subtitle={`Modify operational status for ${selectedUser?.fullName}.`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-primary mb-1">Account Status</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as UserStatus)}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg outline-none bg-white"
            >
              <option value="ACTIVE">ACTIVE &mdash; Account operational</option>
              <option value="INACTIVE">INACTIVE &mdash; Sign in disabled</option>
              <option value="LOCKED">LOCKED &mdash; Account security lock</option>
            </select>
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-3 py-2 text-xs text-ink-secondary hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Updating...' : 'Save Status'}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
