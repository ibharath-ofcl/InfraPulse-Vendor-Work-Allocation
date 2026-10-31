import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { evidenceService } from '../../services/evidenceService';
import { EvidenceIntegrityResponse } from '../../types/evidence';

interface EvidenceIntegrityIndicatorProps {
  evidenceId: string;
  checksum: string;
  compact?: boolean;
}

export const EvidenceIntegrityIndicator: React.FC<EvidenceIntegrityIndicatorProps> = ({
  evidenceId,
  checksum,
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvidenceIntegrityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      setError(null);
      const res = await evidenceService.verifyIntegrity(evidenceId);
      setResult(res);
      setShowDetails(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Verification failed');
      setShowDetails(true);
    } finally {
      setLoading(false);
    }
  };

  const truncatedHash = checksum ? `${checksum.substring(0, 8)}...${checksum.substring(checksum.length - 8)}` : 'N/A';

  if (compact) {
    return (
      <button
        onClick={handleVerify}
        disabled={loading}
        title={`SHA-256: ${checksum}\nClick to verify cryptographic integrity`}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-teal-950/60 text-teal-300 border border-teal-500/30 hover:bg-teal-900/50 transition-colors"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
        ) : (
          <ShieldCheck className="w-3 h-3 text-teal-400" />
        )}
        <span>{truncatedHash}</span>
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleVerify}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          result?.integrityValid
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
            : result?.integrityValid === false
            ? 'bg-red-950/40 text-red-300 border-red-500/40 hover:bg-red-900/50'
            : 'bg-navy-900/80 text-teal-300 border-teal-500/30 hover:bg-navy-800'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
        ) : result?.integrityValid ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        ) : result?.integrityValid === false ? (
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
        )}
        <span>
          {result?.integrityValid ? 'Cryptographically Verified' : 'Verify SHA-256 Integrity'}
        </span>
      </button>

      {showDetails && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-30 mt-2 right-0 w-80 p-3.5 rounded-xl bg-navy-900/95 border border-navy-700 shadow-2xl backdrop-blur-md text-xs text-slate-200"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-navy-800 font-semibold">
            <span className="text-teal-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> SHA-256 Checksum Audit
            </span>
            <button
              onClick={() => setShowDetails(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {result ? (
            <div className="space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Stored Fingerprint:</span>
                <span className="text-teal-200 break-all">{result.storedChecksum}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Calculated File Hash:</span>
                <span className="text-emerald-300 break-all">{result.calculatedChecksum}</span>
              </div>
              <div
                className={`p-2 rounded font-sans text-xs ${
                  result.integrityValid
                    ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-900/30 text-red-300 border border-red-500/30'
                }`}
              >
                {result.statusMessage}
              </div>
            </div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : null}
        </div>
      )}
    </div>
  );
};
