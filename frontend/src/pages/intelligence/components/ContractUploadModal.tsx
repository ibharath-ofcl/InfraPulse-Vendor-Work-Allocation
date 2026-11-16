import React, { useState } from 'react';
import { X, Upload, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { intelligenceService } from '../../../services/intelligenceService';
import { ContractType } from '../../../types/intelligence';

interface ContractUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  projectName: string;
}

export const ContractUploadModal: React.FC<ContractUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
}) => {
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState<ContractType>('CIVIL_INFRASTRUCTURE');
  const [totalValue, setTotalValue] = useState<number>(25000000);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Contract title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const contract = await intelligenceService.createContract({
        projectId,
        title,
        contractType,
        totalValue: Number(totalValue),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        description: description || undefined,
      });

      if (file) {
        await intelligenceService.uploadContractDocument(contract.id, file, file.name);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-surface-border rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="flex items-center justify-between p-5 border-b border-surface-border bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600 border border-teal-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#10243A]">Register Contract & BOQ Schedule</h3>
              <p className="text-xs text-ink-secondary mt-0.5">Project: {projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition"
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

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Contract Title / Work Order Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Arterial Corridor Resurfacing & Drainage Package-1"
              className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">Contract Type</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="CIVIL_INFRASTRUCTURE">Civil Infrastructure</option>
                <option value="ROAD_WORKS">Road Works</option>
                <option value="OPTICAL_FIBER">Optical Fiber / Telecom</option>
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
                className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <label className="block text-xs font-semibold text-ink-primary mb-1">Scope & Technical Specifications</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste contract scope or technical specification text to trigger automated requirement extraction..."
              className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Upload Signed Contract / Technical BOQ Document (.txt, .pdf, .docx)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center transition bg-slate-50 hover:bg-slate-100/60">
              <input
                type="file"
                id="contract-doc-file"
                className="hidden"
                accept=".txt,.pdf,.docx,.doc"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="contract-doc-file" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-teal-600" />
                <span className="text-xs text-ink-primary font-medium">
                  {file ? file.name : 'Choose file or drag & drop here'}
                </span>
                <span className="text-[10px] text-ink-secondary">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'AI service will parse clauses, tolerances and quality checkpoints'}
                </span>
              </label>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-ink-secondary hover:text-ink-primary bg-white border border-surface-border hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 transition flex items-center gap-1.5 shadow-xs"
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
        </form>
      </div>
    </div>
  );
};
