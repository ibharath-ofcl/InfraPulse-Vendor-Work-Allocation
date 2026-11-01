import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  UserPlus,
  QrCode,
  Award,
  AlertTriangle,
  Activity,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Printer,
  AlertCircle,
  Building2,
  MapPin,
  LogOut,
  LogIn
} from 'lucide-react';
import {
  WorkerSummaryResponse,
  WorkerDetailResponse,
  WorkforceAnalyticsResponse,
  EmergencyHeadcountResponse,
  WorkerIncidentDto,
  WorkerSiteAccessDto,
  WorkerStatus,
  CertificationType,
  IncidentSeverity,
  IncidentType,
  SiteAccessScanResult
} from '../../types/workertrust';
import { workertrustService } from '../../services/workertrustService';
import { projectService } from '../../services/projectService';
import { workZoneService } from '../../services/workZoneService';
import { vendorService } from '../../services/vendorService';
import { ProjectResponse } from '../../types/project';
import { WorkZoneItem } from '../../types/workZone';
import { VendorResponse } from '../../types/vendor';
import { useAuth } from '../../auth/useAuth';
import { WorkerDetailModal } from './WorkerDetailModal';

export const WorkerTrustDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'directory' | 'register' | 'verification' | 'certifications' | 'assignments' | 'site-access' | 'emergency-headcount' | 'safety' | 'attendance'
  >('overview');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Analytics Data
  const [analytics, setAnalytics] = useState<WorkforceAnalyticsResponse | null>(null);

  // Worker Directory Data
  const [workers, setWorkers] = useState<WorkerSummaryResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkerStatus | 'ALL'>('ALL');

  // Selected Worker Detail for Modal
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<WorkerDetailResponse | null>(null);

  // Master Data for Dropdowns
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [workZones, setWorkZones] = useState<WorkZoneItem[]>([]);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regRole, setRegRole] = useState('GENERAL_WORKER');
  const [regSkills, setRegSkills] = useState('');
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regVendorId, setRegVendorId] = useState('');
  const [regConsent, setRegConsent] = useState(true);
  const [regVerifMethod, setRegVerifMethod] = useState<'OFFLINE_UIDAI_XML_CONSENT' | 'MANUAL_REVIEW'>('OFFLINE_UIDAI_XML_CONSENT');
  const [regVerifRef, setRegVerifRef] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  // Gate Scanner State
  const [scannerInput, setScannerInput] = useState('');
  const [selectedScanProject, setSelectedScanProject] = useState('');
  const [selectedScanZone, setSelectedScanZone] = useState('');
  const [scanResult, setScanResult] = useState<SiteAccessScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  // Emergency Headcount State
  const [headcount, setHeadcount] = useState<EmergencyHeadcountResponse | null>(null);
  const [headcountFilterProject] = useState('');

  // Incidents State
  const [incidents, setIncidents] = useState<WorkerIncidentDto[]>([]);
  const [newIncidentProj, setNewIncidentProj] = useState('');
  const [newIncidentType, setNewIncidentType] = useState<IncidentType>('SAFETY_VIOLATION');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [newIncidentAction, setNewIncidentAction] = useState('');
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // Certifications State
  const [newCertWorkerId, setNewCertWorkerId] = useState('');
  const [newCertType, setNewCertType] = useState<CertificationType>('GENERAL_CONSTRUCTION_SAFETY');
  const [newCertAuthority, setNewCertAuthority] = useState('');
  const [newCertNumber, setNewCertNumber] = useState('');
  const [newCertIssueDate, setNewCertIssueDate] = useState('');
  const [newCertExpiryDate, setNewCertExpiryDate] = useState('');
  const [submittingCert, setSubmittingCert] = useState(false);

  // Work Assignment State
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [assignProjId, setAssignProjId] = useState('');
  const [assignZoneId, setAssignZoneId] = useState('');
  const [assignStartDate, setAssignStartDate] = useState('');
  const [assignEndDate, setAssignEndDate] = useState('');
  const [assignRole] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Attendance History State
  const [attendanceLogs, setAttendanceLogs] = useState<WorkerSiteAccessDto[]>([]);

  const isVendor = user?.role === 'VENDOR';
  const isPM = user?.role === 'PROJECT_MANAGER';
  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const isField = user?.role === 'FIELD_ENGINEER';

  // Role-appropriate default tab selection
  useEffect(() => {
    if (user?.role === 'VENDOR') {
      setActiveTab((prev) => (prev === 'overview' ? 'directory' : prev));
    } else if (user?.role === 'FIELD_ENGINEER') {
      setActiveTab((prev) => (prev === 'overview' ? 'site-access' : prev));
    }
  }, [user?.role]);

  // Load Initial Master Data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [projRes, vendorRes] = await Promise.all([
          projectService.getProjects({ size: 50 }),
          vendorService.getVendors({ size: 50 }),
        ]);
        setProjects(projRes.content || []);
        setVendors(vendorRes.content || []);
        if (projRes.content?.length > 0) {
          const firstProjId = projRes.content[0].id;
          setSelectedScanProject(firstProjId);
          setAssignProjId(firstProjId);
          setNewIncidentProj(firstProjId);
          loadZonesForProject(firstProjId);
        }
      } catch (e) {
        console.error('Failed to load initial master data:', e);
      }
    };
    loadMasterData();
  }, []);

  const loadZonesForProject = async (projectId: string) => {
    try {
      const res = await workZoneService.getWorkZones({ projectId, size: 50 });
      setWorkZones(res.content || []);
      if (res.content && res.content.length > 0) {
        setSelectedScanZone(res.content[0].id);
        setAssignZoneId(res.content[0].id);
      }
    } catch (e) {
      console.error('Failed to load zones for project:', e);
    }
  };

  // Main data fetching based on activeTab
  const refreshData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'overview') {
        const data = await workertrustService.getAnalytics();
        setAnalytics(data);
      } else if (activeTab === 'directory' || activeTab === 'verification') {
        const st = activeTab === 'verification' ? 'PENDING_REVIEW' : statusFilter;
        const res = await workertrustService.listWorkers({
          status: st,
          search: searchQuery,
          size: 50,
        });
        setWorkers(res.content || []);
      } else if (activeTab === 'site-access') {
        const data = await workertrustService.getEmergencyHeadcount(selectedScanProject);
        setHeadcount(data);
      } else if (activeTab === 'emergency-headcount') {
        const data = await workertrustService.getEmergencyHeadcount(headcountFilterProject || undefined);
        setHeadcount(data);
      } else if (activeTab === 'safety') {
        const res = await workertrustService.listIncidents({ size: 30 });
        setIncidents(res.content || []);
      } else if (activeTab === 'attendance') {
        const res = await workertrustService.getAttendanceHistory(undefined, 0, 50);
        setAttendanceLogs(res.content || []);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to fetch WorkerTrust data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, searchQuery, selectedScanProject, headcountFilterProject]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleOpenWorkerModal = async (workerId: string) => {
    try {
      const detail = await workertrustService.getWorkerDetail(workerId);
      setSelectedWorkerDetail(detail);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to load worker profile.');
    }
  };

  // Handle Registration Submit
  const handleRegisterWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await workertrustService.registerWorker({
        fullName: regFullName,
        mobileNumber: regMobile,
        email: regEmail || undefined,
        dateOfBirth: regDob || undefined,
        jobRole: regRole,
        skillsExperience: regSkills,
        emergencyContactName: regEmergencyName,
        emergencyContactPhone: regEmergencyPhone,
        vendorId: regVendorId || undefined,
        consentGranted: regConsent,
        verificationMethod: regVerifMethod,
        verificationReference: regVerifRef || undefined,
      });

      setSuccessMsg(`Worker registered successfully with Unique Code: ${res.workerCode}! Queued for verification.`);
      setRegFullName('');
      setRegMobile('');
      setRegEmail('');
      setRegDob('');
      setRegSkills('');
      setRegEmergencyName('');
      setRegEmergencyPhone('');
      setRegVerifRef('');
      setActiveTab('directory');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to register worker.');
    } finally {
      setSubmittingReg(false);
    }
  };

  // Handle Site Gate Check-In Scan
  const handleGateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput.trim()) return;
    setScanning(true);
    setErrorMsg(null);
    try {
      const result = await workertrustService.checkIn({
        tokenOrWorkerCode: scannerInput.trim(),
        projectId: selectedScanProject,
        workZoneId: selectedScanZone || undefined,
        deviceReference: 'GATE-DESKTOP-TERMINAL-01',
      });
      setScanResult(result);
      if (result.allowed) {
        setSuccessMsg(`Access Granted: ${result.fullName} (${result.workerCode}) checked in on site.`);
      } else {
        setErrorMsg(`Access Blocked: ${result.humanReadableReason}`);
      }
      refreshData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Scan verification failed.');
    } finally {
      setScanning(false);
    }
  };

  // Handle Gate Check-Out
  const handleCheckOut = async (identifier: string) => {
    try {
      await workertrustService.checkOut(identifier);
      setSuccessMsg('Worker site check-out recorded successfully.');
      refreshData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to record check-out.');
    }
  };

  // Handle Safety Incident Report
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIncident(true);
    setErrorMsg(null);
    try {
      const inc = await workertrustService.reportIncident({
        projectId: newIncidentProj || undefined,
        incidentType: newIncidentType,
        severity: newIncidentSeverity,
        description: newIncidentDesc,
        immediateActionTaken: newIncidentAction || undefined,
      });
      setSuccessMsg(`Safety incident ${inc.incidentReference} logged and routed to Project Manager.`);
      setNewIncidentDesc('');
      setNewIncidentAction('');
      refreshData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to report incident.');
    } finally {
      setSubmittingIncident(false);
    }
  };

  // Handle Worker Assignment Submit
  const handleAssignWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignWorkerId || !assignProjId || !assignZoneId || !assignStartDate || !assignEndDate) {
      setErrorMsg('All fields are mandatory for zone assignment.');
      return;
    }
    setSubmittingAssign(true);
    setErrorMsg(null);
    try {
      await workertrustService.assignWorker(assignWorkerId, {
        projectId: assignProjId,
        workZoneId: assignZoneId,
        startDate: assignStartDate,
        endDate: assignEndDate,
        requiredRole: assignRole || undefined,
      });
      setSuccessMsg('Worker assigned to project work zone successfully.');
      refreshData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to assign worker.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handle Add Certification Submit
  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertWorkerId || !newCertAuthority || !newCertIssueDate) {
      setErrorMsg('Worker, issuing authority, and issue date are required.');
      return;
    }
    setSubmittingCert(true);
    setErrorMsg(null);
    try {
      await workertrustService.addCertification(newCertWorkerId, {
        certificationType: newCertType,
        issuingAuthority: newCertAuthority,
        certificateNumber: newCertNumber || undefined,
        issueDate: newCertIssueDate,
        expiryDate: newCertExpiryDate || undefined,
      });
      setSuccessMsg('Safety certification recorded successfully.');
      setNewCertAuthority('');
      setNewCertNumber('');
      setNewCertIssueDate('');
      setNewCertExpiryDate('');
      refreshData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to record certification.');
    } finally {
      setSubmittingCert(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 text-white relative overflow-hidden border border-indigo-900/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-semibold">
                  InfraPulse Site Security & Safety Gate
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  WorkerTrust™ Workforce Management
                </h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-indigo-100/80 max-w-2xl leading-relaxed">
              Centralized identity verification, skills certification compliance, QR access badges, and real-time gate entry control for municipal infrastructure worksites.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshData()}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>
            {(isAdmin || isPM || isVendor) && (
              <button
                onClick={() => setActiveTab('register')}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Register Worker
              </button>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Intelligence & Analytics
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Worker Directory
        </button>

        {(isAdmin || isPM || isVendor) && (
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'register'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Register Worker
          </button>
        )}

        {(isAdmin || isPM) && (
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'verification'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Verification Queue
          </button>
        )}

        <button
          onClick={() => setActiveTab('certifications')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'certifications'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Safety Certifications
        </button>

        {(isAdmin || isPM) && (
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'assignments'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Zone Allocations
          </button>
        )}

        {(isAdmin || isPM || isField) && (
          <button
            onClick={() => setActiveTab('site-access')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'site-access'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Gate Terminal
          </button>
        )}

        {(isAdmin || isPM || isField) && (
          <button
            onClick={() => setActiveTab('emergency-headcount')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'emergency-headcount'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Headcount
          </button>
        )}

        <button
          onClick={() => setActiveTab('safety')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'safety'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Incidents & Safety
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'attendance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Attendance History
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: INTELLIGENCE & ANALYTICS DASHBOARD                 */}
      {/* ========================================================= */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Registered</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{analytics.totalRegisteredWorkers}</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Workers</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">{analytics.approvedWorkers}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600">{analytics.pendingVerification}</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active On Site</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-600">{analytics.activeOnSiteWorkers}</span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suspended</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-red-600">{analytics.suspendedWorkers}</span>
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cert Compliance</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-indigo-600">{analytics.certificationComplianceRate}%</span>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Graphical Analytics Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Status Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Workforce Lifecycle Status
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.workersByStatus || {}).map(([st, count]) => {
                  const pct = analytics.totalRegisteredWorkers > 0 ? Math.round((count / analytics.totalRegisteredWorkers) * 100) : 0;
                  return (
                    <div key={st}>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{st.replace(/_/g, ' ')}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            st === 'APPROVED' ? 'bg-emerald-500' :
                            st === 'ACTIVE_ON_SITE' ? 'bg-blue-500' :
                            st === 'ASSIGNED' ? 'bg-cyan-500' :
                            st === 'PENDING_REVIEW' ? 'bg-amber-500' :
                            st === 'SUSPENDED' ? 'bg-red-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vendor Workforce Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Workforce by Contractor
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.workersByVendor || {}).map(([vName, count]) => (
                  <div key={vName} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{vName}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded-full">{count} workers</span>
                  </div>
                ))}
                {Object.keys(analytics.workersByVendor || {}).length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">No contractor associations registered.</p>
                )}
              </div>
            </div>

            {/* 7-Day Site Attendance Activity */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                7-Day Site Attendance Trend
              </h3>
              <div className="h-44 flex items-end justify-between gap-2 pt-6">
                {(analytics.dailyAttendanceTrend || []).map((day) => {
                  const maxCount = Math.max(...analytics.dailyAttendanceTrend.map(d => d.count), 5);
                  const heightPct = Math.max(Math.round((day.count / maxCount) * 100), 12);
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-600">{day.count}</span>
                      <div
                        className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all"
                        style={{ height: `${heightPct}%` }}
                        title={`${day.date}: ${day.count} check-ins`}
                      />
                      <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                        {day.date.substring(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: WORKER DIRECTORY                                   */}
      {/* ========================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by worker name, code, or phone..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkerStatus | 'ALL')}
                className="text-xs rounded-lg border border-slate-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE_ON_SITE">Active On Site</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="REQUIRES_CORRECTION">Correction Required</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Workers Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Worker Code & Name</th>
                    <th className="py-3.5 px-4">Role & Contractor</th>
                    <th className="py-3.5 px-4">Active Allocation</th>
                    <th className="py-3.5 px-4">Safety Certs</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 text-xs flex-shrink-0">
                            {w.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{w.fullName}</p>
                            <p className="font-mono text-[11px] text-slate-500">{w.workerCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{w.jobRole.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-slate-500">{w.vendorName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {w.activeWorkZoneName ? (
                          <div>
                            <p className="font-medium text-slate-800">{w.activeWorkZoneName}</p>
                            <p className="text-[11px] text-slate-500">{w.activeProjectName}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                            {w.activeCertificationsCount} Valid
                          </span>
                          {w.expiredCertificationsCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold">
                              {w.expiredCertificationsCount} Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          w.currentStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          w.currentStatus === 'ACTIVE_ON_SITE' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          w.currentStatus === 'ASSIGNED' ? 'bg-cyan-100 text-cyan-800' :
                          w.currentStatus === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800' :
                          w.currentStatus === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {w.currentStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenWorkerModal(w.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          View Profile
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {workers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No workers found matching the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: REGISTER WORKER FORM                               */}
      {/* ========================================================= */}
      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Infrastructure Worker Registration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Submit identity particulars, skills, and DPDP consent. System will assign an immutable Worker ID (INF-WRK-2026-XXXXXX).
            </p>
          </div>

          <form onSubmit={handleRegisterWorker} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                  placeholder="+91 98450 XXXXX"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="worker@contractor.in"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Construction Job Role *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GENERAL_WORKER">General Construction Worker</option>
                  <option value="MASON">Mason & Paving Specialist</option>
                  <option value="ELECTRICIAN">Certified Electrician</option>
                  <option value="EXCAVATOR_OPERATOR">Excavator / Trenching Operator</option>
                  <option value="HEAVY_EQUIPMENT_DRIVER">Heavy Equipment Driver</option>
                  <option value="WELDER">Structural Welder</option>
                  <option value="SAFETY_MARSHAL">Site Safety Marshal</option>
                  <option value="FOREMAN">Site Foreman</option>
                </select>
              </div>

              {!isVendor && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contractor / Vendor Organization</label>
                  <select
                    value={regVendorId}
                    onChange={(e) => setRegVendorId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.companyName} ({v.vendorCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Privacy Compliant Identity Verification Reference */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                Consent-Based Identity Verification (UIDAI / Privacy Safe)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Verification Method</label>
                  <select
                    value={regVerifMethod}
                    onChange={(e) => setRegVerifMethod(e.target.value as 'OFFLINE_UIDAI_XML_CONSENT' | 'MANUAL_REVIEW')}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  >
                    <option value="OFFLINE_UIDAI_XML_CONSENT">Aadhaar Offline Paperless XML (Consent)</option>
                    <option value="MANUAL_REVIEW">Manual Photo ID Inspection (Voter/DL/Passport)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Masked Identity Ref / Number</label>
                  <input
                    type="text"
                    value={regVerifRef}
                    onChange={(e) => setRegVerifRef(e.target.value)}
                    placeholder="e.g. DL-KA01-2021004"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Skills & Trenching / Civil Experience</label>
              <textarea
                rows={2}
                value={regSkills}
                onChange={(e) => setRegSkills(e.target.value)}
                placeholder="Mention past project experience, micro-trenching certifications, HDPE pipe pulling..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                <input
                  type="text"
                  value={regEmergencyName}
                  onChange={(e) => setRegEmergencyName(e.target.value)}
                  placeholder="Spouse / Parent / Next of Kin"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Mobile</label>
                <input
                  type="text"
                  value={regEmergencyPhone}
                  onChange={(e) => setRegEmergencyPhone(e.target.value)}
                  placeholder="+91 98450 XXXXX"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
              <input
                type="checkbox"
                id="consentCheck"
                checked={regConsent}
                onChange={(e) => setRegConsent(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="consentCheck" className="text-xs text-slate-600 leading-normal">
                I hereby record explicit worker consent for purpose-limited worksite safety management, certification tracking, and site access control in compliance with applicable Digital Personal Data Protection (DPDP) standards.
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingReg || !regConsent}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingReg ? 'Registering Worker...' : 'Submit Registration to Verification Queue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PROJECT MANAGER VERIFICATION QUEUE                 */}
      {/* ========================================================= */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">Project Manager Verification & Approval Center</h3>
                <p className="text-xs text-amber-700">Workers awaiting review before QR badge issuance and site allocation.</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200 text-amber-900 font-bold text-xs rounded-full">
              {workers.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((w) => (
              <div key={w.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{w.fullName}</h4>
                    <p className="text-xs font-mono text-slate-500">{w.workerCode}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                    PENDING REVIEW
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><strong>Contractor:</strong> {w.vendorName}</p>
                  <p><strong>Role:</strong> {w.jobRole.replace(/_/g, ' ')}</p>
                  <p><strong>Phone:</strong> {w.mobileNumber}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenWorkerModal(w.id)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    Inspect & Decide
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {workers.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-bold text-slate-700">Verification Queue Clear</p>
                <p className="text-xs text-slate-500">All registered workers have been reviewed by the Project Manager.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: SKILLS & CERTIFICATIONS                            */}
      {/* ========================================================= */}
      {activeTab === 'certifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Register Safety Certification
            </h3>
            <p className="text-xs text-slate-500">Record regulatory certificates (NSC, CPRI, DGMS, First Aid) to clear workers for specialized operations.</p>
            
            <form onSubmit={handleAddCertification} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Worker *</label>
                <select
                  required
                  value={newCertWorkerId}
                  onChange={(e) => setNewCertWorkerId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  <option value="">Select Worker...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.fullName} ({w.workerCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Certification Type *</label>
                <select
                  value={newCertType}
                  onChange={(e) => setNewCertType(e.target.value as CertificationType)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  <option value="GENERAL_CONSTRUCTION_SAFETY">General Construction Safety</option>
                  <option value="EXCAVATION_SAFETY">Excavation & Trenching Safety</option>
                  <option value="ELECTRICAL_SAFETY">Electrical Safety & High Voltage</option>
                  <option value="WORKING_AT_HEIGHT">Working at Height & Scaffolding</option>
                  <option value="PPE_TRAINING">PPE Mandatory Training</option>
                  <option value="FIRST_AID">First Aid & Emergency Response</option>
                  <option value="HEAVY_EQUIPMENT_OPERATION">Heavy Equipment Operation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Issuing Authority *</label>
                <input
                  type="text"
                  required
                  value={newCertAuthority}
                  onChange={(e) => setNewCertAuthority(e.target.value)}
                  placeholder="e.g. National Safety Council"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Certificate Number</label>
                <input
                  type="text"
                  value={newCertNumber}
                  onChange={(e) => setNewCertNumber(e.target.value)}
                  placeholder="e.g. NSC-EXC-2026-90"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={newCertIssueDate}
                    onChange={(e) => setNewCertIssueDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newCertExpiryDate}
                    onChange={(e) => setNewCertExpiryDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingCert}
                className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow transition-all disabled:opacity-50"
              >
                {submittingCert ? 'Recording...' : 'Add Certification Record'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Certification Compliance Overview</span>
              <span className="text-xs text-slate-500 font-normal">Active workers with validated credentials</span>
            </h3>

            <div className="space-y-3">
              {workers.map((w) => (
                <div key={w.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{w.fullName} ({w.workerCode})</p>
                    <p className="text-[11px] text-slate-500">{w.jobRole.replace(/_/g, ' ')} • {w.vendorName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                      {w.activeCertificationsCount} Valid Certs
                    </span>
                    {w.expiredCertificationsCount > 0 && (
                      <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded animate-pulse">
                        {w.expiredCertificationsCount} Expired
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenWorkerModal(w.id)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: WORK ZONE ALLOCATIONS                              */}
      {/* ========================================================= */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Assign Worker to Work Zone
            </h3>
            <p className="text-xs text-slate-500">Allocates approved workers to authorized project work packages.</p>

            <form onSubmit={handleAssignWorker} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Approved Worker *</label>
                <select
                  required
                  value={assignWorkerId}
                  onChange={(e) => setAssignWorkerId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  <option value="">Select Worker...</option>
                  {workers.filter(w => w.currentStatus === 'APPROVED' || w.currentStatus === 'ASSIGNED').map((w) => (
                    <option key={w.id} value={w.id}>{w.fullName} ({w.workerCode}) - {w.jobRole}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Project *</label>
                <select
                  required
                  value={assignProjId}
                  onChange={(e) => {
                    setAssignProjId(e.target.value);
                    loadZonesForProject(e.target.value);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Zone *</label>
                <select
                  required
                  value={assignZoneId}
                  onChange={(e) => setAssignZoneId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  <option value="">Select Work Zone...</option>
                  {workZones.map((z) => (
                    <option key={z.id} value={z.id}>{z.zoneName} ({z.zoneCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={assignEndDate}
                    onChange={(e) => setAssignEndDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingAssign}
                className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow transition-all disabled:opacity-50"
              >
                {submittingAssign ? 'Assigning...' : 'Confirm Zone Assignment'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Active Zone Assignments</h3>
            <div className="space-y-3">
              {workers.filter(w => w.activeWorkZoneName).map((w) => (
                <div key={w.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{w.fullName} ({w.workerCode})</h4>
                    <p className="text-slate-600 mt-0.5">
                      <strong>Zone:</strong> {w.activeWorkZoneName} • <strong>Project:</strong> {w.activeProjectName}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">Contractor: {w.vendorName}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 font-bold rounded-full">
                    ACTIVE ALLOCATION
                  </span>
                </div>
              ))}
              {workers.filter(w => w.activeWorkZoneName).length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-8">No workers currently allocated to active work zones.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: GATE SCANNER & REAL-TIME ENTRY TERMINAL             */}
      {/* ========================================================= */}
      {activeTab === 'site-access' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              Gate Terminal Access Scanner
            </h3>
            <p className="text-xs text-slate-500">
              Scan worker QR code or enter Worker ID (e.g. INF-WRK-2026-000001) to verify approval, assignment, and certifications.
            </p>

            <form onSubmit={handleGateScan} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Project Site *</label>
                <select
                  required
                  value={selectedScanProject}
                  onChange={(e) => {
                    setSelectedScanProject(e.target.value);
                    loadZonesForProject(e.target.value);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Zone (Optional)</label>
                <select
                  value={selectedScanZone}
                  onChange={(e) => setSelectedScanZone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  <option value="">Any authorized zone on project</option>
                  {workZones.map((z) => (
                    <option key={z.id} value={z.id}>{z.zoneName} ({z.zoneCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">QR Code Data / Worker ID *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={scannerInput}
                    onChange={(e) => setScannerInput(e.target.value)}
                    placeholder="Scan QR or enter INF-WRK-2026-XXXXXX"
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 pr-8 focus:ring-2 focus:ring-indigo-500"
                  />
                  <QrCode className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {scanning ? 'Verifying Credentials...' : 'Verify & Record Site Entry'}
              </button>
            </form>

            {/* Instant Visual Decision Banner */}
            {scanResult && (
              <div className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
                scanResult.allowed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {scanResult.allowed ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>ENTRY ALLOWED</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>ENTRY BLOCKED</span>
                    </>
                  )}
                </div>
                <p className="font-medium">{scanResult.humanReadableReason}</p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 font-mono text-[11px] space-y-0.5">
                  <p>Worker: {scanResult.fullName} ({scanResult.workerCode})</p>
                  <p>Contractor: {scanResult.vendorName}</p>
                  {scanResult.projectName && <p>Project: {scanResult.projectName}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Active On-Site Personnel List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Currently On-Site Workers</h3>
                <p className="text-xs text-slate-500">Live active sessions awaiting gate exit</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                {headcount?.totalCheckedIn || 0} On-Site
              </span>
            </div>

            <div className="space-y-3">
              {(headcount?.activePersonnel || []).map((p) => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {p.workerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{p.workerName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{p.workerCode} • {p.workerRole} • {p.vendorName}</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        Checked In: {new Date(p.entryTime).toLocaleTimeString()} ({p.workZoneName || 'General Zone'})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckOut(p.id)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                    Record Exit
                  </button>
                </div>
              ))}
              {(!headcount || headcount.activePersonnel?.length === 0) && (
                <div className="py-12 text-center text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No workers currently checked in on this site.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: EMERGENCY HEADCOUNT ROLL-CALL                      */}
      {/* ========================================================= */}
      {activeTab === 'emergency-headcount' && (
        <div className="space-y-6">
          <div className="bg-red-500 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-red-200">Emergency Protocol Active</span>
                <h2 className="text-2xl font-black">Live Emergency Workforce Headcount</h2>
                <p className="text-xs text-red-100 mt-1">Real-time roll-call verified against server timestamps and confirmed site entry records.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white text-red-700 font-bold text-xs rounded-xl shadow hover:bg-red-50 flex items-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Emergency Roll-Call
              </button>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Personnel Present</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{headcount?.totalCheckedIn || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Work Zones</span>
              <p className="text-3xl font-black text-indigo-600 mt-1">{Object.keys(headcount?.workersByWorkZone || {}).length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Contractors Present</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">{Object.keys(headcount?.workersByVendor || {}).length}</p>
            </div>
          </div>

          {/* Detailed Roll-Call Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Personnel Roster on Site</h3>
              <span className="text-xs font-mono text-slate-500">As of: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/60 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">Worker Code & Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Contractor</th>
                    <th className="py-3 px-4">Work Zone</th>
                    <th className="py-3 px-4">Entry Time</th>
                    <th className="py-3 px-4 text-right">Emergency Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(headcount?.activePersonnel || []).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.workerName} ({p.workerCode})</td>
                      <td className="py-3 px-4">{p.workerRole}</td>
                      <td className="py-3 px-4">{p.vendorName}</td>
                      <td className="py-3 px-4">{p.workZoneName || 'General Site'}</td>
                      <td className="py-3 px-4 font-mono">{new Date(p.entryTime).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-full text-[10px]">
                          ON SITE
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!headcount || headcount.activePersonnel?.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Zero personnel recorded on site.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 9: SAFETY & INCIDENT MANAGEMENT                       */}
      {/* ========================================================= */}
      {activeTab === 'safety' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Report Site Safety Event
            </h3>
            <p className="text-xs text-slate-500">Log PPE violations, equipment misuse, near-misses, or accidents.</p>

            <form onSubmit={handleReportIncident} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Project Site *</label>
                <select
                  required
                  value={newIncidentProj}
                  onChange={(e) => setNewIncidentProj(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Incident Type *</label>
                  <select
                    value={newIncidentType}
                    onChange={(e) => setNewIncidentType(e.target.value as IncidentType)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  >
                    <option value="SAFETY_VIOLATION">Safety Violation</option>
                    <option value="MISSING_PPE">Missing Mandatory PPE</option>
                    <option value="UNAUTHORIZED_ACCESS">Unauthorized Site Access</option>
                    <option value="EQUIPMENT_MISUSE">Equipment Misuse</option>
                    <option value="NEAR_MISS">Near Miss Event</option>
                    <option value="ACCIDENT">Accident / Injury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Severity *</label>
                  <select
                    value={newIncidentSeverity}
                    onChange={(e) => setNewIncidentSeverity(e.target.value as IncidentSeverity)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={newIncidentDesc}
                  onChange={(e) => setNewIncidentDesc(e.target.value)}
                  placeholder="Describe location, unsafe action, equipment involved, and risk factors..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Immediate Action Taken</label>
                <input
                  type="text"
                  value={newIncidentAction}
                  onChange={(e) => setNewIncidentAction(e.target.value)}
                  placeholder="e.g. Work stopped, PPE re-issued, worker escorted out..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <button
                type="submit"
                disabled={submittingIncident}
                className="w-full mt-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow transition-all disabled:opacity-50"
              >
                {submittingIncident ? 'Logging Incident...' : 'Submit Incident Report'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Recorded Incident Log</h3>
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-red-900 font-mono text-sm">{inc.incidentReference}</span>
                      <span className="ml-2 font-semibold text-slate-800">{inc.incidentType.replace(/_/g, ' ')}</span>
                      <p className="text-slate-500 text-[11px]">
                        Project: {inc.projectName || 'Site'} • Reported by: {inc.reportedByName} • {new Date(inc.reportedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 font-bold rounded ${
                      inc.severity === 'CRITICAL' ? 'bg-red-200 text-red-900' :
                      inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-900' :
                      inc.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <p className="text-slate-700">{inc.description}</p>
                  {inc.immediateActionTaken && (
                    <p className="text-indigo-900 bg-indigo-50/70 p-2 rounded-lg text-[11px]">
                      <strong>Action:</strong> {inc.immediateActionTaken}
                    </p>
                  )}
                  {inc.resolution && (
                    <p className="text-emerald-900 bg-emerald-50/70 p-2 rounded-lg text-[11px]">
                      <strong>Resolution:</strong> {inc.resolution}
                    </p>
                  )}
                </div>
              ))}
              {incidents.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-8">Zero safety incidents reported.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 10: ATTENDANCE HISTORY                                */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Historical Gate Attendance Log</h3>
            <span className="text-xs text-slate-500">Entry/exit timestamps with recording officer attribution</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/60 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Worker Code & Name</th>
                  <th className="py-3 px-4">Contractor</th>
                  <th className="py-3 px-4">Project & Zone</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4">Exit Time</th>
                  <th className="py-3 px-4">Gate Decision</th>
                  <th className="py-3 px-4">Recording Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.workerName} ({log.workerCode})</td>
                    <td className="py-3 px-4">{log.vendorName}</td>
                    <td className="py-3 px-4">{log.projectName || 'Site'} ({log.workZoneName || 'General'})</td>
                    <td className="py-3 px-4 font-mono">{new Date(log.entryTime).toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{log.exitTime ? new Date(log.exitTime).toLocaleString() : <span className="text-blue-600 font-bold">On Site</span>}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.accessStatus === 'ALLOW_ENTRY' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.accessStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{log.recordingOfficerName}</td>
                  </tr>
                ))}
                {attendanceLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No attendance log records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Worker Detail Modal Drawer */}
      {selectedWorkerDetail && (
        <WorkerDetailModal
          worker={selectedWorkerDetail}
          onClose={() => setSelectedWorkerDetail(null)}
          onRefresh={() => {
            refreshData();
            handleOpenWorkerModal(selectedWorkerDetail.id);
          }}
        />
      )}

    </div>
  );
};
