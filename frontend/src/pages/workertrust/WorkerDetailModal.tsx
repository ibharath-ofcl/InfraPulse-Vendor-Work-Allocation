import React, { useState } from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileText,
  Award,
  UserCheck,
  Ban,
  RotateCcw,
  Phone,
  Mail,
  User,
  Clock,
  MapPin,
  Building2,
  AlertCircle
} from 'lucide-react';
import {
  WorkerDetailResponse,
  WorkerStatus,
  ApprovalDecision,
} from '../../types/workertrust';
import { workertrustService } from '../../services/workertrustService';
import { useAuth } from '../../auth/useAuth';

interface WorkerDetailModalProps {
  worker: WorkerDetailResponse;
  onClose: () => void;
  onRefresh: () => void;
}

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({ worker, onClose, onRefresh }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'certifications' | 'badge' | 'history'>('profile');
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<ApprovalDecision>('APPROVED');
  const [approvalReason, setApprovalReason] = useState('');

  // Suspension modal state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Reactivate modal state
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivateNotes, setReactivateNotes] = useState('');

  const isProjectManagerOrAdmin = user?.role === 'PLATFORM_ADMIN' || user?.role === 'PROJECT_MANAGER';
  const isFinance = user?.role === 'FINANCE_OFFICER';

  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalReason.trim()) {
      setErrorMsg('A documented reason is mandatory for approval decisions.');
      return;
    }
    setLoadingAction(true);
    setErrorMsg(null);
    try {
      await workertrustService.approveWorker(worker.id, {
        decision: approvalDecision,
        reason: approvalReason,
      });
      setSuccessMsg(`Decision '${approvalDecision}' recorded successfully.`);
      setShowApprovalModal(false);
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to record approval decision.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendReason.trim()) {
      setErrorMsg('A documented suspension justification is mandatory.');
      return;
    }
    setLoadingAction(true);
    setErrorMsg(null);
    try {
      await workertrustService.suspendWorker(worker.id, { reason: suspendReason });
      setSuccessMsg('Worker access has been suspended.');
      setShowSuspendModal(false);
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to suspend worker.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReactivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reactivateNotes.trim()) {
      setErrorMsg('A documented reactivation justification is mandatory.');
      return;
    }
    setLoadingAction(true);
    setErrorMsg(null);
    try {
      await workertrustService.reactivateWorker(worker.id, { resolutionNotes: reactivateNotes });
      setSuccessMsg('Worker has been reactivated and restored to active pool.');
      setShowReactivateModal(false);
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to reactivate worker.');
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (status: WorkerStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">APPROVED</span>;
      case 'ACTIVE_ON_SITE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">ON SITE</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">ASSIGNED</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">PENDING REVIEW</span>;
      case 'REQUIRES_CORRECTION':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">CORRECTION REQUIRED</span>;
      case 'SUSPENDED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">SUSPENDED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-lg">
              {worker.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{worker.fullName}</h2>
                {getStatusBadge(worker.currentStatus)}
              </div>
              <p className="text-xs text-indigo-200/80 font-mono flex items-center gap-2 mt-0.5">
                <span>{worker.workerCode}</span>
                <span>•</span>
                <span>{worker.jobRole.replace('_', ' ')}</span>
                <span>•</span>
                <span>{worker.vendorName}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Profile & Identity
          </button>
          {!isFinance && (
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-4 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'documents'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents ({worker.documents?.length || 0})
            </button>
          )}
          <button
            onClick={() => setActiveTab('certifications')}
            className={`py-3 px-4 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'certifications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            Certifications ({worker.certifications?.length || 0})
          </button>
          {!isFinance && (
            <button
              onClick={() => setActiveTab('badge')}
              className={`py-3 px-4 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'badge'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Digital Badge
            </button>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 font-medium text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Site Access & Incidents
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: Profile & Identity */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile Contact</span>
                  <p className="text-sm font-medium text-slate-900 mt-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {worker.mobileNumber}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                  <p className="text-sm font-medium text-slate-900 mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {worker.email || 'Not provided'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contractor / Vendor</span>
                  <p className="text-sm font-medium text-slate-900 mt-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {worker.vendorName} {worker.vendorCode && `(${worker.vendorCode})`}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Work Zone</span>
                  <p className="text-sm font-medium text-slate-900 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {worker.activeWorkZoneName ? `${worker.activeWorkZoneName} (${worker.activeProjectName})` : 'No active project allocation'}
                  </p>
                </div>
              </div>

              {/* Skills & Experience */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skills & Construction Experience</span>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                  {worker.skillsExperience || 'General infrastructure site construction and trenching operations.'}
                </p>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/40">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Designated Emergency Contact
                </span>
                <div className="mt-2 text-sm text-slate-800 flex flex-wrap gap-4">
                  <span><strong>Name:</strong> {worker.emergencyContactName || 'On-site Supervisor'}</span>
                  <span><strong>Phone:</strong> {worker.emergencyContactPhone || worker.mobileNumber}</span>
                </div>
              </div>

              {/* Identity Verification Summary (Privacy Preserving) */}
              {!isFinance && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Identity Verification Status (Privacy Compliant)
                  </span>
                  <div className="mt-3 space-y-2">
                    {worker.verifications?.length > 0 ? (
                      worker.verifications.map((v) => (
                        <div key={v.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-slate-800">{v.verificationMethod.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-slate-500 font-mono ml-2">Ref: {v.verificationReference || 'Masked'}</span>
                            {v.reviewNotes && <p className="text-xs text-slate-600 mt-1">{v.reviewNotes}</p>}
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            v.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                            v.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            v.verificationStatus === 'REQUIRES_CORRECTION' ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {v.verificationStatus}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No formal identity verification records submitted yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Documents */}
          {activeTab === 'documents' && !isFinance && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Submitted Verification Documents</h3>
                <span className="text-xs text-slate-500">Stored in encrypted infrastructure vault</span>
              </div>
              <div className="space-y-3">
                {worker.documents?.length > 0 ? (
                  worker.documents.map((doc) => (
                    <div key={doc.id} className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.originalFilename}</p>
                          <p className="text-xs text-slate-500">
                            {doc.documentType.replace(/_/g, ' ')} • {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                          {doc.reviewNotes && (
                            <p className="text-xs text-slate-600 mt-1 italic">Notes: {doc.reviewNotes}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        doc.documentStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        doc.documentStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        doc.documentStatus === 'REQUIRES_CORRECTION' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {doc.documentStatus}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-60" />
                    <p className="text-sm">No documents uploaded for this worker yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Certifications */}
          {activeTab === 'certifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Worker Safety & Skill Certifications</h3>
                <span className="text-xs text-slate-500">Validated against regulatory standards</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {worker.certifications?.length > 0 ? (
                  worker.certifications.map((cert) => (
                    <div key={cert.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                      {cert.isExpired && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">
                          EXPIRED
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                          <Award className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {cert.certificationType.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{cert.issuingAuthority}</p>
                          {cert.certificateNumber && (
                            <p className="text-xs font-mono text-slate-600 mt-1">No: {cert.certificateNumber}</p>
                          )}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Expires: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'Permanent'}
                            </span>
                            <span className={`px-2 py-0.5 font-semibold rounded ${
                              cert.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                              cert.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {cert.verificationStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Award className="w-8 h-8 mx-auto mb-2 opacity-60" />
                    <p className="text-sm">No certifications registered.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: QR Badge */}
          {activeTab === 'badge' && !isFinance && (
            <div className="flex flex-col items-center justify-center py-4">
              {worker.qrBadge && worker.qrBadge.isValid ? (
                <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-indigo-400/30 text-center relative overflow-hidden">
                  <div className="absolute top-3 left-4 text-[10px] font-mono tracking-widest text-indigo-300 uppercase">
                    INFRAPULSE WORKERTRUST ID
                  </div>
                  <div className="mt-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/30 border-2 border-indigo-400/50 flex items-center justify-center text-xl font-bold text-white shadow-inner mb-3">
                      {worker.fullName.charAt(0)}
                    </div>
                    <h3 className="text-lg font-bold text-white">{worker.fullName}</h3>
                    <p className="text-xs text-indigo-200 font-mono mt-0.5">{worker.workerCode}</p>
                    <span className="mt-2 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-[11px] font-semibold rounded-full">
                      {worker.jobRole.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div className="mt-5 p-4 bg-white rounded-xl shadow-md inline-block">
                    <div className="w-36 h-36 bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-800 p-2">
                      <QrCode className="w-24 h-24 text-slate-900" />
                      <span className="text-[9px] font-mono mt-1 text-slate-500 truncate max-w-[130px]">
                        {worker.workerCode}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-indigo-800/60 text-xs text-indigo-200/80 space-y-1">
                    <p><strong>Vendor:</strong> {worker.vendorName}</p>
                    {worker.activeProjectName && (
                      <p><strong>Active Project:</strong> {worker.activeProjectName}</p>
                    )}
                    <p className="text-[10px] text-indigo-300/60 font-mono">
                      Badge Valid Until: {new Date(worker.qrBadge.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 max-w-md">
                  <Shield className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <h4 className="text-base font-bold text-slate-800">QR Badge Not Active</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    QR badge credentials are generated automatically once a worker is APPROVED by a Project Manager and has no active safety suspensions.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: History */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Recent Worksites & Gate Access</h4>
                <div className="space-y-2">
                  {worker.recentSiteAccess?.length > 0 ? (
                    worker.recentSiteAccess.map((sa) => (
                      <div key={sa.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{sa.projectName || 'Project Site'}</span>
                          <span className="text-slate-500 ml-2">Zone: {sa.workZoneName || 'General'}</span>
                          <p className="text-slate-500 mt-0.5">
                            In: {new Date(sa.entryTime).toLocaleString()} {sa.exitTime && `• Out: ${new Date(sa.exitTime).toLocaleString()}`}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 font-bold rounded ${
                          sa.accessStatus === 'ALLOW_ENTRY' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sa.accessStatus}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No recorded site gate access entries.</p>
                  )}
                </div>
              </div>

              {!isFinance && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Recorded Safety Incidents</h4>
                  <div className="space-y-2">
                    {worker.incidents?.length > 0 ? (
                      worker.incidents.map((inc) => (
                        <div key={inc.id} className="p-3 bg-red-50/50 rounded-lg border border-red-200 text-xs flex items-start justify-between gap-3">
                          <div>
                            <span className="font-bold text-red-900">{inc.incidentReference}</span>
                            <span className="ml-2 font-medium text-slate-700">{inc.incidentType.replace(/_/g, ' ')}</span>
                            <p className="text-slate-600 mt-1">{inc.description}</p>
                            {inc.resolution && <p className="text-emerald-700 mt-1">Resolution: {inc.resolution}</p>}
                          </div>
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded flex-shrink-0">
                            {inc.severity}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">Zero safety violations or incidents recorded.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer & Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Registered: {new Date(worker.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            {isProjectManagerOrAdmin && worker.currentStatus === 'PENDING_REVIEW' && (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                Review & Decide
              </button>
            )}

            {isProjectManagerOrAdmin && worker.currentStatus !== 'SUSPENDED' && (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                Suspend Access
              </button>
            )}

            {isProjectManagerOrAdmin && worker.currentStatus === 'SUSPENDED' && (
              <button
                onClick={() => setShowReactivateModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Reactivate Worker
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Sub-modal: Approval Dialog */}
        {showApprovalModal && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">Worker Review & Approval Decision</h3>
              <p className="text-xs text-slate-500 mb-4">Mandatory documented justification required by audit policy.</p>
              
              <form onSubmit={handleApprovalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
                  <select
                    value={approvalDecision}
                    onChange={(e) => setApprovalDecision(e.target.value as ApprovalDecision)}
                    className="w-full text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="APPROVED">APPROVE — Clear for site assignment</option>
                    <option value="CORRECTION_REQUESTED">REQUEST CORRECTION — Ask vendor to update</option>
                    <option value="REJECTED">REJECT — Deny site access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Review Notes & Reason *</label>
                  <textarea
                    required
                    rows={3}
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder="Document identity checks, safety certifications inspected, or reasons for rejection..."
                    className="w-full text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApprovalModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loadingAction ? 'Recording...' : 'Submit Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sub-modal: Suspend Dialog */}
        {showSuspendModal && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h3 className="text-base font-bold text-red-600 mb-1">Suspend Worker Access</h3>
              <p className="text-xs text-slate-500 mb-4">Worker will be immediately blocked from site entry and assignments.</p>
              
              <form onSubmit={handleSuspendSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory Suspension Reason *</label>
                  <textarea
                    required
                    rows={3}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Describe safety infraction, non-compliance, or investigation trigger..."
                    className="w-full text-sm rounded-lg border-slate-300 focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSuspendModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loadingAction ? 'Suspending...' : 'Confirm Suspension'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sub-modal: Reactivate Dialog */}
        {showReactivateModal && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h3 className="text-base font-bold text-emerald-700 mb-1">Reactivate Worker</h3>
              <p className="text-xs text-slate-500 mb-4">Lifts suspension and restores worker to approved status.</p>
              
              <form onSubmit={handleReactivateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reactivation Justification Notes *</label>
                  <textarea
                    required
                    rows={3}
                    value={reactivateNotes}
                    onChange={(e) => setReactivateNotes(e.target.value)}
                    placeholder="Document retraining completed, safety clearance provided, or investigation conclusion..."
                    className="w-full text-sm rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReactivateModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loadingAction ? 'Reactivating...' : 'Confirm Reactivation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
