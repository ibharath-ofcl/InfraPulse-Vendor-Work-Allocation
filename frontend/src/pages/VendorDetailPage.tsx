import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  History, 
  RefreshCw, 
  AlertCircle, 
  Edit, 
  FolderKanban,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { vendorService } from '../services/vendorService';
import { useAuth } from '../auth/useAuth';
import { 
  VendorDetailResponse, 
  VendorStatus, 
  ServiceCategory, 
  UpdateVendorPayload 
} from '../types/vendor';

const ALL_CATEGORIES: ServiceCategory[] = [
  'TRENCHING',
  'UNDERGROUND_CABLE_INSTALLATION',
  'BACKFILLING',
  'ROAD_RESURFACING',
  'FINAL_INSPECTION',
  'OTHER',
];

export const VendorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vendor, setVendor] = useState<VendorDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<VendorStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateVendorPayload>({
    companyName: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    addressLine: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    gstNumber: '',
    registrationNumber: '',
    serviceCategories: [],
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchVendorDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await vendorService.getVendorById(id);
      setVendor(data);
      setEditForm({
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phoneNumber: data.phoneNumber,
        alternatePhone: data.alternatePhone || '',
        addressLine: data.addressLine || '',
        city: data.city || '',
        district: data.district || '',
        state: data.state || '',
        pincode: data.pincode,
        gstNumber: data.gstNumber || '',
        registrationNumber: data.registrationNumber || '',
        serviceCategories: data.serviceCategories,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve vendor profile';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVendorDetails();
  }, [fetchVendorDetails]);

  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const isOwnVendor = user?.role === 'VENDOR' && vendor?.userId === user?.id;
  const canEdit = isAdmin || isOwnVendor;

  const handleOpenStatusModal = (status: VendorStatus) => {
    setTargetStatus(status);
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setStatusSubmitting(true);
      await vendorService.updateVendorStatus(id, {
        status: targetStatus,
        reason: statusReason,
      });
      setIsStatusModalOpen(false);
      setStatusReason('');
      await fetchVendorDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to change vendor status');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setEditSubmitting(true);
      await vendorService.updateVendor(id, editForm);
      setIsEditModalOpen(false);
      await fetchVendorDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update vendor');
    } finally {
      setEditSubmitting(false);
    }
  };

  const toggleCategory = (cat: ServiceCategory) => {
    setEditForm((prev) => {
      const exists = prev.serviceCategories.includes(cat);
      if (exists) {
        return { ...prev, serviceCategories: prev.serviceCategories.filter((c) => c !== cat) };
      } else {
        return { ...prev, serviceCategories: [...prev.serviceCategories, cat] };
      }
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
          <p className="text-sm font-medium">Loading vendor dossier...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !vendor) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto mt-10">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-red-900 mb-1">Access Restricted</h2>
          <p className="text-xs text-red-700 mb-4">{error || 'Vendor record not accessible under current session privileges.'}</p>
          <button
            onClick={() => navigate('/vendors')}
            className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800"
          >
            Return to Vendors
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Top Breadcrumb */}
      <div className="mb-4">
        <Link 
          to="/vendors" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Certified Contractors</span>
        </Link>
      </div>

      <PageHeader
        title={vendor.companyName}
        subtitle={`Empanelled Infrastructure Contractor • Registered ${new Date(vendor.createdAt).toLocaleDateString()}`}
        badge={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-teal-50 text-teal-800 rounded-md border border-teal-200">
              {vendor.vendorCode}
            </span>
            <StatusBadge status={vendor.status} size="sm" />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-ink-primary rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Edit className="w-3.5 h-3.5 text-ink-muted" />
                <span>Edit Profile</span>
              </button>
            )}

            {isAdmin && vendor.status === 'PENDING_VERIFICATION' && (
              <button
                onClick={() => handleOpenStatusModal('ACTIVE')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Activate</span>
              </button>
            )}

            {isAdmin && vendor.status === 'ACTIVE' && (
              <button
                onClick={() => handleOpenStatusModal('SUSPENDED')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-all shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspend Vendor</span>
              </button>
            )}

            {isAdmin && vendor.status === 'SUSPENDED' && (
              <button
                onClick={() => handleOpenStatusModal('ACTIVE')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Re-activate Vendor</span>
              </button>
            )}
          </div>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Profile & Associated Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Dossier Card */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-sm font-bold text-ink-primary mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Corporate & Registration Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Primary Representative</span>
                <span className="font-bold text-ink-primary mt-0.5 block">{vendor.contactPerson}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Business Email</span>
                <span className="font-semibold text-ink-primary mt-0.5 block">{vendor.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Contact Phone</span>
                <span className="font-semibold text-ink-primary mt-0.5 block">
                  {vendor.phoneNumber} {vendor.alternatePhone && `• Alt: ${vendor.alternatePhone}`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Business PIN Code</span>
                <span className="font-mono font-bold text-teal-700 mt-0.5 block">{vendor.pincode}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">GST Identification</span>
                <span className="font-mono font-semibold text-ink-primary mt-0.5 block">
                  {vendor.gstNumber || 'Not provided'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-ink-muted block text-[11px]">Registration / CIN</span>
                <span className="font-mono font-semibold text-ink-primary mt-0.5 block">
                  {vendor.registrationNumber || 'Not provided'}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs">
              <span className="text-ink-muted block text-[11px]">Registered Business Address</span>
              <span className="font-medium text-ink-primary mt-0.5 block">
                {[vendor.addressLine, vendor.city, vendor.district, vendor.state].filter(Boolean).join(', ')} - {vendor.pincode}
              </span>
            </div>

            {/* Service Capabilities */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-ink-primary block mb-2">Qualified Service Categories</span>
              <div className="flex flex-wrap gap-1.5">
                {vendor.serviceCategories.map((cat) => (
                  <span 
                    key={cat}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200"
                  >
                    {cat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Associated Projects Card */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-sm font-bold text-ink-primary mb-3 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-teal-600" />
              <span>Active Project Associations ({vendor.associatedProjects.length})</span>
            </h3>

            {vendor.associatedProjects.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                <FolderKanban className="w-8 h-8 text-ink-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-ink-primary">No Active Project Associations</p>
                <p className="text-[11px] text-ink-muted mt-0.5">This contractor is not currently associated with any infrastructure corridor.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {vendor.associatedProjects.map((proj) => (
                  <div key={proj.associationId} className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/projects/${proj.projectId}`}
                          className="font-bold text-sm text-ink-primary hover:text-teal-600 transition-colors"
                        >
                          {proj.projectName}
                        </Link>
                        <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {proj.projectCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          proj.associationStatus === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {proj.associationStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Region: {proj.region}, {proj.state} • Schedule: {proj.startDate} → {proj.targetEndDate}
                      </p>
                      {proj.notes && (
                        <p className="text-[11px] text-ink-secondary italic mt-1">"{proj.notes}"</p>
                      )}
                    </div>

                    <Link
                      to={`/projects/${proj.projectId}`}
                      className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      View Corridor
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Performance Notice & Audit Trail */}
        <div className="space-y-6">
          {/* Performance Summary Placeholder */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-sm font-bold text-ink-primary mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Performance Analytics</span>
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Verification Tier</span>
                <span className="font-bold text-ink-primary">{vendor.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Corridors Assigned</span>
                <span className="font-bold text-ink-primary">{vendor.activeProjectsCount}</span>
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed pt-2 border-t border-slate-200">
                Detailed on-time completion scores, photographic inspection reviews, and quality ratings will calculate dynamically upon execution of physical work assignments in <strong className="text-teal-700">Stage 5 & Stage 6</strong>.
              </p>
            </div>
          </div>

          {/* Audit History Trail */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-sm font-bold text-ink-primary mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <span>Audit Trail ({vendor.auditTrail.length})</span>
            </h3>

            {vendor.auditTrail.length === 0 ? (
              <p className="text-xs text-ink-muted">No audit entries recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {vendor.auditTrail.map((event) => (
                  <div key={event.id} className="text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-teal-800">{event.eventType}</span>
                      <span className="text-ink-muted">{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-ink-primary font-medium mt-1 text-[11px]">{event.summary}</p>
                    {event.reason && (
                      <p className="text-ink-muted italic text-[10px] mt-0.5">Reason: {event.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Status Change */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Vendor Status"
        subtitle={`Target State: ${targetStatus}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-3 text-xs">
          <p className="text-ink-secondary">
            Transitioning vendor <strong>{vendor.companyName}</strong> ({vendor.vendorCode}) to <strong>{targetStatus}</strong>.
          </p>
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Reason / Justification</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="e.g. Documentation verified and technical credentials approved."
              rows={3}
              required
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={statusSubmitting}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {statusSubmitting ? 'Updating...' : `Confirm ${targetStatus}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Vendor Profile */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Vendor Dossier"
        subtitle={`Updating ${vendor.vendorCode}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {isAdmin && (
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Company Name</label>
              <input
                type="text"
                value={editForm.companyName}
                onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Contact Officer</label>
              <input
                type="text"
                value={editForm.contactPerson}
                onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Email Address</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Phone Number</label>
              <input
                type="text"
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Alternate Phone</label>
              <input
                type="text"
                value={editForm.alternatePhone}
                onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Business Address</label>
            <input
              type="text"
              value={editForm.addressLine}
              onChange={(e) => setEditForm({ ...editForm, addressLine: e.target.value })}
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">City</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">District</label>
              <input
                type="text"
                value={editForm.district}
                onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">PIN Code</label>
              <input
                type="text"
                value={editForm.pincode}
                onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                pattern="^[1-9][0-9]{5}$"
                required
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">GST Number</label>
                <input
                  type="text"
                  value={editForm.gstNumber}
                  onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Registration No</label>
                <input
                  type="text"
                  value={editForm.registrationNumber}
                  onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg"
                />
              </div>
            </div>
          )}

          {isAdmin && (
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Service Categories</label>
              <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                {ALL_CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={editForm.serviceCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>{cat.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {editSubmitting ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
