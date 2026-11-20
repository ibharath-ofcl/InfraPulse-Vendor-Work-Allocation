import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Check, 
  X, 
  Sparkles,
  Search,
  Layers,
  Camera,
  Activity,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  getAllMergedInspections, 
  updateStoredInspection, 
  getInspectionAnnotations, 
  CIVIL_FALLBACK_SVGS 
} from '../data/mockInspections';
import { updateMilestoneInspectionGate } from '../data/mockMilestones';
import { QualityInspection, InspectionStatus, InspectionChecklist } from '../types';

export const QualityInspectionPage: React.FC = () => {
  const [inspections, setInspections] = useState<QualityInspection[]>(() => getAllMergedInspections());
  const [selectedId, setSelectedId] = useState<string>(() => {
    const list = getAllMergedInspections();
    return list[0]?.id || 'INS-2026-881';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REVIEW_REQUIRED' | 'PASS' | 'FAIL'>('ALL');
  const [viewMode, setViewMode] = useState<'ANNOTATED' | 'HEATMAP' | 'OPTICAL'>('ANNOTATED');
  const [humanActionNotice, setHumanActionNotice] = useState<{
    type: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
    message: string;
    detail?: string;
  } | null>(null);

  // Sync state whenever inspections change or external events trigger
  useEffect(() => {
    const handleUpdate = () => {
      const merged = getAllMergedInspections();
      setInspections(merged);
    };

    window.addEventListener('infrapulse_inspection_updated', handleUpdate);
    window.addEventListener('infrapulse_evidence_updated', handleUpdate);
    return () => {
      window.removeEventListener('infrapulse_inspection_updated', handleUpdate);
      window.removeEventListener('infrapulse_evidence_updated', handleUpdate);
    };
  }, []);

  const selectedInspection = useMemo(() => {
    return inspections.find(i => i.id === selectedId) || inspections[0];
  }, [inspections, selectedId]);

  const [inspectorNotes, setInspectorNotes] = useState(selectedInspection?.inspectorNotes || '');
  const [checklistState, setChecklistState] = useState<InspectionChecklist[]>(selectedInspection?.checklist || []);

  // Update local form state when switching selected inspection
  useEffect(() => {
    if (selectedInspection) {
      setInspectorNotes(selectedInspection.inspectorNotes || '');
      setChecklistState(selectedInspection.checklist || []);
    }
  }, [selectedInspection?.id]);

  // Checklist toggle handler
  const handleToggleChecklist = (index: number) => {
    const updated = checklistState.map((item, idx) => 
      idx === index ? { ...item, passed: !item.passed } : item
    );
    setChecklistState(updated);
    
    // Auto-persist checklist update
    if (selectedInspection) {
      const updatedInspection: QualityInspection = {
        ...selectedInspection,
        checklist: updated,
      };
      updateStoredInspection(updatedInspection);
      setInspections(prev => prev.map(i => i.id === selectedInspection.id ? updatedInspection : i));
    }
  };

  // Authoritative action handler: PASS, FAIL, or REVIEW_REQUIRED
  const handleUpdateStatus = (newStatus: InspectionStatus) => {
    if (!selectedInspection) return;

    const updatedInspection: QualityInspection = {
      ...selectedInspection,
      status: newStatus,
      inspectorNotes,
      checklist: checklistState,
      humanReviewer: 'Platform Lead (Authorized Auditor)',
    };

    // 1. Update inspection in persistent storage
    updateStoredInspection(updatedInspection);
    setInspections(prev => prev.map(i => i.id === selectedInspection.id ? updatedInspection : i));

    // 2. Replicate to Financial Milestones (Stage 14)
    if (newStatus === 'PASS') {
      updateMilestoneInspectionGate(selectedInspection.workZoneName, 'PASSED');
      setHumanActionNotice({
        type: 'PASS',
        message: `Milestone Gate Released: Certified ${selectedInspection.workType} as COMPLIANT.`,
        detail: `Financial payment milestone for ${selectedInspection.vendorName} on "${selectedInspection.workZoneName}" has been unlocked for disbursement.`,
      });
    } else if (newStatus === 'FAIL') {
      updateMilestoneInspectionGate(selectedInspection.workZoneName, 'FAILED');
      // Create Corrective Action item in localStorage
      try {
        const caItem = {
          id: `ca-${selectedInspection.id.toLowerCase()}`,
          actionCode: `CA-2026-${selectedInspection.id.replace('INS-', '')}`,
          workZoneName: selectedInspection.workZoneName,
          vendorName: selectedInspection.vendorName,
          workType: selectedInspection.workType,
          status: 'OPEN',
          severity: 'HIGH',
          problemDescription: `Quality inspection rejection: ${inspectorNotes || 'Engineering defects detected by AI computer vision & human audit.'}`,
          createdAt: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem('infrapulse_corrective_actions') || '[]');
        localStorage.setItem('infrapulse_corrective_actions', JSON.stringify([caItem, ...existing.filter((e: any) => e.id !== caItem.id)]));
        window.dispatchEvent(new CustomEvent('infrapulse_corrective_actions_updated', { detail: caItem }));
      } catch (e) {
        console.error('Failed to log corrective action:', e);
      }

      setHumanActionNotice({
        type: 'FAIL',
        message: `Rework Order Issued: ${selectedInspection.workType} marked as DEFECTIVE.`,
        detail: `Milestone payment blocked. Corrective Action ticket CA-2026-${selectedInspection.id.replace('INS-', '')} has been logged and dispatched to ${selectedInspection.vendorName}.`,
      });
    } else {
      updateMilestoneInspectionGate(selectedInspection.workZoneName, 'PENDING');
      setHumanActionNotice({
        type: 'REVIEW_REQUIRED',
        message: `Laboratory Escalation: Work held for physical test verification.`,
        detail: `Material core sample test order dispatched for ${selectedInspection.workZoneName}.`,
      });
    }

    setTimeout(() => {
      setHumanActionNotice(null);
    }, 6000);
  };

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((ins) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        ins.id.toLowerCase().includes(q) ||
        ins.workZoneName.toLowerCase().includes(q) ||
        ins.vendorName.toLowerCase().includes(q) ||
        ins.pinCode.includes(q) ||
        ins.workType.toLowerCase().includes(q);

      const matchesStatus = 
        statusFilter === 'ALL' ||
        ins.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inspections, searchQuery, statusFilter]);

  const flaggedCount = inspections.filter(i => i.status === 'REVIEW_REQUIRED').length;
  const passedCount = inspections.filter(i => i.status === 'PASS').length;
  const failedCount = inspections.filter(i => i.status === 'FAIL').length;

  const annotations = selectedInspection ? getInspectionAnnotations(selectedInspection) : [];

  // Calculate dynamic compliance percentage
  const totalChecks = checklistState.length || 1;
  const compliantChecks = checklistState.filter(c => c.passed).length;
  const complianceScore = Math.round((compliantChecks / totalChecks) * 100);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="AI Visual Quality Assurance & Inspection Queue"
        subtitle="Computer vision quality verification of field evidence with human-in-the-loop audit oversight."
        badge={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              {flaggedCount} Flagged for Review
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {passedCount} Compliant
            </span>
          </div>
        }
      />

      {/* Authoritative Live AI Operations Telemetry Bar */}
      <div className="mb-6 p-3.5 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 border border-teal-500/30 rounded-xl text-xs text-slate-200 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 relative" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono font-bold text-teal-300">
                <span>AI Vision Engine v2.4 Active</span>
                <span className="text-[10px] bg-teal-950/80 text-teal-300 px-1.5 py-0.2 rounded border border-teal-700/50">LIVE INFERENCE</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Multi-Model Ensemble: <strong>YOLOv8-Civil</strong> (Structural Detection) + <strong>Depth-Anything-V2</strong> (Monocular Disparity) + <strong>ResNet-50</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>Latency: <strong>138ms</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tamper Check: <strong className="text-emerald-400">MATCH (SHA-256)</strong></span>
            </div>
            <button
              onClick={() => {
                const refreshed = getAllMergedInspections();
                setInspections(refreshed);
              }}
              title="Resync with latest Mobile Field Capture uploads"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync Vault ({inspections.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Human Action Confirmation Alert */}
      {humanActionNotice && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
          humanActionNotice.type === 'PASS' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : humanActionNotice.type === 'FAIL'
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          {humanActionNotice.type === 'PASS' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : humanActionNotice.type === 'FAIL' ? (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-sm">{humanActionNotice.message}</h4>
            {humanActionNotice.detail && (
              <p className="text-xs mt-1 text-slate-700">{humanActionNotice.detail}</p>
            )}
          </div>
          <button 
            onClick={() => setHumanActionNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Queue on Left, Detailed Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Inspection Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            {/* Header and Search */}
            <div className="pb-3 border-b border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-ink-primary">
                    Inspection Queue ({inspections.length})
                  </h3>
                  <p className="text-xs text-ink-secondary">Select evidence packet to audit</p>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                  {filteredInspections.length} Shown
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ID, zone, PIN, vendor, work..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-teal-500 outline-none transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto text-[11px]">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-navy-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({inspections.length})
                </button>
                <button
                  onClick={() => setStatusFilter('REVIEW_REQUIRED')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'REVIEW_REQUIRED'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Review ({flaggedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('PASS')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'PASS'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Pass ({passedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('FAIL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'FAIL'
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Fail ({failedCount})
                </button>
              </div>
            </div>

            {/* List of Inspection Packets */}
            <div className="space-y-2 mt-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredInspections.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <p>No inspection evidence packets match current search criteria.</p>
                </div>
              ) : (
                filteredInspections.map((ins) => {
                  const isSelected = ins.id === selectedInspection?.id;
                  const passedCheckCount = ins.checklist?.filter(c => c.passed).length || 0;
                  const totalCheckCount = ins.checklist?.length || 1;
                  const pct = Math.round((passedCheckCount / totalCheckCount) * 100);

                  return (
                    <div
                      key={ins.id}
                      onClick={() => setSelectedId(ins.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-50 border-teal-500 shadow-md ring-1 ring-teal-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {ins.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ins.submissionTimestamp.split(' ')[0]}
                          </span>
                        </div>
                        <StatusBadge status={ins.status} size="sm" />
                      </div>

                      <h4 className="text-xs font-bold text-ink-primary line-clamp-1">
                        {ins.workZoneName}
                      </h4>

                      <div className="text-[11px] text-ink-secondary space-y-1 mt-2">
                        <div className="flex items-center justify-between">
                          <span>Work: <strong className="text-slate-800">{ins.workType}</strong></span>
                          <span className="text-ink-muted font-mono">PIN: {ins.pinCode}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
                          <span className="truncate max-w-[170px] text-ink-primary font-medium">{ins.vendorName}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-slate-500">
                              {pct}% QA
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              ins.reviewPriority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                              ins.reviewPriority === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {ins.reviewPriority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Detailed Evidence Inspection Dossier */}
        <div className="lg:col-span-7 space-y-5">
          {selectedInspection ? (
            <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
              {/* Header info */}
              <div className="flex flex-wrap items-start justify-between pb-4 border-b border-surface-border mb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {selectedInspection.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      PIN {selectedInspection.pinCode}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Ref: {selectedInspection.assignmentId}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-ink-primary mt-1.5">
                    Quality Audit: {selectedInspection.workType}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Submitted by <strong>{selectedInspection.vendorName}</strong> • {selectedInspection.submissionTimestamp}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium">Compliance Score</div>
                    <div className={`text-base font-bold font-mono ${
                      complianceScore >= 90 ? 'text-emerald-600' :
                      complianceScore >= 70 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {complianceScore}%
                    </div>
                  </div>
                  <StatusBadge status={selectedInspection.status} />
                </div>
              </div>

              {/* View Mode Selector Toolbar */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setViewMode('ANNOTATED')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'ANNOTATED'
                        ? 'bg-white text-teal-700 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>AI Detections (YOLOv8)</span>
                  </button>

                  <button
                    onClick={() => setViewMode('HEATMAP')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'HEATMAP'
                        ? 'bg-white text-teal-700 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Depth Heatmap</span>
                  </button>

                  <button
                    onClick={() => setViewMode('OPTICAL')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'OPTICAL'
                        ? 'bg-white text-teal-700 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                    <span>Optical Photo</span>
                  </button>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {annotations.length} Objects Segmented
                </span>
              </div>

              {/* Evidence Image Preview Frame with Interactive Overlays */}
              <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-navy-950 mb-5 shadow-inner">
                {/* Main Evidence Photo */}
                <img
                  src={selectedInspection.evidenceImageUrl || CIVIL_FALLBACK_SVGS[selectedInspection.workType] || CIVIL_FALLBACK_SVGS.Trenching}
                  alt="Inspection Evidence"
                  className="w-full h-72 object-cover transition-opacity duration-300"
                  onError={(e) => {
                    // Safe civil vector fallback prevents broken image icon
                    (e.target as HTMLImageElement).src = 
                      CIVIL_FALLBACK_SVGS[selectedInspection.workType] || CIVIL_FALLBACK_SVGS.Trenching;
                  }}
                />

                {/* Depth Heatmap False-Color Gradient Overlay */}
                {viewMode === 'HEATMAP' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-red-600/30 via-yellow-500/25 to-blue-600/35 mix-blend-color-burn pointer-events-none backdrop-blur-[0.5px]">
                    <div className="absolute top-12 right-3 bg-navy-950/85 backdrop-blur-md p-2 rounded-lg border border-slate-700 text-[10px] text-white space-y-1">
                      <div className="font-bold text-teal-300">Depth Heatmap Scale</div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-blue-500" />
                        <span>0.0m (Curbside Plane)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-yellow-500" />
                        <span>0.8m (Warning Tape)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-red-500" />
                        <span>1.25m (Trench Bottom)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Detection Overlays (Bounding Boxes) */}
                {viewMode === 'ANNOTATED' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {annotations.map((box) => (
                      <div
                        key={box.id}
                        style={box.style}
                        className={`absolute border-2 rounded transition-all pointer-events-auto group ${
                          box.status === 'COMPLIANT'
                            ? 'border-emerald-400/90 bg-emerald-500/15'
                            : box.status === 'AMBIGUOUS'
                            ? 'border-amber-400/90 bg-amber-500/20 animate-pulse'
                            : 'border-rose-500/90 bg-rose-500/20'
                        }`}
                      >
                        {/* Box Tag Header */}
                        <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 shadow-md whitespace-nowrap ${
                          box.status === 'COMPLIANT'
                            ? 'bg-emerald-600 text-white'
                            : box.status === 'AMBIGUOUS'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}>
                          <span>{box.label}</span>
                          <span className="opacity-80">({Math.round(box.confidence * 100)}%)</span>
                        </div>

                        {/* Interactive Tooltip on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-0 mb-1 z-20 w-48 p-2 rounded bg-navy-950/95 text-slate-200 text-[10px] border border-slate-700 shadow-xl pointer-events-none">
                          <p className="font-semibold text-teal-300">{box.label}</p>
                          <p className="text-slate-400 mt-0.5">{box.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Camera / Telemetry Overlay Badges */}
                <div className="absolute top-3 left-3 bg-navy-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-teal-300 border border-navy-800 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>EXIF GPS: 12.9756° N, 77.6066° E (Verified in Zone Perimeter)</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-navy-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-slate-300 border border-navy-800 shadow-sm">
                  SHA-256 Tamper Check: <span className="text-emerald-400 font-bold font-mono">MATCH</span>
                </div>
              </div>

              {/* AI Findings Section */}
              <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-ink-primary">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Computer Vision Inferences</span>
                    <span className="text-[10px] font-normal text-ink-muted">(YOLOv8-Civil Object Segmenter)</span>
                  </div>
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono font-semibold border border-teal-200">
                    Model: ResNet-50 / YOLO-v8
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {selectedInspection.aiFindings.map((finding, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3 shadow-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-primary text-xs">{finding.feature}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            finding.verdict === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            finding.verdict === 'AMBIGUOUS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {finding.verdict}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-secondary mt-1">{finding.note}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-ink-primary">
                          {(finding.confidence * 100).toFixed(0)}% Conf
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              finding.confidence > 0.9 ? 'bg-emerald-500' :
                              finding.confidence > 0.75 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.round(finding.confidence * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Mandatory Engineering Checklist */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs text-ink-primary">
                    Mandatory Engineering Checklist
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {compliantChecks} of {totalChecks} Compliant • Click to toggle audit certification
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {checklistState.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleToggleChecklist(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        item.passed 
                          ? 'bg-slate-50 border-slate-200 hover:bg-emerald-50/40' 
                          : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <span className="text-ink-secondary text-xs flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{item.label}</span>
                      </span>

                      {item.passed ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Compliant
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-rose-700 text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <X className="w-3.5 h-3.5" /> Defect
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Human Review & Decision Panel */}
              <div className="pt-4 border-t border-surface-border">
                <label className="block font-bold text-xs text-ink-primary mb-1">
                  Field Inspector Audit Remarks & Authority Sign-off
                </label>
                <textarea
                  rows={2}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder="Enter formal civil audit notes for milestone release..."
                  className="w-full text-xs p-2.5 border border-surface-border rounded-lg bg-slate-50 focus:bg-white focus:border-teal-500 outline-none mb-3 transition-colors"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-ink-muted">
                    Auditor: <strong>{selectedInspection.humanReviewer || 'Senior Field Inspector'}</strong>
                  </div>

                  {/* 3 Authoritative Decision Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus('FAIL')}
                      title="Reject work and issue formal Corrective Action rework ticket"
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Issue Rework (FAIL)</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('REVIEW_REQUIRED')}
                      title="Hold milestone for laboratory core or sieve analysis"
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Hold for Lab Test</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('PASS')}
                      title="Authorize civil compliance and release contractor milestone payment gate"
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize Milestone (PASS)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 border border-surface-border text-center text-slate-500">
              <p>No inspection evidence packet selected.</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
