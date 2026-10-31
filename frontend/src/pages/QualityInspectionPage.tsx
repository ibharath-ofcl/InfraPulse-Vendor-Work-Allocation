import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Check, 
  X, 
  Sparkles,
  Info
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { mockInspections } from '../data/mockInspections';
import { QualityInspection, InspectionStatus } from '../types';

export const QualityInspectionPage: React.FC = () => {
  const [inspections, setInspections] = useState<QualityInspection[]>(mockInspections);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection>(mockInspections[0]);
  const [inspectorNotes, setInspectorNotes] = useState(selectedInspection.inspectorNotes || '');
  const [humanActionSuccess, setHumanActionSuccess] = useState<string | null>(null);

  const handleUpdateStatus = (newStatus: InspectionStatus) => {
    const updated = inspections.map((ins) => 
      ins.id === selectedInspection.id 
        ? { ...ins, status: newStatus, inspectorNotes }
        : ins
    );
    setInspections(updated);
    setSelectedInspection({ ...selectedInspection, status: newStatus, inspectorNotes });
    setHumanActionSuccess(`Inspection decision recorded: ${newStatus}`);
    setTimeout(() => setHumanActionSuccess(null), 3000);
  };

  return (
    <PageContainer>
      <PageHeader
        title="AI Visual Quality Assurance & Inspection Queue"
        subtitle="Computer vision quality verification of field evidence with human-in-the-loop audit oversight."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200">
            {inspections.filter(i => i.status === 'REVIEW_REQUIRED').length} Flagged for Review
          </span>
        }
      />

      {/* Illustrative Notice Banner */}
      <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <div>
          <span className="font-bold">Stage 2 Prototype Notice:</span> AI inferences and confidence indexes displayed here are standardized demonstration fixtures. Actual computer vision models (OpenCV / PyTorch) are scheduled for deployment in Stage 9.
        </div>
      </div>

      {/* Main Grid: Queue on Left, Detailed Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Inspection Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl p-4 border border-surface-border shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <h3 className="font-bold text-sm text-ink-primary">
                  Inspection Queue ({inspections.length})
                </h3>
                <p className="text-xs text-ink-secondary">Select evidence packet to audit</p>
              </div>
            </div>

            <div className="space-y-2.5 mt-3">
              {inspections.map((ins) => {
                const isSelected = ins.id === selectedInspection.id;
                return (
                  <div
                    key={ins.id}
                    onClick={() => {
                      setSelectedInspection(ins);
                      setInspectorNotes(ins.inspectorNotes || '');
                    }}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50 border-teal-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {ins.id}
                        </span>
                        <h4 className="text-xs font-bold text-ink-primary mt-1">
                          {ins.workZoneName}
                        </h4>
                      </div>
                      <StatusBadge status={ins.status} size="sm" />
                    </div>

                    <div className="text-[11px] text-ink-secondary space-y-1 mt-2">
                      <div className="flex items-center justify-between">
                        <span>Work: <strong>{ins.workType}</strong></span>
                        <span className="text-ink-muted">PIN: {ins.pinCode}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-[11px]">
                        <span className="truncate max-w-[170px] text-ink-primary font-medium">{ins.vendorName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          ins.reviewPriority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                          ins.reviewPriority === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ins.reviewPriority}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Detailed Evidence Inspection Dossier */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            {/* Header info */}
            <div className="flex items-start justify-between pb-4 border-b border-surface-border mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {selectedInspection.id}
                </span>
                <h3 className="text-base font-bold text-ink-primary mt-1">
                  Quality Audit: {selectedInspection.workType}
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Submitted by <strong>{selectedInspection.vendorName}</strong> • {selectedInspection.submissionTimestamp}
                </p>
              </div>
              <StatusBadge status={selectedInspection.status} />
            </div>

            {/* Evidence Image Preview Frame */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-navy-950 mb-5">
              <img
                src={selectedInspection.evidenceImageUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80'}
                alt="Inspection Evidence"
                className="w-full h-56 object-cover opacity-90 hover:opacity-100 transition-opacity"
                onError={(e) => {
                  // Fallback if local image not present
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-teal-400 border border-navy-800">
                EXIF GPS: 12.9756° N, 77.6066° E (Verified in Zone Perimeter)
              </div>
              <div className="absolute bottom-3 right-3 bg-navy-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] text-slate-300 border border-navy-800">
                SHA-256 Tamper Check: <span className="text-emerald-400 font-bold">MATCH</span>
              </div>
            </div>

            {/* AI Findings Section (Illustrative) */}
            <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-xs text-ink-primary">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Computer Vision Inferences</span>
                  <span className="text-[10px] font-normal text-ink-muted">(Illustrative Baseline)</span>
                </div>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-200">
                  Model: ResNet-50 / YOLO-v8
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {selectedInspection.aiFindings.map((finding, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-primary">{finding.feature}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          finding.verdict === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-700' :
                          finding.verdict === 'AMBIGUOUS' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {finding.verdict}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-secondary mt-0.5">{finding.note}</p>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-ink-primary shrink-0">
                      {(finding.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Compliance Checklist */}
            <div className="mb-5">
              <h4 className="font-bold text-xs text-ink-primary mb-2">
                Mandatory Engineering Checklist
              </h4>
              <div className="space-y-1.5 text-xs">
                {selectedInspection.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-ink-secondary">{item.label}</span>
                    {item.passed ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                        <Check className="w-3.5 h-3.5" /> Compliant
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-rose-700 text-[11px]">
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
                Field Inspector Audit Remarks
              </label>
              <textarea
                rows={2}
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                placeholder="Enter formal civil audit notes for milestone release..."
                className="w-full text-xs p-2.5 border border-surface-border rounded-lg bg-slate-50 focus:bg-white outline-none mb-3"
              />

              {humanActionSuccess && (
                <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{humanActionSuccess}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-ink-muted">
                  Auditor: {selectedInspection.humanReviewer}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('FAIL')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Issue Rework (FAIL)</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('REVIEW_REQUIRED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Hold for Lab Test</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('PASS')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorize Milestone (PASS)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
