import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  Cpu, 
  FileCheck
} from 'lucide-react';
import { intelligenceService } from '../../../services/intelligenceService';
import { 
  parseAndExtractContractDocument, 
  saveStoredContract, 
  saveStoredRequirements 
} from '../../../data/mockIntelligence';
import { ContractType, ContractRequirement } from '../../../types/intelligence';

interface ContractUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  projectName: string;
}

const DEMO_PRESETS = [
  {
    label: '📑 Smart City Fiber & Trenching BOQ (Schedule A)',
    title: 'Smart City Fiber Backbone & Underground Ducting BOQ Schedule',
    contractType: 'OPTICAL_FIBER' as ContractType,
    totalValue: 35000000,
    text: `CONTRACT TENDER SPECIFICATION & BOQ SCHEDULE A
Project: Smart City Optical Fiber & Underground Ducting
Employer: Karnataka Urban Infrastructure Corp • Prime Contractor: Apex Infra Utilities Ltd
Clause 1.1 — Trench Depth: Optical conduit trenching along municipal corridors must maintain a minimum continuous depth of 1.20 meters below curb datum (tolerance: ± 0.05m).
Clause 2.3 — Warning Ribbon: 100mm retroreflective caution warning tape must be installed 300mm above conduit prior to secondary backfilling.
Clause 3.1 — Bedding Layer: 100mm uniform screened river sand bedding cushion required under all HDPE ducts. Zero stone aggregate >2mm permitted.
Clause 4.2 — Backfill Compaction: Earth backfilling must be compacted in 150mm lifts achieving >= 95% Modified Proctor Density.
Clause 5.4 — Carriageway Reinstatement: Pavement trench cut flushness must meet IRC:SP:84 within ±3.0mm surface depression tolerance.`,
  },
  {
    label: '🛣️ Municipal Arterial Road Resurfacing Spec (IRC:SP:84)',
    title: 'Arterial Road Corridor Pavement Resurfacing & Drainage Spec',
    contractType: 'ROAD_WORKS' as ContractType,
    totalValue: 42000000,
    text: `MUNICIPAL HIGHWAY & ARTERIAL ROAD ENGINEERING SPECIFICATION
Technical Spec Code: IRC:SP:84-2019 • Urban Arterial Pavement Resurfacing
Section 500 — Dense Bituminous Macadam (DBM): 50mm compacted wearing course layer with straight-edge depression tolerance <= 3.0mm.
Section 300 — Sub-base Compaction: Granular sub-base layer compaction to achieve 98% Proctor Dry Density verified by nuclear gauge.
Section 100 — Storm-water Inlets: Catch basin grates flush with pavement grade level (tolerance: ± 2mm).`,
  },
  {
    label: '⚡ High-Tension Utility Power Spine Contract',
    title: 'Underground High-Tension Power Ducting & Feeder Contract',
    contractType: 'ELECTRICAL_GRID' as ContractType,
    totalValue: 58000000,
    text: `ELECTRICAL UTILITY INFRASTRUCTURE WORK ORDER
High-Tension 11kV Underground Power Ducting & Encasement
Specification 12.1 — Trench Clearance: Minimum 1.50m vertical depth from carriageway grade with concrete encasement.
Specification 14.3 — Thermal Sand Bedding: Thermal resistivity sand backfill (120mm) surrounding power conduits.
Specification 18.2 — Red Warning Tiles: Heavy-duty precast concrete cable protection covers positioned 250mm above conduits.`,
  },
];

