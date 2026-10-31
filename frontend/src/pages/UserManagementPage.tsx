import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { userService } from '../services/userService';
import { AuthUser, UserRole, UserStatus } from '../types';
import { 
  UserPlus, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  AlertTriangle,
  RotateCcw,
  Users
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
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

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
        return 'bg-navy-900 text-teal-300 border-navy-700';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform User Management"
        subtitle="Manage municipal infrastructure operators, assign authorized platform roles, and audit account statuses."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Admin Authorization Enforced</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="px-3 py-2 text-xs font-medium bg-white hover:bg-slate-50 border border-surface-border text-ink-primary rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                setActionError(null);
                setAddModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-medium bg-navy-900 hover:bg-navy-800 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>Provision User</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search user name or official email..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-surface-border rounded-lg px-2.5 py-1.5 text-ink-primary focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="VENDOR">Vendor</option>
              <option value="FIELD_ENGINEER">Field Engineer</option>
              <option value="FINANCE_OFFICER">Finance Officer</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-surface-border rounded-lg px-2.5 py-1.5 text-ink-primary focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ink-secondary flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading user directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-ink-muted mx-auto" />
            <p className="text-xs font-semibold text-ink-primary">No users match your filters</p>
            <p className="text-[11px] text-ink-secondary">Try adjusting your search query or reset status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-surface-border text-ink-secondary font-semibold">
                  <th className="py-3 px-4">Operator / User</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink-primary">{u.fullName}</div>
                      <div className="text-[11px] text-ink-muted">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 text-ink-secondary">
                      {u.phoneNumber || '&mdash;'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-4 text-ink-muted text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setTargetRole(u.role);
                          setActionError(null);
                          setEditRoleModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-ink-primary rounded transition-colors inline-flex items-center gap-1"
                        title="Change user role"
                      >
                        <Edit3 className="w-3 h-3 text-ink-muted" />
                        <span>Role</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setTargetStatus(u.status);
                          setActionError(null);
                          setStatusModalOpen(true);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors inline-flex items-center gap-1 ${
                          u.status === 'ACTIVE' 
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                        title="Modify account status"
                      >
                        {u.status === 'ACTIVE' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        <span>{u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
              className="px-3 py-2 text-xs text-ink-secondary hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
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
              <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
              <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
              <option value="VENDOR">VENDOR</option>
              <option value="FIELD_ENGINEER">FIELD_ENGINEER</option>
              <option value="FINANCE_OFFICER">FINANCE_OFFICER</option>
            </select>
          </div>

          <p className="text-[11px] text-ink-muted">
            Note: You cannot demote your own account or remove the final active Platform Administrator.
          </p>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditRoleModalOpen(false)}
              className="px-3 py-2 text-xs text-ink-secondary hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium disabled:opacity-50"
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
              className="px-3 py-2 text-xs text-ink-secondary hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
