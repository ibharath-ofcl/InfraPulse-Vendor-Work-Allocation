import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  RefreshCw, 
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { vendorService } from '../services/vendorService';
import { useAuth } from '../auth/useAuth';
import { 
  VendorResponse, 
  ServiceCategory, 
  CreateVendorPayload 
} from '../types/vendor';

const ALL_CATEGORIES: ServiceCategory[] = [
  'TRENCHING',
  'UNDERGROUND_CABLE_INSTALLATION',
  'BACKFILLING',
  'ROAD_RESURFACING',
  'FINAL_INSPECTION',
  'OTHER',
];

export const VendorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Register Vendor Modal
  const [registerModal, setRegisterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [createForm, setCreateForm] = useState<CreateVendorPayload>({
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
    serviceCategories: ['TRENCHING'],
  });

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vendorService.getVendors({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        page,
        size: pageSize,
      });
      setVendors(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve vendor records';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const canCreate = user?.role === 'PLATFORM_ADMIN' || hasPermission('VENDOR_CREATE');

  const handleOpenRegisterModal = () => {
    setRegisterModal(true);
    setFormErrors({});
    setCreateForm({
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
      serviceCategories: ['TRENCHING'],
    });
  };

  const toggleCategory = (cat: ServiceCategory) => {
    setCreateForm((prev) => {
      const exists = prev.serviceCategories.includes(cat);
      if (exists) {
        return { ...prev, serviceCategories: prev.serviceCategories.filter((c) => c !== cat) };
      } else {
        return { ...prev, serviceCategories: [...prev.serviceCategories, cat] };
      }
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createForm.companyName.trim()) errors.companyName = 'Company name is required';
    if (!createForm.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      errors.email = 'Valid email is required';
    }
    if (!createForm.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (!/^[1-9][0-9]{5}$/.test(createForm.pincode.trim())) {
      errors.pincode = 'PIN code must be a valid 6-digit postal code';
    }
    if (createForm.serviceCategories.length === 0) {
      errors.serviceCategories = 'Select at least one qualified service category';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await vendorService.createVendor({
        ...createForm,
        companyName: createForm.companyName.trim(),
        contactPerson: createForm.contactPerson.trim(),
        email: createForm.email.trim().toLowerCase(),
        phoneNumber: createForm.phoneNumber.trim(),
        pincode: createForm.pincode.trim(),
      });
      setRegisterModal(false);
      setPage(0);
      await fetchVendors();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to register vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const filterOptions = [
    { label: 'All Contractors', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending Verification', value: 'PENDING_VERIFICATION' },
    { label: 'Suspended', value: 'SUSPENDED' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Contractor & Vendor Management"
        subtitle="Empanelled infrastructure contractors, service capabilities, active corridor participation, and compliance certifications."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            {totalElements} Contractors Empanelled
          </span>
        }
        actions={
          canCreate ? (
            <button
              onClick={handleOpenRegisterModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              <span>Register Vendor</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <FilterBar
          options={filterOptions}
          selected={statusFilter}
          onSelect={(val) => { setStatusFilter(val); setPage(0); }}
        />

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
            className="w-full sm:w-48 px-3 py-1.5 text-xs bg-white border border-surface-border rounded-lg text-ink-primary"
          >
            <option value="ALL">All Capabilities</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <SearchInput
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
            placeholder="Search vendor, contact, code..."
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Loading, Error, and Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
          <RefreshCw className="w-7 h-7 animate-spin text-teal-600 mb-2" />
          <p className="text-xs font-medium">Fetching contractor registry...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-red-900 mb-1">Failed to Load Contractors</p>
          <p className="text-xs text-red-700 mb-3">{error}</p>
          <button
            onClick={() => fetchVendors()}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Contractors Found"
          description="Try broadening your search query or selecting a different status filter."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); setPage(0); }}
              className="px-3.5 py-1.5 bg-slate-100 text-xs font-semibold rounded-lg hover:bg-slate-200"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <>
          {/* Vendor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                onClick={() => navigate(`/vendors/${vendor.id}`)}
                className="bg-white rounded-xl p-5 border border-surface-border shadow-card hover:shadow-card-hover hover:border-teal-500/30 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {vendor.vendorCode}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          Registered {new Date(vendor.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-ink-primary mt-1 group-hover:text-teal-600 transition-colors">
                        {vendor.companyName}
                      </h3>
                    </div>
                    <StatusBadge status={vendor.status} size="sm" />
                  </div>

                  <div className="text-xs text-ink-secondary space-y-1.5 mt-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-ink-muted" />
                      <span>Contact: <strong>{vendor.contactPerson}</strong></span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-ink-muted" />
                        <span>{vendor.email}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-ink-muted" />
                        <span>{vendor.phoneNumber}</span>
                      </span>
                    </div>
                    {vendor.city && (
                      <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                        <MapPin className="w-3 h-3 text-ink-muted" />
                        <span>{[vendor.city, vendor.state].filter(Boolean).join(', ')} (PIN {vendor.pincode})</span>
                      </div>
                    )}
                  </div>

                  {/* Service Categories Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {vendor.serviceCategories.map((cat) => (
                      <span 
                        key={cat}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {cat.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-ink-secondary">
                  <span className="text-[11px]">
                    Active Corridors: <strong>{vendor.activeProjectsCount}</strong>
                  </span>
                  <span className="text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs">
                    Inspect Dossier <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-surface-border text-xs text-ink-secondary">
              <span>
                Showing <strong>{page * pageSize + 1}</strong> to{' '}
                <strong>{Math.min((page + 1) * pageSize, totalElements)}</strong> of{' '}
                <strong>{totalElements}</strong> contractors
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-2.5 py-1.5 border border-surface-border rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="px-2 font-medium">Page {page + 1} of {totalPages}</span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1.5 border border-surface-border rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Register Vendor Modal */}
      <Modal
        isOpen={registerModal}
        onClose={() => setRegisterModal(false)}
        title="Register Infrastructure Contractor"
        subtitle="Newly registered vendors enter PENDING_VERIFICATION until administrative certification."
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Company / Entity Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Apex Infrastructure Services Pvt Ltd"
              value={createForm.companyName}
              onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${formErrors.companyName ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
            />
            {formErrors.companyName && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.companyName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Primary Representative *</label>
              <input 
                type="text" 
                placeholder="e.g. Rajesh Kumar"
                value={createForm.contactPerson}
                onChange={(e) => setCreateForm({ ...createForm, contactPerson: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.contactPerson ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.contactPerson && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.contactPerson}</p>}
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Official Email *</label>
              <input 
                type="email" 
                placeholder="e.g. contact@apexinfra.example"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.email && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Phone Number *</label>
              <input 
                type="text" 
                placeholder="e.g. +91 98765 43210"
                value={createForm.phoneNumber}
                onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.phoneNumber && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.phoneNumber}</p>}
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Alternate Phone</label>
              <input 
                type="text" 
                placeholder="e.g. +91 98765 43219"
                value={createForm.alternatePhone}
                onChange={(e) => setCreateForm({ ...createForm, alternatePhone: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Business Address</label>
            <input 
              type="text" 
              placeholder="e.g. Plot 14, Guindy Industrial Estate"
              value={createForm.addressLine}
              onChange={(e) => setCreateForm({ ...createForm, addressLine: e.target.value })}
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">City</label>
              <input 
                type="text" 
                placeholder="e.g. Chennai"
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">District</label>
              <input 
                type="text" 
                placeholder="e.g. Chennai"
                value={createForm.district}
                onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">PIN Code (6 digits) *</label>
              <input 
                type="text" 
                placeholder="e.g. 600032"
                maxLength={6}
                value={createForm.pincode}
                onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg font-mono ${formErrors.pincode ? 'border-red-500 bg-red-50' : 'border-surface-border'}`}
              />
              {formErrors.pincode && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.pincode}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">State</label>
              <input 
                type="text" 
                placeholder="e.g. Tamil Nadu"
                value={createForm.state}
                onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">GST Number (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 33AAAAA0000A1Z5"
                value={createForm.gstNumber}
                onChange={(e) => setCreateForm({ ...createForm, gstNumber: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Qualified Service Capabilities *</label>
            <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              {ALL_CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={createForm.serviceCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>{cat.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
            {formErrors.serviceCategories && (
              <p className="text-[11px] text-red-600 mt-0.5">{formErrors.serviceCategories}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setRegisterModal(false)}
              className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Contractor'}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
