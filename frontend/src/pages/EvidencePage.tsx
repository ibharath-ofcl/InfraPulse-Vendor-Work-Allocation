import React, { useState } from 'react';
import { 
  MapPin, 
  Eye
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { mockEvidenceItems } from '../data/mockEvidence';
import { EvidenceItem } from '../types';

export const EvidencePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activePreview, setActivePreview] = useState<EvidenceItem | null>(null);

  const filterOptions = [
    { label: 'All Evidence', value: 'ALL', count: mockEvidenceItems.length },
    { label: 'Verified', value: 'VERIFIED', count: mockEvidenceItems.filter(e => e.verificationStatus === 'VERIFIED').length },
    { label: 'Flagged by AI', value: 'FLAGGED', count: mockEvidenceItems.filter(e => e.verificationStatus === 'FLAGGED').length },
    { label: 'Rejected', value: 'REJECTED', count: mockEvidenceItems.filter(e => e.verificationStatus === 'REJECTED').length },
  ];

  const filteredEvidence = mockEvidenceItems.filter((e) => {
    const matchesSearch = 
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.assignmentId.toLowerCase().includes(search.toLowerCase()) ||
      e.workZoneName.toLowerCase().includes(search.toLowerCase()) ||
      e.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      e.pinCode.includes(search);

    const matchesStatus = statusFilter === 'ALL' || e.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Photographic Evidence Vault"
        subtitle="Geotagged field photography submitted by contractors for automated computer vision quality inspection."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {mockEvidenceItems.length} Verified Media Files
          </span>
        }
      />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <FilterBar
          options={filterOptions}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by photo ID, PIN, vendor, work zone..."
          className="w-full sm:w-80"
        />
      </div>

      {/* Evidence Media Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvidence.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-surface-border shadow-card hover:shadow-card-hover overflow-hidden transition-all flex flex-col justify-between group"
          >
            {/* Image Thumbnail with Overlay */}
            <div className="relative h-48 bg-navy-950 overflow-hidden cursor-pointer" onClick={() => setActivePreview(item)}>
              <img
                src={item.imageUrl}
                alt={item.evidenceType}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute top-3 left-3">
                <StatusBadge status={item.verificationStatus} size="sm" />
              </div>
              <div className="absolute top-3 right-3 bg-navy-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-teal-400 border border-navy-800">
                {item.fileSize}
              </div>
              <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-lg bg-white/90 text-ink-primary font-bold text-xs flex items-center gap-1.5 shadow-md">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span>Inspect Media</span>
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    {item.id}
                  </span>
                  <span className="text-ink-muted text-[11px]">{item.submissionDate}</span>
                </div>

                <h4 className="font-bold text-sm text-ink-primary mt-1">
                  {item.workZoneName}
                </h4>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Package: <strong className="text-ink-primary font-mono">{item.assignmentId}</strong> • Vendor: <strong>{item.vendorName}</strong>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>PIN {item.pinCode}</span>
                </span>
                <button
                  onClick={() => setActivePreview(item)}
                  className="text-teal-600 font-semibold hover:text-teal-700"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Inspection Modal */}
      {activePreview && (
        <Modal
          isOpen={!!activePreview}
          onClose={() => setActivePreview(null)}
          title={`Evidence Inspection: ${activePreview.id}`}
          subtitle={`Submitted for Package ${activePreview.assignmentId} by ${activePreview.vendorName}`}
          maxWidth="2xl"
          footer={
            <div className="flex justify-between w-full items-center">
              <span className="text-xs text-ink-muted">
                EXIF GPS: {activePreview.coordinates.lat}° N, {activePreview.coordinates.lng}° E
              </span>
              <button
                onClick={() => setActivePreview(null)}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800"
              >
                Done
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-black">
              <img
                src={activePreview.imageUrl}
                alt="Full Evidence"
                className="w-full max-h-[380px] object-contain mx-auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
              <div>
                <p className="text-ink-muted">Stage Category</p>
                <p className="font-bold text-ink-primary">{activePreview.evidenceType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-ink-muted">Verification Status</p>
                <StatusBadge status={activePreview.verificationStatus} size="sm" />
              </div>
              <div>
                <p className="text-ink-muted">Location Geotag</p>
                <p className="font-mono text-ink-primary">
                  {activePreview.coordinates.lat}, {activePreview.coordinates.lng} (Verified in {activePreview.pinCode})
                </p>
              </div>
              <div>
                <p className="text-ink-muted">File Size & Integrity</p>
                <p className="font-mono text-ink-primary">{activePreview.fileSize} • SHA-256 Validated</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