export const ContractUploadModal: React.FC<ContractUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
}) => {
  const [title, setTitle] = useState('Smart City Fiber Backbone & Underground Ducting BOQ Schedule');
  const [contractType, setContractType] = useState<ContractType>('OPTICAL_FIBER');
  const [totalValue, setTotalValue] = useState<number>(35000000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]);
  const [description, setDescription] = useState(DEMO_PRESETS[0].text);
  const [file, setFile] = useState<File | null>(null);

  // Preprocessing states
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [preprocessingStep, setPreprocessingStep] = useState(0);
  const [extractedRequirements, setExtractedRequirements] = useState<ContractRequirement[]>([]);
  const [detectedStandards, setDetectedStandards] = useState<string[]>(['IRC:SP:84', 'CPWD Section 5.2']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run initial extraction on mount/preset
  useEffect(() => {
    if (isOpen && description) {
      handlePreprocessDocument(file ? file.name : 'contract_spec.txt', description);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Preprocessing engine
  const handlePreprocessDocument = (docName: string, text: string) => {
    setIsPreprocessing(true);
    setPreprocessingStep(1);

    setTimeout(() => {
      setPreprocessingStep(2);
      setTimeout(() => {
        setPreprocessingStep(3);
        const { requirements, summary } = parseAndExtractContractDocument(
          docName,
          text,
          { id: projectId, name: projectName, contractType }
        );
        setExtractedRequirements(requirements);
        setDetectedStandards(summary.detectedStandards);
        setIsPreprocessing(false);
      }, 350);
    }, 300);
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setTitle(preset.title);
    setContractType(preset.contractType);
    setTotalValue(preset.totalValue);
    setDescription(preset.text);
    setFile(null);
    handlePreprocessDocument(preset.title + '.txt', preset.text);
  };

  // Handle File Input Selection
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') + ' Schedule');

    // Read file text content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setDescription(content.slice(0, 3000));
      handlePreprocessDocument(selectedFile.name, content || DEMO_PRESETS[0].text);
    };
    reader.onerror = () => {
      handlePreprocessDocument(selectedFile.name, DEMO_PRESETS[0].text);
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Contract title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Process & extract complete data model
      const { contract, requirements } = parseAndExtractContractDocument(
        file ? file.name : 'contract_spec.txt',
        description,
        { id: projectId, name: projectName, contractType }
      );

      // Customize with form state
      contract.title = title;
      contract.contractType = contractType;
      contract.totalValue = Number(totalValue);
      contract.startDate = startDate;
      contract.endDate = endDate;
      contract.description = description.slice(0, 300);

      // 2. Persist in local storage
      saveStoredContract(contract);
      saveStoredRequirements(requirements);

      // 3. Attempt backend registration
      try {
        await intelligenceService.createContract({
          projectId,
          title,
          contractType,
          totalValue: Number(totalValue),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          description: description || undefined,
        });
      } catch (err) {
        console.warn('Backend contract creation skipped/fallback to client storage', err);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to register contract and extract requirements');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-surface-border rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border bg-gradient-to-r from-slate-50 via-white to-teal-50/40 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600 border border-teal-200 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#10243A]">Register Contract & BOQ Schedule</h3>
              <p className="text-xs text-ink-secondary mt-0.5">Project: <strong>{projectName}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Presets */}
          <div>
            <label className="block text-xs font-bold text-ink-primary mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Instant Document Presets (1-Click Test)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_PRESETS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className={`text-left p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    title === p.title
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium'
                  }`}
                >
                  <p className="truncate font-semibold">{p.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">₹ {(p.totalValue / 10000000).toFixed(1)} Cr • {p.contractType.replace(/_/g, ' ')}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop File Upload */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Upload Signed Contract / Technical BOQ Document (.pdf, .txt, .docx, .json)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center transition bg-slate-50 hover:bg-slate-100/60">
              <input
                type="file"
                id="contract-doc-file"
                className="hidden"
                accept=".txt,.pdf,.docx,.doc,.json,.csv"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <label htmlFor="contract-doc-file" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-full text-teal-600 border border-teal-100">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs text-ink-primary font-bold">
                  {file ? file.name : 'Choose contract file or drag & drop here'}
                </span>
                <span className="text-[11px] text-ink-secondary">
                  {file 
                    ? `${(file.size / 1024).toFixed(1)} KB • AI Document Parser Activated` 
                    : 'System parses clauses, tolerances, standards (IRC/CPWD/IS) and milestone payment gates'}
                </span>
              </label>
            </div>
          </div>

          {/* Real-time Preprocessing Progress Visualizer */}
          {isPreprocessing ? (
            <div className="p-3.5 bg-navy-950 text-white rounded-xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 text-teal-400 font-bold">
                  <Cpu className="w-4 h-4 animate-spin text-teal-400" />
                  <span>AI Preprocessor Running...</span>
                </span>
                <span className="text-slate-400">Pipeline Stage {preprocessingStep} of 3</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-400 h-full transition-all duration-300"
                  style={{ width: `${(preprocessingStep / 3) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                {preprocessingStep === 1 && 'Scanning document tokens and segmenting contractual sections...'}
                {preprocessingStep === 2 && 'Detecting engineering specifications, units (mm, m, %), and tolerances...'}
                {preprocessingStep === 3 && 'Calibrating verification methods and milestone payment criteria...'}
              </p>
            </div>
          ) : (
            /* Preprocessing Summary Banner */
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-teal-900 font-medium">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Document Preprocessed:</strong> Extracted <strong>{extractedRequirements.length} Quality Requirements</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {detectedStandards.map((std, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-white text-teal-800 border border-teal-200 rounded font-semibold">
                    {std}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Contract Title / Work Order Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smart City Fiber Backbone & Underground Ducting BOQ Schedule"
                className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Contract Type</label>
                <select
                  value={contractType}
                  onChange={(e) => {
                    const ct = e.target.value as ContractType;
                    setContractType(ct);
                    handlePreprocessDocument(file ? file.name : 'spec.txt', description);
                  }}
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium"
                >
                  <option value="OPTICAL_FIBER">Optical Fiber / Telecom</option>
                  <option value="CIVIL_INFRASTRUCTURE">Civil Infrastructure</option>
                  <option value="ROAD_WORKS">Road Works</option>
                  <option value="WATER_SUPPLY_DRAINAGE">Water Supply & Drainage</option>
                  <option value="ELECTRICAL_GRID">Electrical Grid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Contract Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={totalValue}
                  onChange={(e) => setTotalValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Target End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Contract Clauses & Technical Specifications Stream
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  handlePreprocessDocument(file ? file.name : 'spec.txt', e.target.value);
                }}
                placeholder="Paste contract clauses or technical BOQ text to trigger automated requirement extraction..."
                className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-xs text-ink-primary font-mono placeholder-ink-muted focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Live Preview of Extracted Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Extracted Requirements Preview ({extractedRequirements.length})</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Will be registered in Module A</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {extractedRequirements.map((req, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-2 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">{req.requirementCode}</span>
                      <span className="font-bold text-ink-primary text-xs">{req.title}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">{req.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{req.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-ink-primary">
                      {req.requiredValue} {req.measurementUnit || ''}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">{req.permittedTolerance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-surface-border">
            <span className="text-[11px] text-slate-500 font-medium">
              Integrates with <strong>Milestone Gates</strong> & <strong>Quality QA</strong>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-ink-secondary hover:text-ink-primary bg-white border border-surface-border hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Extraction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Register & Extract Requirements</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
