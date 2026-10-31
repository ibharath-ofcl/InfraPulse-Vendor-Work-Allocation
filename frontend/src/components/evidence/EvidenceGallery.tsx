import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  Clock,
  HardHat,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  EvidenceDetail,
  EvidenceCategory,
  EvidenceReviewStatus,
} from '../../types/evidence';
import { evidenceService } from '../../services/evidenceService';
import { EvidencePreviewModal } from './EvidencePreviewModal';

interface EvidenceGalleryProps {
  assignmentId: string;
  refreshKey?: number;
}

const CATEGORY_TABS: { value: EvidenceCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Photos' },
  { value: 'BEFORE_WORK', label: 'Before Work' },
  { value: 'WORK_IN_PROGRESS', label: 'Work in Progress' },
  { value: 'AFTER_WORK', label: 'After Work' },
  { value: 'MATERIAL_EVIDENCE', label: 'Materials' },
  { value: 'SITE_CONDITION', label: 'Site Conditions' },
  { value: 'COMPLETION_EVIDENCE', label: 'Completion' },
  { value: 'SUPPORTING_DOCUMENT', label: 'Documents' },
];

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  assignmentId,
  refreshKey = 0,
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EvidenceCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDetail | null>(null);

  const fetchEvidence = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const catParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const response = await evidenceService.getAssignmentEvidence(assignmentId, catParam, 0, 50);
      setEvidenceList(response.evidence || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load evidence gallery.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, selectedCategory]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence, refreshKey]);

  const filteredEvidence = evidenceList.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.evidenceCode.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.originalFileName.toLowerCase().includes(q) ||
      item.uploadedByName.toLowerCase().includes(q)
    );
  });

  const getCategoryBadgeClass = (category: EvidenceCategory) => {
    switch (category) {
      case 'BEFORE_WORK':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'WORK_IN_PROGRESS':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'AFTER_WORK':
      case 'COMPLETION_EVIDENCE':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'MATERIAL_EVIDENCE':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getReviewBadge = (status: EvidenceReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800/80">
            <XCircle className="w-3 h-3 text-red-400" />
            Rejected
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80">
            <Clock className="w-3 h-3 text-amber-400" />
            Pending Review
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Not Reviewed
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" id="evidence-gallery">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedCategory(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={fetchEvidence}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh gallery"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredEvidence.length === 0 && (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800/80 rounded-xl">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-300">No Evidence Photographs Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {selectedCategory !== 'ALL'
              ? `No photographic evidence uploaded under category "${selectedCategory}".`
              : 'Vendors and field engineers can upload site photographs using the panel above.'}
          </p>
        </div>
      )}

      {/* Evidence Grid */}
      {!loading && filteredEvidence.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredEvidence.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedEvidence(item)}
              className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-xl overflow-hidden shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
              id={`evidence-card-${item.evidenceCode}`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={item.previewUrl}
                  alt={item.originalFileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to direct file download url if preview not generated yet
                    (e.target as HTMLImageElement).src = item.fileDownloadUrl;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

                {/* Category Badge top-left */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border shadow-sm ${getCategoryBadgeClass(
                      item.evidenceCategory
                    )}`}
                  >
                    {item.evidenceCategoryDisplayName || item.evidenceCategory}
                  </span>
                </div>

                {/* Review status top-right */}
                <div className="absolute top-2 right-2">
                  {getReviewBadge(item.reviewStatus)}
                </div>

                {/* View Overlay Hover */}
                <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-lg">
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Evidence
                  </span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-indigo-400">{item.evidenceCode}</span>
                    <span className="text-[11px] text-slate-400">{item.fileSizeFormatted}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 truncate">
                      <HardHat className="w-3 h-3 text-slate-500" />
                      {item.uploadedByName}
                    </span>
                    <span className="font-mono text-slate-500">
                      {item.imageWidth && item.imageHeight ? `${item.imageWidth}×${item.imageHeight}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      SHA-256
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence Full Preview / Review Modal */}
      {selectedEvidence && (
        <EvidencePreviewModal
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
          onEvidenceUpdated={(updated) => {
            setSelectedEvidence(updated);
            setEvidenceList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          }}
        />
      )}
    </div>
  );
};
