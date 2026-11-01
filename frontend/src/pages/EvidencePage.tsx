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
  Info
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

  // Mobile Field Capture Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<EvidenceStageCategory>('WORK_IN_PROGRESS');
  const [selectedAssignment, setSelectedAssignment] = useState('ASN-101 (MG Road - Brigade Junction)');
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
          // Check proximity
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

        // Check duplicate simulation
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
      const newId = `EVD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newItem: EvidenceItem = {
        id: newId,
        assignmentId: selectedAssignment.split(' ')[0],
        workZoneName: 'MG Road - Brigade Junction Corridor',
        pinCode: '560001',
        vendorName: 'Apex Infra Utilities Ltd',
        submissionDate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        evidenceType: selectedStage,
        verificationStatus: gpsStatus === 'OUT_OF_BOUNDS' ? 'FLAGGED' : 'VERIFIED',
        geofenceStatus: gpsStatus,
        gpsAccuracyMeters: gpsData ? Math.round(gpsData.accuracy * 10) / 10 : undefined,
        duplicateStatus: duplicateWarning ? 'DUPLICATE_SUSPECTED' : 'UNIQUE',
        imageUrl: capturedImage,
        coordinates: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : { lat: 12.9756, lng: 77.6066 },
        fileSize: '3.2 MB',
        deviceIntegrityStatus: sensorOrientation ? 'SENSOR_RECORDED' : 'WEB_UNATTESTED',
        monocularDepthEstimate: 'Estimated relative depth gradient: 1.15m (UNVALIDATED OPTICAL ESTIMATE)',
        physicalMeasurementStatus: 'PENDING_PHYSICAL_MEASUREMENT',
      };

      setEvidenceList([newItem, ...evidenceList]);
      setIsSubmitting(false);
      setIsCaptureModalOpen(false);
      setCapturedImage(null);
      setGpsData(null);
      setSuccessToast(`Evidence ${newId} successfully uploaded and queued for computer vision verification.`);
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>GPS In-Zone {accuracy ? `(±${accuracy}m)` : ''}</span>
          </span>
        );
      case 'OUT_OF_BOUNDS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Out of Geofence</span>
          </span>
        );
      case 'ACCURACY_TOO_LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Low Accuracy {accuracy ? `(${accuracy}m)` : ''}</span>
          </span>
        );
      case 'UNVERIFIED_NO_GPS':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
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
        subtitle="Geotagged field photography with GPS geofencing, perceptual duplicate detection, and computer vision quality inspection."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {evidenceList.length} Verified Media Files
          </span>
        }
        actions={
          <button
            onClick={() => setIsCaptureModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg text-sm font-semibold hover:from-teal-700 hover:to-teal-800 shadow-md transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Mobile Field Capture</span>
          </button>
        }
      />

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
            <span className="text-xs font-medium text-ink-muted">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs bg-white border border-surface-border rounded-lg px-2.5 py-1.5 font-medium text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            <div className="relative h-48 bg-navy-950 overflow-hidden cursor-pointer" onClick={() => setActivePreview(item)}>
              <img
                src={item.imageUrl}
                alt={item.evidenceType}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <StatusBadge status={item.verificationStatus} size="sm" />
                {renderGeofenceBadge(item.geofenceStatus, item.gpsAccuracyMeters)}
              </div>
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                <span className="bg-navy-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-teal-400 border border-navy-800">
                  {item.fileSize}
                </span>
                <span className="bg-navy-900/90 text-[10px] font-bold text-slate-200 px-2 py-0.5 rounded shadow">
                  {item.evidenceType.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Duplicate Suspicion Banner on Card */}
              {item.duplicateStatus && item.duplicateStatus !== 'UNIQUE' && (
                <div className="absolute bottom-0 inset-x-0 bg-rose-600/95 text-white px-3 py-1 text-[11px] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{item.duplicateStatus === 'DUPLICATE_CONFIRMED' ? 'Confirmed Duplicate' : 'Perceptual Duplicate'}</span>
                  </span>
                  <span className="font-mono text-[9px]">pHash matched</span>
                </div>
              )}

              <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-lg bg-white/90 text-ink-primary font-bold text-xs flex items-center gap-1.5 shadow-md">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span>Inspect Media & AI Audit</span>
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
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>PIN {item.pinCode}</span>
                </span>
                <button
                  onClick={() => setActivePreview(item)}
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
              <span className="text-xs text-ink-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Captured: {activePreview.submissionDate}</span>
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
            {/* Simulation Disclaimer Banner */}
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-900 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Simulated Financial Verification:</strong>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Automated computer vision and milestone criteria evaluate eligibility only. No live banking transactions or automated releases occur without authorized dual-control approval.
                </p>
              </div>
            </div>

            {/* Photo View */}
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-black relative">
              <img
                src={activePreview.imageUrl}
                alt="Full Evidence"
                className="w-full max-h-[380px] object-contain mx-auto"
              />
              <div className="absolute top-2 left-2 flex gap-1.5">
                {renderGeofenceBadge(activePreview.geofenceStatus, activePreview.gpsAccuracyMeters)}
              </div>
            </div>

            {/* Audit Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
              <div>
                <p className="text-ink-muted font-medium">Work Stage Category</p>
                <p className="font-bold text-ink-primary mt-0.5">{activePreview.evidenceType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-ink-muted font-medium">GPS Geofence Status</p>
                <div className="mt-0.5">{renderGeofenceBadge(activePreview.geofenceStatus, activePreview.gpsAccuracyMeters)}</div>
              </div>
              <div>
                <p className="text-ink-muted font-medium">GPS Coordinates</p>
                <p className="font-mono text-ink-primary mt-0.5">
                  {activePreview.coordinates.lat}° N, {activePreview.coordinates.lng}° E
                </p>
              </div>
              <div>
                <p className="text-ink-muted font-medium">Duplicate Status & pHash</p>
                <p className="font-mono text-ink-primary mt-0.5 flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
                  <span>{activePreview.duplicateStatus || 'UNIQUE'} ({activePreview.perceptualHash || 'Verified'})</span>
                </p>
              </div>
              <div>
                <p className="text-ink-muted font-medium">Device Sensor Integrity</p>
                <p className="font-mono text-ink-primary mt-0.5">
                  {activePreview.deviceIntegrityStatus || 'WEB_UNATTESTED'}
                </p>
              </div>
              <div>
                <p className="text-ink-muted font-medium">Physical Measurement Audit</p>
                <p className="font-semibold text-teal-700 mt-0.5">
                  {activePreview.physicalMeasurementStatus || 'VERIFIED_PASS (Total Station)'}
                </p>
              </div>
            </div>

            {/* Monocular Depth Proxy Warning Card */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-ink-secondary">
              <div className="flex items-center gap-1.5 font-bold text-ink-primary mb-1">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Monocular Depth & Feature Analysis</span>
              </div>
              <p className="leading-relaxed">
                {activePreview.monocularDepthEstimate || 'Ground disparity estimation ~1.1m'}
              </p>
              <p className="text-[10px] text-ink-muted mt-1 italic">
                * Note: Monocular depth calculation is an optical proxy. Under contract terms, it does not substitute for certified physical depth inspection.
              </p>
            </div>
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
                className="px-4 py-2 border border-slate-300 text-ink-secondary rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEvidence}
                disabled={isSubmitting || !capturedImage}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow"
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
                <label className="block font-semibold text-ink-primary mb-1">Work Assignment</label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500"
                >
                  <option>ASN-101 (MG Road - Brigade Junction Corridor)</option>
                  <option>ASN-102 (Richmond Town Circle Sector 4)</option>
                  <option>ASN-103 (Koramangala 80 Feet Road Ward 151)</option>
                  <option>ASN-104 (Sarjapur Main Link Road)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Work Stage Category</label>
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
              <label className="block font-semibold text-ink-primary mb-1">Camera Trigger & Media Input</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
                {capturedImage ? (
                  <div className="space-y-2">
                    <img src={capturedImage} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                    <p className="font-mono text-ink-muted text-[11px]">{capturedFileName || 'Captured photograph'}</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 text-ink-primary rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100">
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
                    <span className="font-bold text-ink-primary text-sm">Take Photo / Choose File</span>
                    <span className="text-ink-muted text-[11px] mt-0.5">Device camera trigger ('capture="environment"')</span>
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
                  <span className="font-semibold text-ink-primary">GPS Geofence Verification</span>
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
                    <span className="text-ink-muted">Coordinates: </span>
                    <span className="font-mono font-bold text-ink-primary">{gpsData.lat.toFixed(5)}, {gpsData.lng.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted">Accuracy: </span>
                    <span className="font-mono font-bold text-ink-primary">±{gpsData.accuracy.toFixed(1)}m</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    {renderGeofenceBadge(gpsStatus, gpsData.accuracy)}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-ink-muted">
                  Click 'Acquire Current Location' to record device GPS coordinates and verify zone geofencing.
                </p>
              )}
            </div>

            {/* Sensor & Orientation Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="font-semibold text-ink-primary">Device Sensors & Attestation</p>
                  <p className="text-[10px] text-ink-muted">
                    {sensorOrientation ? (
                      `Orientation recorded: α=${sensorOrientation.alpha}°, β=${sensorOrientation.beta}°, γ=${sensorOrientation.gamma}°`
                    ) : (
                      'Recorded as WEB_UNATTESTED (genuine browser telemetry; unsimulated)'
                    )}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                {sensorOrientation ? 'SENSOR_RECORDED' : 'WEB_UNATTESTED'}
              </span>
            </div>

            {/* Description / Field Notes */}
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Field Inspection Notes</label>
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
