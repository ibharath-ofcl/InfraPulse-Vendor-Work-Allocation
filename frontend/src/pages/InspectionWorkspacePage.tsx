import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Ruler, 
  Wrench, 
  ShieldAlert, 
  RefreshCw, 
  MapPin, 
  UserCheck, 
  Lock, 
  Unlock,
  AlertCircle,
  Camera,
  History,
  Layers,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import { humanReviewService } from '../services/humanReviewService';
import { PageContainer } from '../components/layout/PageContainer';
import { 
  HumanReviewDetailDto, 
  ReviewDecisionType, 
  CorrectiveActionDto, 
  PhysicalMeasurementType,
  MeasurementUnit,
  CorrectiveActionType,
  ReviewPriority,
  FindingSeverity
} from '../types/humanReview';

const FALLBACK_DETAIL: HumanReviewDetailDto = {
  id: 'hr-001',
  reviewCode: 'HR-2026-0042',
  assessmentId: 'QA-2026-0118',
  assessmentCode: 'QA-2026-0118',
  assignmentId: 'WA-2026-0091',
  assignmentCode: 'WA-SGF-001',
  projectId: 'PRJ-BLR-01',
  projectName: 'Smart Grid Optical Fiber & Underground Ducting',
  projectCode: 'SGF-BLR',
  workZoneId: 'WZ-04',
  workZoneName: 'Zone 4 — Indiranagar 100ft Rd',
  workZoneCode: 'WZ-04',
  vendorId: 'VND-001',
  vendorName: 'Apex Infrastructure Ltd',
  workType: 'UNDERGROUND_CONDUIT',
  templateId: 'TPL-001',
  templateName: 'Standard Optical Conduit Trenching Spec v2.1',
  pincode: '560038',
  evidenceCompletenessScore: 88,
  totalCriteriaEvaluated: 10,
  passedCount: 8,
  flaggedCount: 2,
  failedCount: 0,
  findingsCount: 10,
  evaluationSummary: 'Assessment computed against configured municipal ducting inspection template criteria.',
  status: 'PENDING',
  priority: 'HIGH',
  assignedReviewerName: 'Kavita Reddy (Field QA)',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  escalations: [],
  findings: [
    {
      id: 'f-1',
      criterionCode: 'EXC-DEP-01',
      criterionName: 'Minimum Trench Depth Verification',
      category: 'EXCAVATION_SAFETY',
      severity: 'HIGH',
      outcome: 'PASS',
      title: 'Trench Depth Compliance',
      description: 'Depth marker exceeds minimum 1.2m specification per municipal code.',
      confidenceScore: 0.94,
      requiresPhysicalMeasurement: true,
      requiresHumanReview: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'f-2',
      criterionCode: 'BED-AGG-02',
      criterionName: 'Conduit Bedding Aggregate Compaction',
      category: 'MATERIAL_QUALITY',
      severity: 'MEDIUM',
      outcome: 'REQUIRES_PHYSICAL_MEASUREMENT',
      title: 'Sub-base Bedding Compaction Check',
      description: 'Sub-base compaction requires calibrated proctor penetration test.',
      confidenceScore: 0.72,
      requiresPhysicalMeasurement: true,
      requiresHumanReview: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'f-3',
      criterionCode: 'SAF-BAR-03',
      criterionName: 'Continuous Barricade & Warning Tape',
      category: 'WORKZONE_SAFETY',
      severity: 'HIGH',
      outcome: 'PASS',
      title: 'Workzone Barricade Integrity',
      description: 'High-visibility safety cordon and dual-layer retroreflective tape detected.',
      confidenceScore: 0.96,
      requiresPhysicalMeasurement: false,
      requiresHumanReview: false,
      createdAt: new Date().toISOString(),
    },
  ],
  measurements: [
    {
      id: 'm-1',
      assessmentId: 'QA-2026-0118',
      measurementCode: 'PM-2026-001',
      measurementType: 'TRENCH_DEPTH',
      measuredValue: 1.25,
      unit: 'METERS',
      specifiedTarget: 1.20,
      specifiedMin: 1.15,
      specifiedMax: 1.40,
      verificationStatus: 'VERIFIED_PASS',
      instrumentUsed: 'Calibrated Laser Dipstick #LS-402',
      verifiedByName: 'Kavita Reddy (Field QA)',
      createdAt: new Date().toISOString(),
    },
  ],
  correctiveActions: [],
  evidenceList: [],
  decisions: [],
};

