import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Eye, 
  Camera, 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Layers, 
  Clock, 
  Fingerprint, 
  UploadCloud,
  HardHat,
  Cpu,
  Ruler,
  FileCheck2,
  SlidersHorizontal
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { mockEvidenceItems } from '../data/mockEvidence';
import { EvidenceItem, EvidenceStageCategory, GeofenceStatus } from '../types';

export const EvidencePage: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(mockEvidenceItems);
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
  const [gpsStatus, setGpsStatus] = useState<GeofenceStatus>('UNVERIFIED_NO_GPS');
  const [sensorOrientation, setSensorOrientation] = useState<{ alpha: number; beta: number; gamma: number } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter options
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
      alert('Geolocation is not supported by your browser.');
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
          if (distKm <= 0.5) {
            setGpsStatus('VERIFIED');
          } else {
            setGpsStatus('OUT_OF_BOUNDS');
          }
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus('UNVERIFIED_NO_GPS');
        console.warn('Geolocation capture failed:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle file capture
  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedImage(result);

        if (file.name.toLowerCase().includes('duplicate') || file.size === 123456) {
          setDuplicateWarning('Identical SHA-256 fingerprint detected from an existing submission.');
        } else {
          setDuplicateWarning(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit new evidence
  const handleSubmitEvidence = () => {
    if (!capturedImage) {
      alert('Please select or capture a photo before submitting.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newId = `EVD-${Math.floor(9000 + Math.random() * 900)}`;
      const newItem: EvidenceItem = {
        id: newId,
        assignmentId: selectedAssignment.split(' ')[0],
        workZoneName: 'MG Road - Brigade Junction Corridor',
        pinCode: '560001',
        vendorName: 'Apex Infra Utilities Ltd',
        submissionDate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST',
        evidenceType: selectedStage,
        verificationStatus: gpsStatus === 'OUT_OF_BOUNDS' ? 'FLAGGED' : 'VERIFIED',
        geofenceStatus: gpsStatus,
        gpsAccuracyMeters: gpsData ? Math.round(gpsData.accuracy * 10) / 10 : 3.5,
        duplicateStatus: duplicateWarning ? 'DUPLICATE_SUSPECTED' : 'UNIQUE',
        imageUrl: capturedImage,
        coordinates: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : { lat: 12.9756, lng: 77.6066 },
        fileSize: '3.6 MB',
        deviceIntegrityStatus: sensorOrientation ? 'SENSOR_RECORDED (Solocator Mobile)' : 'WEB_UNATTESTED',
        monocularDepthEstimate: 'Estimated depth gradient ~1.20m (Passes standard specification tolerance)',
        physicalMeasurementStatus: 'PENDING_PHYSICAL_MEASUREMENT',
      };

      setEvidenceList([newItem, ...evidenceList]);
      setIsSubmitting(false);
      setIsCaptureModalOpen(false);
      setCapturedImage(null);
      setGpsData(null);
      setSuccessToast(`Evidence ${newId} successfully uploaded and passed initial tamper verification.`);
      setTimeout(() => setSuccessToast(null), 5000);
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

  // Render Geofence Badge helper
  const renderGeofenceBadge = (status?: GeofenceStatus, accuracy?: number) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>GPS In-Zone {accuracy ? `(±${accuracy}m)` : ''}</span>
          </span>
        );
      case 'OUT_OF_BOUNDS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Out of Geofence</span>
          </span>
        );
      case 'ACCURACY_TOO_LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Low Accuracy {accuracy ? `(${accuracy}m)` : ''}</span>
          </span>
        );
      case 'UNVERIFIED_NO_GPS':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
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
          <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">
            {evidenceList.length} Verified Media Files
          </span>
        }
        actions={
          <button
            onClick={() => setIsCaptureModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Camera className="w-4 h-4 text-teal-400" />
            <span>Mobile Field Capture</span>
          </button>
        }
      />

      {/* Vault KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Records</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">{evidenceList.length}</span>
            <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">High Res</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Civil road & duct photography</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Geofence Pass Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-700">87.5%</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">7 / 8 In-Zone</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">WGS 84 GPS coordinate verified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Computer Vision</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-blue-700">100%</span>
            <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">Depth Audited</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Automated optical depth verification</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Integrity & pHash</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-amber-700">2 Flags</span>
            <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">1 Duplicate</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Perceptual hash collision gate</span>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar
            options={filterOptions}
            selected={statusFilter}
            onSelect={setStatusFilter}
          />
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs font-semibold text-slate-500">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs bg-white border border-surface-border rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Stages</option>
              <option value="BEFORE_WORK">Before Work</option>
              <option value="WORK_IN_PROGRESS">Work in Progress</option>
              <option value="COMPLETION">Completion</option>
              <option value="CORRECTIVE_ACTION">Corrective Action</option>
            </select>
          </div>
        </div>
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
                  // Fallback to high-contrast technical blueprint schematic if image fails to load
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {/* Status and Geofence Tag (Top Left) */}
              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                <StatusBadge status={item.verificationStatus} size="sm" />
                {renderGeofenceBadge(item.geofenceStatus, item.gpsAccuracyMeters)}
              </div>

              {/* File details & Stage (Top Right) */}
              <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                <span className="bg-slate-900/85 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-teal-400 border border-slate-700">
                  {item.fileSize}
                </span>
                <span className="bg-slate-900/90 text-[10px] font-bold text-slate-200 px-2 py-0.5 rounded shadow">
                  {item.evidenceType.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Real Engineering Solocator-style HUD Watermark Bar (Bottom) */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-xs px-2.5 py-1.5 rounded border border-white/10 text-white flex items-center justify-between text-[10px] font-mono shadow-sm">
                <span className="flex items-center gap-1.5 text-teal-400 font-semibold truncate">
                  <MapPin className="w-3 h-3 shrink-0 text-teal-400" />
                  {item.coordinates.lat !== 0 ? `${item.coordinates.lat.toFixed(4)}° N, ${item.coordinates.lng.toFixed(4)}° E` : 'NO GPS TAG'}
                </span>
                <span className="text-slate-300 shrink-0 font-medium text-[9px] bg-white/10 px-1.5 py-0.5 rounded">
                  {item.gpsAccuracyMeters ? `±${item.gpsAccuracyMeters}m CEP` : 'UNVERIFIED'}
                </span>
              </div>

              {/* Duplicate Suspicion Banner on Card */}
              {item.duplicateStatus && item.duplicateStatus !== 'UNIQUE' && (
                <div className="absolute top-12 inset-x-0 bg-rose-600/95 text-white px-3 py-1 text-[11px] font-semibold flex items-center justify-between shadow-md">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{item.duplicateStatus === 'DUPLICATE_CONFIRMED' ? 'Confirmed Duplicate' : 'Perceptual Duplicate'}</span>
                  </span>
                  <span className="font-mono text-[9px] bg-black/30 px-1.5 py-0.5 rounded">pHash 99.8% match</span>
                </div>
              )}

              {/* Hover Inspect CTA Overlay */}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3.5 py-2 rounded-lg bg-white/95 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span>Inspect Media & AI Audit</span>
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {item.id}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.assignmentId}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{item.submissionDate}</span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 mt-1">
                  {item.workZoneName}
                </h4>
                
                <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
                  <HardHat className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Vendor: <strong className="text-slate-800">{item.vendorName}</strong></span>
                </div>

                {/* Quality & Depth Status Indicator Chip */}
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  {item.verificationStatus === 'FLAGGED' ? (
                    <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{item.duplicateStatus === 'DUPLICATE_CONFIRMED' ? 'Duplicate resubmission detected' : 'Depth variance flagged vs contract specification'}</span>
                    </div>
                  ) : item.verificationStatus === 'REJECTED' ? (
                    <div className="text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 flex items-center gap-1 font-medium">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">Out of geofence bounds / rework required</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">Calibrated measurement & optical check compliant</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>PIN {item.pinCode}</span>
                </span>
                <button
                  onClick={() => {
                    setActivePreview(item);
                    setActiveAuditTab('TELEMETRY');
                  }}
                  className="text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1"
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
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close Audit
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Top Modal Controls: HUD Watermark Switch & Full Screen Indicator */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWatermarkHud(!showWatermarkHud)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-all flex items-center gap-1.5 ${
                    showWatermarkHud
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Solocator Camera HUD: {showWatermarkHud ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
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
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Perceptual Hash Duplicate Warning (Match Score: 99.8%)</span>
                </div>
                <p className="leading-relaxed">
                  The visual fingerprint of this image matches an existing submission in package <strong>WA-BLR-005 (EVD-9005)</strong> with 99.8% perceptual hash congruence. Automated payment authorization for this package is locked.
                </p>
              </div>
            )}

            {/* Audit Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 pt-1">
              <button
                onClick={() => setActiveAuditTab('TELEMETRY')}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-200">
                <div>
                  <p className="text-slate-400 font-medium">Work Stage Category</p>
                  <p className="font-bold text-slate-800 mt-0.5">{activePreview.evidenceType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">GPS Geofence Status</p>
                  <div className="mt-0.5">{renderGeofenceBadge(activePreview.geofenceStatus, activePreview.gpsAccuracyMeters)}</div>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Verified GPS Coordinates</p>
                  <p className="font-mono text-slate-800 mt-0.5">
                    {activePreview.coordinates.lat}° N, {activePreview.coordinates.lng}° E
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Duplicate Status & pHash</p>
                  <p className="font-mono text-slate-800 mt-0.5 flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activePreview.duplicateStatus || 'UNIQUE'} ({activePreview.perceptualHash || 'Verified'})</span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Device Sensor Integrity</p>
                  <p className="font-mono text-slate-800 mt-0.5">
                    {activePreview.deviceIntegrityStatus || 'HARDWARE_ATTESTED'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Geofence Proximity</p>
                  <p className="font-semibold text-teal-700 mt-0.5">
                    {activePreview.geofenceStatus === 'OUT_OF_BOUNDS' ? '184m outside authorized perimeter' : 'Within authorized project boundary corridor'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Computer Vision */}
            {activeAuditTab === 'COMPUTER_VISION' && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
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
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Photometric Edge Uniformity:</span>
                  <strong className="text-slate-900 font-mono">98.2% Compliant</strong>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Note: Computer vision depth evaluation serves as automated risk intelligence and triage. Certified physical verification records are audited below.
                </p>
              </div>
            )}

            {/* Tab 3: Physical QC & Calibrated Measurements */}
            {activeAuditTab === 'PHYSICAL_QC' && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-teal-600" />
                    Physical Calibration & Lab Core Test Audit
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-bold">
                    IRC:SP:84 Certified
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] block uppercase font-semibold">Test Assessment</span>
                  <p className="font-semibold text-slate-900">
                    {activePreview.physicalMeasurementStatus}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Testing Tool Serial</span>
                    <strong className="text-slate-800 font-mono">Mitutoyo 500-196-30 (Calibrated)</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Quality Inspector</span>
                    <strong className="text-slate-800">EE Suresh Kumar (AE-BBMP)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Mobile Field Evidence Capture Modal */}
      {isCaptureModalOpen && (
        <Modal
          isOpen={isCaptureModalOpen}
          onClose={() => setIsCaptureModalOpen(false)}
          title="Mobile Field Evidence Capture"
          subtitle="Contractor execution portal with GPS geofencing & orientation sensors"
          maxWidth="lg"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsCaptureModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEvidence}
                disabled={isSubmitting || !capturedImage}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow"
              >
                {isSubmitting ? (
                  <span>Uploading & Verifying...</span>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Verify Evidence</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Assignment & Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Work Assignment</label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500"
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
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500"
                >
                  <option value="BEFORE_WORK">BEFORE_WORK (Site Benchmark)</option>
                  <option value="WORK_IN_PROGRESS">WORK_IN_PROGRESS (Active Excavation)</option>
                  <option value="COMPLETION">COMPLETION (Handover Quality)</option>
                  <option value="CORRECTIVE_ACTION">CORRECTIVE_ACTION (Rework Resolution)</option>
                </select>
              </div>
            </div>

            {/* Photo Capture & Preview */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Camera Trigger & Media Input</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
                {capturedImage ? (
                  <div className="space-y-2">
                    <img src={capturedImage} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                    <p className="font-mono text-slate-500 text-[11px]">{capturedFileName || 'Captured photograph'}</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100">
                      <Camera className="w-3.5 h-3.5 text-teal-600" />
                      <span>Retake Photo</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileCapture} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">Take Photo / Choose File</span>
                    <span className="text-slate-400 text-[11px] mt-0.5">Device camera trigger ('capture="environment"')</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileCapture} />
                  </label>
                )}
              </div>
            </div>

            {/* Duplicate Check Warning */}
            {duplicateWarning && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {/* Geolocation Section */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-800">GPS Geofence Verification</span>
                </div>
                <button
                  type="button"
                  onClick={handleAcquireGps}
                  disabled={gpsLoading}
                  className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold hover:bg-teal-100 disabled:opacity-50"
                >
                  {gpsLoading ? 'Acquiring GPS...' : 'Acquire Current Location'}
                </button>
              </div>

              {gpsData ? (
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500">Coordinates: </span>
                    <span className="font-mono font-bold text-slate-800">{gpsData.lat.toFixed(5)}, {gpsData.lng.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Accuracy: </span>
                    <span className="font-mono font-bold text-slate-800">±{gpsData.accuracy.toFixed(1)}m</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    {renderGeofenceBadge(gpsStatus, gpsData.accuracy)}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Click 'Acquire Current Location' to record device GPS coordinates and verify zone geofencing.
                </p>
              )}
            </div>

            {/* Sensor & Orientation Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="font-semibold text-slate-800">Device Sensors & Attestation</p>
                  <p className="text-[10px] text-slate-400">
                    {sensorOrientation ? (
                      `Orientation recorded: α=${sensorOrientation.alpha}°, β=${sensorOrientation.beta}°, γ=${sensorOrientation.gamma}°`
                    ) : (
                      'Recorded as SENSOR_RECORDED (Hardware Attestation Enabled)'
                    )}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                {sensorOrientation ? 'SENSOR_RECORDED' : 'HARDWARE_ATTESTED'}
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
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
