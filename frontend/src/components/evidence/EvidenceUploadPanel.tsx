import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
} from 'lucide-react';
import { EvidenceCategory } from '../../types/evidence';
import { evidenceService } from '../../services/evidenceService';

interface EvidenceUploadPanelProps {
  assignmentId: string;
  onUploadSuccess?: () => void;
}

const CATEGORIES: { value: EvidenceCategory; label: string; desc: string }[] = [
  { value: 'BEFORE_WORK', label: 'Before Work', desc: 'Pre-existing site conditions prior to work' },
  { value: 'WORK_IN_PROGRESS', label: 'Work in Progress', desc: 'Active execution, trenching or laying' },
  { value: 'AFTER_WORK', label: 'After Work', desc: 'Finished surface or completed step' },
  { value: 'MATERIAL_EVIDENCE', label: 'Material Evidence', desc: 'Cables, conduits, asphalt, aggregate batch' },
  { value: 'SITE_CONDITION', label: 'Site Condition', desc: 'Safety barriers, weather, soil or obstacles' },
  { value: 'COMPLETION_EVIDENCE', label: 'Completion Evidence', desc: 'Final restored state ready for review' },
  { value: 'SUPPORTING_DOCUMENT', label: 'Supporting Document', desc: 'Permits, lab test certs, surveyor sheets' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const EvidenceUploadPanel: React.FC<EvidenceUploadPanelProps> = ({
  assignmentId,
  onUploadSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [category, setCategory] = useState<EvidenceCategory>('WORK_IN_PROGRESS');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMessage(`File "${file.name}" has unsupported format. Only JPEG, PNG and WebP are allowed.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`File "${file.name}" exceeds the 10MB maximum file size limit.`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select at least one photograph to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsedLat = latitude ? parseFloat(latitude) : undefined;
      const parsedLng = longitude ? parseFloat(longitude) : undefined;

      const uploaded = await evidenceService.uploadEvidence(
        assignmentId,
        selectedFiles,
        category,
        description.trim() || undefined,
        undefined,
        parsedLat,
        parsedLng
      );

      setSuccessMessage(`Successfully uploaded ${uploaded.length} photo evidence record(s).`);
      setSelectedFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPreviews([]);
      setDescription('');
      setLatitude('');
      setLongitude('');

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      const detail = err.response?.data?.message || err.message || 'Failed to upload photo evidence.';
      setErrorMessage(detail);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl" id="evidence-upload-panel">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            Upload Field Evidence Photograph
          </h3>
          <p className="text-sm text-slate-400">
            Submit original high-resolution site photographs. Cryptographic SHA-256 hash & EXIF metadata are extracted automatically.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800/80 rounded-lg flex items-center gap-2 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-lg flex items-center gap-2 text-sm text-emerald-300">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/20'
              : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
          }`}
          id="evidence-drop-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            id="evidence-file-input"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-indigo-900/40 flex items-center justify-center text-indigo-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Drop photographs here, or <span className="text-indigo-400 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400">
              JPEG, PNG or WebP up to 10MB each. EXIF orientation and GPS coordinates will be preserved.
            </p>
          </div>
        </div>

        {/* Selected Previews */}
        {selectedFiles.length > 0 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Selected Photographs ({selectedFiles.length})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-800 aspect-video">
                  <img
                    src={previews[idx]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="self-end p-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-[11px] text-slate-200 truncate font-mono">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="evidence-category-select">
              Evidence Category *
            </label>
            <select
              id="evidence-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as EvidenceCategory)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} — {cat.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="evidence-description-input">
              Description / Site Notes
            </label>
            <input
              id="evidence-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Trench line chainage 0+150 to 0+200, depth 1.2m"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Optional Manual GPS Coordinates */}
        <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            Manual GPS Override (Optional if camera lacks GPS sensor)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude (e.g. 17.385044)"
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              id="evidence-latitude-input"
            />
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude (e.g. 78.486671)"
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              id="evidence-longitude-input"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUploading || selectedFiles.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-950/40 transition-colors"
            id="evidence-upload-submit-btn"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading & Processing Evidence...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Evidence ({selectedFiles.length})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
