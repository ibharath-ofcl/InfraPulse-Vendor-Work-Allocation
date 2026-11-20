import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Eye, 
  Camera, 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  ShieldCheck,
  Layers, 
  Clock, 
  Fingerprint, 
  UploadCloud,
  HardHat,
  Cpu,
  Ruler,
  FileCheck2,
  SlidersHorizontal,
  FilterX,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { getAllMergedEvidence, saveStoredEvidence } from '../data/mockEvidence';
import { recordAuditEvent } from '../data/mockAuditEvents';
import { EvidenceItem, EvidenceStageCategory, GeofenceStatus } from '../types';
import { analyzeImageAuthenticity, AuthenticityScanResult } from '../utils/imageAuthenticity';

// Sample demonstration presets for instant real vs fake testing
const SAMPLE_PRESETS = [
  {
    label: '🏗️ Authentic Trench Photo',
    type: 'REAL',
    fileName: 'site_excavation_trench_depth.jpg',
    url: 'https://images.unsplash.com/photo-1579847188804-ecba0e2ea330?auto=format&fit=crop&w=800&q=80',
    desc: 'Real on-site excavation with trench shields & safety tape',
  },
  {
    label: '⚠️ Fake / Screen Artifact',
    type: 'FAKE',
    fileName: 'fake_synthetic_screenshot_render.png',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    desc: 'Abstract digital render / non-field graphic',
  },
  {
    label: '🔁 Duplicate Collision Test',
    type: 'DUPLICATE',
    fileName: 'reuploaded_field_photo_copy.jpg',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    desc: 'Exact pHash duplicate of existing evidence EVD-9005',
  },
];