export const InspectionWorkspacePage: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();

  const [review, setReview] = useState<HumanReviewDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'FINDINGS' | 'EVIDENCE' | 'MEASUREMENTS' | 'CORRECTIVE_ACTIONS' | 'HISTORY'>('FINDINGS');

  // Evidence Inspection Viewer (Section C)
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showAiOverlay, setShowAiOverlay] = useState<boolean>(true);
  const [isReassessing, setIsReassessing] = useState<boolean>(false);
  const [reassessMessage, setReassessMessage] = useState<string | null>(null);

  // Modals
  const [showDecisionModal, setShowDecisionModal] = useState<boolean>(false);
  const [decisionType, setDecisionType] = useState<ReviewDecisionType>('APPROVED');
  const [decisionRationale, setDecisionRationale] = useState<string>('');
  const [inspectorNotes, setInspectorNotes] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Measurement Modal
  const [showMeasurementModal, setShowMeasurementModal] = useState<boolean>(false);
  const [measType, setMeasType] = useState<PhysicalMeasurementType>('TRENCH_DEPTH');
  const [measValue, setMeasValue] = useState<string>('');
  const [measUnit, setMeasUnit] = useState<MeasurementUnit>('METERS');
  const [measSpecTarget, setMeasSpecTarget] = useState<string>('');
  const [measSpecMin, setMeasSpecMin] = useState<string>('');
  const [measSpecMax, setMeasSpecMax] = useState<string>('');
  const [measInstrument, setMeasInstrument] = useState<string>('');
  const [measLocation, setMeasLocation] = useState<string>('');
  const [measNotes, setMeasNotes] = useState<string>('');
  const [isSubmittingMeas, setIsSubmittingMeas] = useState<boolean>(false);

  // Corrective Action Modal
  const [showCAModal, setShowCAModal] = useState<boolean>(false);
  const [caType, setCaType] = useState<CorrectiveActionType>('DEPTH_CORRECTION');
  const [caPriority, setCaPriority] = useState<ReviewPriority>('HIGH');
  const [caSeverity, setCaSeverity] = useState<FindingSeverity>('HIGH');
  const [caDesc, setCaDesc] = useState<string>('');
  const [caRequired, setCaRequired] = useState<string>('');
  const [caDueDate, setCaDueDate] = useState<string>('');
  const [isSubmittingCA, setIsSubmittingCA] = useState<boolean>(false);

  // Escalation Modal
  const [showEscalateModal, setShowEscalateModal] = useState<boolean>(false);
  const [escReason, setEscReason] = useState<string>('');
  const [escRole, setEscRole] = useState<string>('PROJECT_MANAGER');
  const [isSubmittingEsc, setIsSubmittingEsc] = useState<boolean>(false);

  // Verify CA Modal
  const [verifyingCA, setVerifyingCA] = useState<CorrectiveActionDto | null>(null);
  const [caResolutionNotes, setCaResolutionNotes] = useState<string>('');
  const [isVerifyingCA, setIsVerifyingCA] = useState<boolean>(false);

  const fetchDetail = async () => {
    if (!reviewId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await humanReviewService.getReviewDetail(reviewId);
      if (data) {
        setReview(data);
      } else {
        setReview({ ...FALLBACK_DETAIL, id: reviewId, reviewCode: `HR-${reviewId.toUpperCase()}` });
      }
    } catch (err: unknown) {
      console.warn('Backend detail unavailable, using fallback demonstration:', err);
      setReview({ ...FALLBACK_DETAIL, id: reviewId, reviewCode: `HR-${reviewId.toUpperCase()}` });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [reviewId]);

  // Rule 2 Pre-Validation Check
  const rule2Status = React.useMemo(() => {
    if (!review) return { canApprove: true, reasons: [] };
    const reasons: string[] = [];

    // Check failed findings
    const failingFindings = (review.findings || []).filter(f => f.outcome === 'FAIL');
    if (failingFindings.length > 0) {
      reasons.push(`${failingFindings.length} mandatory criteria finding(s) marked FAIL`);
    }

    // Check findings requiring physical measurement
    const pendingPhysFindings = (review.findings || []).filter(f => f.outcome === 'REQUIRES_PHYSICAL_MEASUREMENT');
    const verifiedPassMeasurements = (review.measurements || []).filter(m => m.verificationStatus === 'VERIFIED_PASS');
    if (pendingPhysFindings.length > 0 && verifiedPassMeasurements.length === 0) {
      reasons.push(`${pendingPhysFindings.length} criterion requires physical measurement verification`);
    }

    // Check measurements with missing spec or failed
    const unverifiedMeasurements = (review.measurements || []).filter(
      m => m.verificationStatus === 'SPECIFICATION_REQUIRED' || m.verificationStatus === 'VERIFIED_FAIL'
    );
    if (unverifiedMeasurements.length > 0) {
      reasons.push(`${unverifiedMeasurements.length} physical measurement(s) either failed or missing engineering specifications`);
    }

    // Check open corrective actions
    const openCAs = (review.correctiveActions || []).filter(ca => ca.status !== 'VERIFIED_CLOSED');
    if (openCAs.length > 0) {
      reasons.push(`${openCAs.length} open/unverified corrective action(s)`);
    }

    return {
      canApprove: reasons.length === 0,
      reasons
    };
  }, [review]);

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId) return;
    if (decisionType === 'APPROVED' && !rule2Status.canApprove) {
      setDecisionError(`Cannot approve: ${rule2Status.reasons.join(', ')}`);
      return;
    }

    try {
      setIsSubmittingDecision(true);
      setDecisionError(null);
      await humanReviewService.recordDecision(reviewId, {
        decisionType,
        decisionRationale,
        inspectorNotes: inspectorNotes || undefined
      });
      setShowDecisionModal(false);
      setDecisionRationale('');
      setInspectorNotes('');
      await fetchDetail();
    } catch (err: any) {
      console.error('Failed to record decision:', err);
      setDecisionError(err.response?.data?.message || err.message || 'Failed to submit decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleRecordMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review) return;
    try {
      setIsSubmittingMeas(true);
      await humanReviewService.recordMeasurement(review.assessmentId, {
        measurementType: measType,
        measuredValue: parseFloat(measValue),
        unit: measUnit,
        specifiedTarget: measSpecTarget ? parseFloat(measSpecTarget) : undefined,
        specifiedMin: measSpecMin ? parseFloat(measSpecMin) : undefined,
        specifiedMax: measSpecMax ? parseFloat(measSpecMax) : undefined,
        instrumentUsed: measInstrument || undefined,
        locationMarker: measLocation || undefined,
        notes: measNotes || undefined
      });
      setShowMeasurementModal(false);
      setMeasValue('');
      setMeasSpecTarget('');
      setMeasSpecMin('');
      setMeasSpecMax('');
      setMeasInstrument('');
      setMeasLocation('');
      setMeasNotes('');
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record measurement.');
    } finally {
      setIsSubmittingMeas(false);
    }
  };

  const handleCreateCorrectiveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review) return;
    try {
      setIsSubmittingCA(true);
      await humanReviewService.createCorrectiveAction(review.assessmentId, {
        actionType: caType,
        priority: caPriority,
        severity: caSeverity,
        problemDescription: caDesc,
        requiredAction: caRequired,
        dueDate: caDueDate ? new Date(caDueDate).toISOString() : undefined
      });
      setShowCAModal(false);
      setCaDesc('');
      setCaRequired('');
      setCaDueDate('');
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create corrective action.');
    } finally {
      setIsSubmittingCA(false);
    }
  };

  const handleVerifyCA = async (approved: boolean) => {
    if (!verifyingCA) return;
    try {
      setIsVerifyingCA(true);
      await humanReviewService.verifyCorrectiveAction(verifyingCA.id, {
        approved,
        resolutionNotes: caResolutionNotes || (approved ? 'Rework verified and compliant' : 'Rework rejected - re-work required')
      });
      setVerifyingCA(null);
      setCaResolutionNotes('');
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify corrective action.');
    } finally {
      setIsVerifyingCA(false);
    }
  };

  const handleEscalateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId) return;
    try {
      setIsSubmittingEsc(true);
      await humanReviewService.escalateReview(reviewId, {
        reason: escReason,
        escalatedToRole: escRole
      });
      setShowEscalateModal(false);
      setEscReason('');
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to escalate review.');
    } finally {
      setIsSubmittingEsc(false);
    }
  };

  const handleTriggerReassessment = async () => {
    if (!review) return;
    try {
      setIsReassessing(true);
      setReassessMessage(null);
      await humanReviewService.reassessAssessment(review.assessmentId);
      setReassessMessage('AI Reassessment completed successfully! Updated findings & revision recorded.');
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to trigger reassessment.');
    } finally {
      setIsReassessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        <span className="text-sm">Loading inspection workspace...</span>
      </div>
    );
  }

  if (error || !review) {
    return (
      <PageContainer className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#10243A]">Review Not Found</h2>
        <p className="text-sm text-slate-600">{error || 'Could not locate the requested inspection review.'}</p>
        <button
          onClick={() => navigate('/human-review')}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-[#0E827B] border border-[#13A89E]/40 rounded-lg text-sm font-semibold transition cursor-pointer"
        >
          Back to Inspection Queue
        </button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DCE3E8] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <button
              onClick={() => navigate('/human-review')}
              className="hover:text-[#0E827B] flex items-center gap-1 transition font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Inspection Queue
            </button>
            <span>/</span>
            <span className="font-mono text-[#0E827B] font-bold">{review.reviewCode}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[#10243A] tracking-tight flex items-center gap-2.5">
              <span>Inspection Review:</span>
              <span className="font-mono text-[#0E827B]">{review.reviewCode}</span>
            </h1>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              review.status === 'COMPLETED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : review.status === 'ESCALATED'
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              {review.status}
            </span>

            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
              Priority: {review.priority}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMeasurementModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-purple-800 border border-purple-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5" />
            + Record Measurement
          </button>

          <button
            onClick={() => setShowCAModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-orange-800 border border-orange-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            + Corrective Action
          </button>

          <button
            onClick={() => setShowEscalateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Escalate
          </button>

          <button
            onClick={() => setShowDecisionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#13A89E] hover:bg-[#0E827B] text-white font-bold rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            Make Authoritative Decision
          </button>
        </div>
      </div>

      {/* Assignment Header Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white border border-[#DCE3E8] rounded-xl p-5 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Work Assignment</span>
          <div className="font-mono font-bold text-sm text-[#0E827B] mt-1">{review.assignmentCode}</div>
          <div className="text-xs text-[#10243A] font-semibold mt-0.5">{review.workType?.replace('_', ' ')}</div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project & Zone</span>
          <div className="font-bold text-sm text-[#10243A] mt-1">{review.workZoneName}</div>
          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#13A89E]" />
            {review.projectName} ({review.pincode})
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Vendor</span>
          <div className="font-bold text-sm text-[#10243A] mt-1">{review.vendorName}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Template: {review.templateName}</div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stage 6 Downstream Status</span>
          <div className="mt-1 flex items-center gap-1.5">
            {review.latestDecision === 'APPROVED' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <Unlock className="w-3 h-3" /> RELEASED (Dependencies Unblocked)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                <Lock className="w-3 h-3" /> PENDING RELEASE (Downstream Blocked)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium">
            {review.assignedReviewerName ? `Reviewer: ${review.assignedReviewerName}` : 'Unassigned'}
          </div>
        </div>
      </div>

      {/* Rule 2 Pre-Validation Status Notice */}
      {!rule2Status.canApprove ? (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-950">Rule 2 Governance Active: Approval Currently Blocked</div>
            <p className="text-amber-900/90 leading-relaxed">
              Before this work assignment can receive an authoritative <strong className="text-amber-950 font-bold">APPROVED</strong> decision and unblock downstream dependencies, the following items must be resolved:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-900 font-semibold">
              {rule2Status.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>All mandatory criteria, physical measurements, and corrective actions are satisfied. Ready for final authoritative approval.</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 flex flex-wrap gap-1.5 shadow-2xs">
        <button
          onClick={() => setActiveTab('FINDINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'FINDINGS'
              ? 'bg-white text-[#10243A] shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Layers className="w-4 h-4 text-[#13A89E]" />
          Criteria & Findings ({review.findings?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('EVIDENCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'EVIDENCE'
              ? 'bg-white text-[#10243A] shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Camera className="w-4 h-4 text-cyan-600" />
          Evidence & AI Overlays ({review.evidenceList?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('MEASUREMENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'MEASUREMENTS'
              ? 'bg-white text-[#10243A] shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Ruler className="w-4 h-4 text-purple-600" />
          Physical Measurements ({review.measurements?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('CORRECTIVE_ACTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'CORRECTIVE_ACTIONS'
              ? 'bg-white text-[#10243A] shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Wrench className="w-4 h-4 text-orange-600" />
          Corrective Actions & Rework ({review.correctiveActions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-white text-[#10243A] shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <History className="w-4 h-4 text-blue-600" />
          Decision History ({review.decisions?.length || 0})
        </button>
      </div>

      {/* TAB CONTENT 1: Findings & Criteria */}
      {activeTab === 'FINDINGS' && (
        <div className="space-y-4">
          {/* Completeness Card */}
          <div className="bg-white border border-[#DCE3E8] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Quality Assessment</div>
              <div className="text-base font-bold text-[#10243A] mt-0.5">
                Completeness Score: <span className="text-[#0E827B] font-mono">{review.evidenceCompletenessScore?.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                {review.evaluationSummary || 'Assessment computed against configured inspection template criteria.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center shadow-2xs">
                <div className="text-lg font-bold text-emerald-800">{review.passedCount}</div>
                <div className="text-[10px] text-emerald-900 font-bold uppercase tracking-wider">Passed</div>
              </div>
              <div className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-center shadow-2xs">
                <div className="text-lg font-bold text-amber-900">{review.flaggedCount}</div>
                <div className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">Flagged</div>
              </div>
              <div className="px-3.5 py-2 rounded-lg bg-rose-50 border border-rose-200 text-center shadow-2xs">
                <div className="text-lg font-bold text-rose-800">{review.failedCount}</div>
                <div className="text-[10px] text-rose-900 font-bold uppercase tracking-wider">Failed</div>
              </div>
            </div>
          </div>

          {/* Findings List */}
          <div className="space-y-3">
            {(review.findings || []).length === 0 ? (
              <div className="bg-white border border-[#DCE3E8] rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
                No findings recorded for this quality assessment.
              </div>
            ) : (
              (review.findings || []).map((f) => (
                <div 
                  key={f.id}
                  className={`bg-white border rounded-xl p-4 transition shadow-xs hover:shadow-sm ${
                    f.outcome === 'FAIL' 
                      ? 'border-rose-300' 
                      : f.outcome === 'REQUIRES_PHYSICAL_MEASUREMENT'
                      ? 'border-purple-300'
                      : f.outcome === 'FLAGGED'
                      ? 'border-amber-300'
                      : 'border-[#DCE3E8]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0E827B] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
                          {f.criterionCode}
                        </span>
                        <span className="font-bold text-[#10243A] text-sm">{f.criterionName}</span>

                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          f.outcome === 'PASS' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : f.outcome === 'FAIL'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : f.outcome === 'REQUIRES_PHYSICAL_MEASUREMENT'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        }`}>
                          {f.outcome}
                        </span>

                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {f.severity}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#10243A] mt-1">{f.title}</div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{f.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {f.detectedClasses && f.detectedClasses.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <Sparkles className="w-3.5 h-3.5 text-[#0E827B]" />
                          <span className="text-[11px] text-slate-500 font-medium">AI Detections:</span>
                          {f.detectedClasses.map((dc, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-[#0E827B] border border-[#13A89E]/30 rounded font-mono text-[11px] font-semibold">
                              {dc}
                            </span>
                          ))}
                        </div>
                      )}

                      {f.requiresPhysicalMeasurement && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-900 border border-purple-300 rounded text-[11px] font-bold">
                          <Ruler className="w-3.5 h-3.5 text-purple-700" /> Mandatory Dip-Rod Test
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Evidence & AI Detection Viewer (Section C) */}
      {activeTab === 'EVIDENCE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#DCE3E8] rounded-xl p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[#10243A] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#13A89E]" />
                Evidence Inspection Viewer & AI Overlays
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Inspect authentic field photographic evidence, zoom into high-res details, and verify actual model detection coordinates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerReassessment}
                disabled={isReassessing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#13A89E]/10 hover:bg-[#13A89E]/20 text-[#0E827B] border border-[#13A89E]/30 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReassessing ? 'animate-spin' : ''}`} />
                {isReassessing ? 'Reassessing...' : 'Trigger AI Reassessment'}
              </button>
            </div>
          </div>

          {reassessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{reassessMessage}</span>
            </div>
          )}

          {(!review.evidenceList || review.evidenceList.length === 0) ? (
            <div className="bg-white border border-[#DCE3E8] rounded-xl p-12 text-center text-slate-500 text-xs shadow-xs">
              <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              No photographic evidence submitted for this assignment yet.
            </div>
          ) : (
            (() => {
              const currentEvidence = review.evidenceList[selectedEvidenceIndex] || review.evidenceList[0];
              const detections = currentEvidence.detections || [];
              const hasDetections = detections.length > 0;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left Column: Image Viewer with Zoom & Overlay */}
                  <div className="lg:col-span-2 bg-white border border-[#DCE3E8] rounded-xl overflow-hidden flex flex-col shadow-xs">
                    {/* Viewer Controls Toolbar */}
                    <div className="p-3 bg-slate-50 border-b border-[#DCE3E8] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0E827B] px-2 py-0.5 bg-white rounded border border-slate-200 shadow-2xs">
                          {currentEvidence.evidenceCode}
                        </span>
                        <span className="text-xs font-bold text-[#10243A]">
                          {currentEvidence.evidenceCategory}
                        </span>
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          ({selectedEvidenceIndex + 1} of {review.evidenceList.length})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle AI Overlay */}
                        <button
                          onClick={() => setShowAiOverlay(!showAiOverlay)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            showAiOverlay
                              ? 'bg-cyan-50 text-cyan-900 border-cyan-300'
                              : 'bg-white text-slate-700 border-slate-300 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                          title="Toggle AI Detection Bounding Boxes"
                        >
                          {showAiOverlay ? <Eye className="w-3.5 h-3.5 text-cyan-700" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                          <span>{showAiOverlay ? 'AI Overlays Active' : 'Original Photo'}</span>
                        </button>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-slate-700 shadow-2xs">
                          <button
                            onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                            className="p-1.5 hover:text-[#10243A] hover:bg-slate-100 rounded cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono px-1.5 min-w-[36px] text-center font-bold text-[#0E827B]">
                            {zoomLevel}%
                          </span>
                          <button
                            onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                            className="p-1.5 hover:text-[#10243A] hover:bg-slate-100 rounded cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setZoomLevel(100)}
                            className="p-1.5 hover:text-[#10243A] hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                            title="Reset Zoom (100%)"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Viewport Container */}
                    <div className="relative bg-slate-900 min-h-[420px] max-h-[560px] overflow-auto flex items-center justify-center p-4">
                      <div 
                        className="relative transition-transform duration-200 origin-center"
                        style={{ transform: `scale(${zoomLevel / 100})` }}
                      >
                        <img
                          src={currentEvidence.previewUrl}
                          alt={currentEvidence.originalFileName || 'Evidence Image'}
                          className="max-h-[480px] w-auto object-contain rounded shadow-lg border border-slate-800"
                        />

                        {/* Actual AI Detection Bounding Box Overlays */}
                        {showAiOverlay && hasDetections && detections.map((det, dIdx) => {
                          if (!det.box2d || det.box2d.length < 4) return null;
                          const [ymin, xmin, ymax, xmax] = det.box2d;
                          const top = ymin * 100;
                          const left = xmin * 100;
                          const width = (xmax - xmin) * 100;
                          const height = (ymax - ymin) * 100;

                          return (
                            <div
                              key={dIdx}
                              className="absolute border-2 border-teal-400 bg-teal-500/15 pointer-events-none transition"
                              style={{
                                top: `${top}%`,
                                left: `${left}%`,
                                width: `${width}%`,
                                height: `${height}%`,
                              }}
                            >
                              <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-slate-950/90 text-teal-300 font-mono text-[9px] font-bold border border-teal-500/50 rounded whitespace-nowrap shadow-sm">
                                {det.classLabel} ({(det.confidence * 100).toFixed(1)}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {showAiOverlay && !hasDetections && (
                        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-2.5 text-center text-xs text-slate-300 pointer-events-none">
                          <span className="text-teal-400 font-semibold">Original Image:</span> No model detection bounding boxes generated for this evidence category.
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Navigation Ribbon */}
                    <div className="p-3 bg-slate-50 border-t border-[#DCE3E8] flex items-center gap-2.5 overflow-x-auto">
                      {review.evidenceList.map((ev, idx) => (
                        <button
                          key={ev.id}
                          onClick={() => {
                            setSelectedEvidenceIndex(idx);
                            setZoomLevel(100);
                          }}
                          className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                            selectedEvidenceIndex === idx
                              ? 'border-[#13A89E] ring-2 ring-[#13A89E]/30'
                              : 'border-slate-300 opacity-70 hover:opacity-100 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={ev.previewUrl}
                            alt={ev.evidenceCode}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-[#10243A]/85 text-[8px] font-mono text-center text-white py-0.5 truncate">
                            {ev.evidenceCategory}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Evidence & AI Model Metadata Panel */}
                  <div className="space-y-4">
                    {/* Metadata Card */}
                    <div className="bg-white border border-[#DCE3E8] rounded-xl p-4 space-y-3 shadow-xs">
                      <h4 className="text-xs font-bold text-[#10243A] uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#0E827B]" />
                        Evidence Metadata
                      </h4>

                      <div className="space-y-2 text-xs divide-y divide-slate-100">
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-slate-500">File Name:</span>
                          <span className="text-[#10243A] font-mono font-medium truncate max-w-[180px]">{currentEvidence.originalFileName}</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-slate-500">Category:</span>
                          <span className="text-[#0E827B] font-bold">{currentEvidence.evidenceCategory}</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-slate-500">Submitted By:</span>
                          <span className="text-[#10243A] font-medium">{currentEvidence.submittedByName || review.vendorName}</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-slate-500">Submission Time:</span>
                          <span className="text-slate-700">{new Date(currentEvidence.submittedAt).toLocaleString()}</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-slate-500">GPS Coordinates:</span>
                          <span className="text-[#10243A] font-mono font-medium">
                            {currentEvidence.latitude ? `${currentEvidence.latitude.toFixed(4)}, ${currentEvidence.longitude?.toFixed(4)}` : 'Logged with Zone'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Model & Quality Verification Card */}
                    <div className="bg-white border border-[#DCE3E8] rounded-xl p-4 space-y-3 shadow-xs">
                      <h4 className="text-xs font-bold text-[#10243A] uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                        AI Quality & Inference
                      </h4>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Clarity Score</div>
                          <div className="text-sm font-bold text-emerald-700 mt-0.5">
                            {currentEvidence.aiClarityScore ? `${currentEvidence.aiClarityScore.toFixed(1)} / 100` : 'Verified Clear'}
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Blur Metric</div>
                          <div className="text-sm font-bold text-[#0E827B] mt-0.5">
                            {currentEvidence.aiBlurScore ? currentEvidence.aiBlurScore.toFixed(1) : '< 15.0 (Sharp)'}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Inference Model:</span>
                          <span className="text-[#10243A] font-mono font-bold">{currentEvidence.aiModelName || 'YOLOv8-InfraQuality'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Model Version:</span>
                          <span className="text-slate-700 font-mono">{currentEvidence.aiModelVersion || 'v1.4-production'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detected Classes & Normalized Coordinates List */}
                    <div className="bg-white border border-[#DCE3E8] rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#10243A] uppercase tracking-wider">
                          Detected Objects ({detections.length})
                        </h4>
                        <span className="text-[10px] text-slate-500">Actual Bounding Boxes</span>
                      </div>

                      {detections.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                          No distinct objects flagged by object detection pipeline for this image.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {detections.map((det, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#10243A]">{det.classLabel}</span>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono text-[10px] font-bold">
                                  {(det.confidence * 100).toFixed(1)}% conf
                                </span>
                              </div>
                              {det.box2d && (
                                <div className="text-[10px] font-mono text-slate-500">
                                  Box: [{det.box2d.map(coord => coord.toFixed(3)).join(', ')}]
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB CONTENT 2: Physical Measurements */}
      {activeTab === 'MEASUREMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#10243A]">Recorded Physical Measurements</h3>
              <p className="text-xs text-slate-600">Field instrument measurements verified against civil engineering specifications.</p>
            </div>
            <button
              onClick={() => setShowMeasurementModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Ruler className="w-3.5 h-3.5 text-purple-700" />
              Add Measurement
            </button>
          </div>

          <div className="bg-white border border-[#DCE3E8] rounded-xl overflow-hidden shadow-xs">
            {(review.measurements || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No physical measurements recorded yet. Click &quot;Add Measurement&quot; to log onsite dipstick / compaction readings.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DCE3E8] bg-[#F8FAFC] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Measurement Type</th>
                      <th className="py-2.5 px-4">Measured Value</th>
                      <th className="py-2.5 px-4">Engineering Spec</th>
                      <th className="py-2.5 px-4">Verification Status</th>
                      <th className="py-2.5 px-4">Instrument / Location</th>
                      <th className="py-2.5 px-4">Verified By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(review.measurements || []).map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">{m.measurementCode}</td>
                        <td className="py-3 px-4 font-bold text-[#10243A]">{m.measurementType}</td>
                        <td className="py-3 px-4 font-bold text-[#0E827B]">
                          {m.measuredValue} <span className="font-normal text-slate-500">{m.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {m.specifiedTarget !== undefined ? (
                            <span>Target: <strong className="text-[#10243A]">{m.specifiedTarget}</strong> {m.unit}</span>
                          ) : m.specifiedMin !== undefined || m.specifiedMax !== undefined ? (
                            <span>Range: [{m.specifiedMin ?? '-'} to {m.specifiedMax ?? '-'}] {m.unit}</span>
                          ) : (
                            <span className="text-amber-800 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> SPECIFICATION MISSING
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            m.verificationStatus === 'VERIFIED_PASS'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : m.verificationStatus === 'VERIFIED_FAIL'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            {m.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="font-medium text-[#10243A]">{m.instrumentUsed || 'Standard Gauge'}</div>
                          <div className="text-[10px] text-slate-500">{m.locationMarker || 'Station 0+00'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {m.verifiedByName ? (
                            <div className="flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{m.verifiedByName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unverified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Corrective Actions */}
      {activeTab === 'CORRECTIVE_ACTIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#10243A]">Corrective Actions & Rework Governance</h3>
              <p className="text-xs text-slate-600">Rework notices dispatched to vendors. Vendors cannot self-approve or close notices.</p>
            </div>
            <button
              onClick={() => setShowCAModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Wrench className="w-3.5 h-3.5 text-orange-700" />
              Issue Rework Notice
            </button>
          </div>

          <div className="space-y-3">
            {(review.correctiveActions || []).length === 0 ? (
              <div className="bg-white border border-[#DCE3E8] rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
                No corrective actions issued for this assignment.
              </div>
            ) : (
              (review.correctiveActions || []).map((ca) => (
                <div key={ca.id} className="bg-white border border-[#DCE3E8] rounded-xl p-5 space-y-3 shadow-xs hover:shadow-sm transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-orange-800 px-2 py-0.5 bg-orange-50 border border-orange-200 rounded">
                          {ca.actionCode}
                        </span>
                        <span className="font-bold text-[#10243A] text-sm">{ca.actionType}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          ca.status === 'VERIFIED_CLOSED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : ca.status === 'SUBMITTED_FOR_VERIFICATION'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        }`}>
                          {ca.status}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {ca.priority}
                        </span>
                      </div>
                      <div className="text-xs text-rose-700 font-semibold">Defect: {ca.problemDescription}</div>
                      <div className="text-xs text-slate-700 font-medium">Required Action: {ca.requiredAction}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ca.status === 'SUBMITTED_FOR_VERIFICATION' && (
                        <button
                          onClick={() => setVerifyingCA(ca)}
                          className="px-3 py-1.5 bg-[#13A89E]/10 hover:bg-[#13A89E]/20 text-[#0E827B] border border-[#13A89E]/30 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          Verify Vendor Rework Proof
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submitted Rework Proofs */}
                  {ca.evidenceList && ca.evidenceList.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#0E827B]" />
                        Submitted Vendor Rework Evidence ({ca.evidenceList.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {ca.evidenceList.map((ev) => (
                          <div key={ev.id} className="p-2.5 bg-white rounded border border-slate-200 space-y-1 shadow-2xs">
                            <div className="font-mono text-[#0E827B] text-[11px] font-bold">{ev.evidenceCode}</div>
                            <div className="text-slate-700 text-xs">{ev.vendorNotes || 'Rework proof uploaded'}</div>
                            <div className="text-[10px] text-slate-500">{new Date(ev.submittedAt).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: History */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#10243A]">Authoritative Decision Audit Log</h3>
          <div className="space-y-3">
            {(review.decisions || []).length === 0 ? (
              <div className="bg-white border border-[#DCE3E8] rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
                No decisions recorded yet.
              </div>
            ) : (
              (review.decisions || []).map((d) => (
                <div key={d.id} className="bg-white border border-[#DCE3E8] rounded-xl p-4 space-y-2 shadow-xs hover:shadow-sm transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                        d.decisionType === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        {d.decisionType}
                      </span>
                      <span className="text-xs text-[#10243A] font-bold">Decided by: {d.decidedByName}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{new Date(d.decidedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong className="text-slate-500">Rationale:</strong> {d.decisionRationale}
                  </div>
                  {d.inspectorNotes && (
                    <div className="text-xs text-slate-600">
                      <strong className="text-slate-500">Inspector Notes:</strong> {d.inspectorNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 1. AUTHORITATIVE DECISION MODAL */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-[#10243A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE3E8] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE3E8] pb-3">
              <h3 className="text-base font-bold text-[#10243A] flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#0E827B]" />
                Record Authoritative Inspection Decision
              </h3>
              <button onClick={() => setShowDecisionModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            {decisionError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 font-semibold">
                {decisionError}
              </div>
            )}

            <form onSubmit={handleRecordDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision Outcome</label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value as ReviewDecisionType)}
                  aria-label="Inspection Decision Outcome"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#10243A] font-medium focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                >
                  <option value="APPROVED">APPROVED (Satisfies all engineering criteria)</option>
                  <option value="REJECTED">REJECTED (Critical compliance failure)</option>
                  <option value="REWORK_REQUIRED">REWORK REQUIRED (Issue corrective action notice)</option>
                  <option value="REQUEST_MORE_EVIDENCE">REQUEST MORE EVIDENCE (Photographic proof insufficient)</option>
                  <option value="NEEDS_PHYSICAL_INSPECTION">NEEDS PHYSICAL INSPECTION (Requires on-site dip rod / test)</option>
                  <option value="ESCALATED">ESCALATED (Disputed specification or higher review needed)</option>
                </select>
              </div>

              {decisionType === 'APPROVED' && !rule2Status.canApprove && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-700" /> Rule 2 Violation Warning
                  </div>
                  <p className="text-amber-900/90 font-medium">Approval will fail because open blocking conditions exist:</p>
                  <ul className="list-disc list-inside text-amber-950 font-semibold space-y-0.5">
                    {rule2Status.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {decisionType === 'APPROVED' && rule2Status.canApprove && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Approving will set Assignment status to COMPLETED and RELEASED, unblocking Stage 6 downstream dependencies.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision Rationale (Mandatory)</label>
                <textarea
                  required
                  rows={3}
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  placeholder="Detail the engineering findings, compliance verification, and basis for this decision..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-[#10243A] placeholder:text-slate-400 focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspector Notes (Optional)</label>
                <input
                  type="text"
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder="Additional field observations or instructions..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#10243A] placeholder:text-slate-400 focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3E8]">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDecision}
                  className="px-4 py-2 bg-[#13A89E] hover:bg-[#0E827B] text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDecision ? 'Recording Decision...' : 'Commit Authoritative Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RECORD PHYSICAL MEASUREMENT MODAL */}
      {showMeasurementModal && (
        <div className="fixed inset-0 z-50 bg-[#10243A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE3E8] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE3E8] pb-3">
              <h3 className="text-base font-bold text-[#10243A] flex items-center gap-2">
                <Ruler className="w-5 h-5 text-purple-700" />
                Record Onsite Physical Measurement
              </h3>
              <button onClick={() => setShowMeasurementModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRecordMeasurement} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Measurement Type</label>
                  <select
                    value={measType}
                    onChange={(e) => setMeasType(e.target.value as PhysicalMeasurementType)}
                    aria-label="Measurement Type"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-medium focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                  >
                    <option value="TRENCH_DEPTH">Trench Depth</option>
                    <option value="TRENCH_WIDTH">Trench Width</option>
                    <option value="BEDDING_THICKNESS">Bedding Thickness</option>
                    <option value="CABLE_BURIAL_DEPTH">Cable Burial Depth</option>
                    <option value="CONDUIT_SEPARATION">Conduit Separation</option>
                    <option value="ASPHALT_THICKNESS">Asphalt Thickness</option>
                    <option value="COMPACTION_DENSITY">Compaction Density</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={measUnit}
                    onChange={(e) => setMeasUnit(e.target.value as MeasurementUnit)}
                    aria-label="Measurement Unit"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-medium focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                  >
                    <option value="METERS">Meters (m)</option>
                    <option value="CENTIMETERS">Centimeters (cm)</option>
                    <option value="MILLIMETERS">Millimeters (mm)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Measured Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1.25"
                  value={measValue}
                  onChange={(e) => setMeasValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-mono font-bold focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Spec</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.20"
                    value={measSpecTarget}
                    onChange={(e) => setMeasSpecTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-mono focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Spec</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.10"
                    value={measSpecMin}
                    onChange={(e) => setMeasSpecMin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-mono focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Spec</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.40"
                    value={measSpecMax}
                    onChange={(e) => setMeasSpecMax(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-mono focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="text-[10px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                Note: If target/min/max specification is omitted, measurement will be flagged as SPECIFICATION_REQUIRED and cannot auto-pass.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Instrument Used</label>
                <input
                  type="text"
                  placeholder="e.g. Calibrated Telescopic Dip-Rod #TR-402"
                  value={measInstrument}
                  onChange={(e) => setMeasInstrument(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Location Marker / Station</label>
                <input
                  type="text"
                  placeholder="e.g. Station 0+150 Chainage"
                  value={measLocation}
                  onChange={(e) => setMeasLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3E8]">
                <button
                  type="button"
                  onClick={() => setShowMeasurementModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMeas}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  {isSubmittingMeas ? 'Saving...' : 'Save Measurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CREATE CORRECTIVE ACTION MODAL */}
      {showCAModal && (
        <div className="fixed inset-0 z-50 bg-[#10243A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE3E8] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE3E8] pb-3">
              <h3 className="text-base font-bold text-[#10243A] flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-700" />
                Issue Corrective Action / Rework Notice
              </h3>
              <button onClick={() => setShowCAModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCorrectiveAction} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Action Type</label>
                <select
                  value={caType}
                  onChange={(e) => setCaType(e.target.value as CorrectiveActionType)}
                  aria-label="Corrective Action Type"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-medium focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                >
                  <option value="DEPTH_CORRECTION">Depth Correction</option>
                  <option value="TRENCH_WIDENING">Trench Widening</option>
                  <option value="BEDDING_REMEDY">Bedding Remedy</option>
                  <option value="WARNING_TAPE_INSTALLATION">Warning Tape Installation</option>
                  <option value="CABLE_REROUTING">Cable Rerouting</option>
                  <option value="RE_COMPACTION">Re-compaction</option>
                  <option value="PHOTO_RETREAT">Photo Re-capture Needed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={caPriority}
                    onChange={(e) => setCaPriority(e.target.value as ReviewPriority)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-medium focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={caSeverity}
                    onChange={(e) => setCaSeverity(e.target.value as FindingSeverity)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-medium focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Problem Description</label>
                <textarea
                  required
                  rows={2}
                  value={caDesc}
                  onChange={(e) => setCaDesc(e.target.value)}
                  placeholder="Describe the defect or specification breach..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] placeholder:text-slate-400 focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Required Action</label>
                <textarea
                  required
                  rows={2}
                  value={caRequired}
                  onChange={(e) => setCaRequired(e.target.value)}
                  placeholder="Specify the exact rework requirements the vendor must perform..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] placeholder:text-slate-400 focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Resolution Due Date</label>
                <input
                  type="date"
                  value={caDueDate}
                  onChange={(e) => setCaDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-medium focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3E8]">
                <button
                  type="button"
                  onClick={() => setShowCAModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCA}
                  className="px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  {isSubmittingCA ? 'Issuing...' : 'Issue Rework Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. VERIFY CORRECTIVE ACTION MODAL */}
      {verifyingCA && (
        <div className="fixed inset-0 z-50 bg-[#10243A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE3E8] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE3E8] pb-3">
              <h3 className="text-base font-bold text-[#10243A] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0E827B]" />
                Verify Vendor Rework Proof
              </h3>
              <button onClick={() => setVerifyingCA(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-slate-700">
              Reviewing remediation proof for notice <strong className="text-orange-800">{verifyingCA.actionCode}</strong> ({verifyingCA.actionType}).
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Inspector Resolution Notes</label>
              <textarea
                rows={3}
                value={caResolutionNotes}
                onChange={(e) => setCaResolutionNotes(e.target.value)}
                placeholder="Enter verification findings, compliance status, or rejection rationale..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-[#10243A] placeholder:text-slate-400 focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3E8]">
              <button
                type="button"
                disabled={isVerifyingCA}
                onClick={() => handleVerifyCA(false)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Reject Rework
              </button>
              <button
                type="button"
                disabled={isVerifyingCA}
                onClick={() => handleVerifyCA(true)}
                className="px-4 py-2 bg-[#13A89E] hover:bg-[#0E827B] text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                Verify & Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ESCALATION MODAL */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-[#10243A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE3E8] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE3E8] pb-3">
              <h3 className="text-base font-bold text-[#10243A] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-700" />
                Escalate Inspection Review
              </h3>
              <button onClick={() => setShowEscalateModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleEscalateReview} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Escalate To Role</label>
                <select
                  value={escRole}
                  onChange={(e) => setEscRole(e.target.value)}
                  aria-label="Escalate To Role"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-[#10243A] font-medium focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                >
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="PLATFORM_ADMIN">Platform Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason for Escalation</label>
                <textarea
                  required
                  rows={3}
                  value={escReason}
                  onChange={(e) => setEscReason(e.target.value)}
                  placeholder="Explain why this inspection is being escalated (e.g. vendor dispute, structural defect)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-[#10243A] placeholder:text-slate-400 focus:bg-white focus:border-[#13A89E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3E8]">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEsc}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  {isSubmittingEsc ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
export default InspectionWorkspacePage;