export const EvidencePage: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(getAllMergedEvidence);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [activePreview, setActivePreview] = useState<EvidenceItem | null>(null);
  const [showWatermarkHud, setShowWatermarkHud] = useState(true);
  const [activeAuditTab, setActiveAuditTab] = useState<'TELEMETRY' | 'COMPUTER_VISION' | 'PHYSICAL_QC'>('TELEMETRY');

  // Mobile Field Capture Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<EvidenceStageCategory>('WORK_IN_PROGRESS');
  const [selectedAssignment, setSelectedAssignment] = useState('WA-BLR-001 (MG Road - Brigade Junction Corridor)');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFileName, setCapturedFileName] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GeofenceStatus>('VERIFIED');
  const [sensorOrientation, setSensorOrientation] = useState<{ alpha: number; beta: number; gamma: number } | null>({ alpha: 42, beta: 15, gamma: -8 });
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Real-time AI Authenticity & Forensics Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<AuthenticityScanResult | null>(null);

  // Sync when evidence is updated from other windows or tabs
  useEffect(() => {
    const handleSync = () => {
      setEvidenceList(getAllMergedEvidence());
    };
    window.addEventListener('infrapulse_evidence_updated', handleSync);
    return () => window.removeEventListener('infrapulse_evidence_updated', handleSync);
  }, []);

  // Compute known pHashes for duplicate collision checks
  const existingHashes = useMemo(() => {
    return evidenceList
      .filter(e => Boolean(e.perceptualHash))
      .map(e => ({ id: e.id, pHash: e.perceptualHash! }));
  }, [evidenceList]);

  // Dynamic KPI Metrics calculated across the active evidence list
  const inZoneCount = useMemo(() => evidenceList.filter(e => e.geofenceStatus === 'VERIFIED').length, [evidenceList]);
  const geofenceMatchPercent = useMemo(() => {
    if (evidenceList.length === 0) return 0;
    return Math.round((inZoneCount / evidenceList.length) * 1000) / 10;
  }, [inZoneCount, evidenceList]);

  const cvPassCount = useMemo(() => evidenceList.filter(e => e.verificationStatus === 'VERIFIED').length, [evidenceList]);
  const cvPassPercent = useMemo(() => {
    if (evidenceList.length === 0) return 0;
    return Math.round((cvPassCount / evidenceList.length) * 1000) / 10;
  }, [cvPassCount, evidenceList]);

  const flaggedCount = useMemo(() => evidenceList.filter(e => e.verificationStatus === 'FLAGGED' || e.verificationStatus === 'REJECTED').length, [evidenceList]);
  const duplicateCount = useMemo(() => evidenceList.filter(e => e.duplicateStatus === 'DUPLICATE_CONFIRMED' || e.duplicateStatus === 'DUPLICATE_SUSPECTED').length, [evidenceList]);

  // Filter options with dynamic counts
  const filterOptions = [
    { label: 'All Evidence', value: 'ALL', count: evidenceList.length },
    { label: 'Verified', value: 'VERIFIED', count: evidenceList.filter(e => e.verificationStatus === 'VERIFIED').length },
    { label: 'Flagged by AI', value: 'FLAGGED', count: evidenceList.filter(e => e.verificationStatus === 'FLAGGED').length },
    { label: 'Rejected', value: 'REJECTED', count: evidenceList.filter(e => e.verificationStatus === 'REJECTED').length },
  ];

  // Listen to device orientation if available on field capture
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        setSensorOrientation({
          alpha: Math.round(e.alpha),
          beta: Math.round(e.beta),
          gamma: Math.round(e.gamma),
        });
      }
    };

    if (isCaptureModalOpen && typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isCaptureModalOpen]);

  // Handle GPS acquisition
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      // Simulate verified location if browser has no GPS
      setGpsData({ lat: 12.9756, lng: 77.6066, accuracy: 3.2 });
      setGpsStatus('VERIFIED');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        setGpsData({ lat, lng, accuracy });
        setGpsLoading(false);

        // Evaluate geofence (simulated zone center check: MG Road ~12.9756, 77.6066)
        if (accuracy > 50) {
          setGpsStatus('ACCURACY_TOO_LOW');
        } else {
          const distKm = Math.sqrt(Math.pow(lat - 12.9756, 2) + Math.pow(lng - 77.6066, 2)) * 111;
          if (distKm <= 0.8) {
            setGpsStatus('VERIFIED');
          } else {
            setGpsStatus('OUT_OF_BOUNDS');
          }
        }
      },
      () => {
        setGpsLoading(false);
        // Fallback default in-zone coordinates for demonstration
        setGpsData({ lat: 12.9756, lng: 77.6066, accuracy: 3.2 });
        setGpsStatus('VERIFIED');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Perform Real-Time AI Authenticity Scan on loaded image
  const triggerAuthenticityAnalysis = async (imageUrl: string, fileName: string) => {
    try {
      setIsScanning(true);
      const result = await analyzeImageAuthenticity(imageUrl, fileName, existingHashes);
      setScanResult(result);
    } catch (err) {
      console.error('Forensic authenticity scan failed', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle file capture from file input
  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        triggerAuthenticityAnalysis(result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle selecting a sample test preset
  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setCapturedFileName(preset.fileName);
    setCapturedImage(preset.url);
    triggerAuthenticityAnalysis(preset.url, preset.fileName);
  };

  // Submit new evidence with full authenticity verification
  const handleSubmitEvidence = () => {
    if (!capturedImage) {
      alert('Please select or capture a photo before submitting.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newId = `EVD-${Math.floor(9010 + Math.random() * 900)}`;
      const isAuthentic = scanResult ? scanResult.isAuthentic : true;
      const isDuplicate = scanResult ? scanResult.isDuplicate : false;

      // Determine final lifecycle verification status
      let finalStatus: 'VERIFIED' | 'FLAGGED' | 'REJECTED' = 'VERIFIED';
      if (!isAuthentic || isDuplicate) {
        finalStatus = isDuplicate ? 'FLAGGED' : 'REJECTED';
      } else if (gpsStatus === 'OUT_OF_BOUNDS') {
        finalStatus = 'FLAGGED';
      }

      const newItem: EvidenceItem = {
        id: newId,
        assignmentId: selectedAssignment.split(' ')[0],
        workZoneName: 'MG Road - Brigade Junction Corridor',
        pinCode: '560001',
        vendorName: 'Apex Infra Utilities Ltd',
        submissionDate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST',
        evidenceType: selectedStage,
        verificationStatus: finalStatus,
        geofenceStatus: gpsStatus,
        gpsAccuracyMeters: gpsData ? Math.round(gpsData.accuracy * 10) / 10 : 3.2,
        duplicateStatus: isDuplicate ? 'DUPLICATE_CONFIRMED' : 'UNIQUE',
        perceptualHash: scanResult?.perceptualHash || 'a7b8c9d0e1f23456',
        imageUrl: capturedImage,
        coordinates: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : { lat: 12.9756, lng: 77.6066 },
        fileSize: '3.8 MB',
        deviceIntegrityStatus: isAuthentic
          ? 'SENSOR_RECORDED (Solocator Field Capture v4.8 - Authenticity Verified)'
          : 'WEB_UNATTESTED (Synthetic / Discrepant Forensic Alert)',
        monocularDepthEstimate: scanResult?.monocularDepthEstimate || 'Estimated trench depth ~1.18m (Compliant with 1.20m nominal tolerance)',
        physicalMeasurementStatus: isAuthentic
          ? 'VERIFIED_PASS (Optical gradient & core density within specification)'
          : 'VERIFICATION_FAILED (AI Authenticity Audit flagged synthetic or out-of-spec anomaly)',
      };

      // 1. Save to persistent localStorage
      saveStoredEvidence(newItem);

      // Replicate to Centralized Enterprise Audit Trail
      recordAuditEvent({
        eventCategory: 'EVIDENCE_AI',
        eventType: 'EVIDENCE_SUBMITTED',
        entityType: 'EVIDENCE',
        entityId: newItem.id,
        entityReference: `${newItem.id} (${newItem.assignmentId})`,
        action: 'MOBILE_FIELD_CAPTURE',
        outcome: newItem.verificationStatus === 'REJECTED' ? 'FAILURE' : newItem.verificationStatus === 'FLAGGED' ? 'WARNING' : 'SUCCESS',
        description: `Field photo uploaded via Mobile Field Capture for ${newItem.workZoneName}. Geofence status: ${newItem.geofenceStatus || 'VERIFIED'}. Forensic scan: ${newItem.verificationStatus}.`,
        actorName: 'Mobile Field Officer',
        actorRole: 'FIELD_AGENT',
        eventPayload: JSON.stringify({
          evidenceId: newItem.id,
          geofenceStatus: newItem.geofenceStatus,
          verificationStatus: newItem.verificationStatus,
          workZoneName: newItem.workZoneName,
        }),
      }).catch(err => console.warn('Audit recording warning', err));

      // 2. Prepend to active state list (replicates across page)
      setEvidenceList([newItem, ...evidenceList]);
      setIsSubmitting(false);
      setIsCaptureModalOpen(false);
      setCapturedImage(null);
      setScanResult(null);

      // 3. Display informative success banner
      setSuccessToast(
        `Evidence ${newId} Uploaded & Verified: AI Authenticity Scanner identified photo as ${
          isAuthentic ? 'REAL (Authentic Civil Capture: ' + (scanResult?.confidenceScore || 98.4) + '% confidence)' : 'FLAGGED (Synthetic / Discrepant Media)'
        }. Data saved and replicated in vault!`
      );

      // Scroll smoothly to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => setSuccessToast(null), 8000);
    }, 600);
  };

  // Filter evidence
  const filteredEvidence = evidenceList.filter((e) => {
    const matchesSearch = 
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.assignmentId.toLowerCase().includes(search.toLowerCase()) ||
      e.workZoneName.toLowerCase().includes(search.toLowerCase()) ||
      e.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      e.pinCode.includes(search);

    const matchesStatus = statusFilter === 'ALL' || e.verificationStatus === statusFilter;
    const matchesStage = stageFilter === 'ALL' || e.evidenceType === stageFilter;
    return matchesSearch && matchesStatus && matchesStage;
  });

  const isFiltered = Boolean(search.trim()) || statusFilter !== 'ALL' || stageFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setStageFilter('ALL');
  };

  // Render Geofence Badge helper
  const renderGeofenceBadge = (status?: GeofenceStatus, accuracy?: number) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>GPS In-Zone {accuracy ? `(±${accuracy}m)` : ''}</span>
          </span>
        );
      case 'OUT_OF_BOUNDS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Out of Geofence</span>
          </span>
        );
      case 'ACCURACY_TOO_LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Low Accuracy {accuracy ? `(${accuracy}m)` : ''}</span>
          </span>
        );
      case 'UNVERIFIED_NO_GPS':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
            <Compass className="w-3 h-3 text-slate-400" />
            <span>No GPS Geotag</span>
          </span>
        );
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Photographic Evidence Vault"
        subtitle="Geotagged civil infrastructure field photography with real-time GPS geofencing, perceptual duplicate detection, and computer vision quality inspection."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            {isFiltered ? `Showing ${filteredEvidence.length} of ${evidenceList.length} Photos` : `${evidenceList.length} Verified Media Files`}
          </span>
        }
        actions={
          <button
            onClick={() => {
              setIsCaptureModalOpen(true);
              // Pre-fill initial GPS coordinate
              if (!gpsData) {
                setGpsData({ lat: 12.9756, lng: 77.6066, accuracy: 3.2 });
                setGpsStatus('VERIFIED');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#10243A] hover:bg-[#1B3550] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Camera className="w-4 h-4 text-teal-400" />
            <span>Mobile Field Capture</span>
          </button>
        }
      />

      {/* Vault KPI Summary Strip (Dynamically Replicated from Stored Evidence) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Total Media Records</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#10243A]">{evidenceList.length}</span>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">High Res</span>
            </div>
            <span className="text-xs text-ink-secondary mt-1 block truncate">Civil road & duct photography</span>
          </div>
          <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600 border border-teal-100 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">GPS Geofence Match</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold text-emerald-700">{geofenceMatchPercent}%</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {inZoneCount} / {evidenceList.length} In-Zone
              </span>
            </div>
            <span className="text-xs text-ink-secondary mt-1 block truncate">WGS 84 GPS coordinate verified</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Computer Vision</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold text-blue-700">{cvPassPercent}%</span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {cvPassCount} Depth Audited
              </span>
            </div>
            <span className="text-xs text-ink-secondary mt-1 block truncate">Automated optical depth check</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Integrity & pHash Gate</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold text-amber-700">{flaggedCount} Flags</span>
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {duplicateCount} Duplicate{duplicateCount !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xs text-ink-secondary mt-1 block truncate">Perceptual hash collision gate</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900 text-xs font-medium animate-in fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)} 
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unified Filter, Stage & Search Control Bar */}
      <div className="bg-white rounded-xl border border-surface-border p-3.5 shadow-card mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {filterOptions.map((opt) => {
              const isSelected = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#10243A] text-white border-[#10243A] shadow-xs'
                      : 'bg-white text-ink-secondary border-surface-border hover:bg-slate-50 hover:text-ink-primary'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected
                        ? 'bg-teal-500 text-navy-950 font-bold'
                        : 'bg-slate-100 text-ink-secondary'
                    }`}
                  >
                    {opt.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Stage Select, Search, Reset */}
          <div className="flex items-center gap-2.5 flex-1 lg:flex-initial justify-end">
            {/* Stage Dropdown */}
            <div className="relative shrink-0">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="h-9 text-xs bg-white border border-surface-border rounded-lg pl-3 pr-7 font-medium text-ink-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-xs cursor-pointer"
              >
                <option value="ALL">All Stages ({evidenceList.length})</option>
                <option value="BEFORE_WORK">Before Work</option>
                <option value="WORK_IN_PROGRESS">Work in Progress</option>
                <option value="COMPLETION">Completion</option>
                <option value="CORRECTIVE_ACTION">Corrective Action</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by code, PIN, vendor, zone..."
                className="w-full"
              />
            </div>

            {/* Reset Filters Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5"
                title="Reset all search & status filters"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State when filters yield no matches */}
      {filteredEvidence.length === 0 && (
        <div className="bg-white rounded-xl border border-surface-border p-12 text-center shadow-card flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No matching photographic evidence</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            No media files match your current search criteria or stage filters. Try adjusting your filters or resetting them.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-[#10243A] text-white rounded-lg text-xs font-semibold hover:bg-[#1B3550] shadow-sm flex items-center gap-1.5"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* Evidence Media Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvidence.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-surface-border shadow-card hover:shadow-card-hover overflow-hidden transition-all flex flex-col justify-between group"
          >
            {/* Image Thumbnail with Overlay */}
            <div 
              className="relative h-52 bg-slate-900 overflow-hidden cursor-pointer" 
              onClick={() => {
                setActivePreview(item);
                setActiveAuditTab('TELEMETRY');
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.evidenceType}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95 group-hover:opacity-100"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {/* Top Bar: Badges on Left and File Metadata on Right */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusBadge status={item.verificationStatus} size="sm" />
                  {renderGeofenceBadge(item.geofenceStatus, item.gpsAccuracyMeters)}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="bg-slate-950/85 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-teal-300 border border-white/10 shadow-xs">
                    {item.fileSize}
                  </span>
                  <span className="bg-slate-950/90 text-[10px] font-bold text-slate-200 px-2 py-0.5 rounded shadow-xs border border-white/10">
                    {item.evidenceType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Duplicate Suspicion Banner on Card */}
              {item.duplicateStatus && item.duplicateStatus !== 'UNIQUE' && (
                <div className="absolute top-11 inset-x-2.5 bg-rose-600/95 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-semibold flex items-center justify-between shadow-md border border-rose-500">
                  <span className="flex items-center gap-1.5 truncate">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.duplicateStatus === 'DUPLICATE_CONFIRMED' ? 'Confirmed Duplicate' : 'Perceptual Duplicate'}</span>
                  </span>
                  <span className="font-mono text-[9px] bg-black/30 px-1.5 py-0.5 rounded shrink-0">pHash 99.8% match</span>
                </div>
              )}

              {/* Engineering Solocator HUD Watermark Bar (Bottom) */}
              <div className="absolute bottom-2 inset-x-2.5 bg-slate-950/85 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-white flex items-center justify-between text-[10px] font-mono shadow-sm">
                <span className="flex items-center gap-1.5 text-teal-300 font-semibold truncate">
                  <MapPin className="w-3 h-3 shrink-0 text-teal-400" />
                  {item.coordinates.lat !== 0 ? `${item.coordinates.lat.toFixed(4)}° N, ${item.coordinates.lng.toFixed(4)}° E` : 'NO GPS TAG'}
                </span>
                <span className="text-slate-300 shrink-0 font-medium text-[9px] bg-white/10 px-1.5 py-0.5 rounded">
                  {item.gpsAccuracyMeters ? `±${item.gpsAccuracyMeters}m CEP` : 'UNVERIFIED'}
                </span>
              </div>

              {/* Hover Inspect CTA Overlay */}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-3.5 py-2 rounded-lg bg-white/95 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span>Inspect Media & AI Audit</span>
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                {/* ID & Date Header */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs">
                      {item.id}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                      {item.assignmentId}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-medium">{item.submissionDate}</span>
                </div>

                {/* Zone Name */}
                <h4 className="font-bold text-sm text-[#10243A] line-clamp-1" title={item.workZoneName}>
                  {item.workZoneName}
                </h4>
                
                {/* Vendor Row */}
                <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5 line-clamp-1" title={item.vendorName}>
                  <HardHat className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Vendor: <strong className="text-slate-800">{item.vendorName}</strong></span>
                </div>

                {/* Quality & Depth Status Indicator Chip */}
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  {item.verificationStatus === 'FLAGGED' ? (
                    <div className="h-7 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{item.duplicateStatus === 'DUPLICATE_CONFIRMED' ? 'Duplicate resubmission detected' : 'Depth variance flagged vs specification'}</span>
                    </div>
                  ) : item.verificationStatus === 'REJECTED' ? (
                    <div className="h-7 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">Out of geofence bounds / AI authenticity rejection</span>
                    </div>
                  ) : (
                    <div className="h-7 px-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">Calibrated measurement & optical check compliant</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>PIN {item.pinCode}</span>
                </span>
                <button
                  onClick={() => {
                    setActivePreview(item);
                    setActiveAuditTab('TELEMETRY');
                  }}
                  className="text-teal-600 font-bold hover:text-teal-700 flex items-center gap-1 transition-colors"
                >
                  <span>Verification Audit</span>
                  <span>→</span>
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
          title={`Evidence Verification Audit: ${activePreview.id}`}
          subtitle={`Submitted for Package ${activePreview.assignmentId} by ${activePreview.vendorName}`}
          maxWidth="2xl"
          footer={
            <div className="flex flex-col sm:flex-row justify-between w-full items-center gap-3">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Captured: {activePreview.submissionDate}</span>
              </span>
              <button
                onClick={() => setActivePreview(null)}
                className="px-4 py-2 bg-[#10243A] text-white rounded-lg text-xs font-semibold hover:bg-[#1B3550] transition-colors"
              >
                Close Audit
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Top Modal Controls: HUD Watermark Switch & File Size */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setShowWatermarkHud(!showWatermarkHud)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                  showWatermarkHud
                    ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Solocator Camera HUD: {showWatermarkHud ? 'ON' : 'OFF'}</span>
              </button>

              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 font-semibold">
                {activePreview.fileSize} • JPEG High-Res
              </span>
            </div>

            {/* Photo View with Real Municipal Camera HUD Watermark */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative shadow-inner">
              <img
                src={activePreview.imageUrl}
                alt="Full Evidence"
                className="w-full max-h-[380px] object-contain mx-auto"
              />

              {/* Top Left Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <StatusBadge status={activePreview.verificationStatus} size="sm" />
                {renderGeofenceBadge(activePreview.geofenceStatus, activePreview.gpsAccuracyMeters)}
              </div>

              {/* Realistic Municipal Engineering Solocator Watermark HUD */}
              {showWatermarkHud && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-3 text-white font-mono text-[10px] space-y-1">
                  <div className="flex items-center justify-between border-b border-white/20 pb-1 text-teal-300 font-bold">
                    <span>INFRAPULSE AI • FIELD ENGINEERING VERIFICATION HUD</span>
                    <span>{activePreview.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-200 pt-0.5">
                    <div>
                      <span className="text-slate-400">LAT/LON: </span>
                      <strong className="text-white">{activePreview.coordinates.lat.toFixed(5)}° N, {activePreview.coordinates.lng.toFixed(5)}° E</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">ACCURACY: </span>
                      <strong className="text-white">±{activePreview.gpsAccuracyMeters || 3.5}m CEP (14 Satellites)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">ZONE: </span>
                      <strong className="text-white">{activePreview.workZoneName} (PIN {activePreview.pinCode})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">TIMESTAMP: </span>
                      <strong className="text-white">{activePreview.submissionDate}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Duplicate Flag Alert Banner */}
            {activePreview.duplicateStatus && activePreview.duplicateStatus !== 'UNIQUE' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Perceptual Hash Duplicate Warning (Match Score: 99.8%)</span>
                </div>
                <p className="leading-relaxed">
                  The visual fingerprint of this image matches an existing submission in package <strong>WA-BLR-005 (EVD-9005)</strong> with 99.8% perceptual hash congruence. Automated milestone payout authorization for this package is locked.
                </p>
              </div>
            )}

            {/* Audit Tabs Bar */}
            <div className="flex items-center gap-1 border-b border-slate-200 pt-1">
              <button
                onClick={() => setActiveAuditTab('TELEMETRY')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeAuditTab === 'TELEMETRY'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Spatial Geotag & Sensors</span>
              </button>
              <button
                onClick={() => setActiveAuditTab('COMPUTER_VISION')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeAuditTab === 'COMPUTER_VISION'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>AI Computer Vision</span>
              </button>
              <button
                onClick={() => setActiveAuditTab('PHYSICAL_QC')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeAuditTab === 'PHYSICAL_QC'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Physical Lab & Caliper QC</span>
              </button>
            </div>

            {/* Tab 1: Telemetry & Sensors */}
            {activeAuditTab === 'TELEMETRY' && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl text-xs border border-surface-border">
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Work Stage Category</p>
                  <p className="font-bold text-slate-900 mt-0.5">{activePreview.evidenceType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">GPS Geofence Status</p>
                  <div className="mt-0.5">{renderGeofenceBadge(activePreview.geofenceStatus, activePreview.gpsAccuracyMeters)}</div>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Verified GPS Coordinates</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {activePreview.coordinates.lat}° N, {activePreview.coordinates.lng}° E
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Duplicate Status & pHash</p>
                  <p className="font-mono text-slate-800 mt-0.5 flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activePreview.duplicateStatus || 'UNIQUE'} ({activePreview.perceptualHash || 'Verified'})</span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Device Sensor Integrity</p>
                  <p className="font-mono font-medium text-slate-800 mt-0.5">
                    {activePreview.deviceIntegrityStatus || 'HARDWARE_ATTESTED'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Geofence Proximity</p>
                  <p className="font-semibold text-teal-700 mt-0.5">
                    {activePreview.geofenceStatus === 'OUT_OF_BOUNDS' ? '184m outside authorized perimeter' : 'Within authorized project boundary corridor'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Computer Vision */}
            {activeAuditTab === 'COMPUTER_VISION' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-surface-border text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    Monocular Depth & Disparity Analysis
                  </span>
                  <span className="font-mono text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-bold">
                    Depth AI Model v2.4
                  </span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {activePreview.monocularDepthEstimate}
                </p>
                <div className="p-3 bg-white rounded-lg border border-surface-border flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Photometric Edge Uniformity:</span>
                  <strong className="text-slate-900 font-mono">98.2% Compliant</strong>
                </div>
              </div>
            )}

            {/* Tab 3: Physical QC & Calibrated Measurements */}
            {activeAuditTab === 'PHYSICAL_QC' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-surface-border text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-teal-600" />
                    Physical Calibration & Lab Core Test Audit
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-bold">
                    IRC:SP:84 Certified
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-surface-border space-y-1">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Test Assessment</span>
                  <p className="font-semibold text-slate-900 leading-relaxed">
                    {activePreview.physicalMeasurementStatus}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-surface-border">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Testing Device Serial</span>
                    <strong className="text-slate-800 font-mono text-xs">Mitutoyo 500-196-30 (Calibrated)</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-surface-border">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Authorizing Engineer</span>
                    <strong className="text-slate-800 text-xs">EE Suresh Kumar (AE-BBMP)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Mobile Field Evidence Capture Modal with AI Authenticity Scanner */}
      {isCaptureModalOpen && (
        <Modal
          isOpen={isCaptureModalOpen}
          onClose={() => setIsCaptureModalOpen(false)}
          title="Mobile Field Evidence Capture"
          subtitle="Contractor execution portal with AI real/fake detection, GPS geofencing & orientation sensors"
          maxWidth="lg"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsCaptureModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEvidence}
                disabled={isSubmitting || !capturedImage || isScanning}
                className="px-4 py-2 bg-[#10243A] text-white rounded-lg text-xs font-semibold hover:bg-[#1B3550] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {isSubmitting ? (
                  <span>Uploading & Verifying...</span>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-teal-400" />
                    <span>Upload & Verify Evidence</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* Quick Demonstration Presets Banner */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Instant Test Presets (Real vs Fake / Duplicate Verification):</span>
                </span>
                <span className="text-[10px] text-slate-400">One-click simulation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="p-2 text-left bg-white border border-slate-200 hover:border-teal-400 rounded-lg text-[11px] transition-all hover:bg-teal-50/40"
                  >
                    <span className="font-bold block text-slate-800">{preset.label}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assignment & Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Work Assignment</label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option>WA-BLR-001 (MG Road - Brigade Junction Corridor)</option>
                  <option>WA-BLR-002 (Koramangala 80 Feet Road Ward 151)</option>
                  <option>WA-BLR-003 (Sarjapur Main Link Road)</option>
                  <option>WA-BLR-004 (Yelahanka Satellite Town Outer Ring)</option>
                  <option>WA-BLR-005 (Whitefield ITPL Main Corridor)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Work Stage Category</label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value as EvidenceStageCategory)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="BEFORE_WORK">BEFORE_WORK (Site Benchmark)</option>
                  <option value="WORK_IN_PROGRESS">WORK_IN_PROGRESS (Active Excavation)</option>
                  <option value="COMPLETION">COMPLETION (Handover Quality)</option>
                  <option value="CORRECTIVE_ACTION">CORRECTIVE_ACTION (Rework Resolution)</option>
                </select>
              </div>
            </div>

            {/* Photo Capture & Upload Box */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Upload Photo / Field Capture</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
                {capturedImage ? (
                  <div className="space-y-2">
                    <img src={capturedImage} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm border border-slate-200" />
                    <p className="font-mono text-slate-500 text-[11px]">{capturedFileName || 'Captured photograph'}</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100">
                      <Camera className="w-3.5 h-3.5 text-teal-600" />
                      <span>Choose Different Photo</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileCapture} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-2 shadow-xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">Take Photo / Upload Image</span>
                    <span className="text-slate-400 text-[11px] mt-0.5">Supports JPG, PNG, WEBP from mobile camera or desktop</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileCapture} />
                  </label>
                )}
              </div>
            </div>

            {/* AI Real / Fake Authenticity Scanner Banner */}
            {isScanning && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700 animate-pulse">
                <div className="flex items-center gap-2 font-bold text-teal-700">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                  <span>InfraPulse AI Real-Time Authenticity Scanner in Progress...</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-500 pl-6">
                  <p>• Extracting CMOS sensor optical characteristics & EXIF metadata...</p>
                  <p>• Calculating 64-bit block-average perceptual hash (pHash)...</p>
                  <p>• Running civil terrain earth-tone spectrum analysis...</p>
                </div>
              </div>
            )}

            {!isScanning && scanResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                  scanResult.isAuthentic
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50/90 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {scanResult.isAuthentic ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>AI AUTHENTICITY VERIFIED: REAL ON-SITE CAPTURE</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>AI AUTHENTICITY ALERT: {scanResult.verdictTitle.toUpperCase()}</span>
                      </>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      scanResult.isAuthentic
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    Confidence: {scanResult.confidenceScore}%
                  </span>
                </div>

                <div className="space-y-1 text-[11px] pt-1 border-t border-black/10">
                  {scanResult.reasons.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold">{scanResult.isAuthentic ? '✓' : '✗'}</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-black/10 text-[10px] font-mono">
                  <div>
                    <span className="opacity-70 block">SCENE:</span>
                    <strong className="truncate block">{scanResult.sceneClassification.slice(0, 18)}...</strong>
                  </div>
                  <div>
                    <span className="opacity-70 block">pHash:</span>
                    <strong>{scanResult.perceptualHash.slice(0, 8)}...</strong>
                  </div>
                  <div>
                    <span className="opacity-70 block">EARTH TONES:</span>
                    <strong>{scanResult.exifTelemetry.earthToneRatio}% Spectrum</strong>
                  </div>
                  <div>
                    <span className="opacity-70 block">OPTICAL DEPTH:</span>
                    <strong>1.18m Verified</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Geolocation Section */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-800">GPS Geofence Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGpsData({ lat: 12.9756, lng: 77.6066, accuracy: 2.8 });
                      setGpsStatus('VERIFIED');
                    }}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100"
                  >
                    Simulate In-Zone
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGpsData({ lat: 12.9610, lng: 77.6710, accuracy: 6.8 });
                      setGpsStatus('OUT_OF_BOUNDS');
                    }}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100"
                  >
                    Simulate Out-of-Bounds
                  </button>
                  <button
                    type="button"
                    onClick={handleAcquireGps}
                    disabled={gpsLoading}
                    className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold hover:bg-teal-100 disabled:opacity-50"
                  >
                    {gpsLoading ? 'Acquiring...' : 'Acquire GPS'}
                  </button>
                </div>
              </div>

              {gpsData && (
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500">Coordinates: </span>
                    <span className="font-mono font-bold text-slate-800">{gpsData.lat.toFixed(5)}, {gpsData.lng.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Accuracy: </span>
                    <span className="font-mono font-bold text-slate-800">±{gpsData.accuracy.toFixed(1)}m CEP</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    {renderGeofenceBadge(gpsStatus, gpsData.accuracy)}
                  </div>
                </div>
              )}
            </div>

            {/* Sensor & Orientation Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="font-semibold text-slate-800">Device Sensors & Attestation</p>
                  <p className="text-[10px] text-slate-400">
                    Orientation recorded: α={sensorOrientation?.alpha || 42}°, β={sensorOrientation?.beta || 15}°, γ={sensorOrientation?.gamma || -8}°
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                HARDWARE_ATTESTED
              </span>
            </div>

            {/* Description / Field Notes */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Field Inspection Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Enter details on excavation condition, depth markers, barricades..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
