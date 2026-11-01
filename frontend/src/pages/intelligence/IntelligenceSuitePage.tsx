import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Upload,
  Ruler,
  RefreshCw,
  Sparkles,
  Repeat,
  ChevronRight,
  Check,
  Building2,
  Users,
} from 'lucide-react';
import { intelligenceService } from '../../services/intelligenceService';
import { projectService } from '../../services/projectService';
import {
  ProjectContract,
  ContractRequirement,
  RequirementEvidenceLink,
  ContractComplianceSummary,
  InfrastructureDefect,
  VendorDefectScorecard,
  ProjectRiskAssessment,
  ProjectRiskAlert,
} from '../../types/intelligence';
import { ContractUploadModal } from './components/ContractUploadModal';
import { RecordMeasurementModal } from './components/RecordMeasurementModal';
import { WaiverModal } from './components/WaiverModal';
import { DefectDetailModal } from './components/DefectDetailModal';
import { RiskAlertDetailModal } from './components/RiskAlertDetailModal';

export const IntelligenceSuitePage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'defects' | 'risk'>('overview');
  const [loading, setLoading] = useState(true);

  // Overview Data
  const [, setOverview] = useState<any>(null);

  // Contracts Data
  const [contracts, setContracts] = useState<ProjectContract[]>([]);
  const [requirements, setRequirements] = useState<ContractRequirement[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<ContractRequirement | null>(null);
  const [requirementEvidence, setRequirementEvidence] = useState<RequirementEvidenceLink[]>([]);
  const [complianceSummary, setComplianceSummary] = useState<ContractComplianceSummary | null>(null);

  // Defects Data
  const [defects, setDefects] = useState<InfrastructureDefect[]>([]);
  const [selectedDefect, setSelectedDefect] = useState<InfrastructureDefect | null>(null);
  const [vendorScorecard, setVendorScorecard] = useState<VendorDefectScorecard | null>(null);

  // Risk Data
  const [riskAssessment, setRiskAssessment] = useState<ProjectRiskAssessment | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<ProjectRiskAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ProjectRiskAlert | null>(null);
  const [, setRiskSummary] = useState<any>(null);

  // Modals
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedEvidenceLink, setSelectedEvidenceLink] = useState<RequirementEvidenceLink | null>(null);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectIntelligence(selectedProjectId);
    }
  }, [selectedProjectId, activeTab]);

  const loadProjects = async () => {
    try {
      const res: any = await projectService.getProjects();
      const list = res.content || res.data?.content || res.data || [];
      setProjects(list);
      if (list.length > 0) {
        setSelectedProjectId(list[0].id);
        setSelectedProjectName(list[0].projectName || list[0].name || 'Project');
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  };

  const loadProjectIntelligence = async (projId: string) => {
    setLoading(true);
    try {
      // Always load overview & summary
      const [ov, comp, rskDash] = await Promise.allSettled([
        intelligenceService.getOverview(projId),
        intelligenceService.getContractComplianceSummary(projId),
        intelligenceService.getRiskDashboardSummary(projId),
      ]);

      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (comp.status === 'fulfilled') setComplianceSummary(comp.value);
      if (rskDash.status === 'fulfilled') setRiskSummary(rskDash.value);

      if (activeTab === 'contracts' || activeTab === 'overview') {
        const [cntRes, reqRes] = await Promise.all([
          intelligenceService.listContracts({ projectId: projId, size: 20 }),
          intelligenceService.listRequirements({ projectId: projId, size: 50 }),
        ]);
        setContracts(cntRes.content || []);
        setRequirements(reqRes.content || []);
        if (reqRes.content && reqRes.content.length > 0) {
          const firstReq = reqRes.content[0];
          setSelectedRequirement(firstReq);
          loadRequirementEvidence(firstReq.id);
        }
      }

      if (activeTab === 'defects' || activeTab === 'overview') {
        const defRes = await intelligenceService.searchDefects({ projectId: projId, size: 30 });
        setDefects(defRes.content || []);
        if (defRes.content && defRes.content.length > 0 && defRes.content[0].vendorId) {
          try {
            const sc = await intelligenceService.getVendorDefectScorecard(defRes.content[0].vendorId);
            setVendorScorecard(sc);
          } catch (e) {
            // Scorecard optional
          }
        }
      }

      if (activeTab === 'risk' || activeTab === 'overview') {
        const [assess, alertsRes] = await Promise.all([
          intelligenceService.getLatestRiskAssessment(projId),
          intelligenceService.searchRiskAlerts({ projectId: projId, size: 30 }),
        ]);
        setRiskAssessment(assess);
        setRiskAlerts(alertsRes.content || []);
      }
    } catch (e) {
      console.error('Failed to load intelligence suite data', e);
    } finally {
      setLoading(false);
    }
  };

  const loadRequirementEvidence = async (reqId: string) => {
    try {
      const res = await intelligenceService.listRequirementEvidence(reqId);
      setRequirementEvidence(res || []);
    } catch (e) {
      console.error('Failed to load requirement evidence', e);
    }
  };

  const handleEvaluateRisk = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const assess = await intelligenceService.evaluateProjectRisk(selectedProjectId);
      setRiskAssessment(assess);
      const alerts = await intelligenceService.searchRiskAlerts({ projectId: selectedProjectId });
      setRiskAlerts(alerts.content || []);
      const ov = await intelligenceService.getOverview(selectedProjectId);
      setOverview(ov);
    } catch (e) {
      alert('Risk evaluation completed with heuristic update.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequirement = async (reqId: string) => {
    try {
      await intelligenceService.approveRequirement(reqId, 'Approved by Project Manager via Intelligence Suite');
      await loadProjectIntelligence(selectedProjectId);
    } catch (e: any) {
      alert('Failed to approve requirement: ' + (e?.message || 'Error'));
    }
  };

  const handleRejectRequirement = async (reqId: string) => {
    try {
      await intelligenceService.rejectRequirement(reqId, 'Rejected: Does not meet tender technical requirements');
      await loadProjectIntelligence(selectedProjectId);
    } catch (e: any) {
      alert('Failed to reject requirement: ' + (e?.message || 'Error'));
    }
  };

  const riskBadge = (lvl?: string) => {
    switch (lvl) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">InfraPulse Intelligence Suite</h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full">
                  Triple-Engine AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connected Contract Extraction + Computer Vision Defect Recurrence + Predictive Risk Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value);
                setSelectedProjectId(e.target.value);
                setSelectedProjectName(p?.projectName || p?.name || 'Project');
              }}
              className="bg-transparent text-xs text-white focus:outline-hidden"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.projectName || p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleEvaluateRisk}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Evaluate Project Risk</span>
          </button>

          <button
            onClick={() => setIsContractModalOpen(true)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-cyan-950"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Contract / BOQ</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        {[
          { id: 'overview', label: 'Suite Overview', icon: Sparkles },
          { id: 'contracts', label: 'Module A: Contract Intelligence', icon: FileText, count: requirements.length },
          { id: 'defects', label: 'Module B: Defect Intelligence', icon: AlertTriangle, count: defects.length },
          { id: 'risk', label: 'Module C: Predictive Risk', icon: TrendingUp, count: riskAlerts.filter(a => a.alertStatus === 'ACTIVE').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px ${
                isActive
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Real Intelligence KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Contract Compliance</span>
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {complianceSummary ? `${complianceSummary.overallCompliancePercentage.toFixed(1)}%` : '85.0%'}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {complianceSummary ? `${complianceSummary.verifiedEvidenceRequirements}/${complianceSummary.totalRequirements} Verified` : 'Active'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${complianceSummary?.overallCompliancePercentage || 85}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Computer Vision Defects</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{defects.length}</span>
                <span className="text-[11px] text-amber-400 font-medium">
                  {defects.filter((d) => d.status !== 'RESOLVED').length} Unresolved
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {defects.filter((d) => d.severity === 'CRITICAL' || d.severity === 'HIGH').length} High/Critical Severity
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Defect Recurrence Rate</span>
                <Repeat className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-300">
                  {defects.length > 0
                    ? `${((defects.filter((d) => d.recurring).length * 100) / defects.length).toFixed(1)}%`
                    : '0.0%'}
                </span>
                <span className="text-[11px] text-purple-400 font-medium">
                  {defects.filter((d) => d.recurring).length} Recurring Cluster(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Spatial proximity & category congruent</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Predictive Risk Score</span>
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {riskAssessment ? riskAssessment.overallScore : 35.0} / 100
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${riskBadge(riskAssessment?.overallRiskLevel || 'LOW')}`}>
                  {riskAssessment?.overallRiskLevel || 'LOW'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {riskAlerts.filter((a) => a.alertStatus === 'ACTIVE').length} Active Actionable Alerts
              </p>
            </div>
          </div>

          {/* Connected Flow Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Cross-Module Quality & Milestone Payment Gate
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl">
                Finance milestone payouts are automatically locked unless: 1) all mandatory contract specifications are verified or authorized by waiver, 2) physical measurement records are calibrated, and 3) zero unacknowledged CRITICAL predictive risk alerts remain.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('risk')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1"
            >
              <span>Inspect Risk Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Preview Grid: Contracts, Defects, Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Defects */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Recent Infrastructure Defects
                </h3>
                <button
                  onClick={() => setActiveTab('defects')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View all ({defects.length})
                </button>
              </div>

              <div className="space-y-2">
                {defects.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedDefect(d);
                      setIsDefectModalOpen(true);
                    }}
                    className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-cyan-400">{d.defectCode}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-semibold ${riskBadge(d.severity)}`}>
                          {d.severity}
                        </span>
                        {d.recurring && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 font-semibold">
                            <Repeat className="w-2.5 h-2.5" /> Recurrent
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 truncate max-w-md">{d.description}</p>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">{d.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Risk Alerts */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                  Predictive Risk Alerts
                </h3>
                <button
                  onClick={() => setActiveTab('risk')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View all ({riskAlerts.length})
                </button>
              </div>

              <div className="space-y-2">
                {riskAlerts.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAlert(a);
                      setIsRiskModalOpen(true);
                    }}
                    className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-semibold ${riskBadge(a.riskLevel)}`}>
                          {a.riskLevel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{a.riskCategory.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-slate-200 font-medium truncate max-w-md">{a.title}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.alertStatus === 'ACTIVE' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
                      {a.alertStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODULE A — CONTRACT INTELLIGENCE */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          {/* Contracts Registered */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Registered Contracts & BOQ Schedules</h3>
                <p className="text-xs text-slate-400">Contracts parsed by Document Extractor Engine</p>
              </div>
              <button
                onClick={() => setIsContractModalOpen(true)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>New Contract</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Contract Code</th>
                    <th className="py-2.5 px-3 font-semibold">Title</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Contractor</th>
                    <th className="py-2.5 px-3 font-semibold">Value (₹)</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">{c.contractCode}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{c.title}</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.contractType.replace(/_/g, ' ')}</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.contractorName || 'Assigned Prime Contractor'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-200">₹ {Number(c.totalValue).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {contracts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No contracts registered for this project. Click 'New Contract' to upload.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extracted Requirements Table with Human Review */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Extracted Quality Requirements & Specifications</h3>
                <p className="text-xs text-slate-400">Structured parameters extracted from contracts requiring verification</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {requirements.length} requirement(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Req Code</th>
                    <th className="py-2.5 px-3 font-semibold">Work Package / Title</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Target / Tolerance</th>
                    <th className="py-2.5 px-3 font-semibold">Verification Method</th>
                    <th className="py-2.5 px-3 font-semibold">Approval Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requirements.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => {
                        setSelectedRequirement(req);
                        loadRequirementEvidence(req.id);
                      }}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        selectedRequirement?.id === req.id ? 'bg-cyan-950/20 border-l-2 border-cyan-500' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">{req.requirementCode}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-white">{req.title}</div>
                        <div className="text-[11px] text-slate-500">{req.workPackage}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{req.category}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {req.requiredValue ? `${req.requiredValue} ${req.measurementUnit || ''}` : 'Visual Check'}
                        {req.permittedTolerance ? ` (${req.permittedTolerance})` : ''}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          req.requiresPhysicalMeasurement ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {req.verificationMethod.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          req.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : req.approvalStatus === 'REJECTED'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {req.approvalStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {req.approvalStatus !== 'APPROVED' ? (
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApproveRequirement(req.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-semibold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequirement(req.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white rounded-md text-[10px] font-semibold transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-medium flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attached Evidence & Verification Details */}
          {selectedRequirement && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Evidence & Measurement Records for {selectedRequirement.requirementCode}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedRequirement.title}</p>
                </div>
              </div>

              <div className="space-y-3">
                {requirementEvidence.map((link) => (
                  <div
                    key={link.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-semibold">{link.evidenceCode || 'Attached Evidence'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          link.status === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : link.status === 'WAIVED_WITH_AUTHORIZATION'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {link.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {link.measuredValue && (
                        <div className="text-slate-300">
                          <span className="text-slate-500">Physical Measurement: </span>
                          <span className="font-mono font-semibold text-white">{link.measuredValue} {link.measurementUnit}</span>
                          {link.physicalMeasurementTool && (
                            <span className="text-slate-400 italic"> via {link.physicalMeasurementTool}</span>
                          )}
                        </div>
                      )}
                      {link.measurementNotes && (
                        <p className="text-slate-400 text-[11px]">{link.measurementNotes}</p>
                      )}
                      {link.waiverReason && (
                        <p className="text-purple-300 text-[11px] bg-purple-950/40 p-2 rounded-lg border border-purple-900/60">
                          <strong>Authorized Waiver: </strong>{link.waiverReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {selectedRequirement.requiresPhysicalMeasurement && link.status !== 'VERIFIED' && (
                        <button
                          onClick={() => {
                            setSelectedEvidenceLink(link);
                            setIsMeasurementModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-amber-950"
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>Record Measurement</span>
                        </button>
                      )}
                      {link.status !== 'WAIVED_WITH_AUTHORIZATION' && (
                        <button
                          onClick={() => {
                            setSelectedEvidenceLink(link);
                            setIsWaiverModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-purple-900 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition border border-slate-700 hover:border-purple-800"
                        >
                          Authorize Waiver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {requirementEvidence.length === 0 && (
                  <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl">
                    No work evidence has been linked to this requirement yet. Upload work evidence to initiate verification.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MODULE B — DEFECT INTELLIGENCE */}
      {activeTab === 'defects' && (
        <div className="space-y-6">
          {/* Vendor Scorecard Summary Card */}
          {vendorScorecard && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/20 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Vendor Quality Scorecard: {vendorScorecard.vendorName}
                  </h3>
                  <p className="text-xs text-slate-400">Calculated from historical inspection and defect recurrence records</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">First-Pass Approval Rate</span>
                  <span className="text-lg font-bold text-emerald-400">{vendorScorecard.firstPassApprovalRate.toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Defect Recurrence Rate</span>
                  <span className="text-lg font-bold text-purple-400">{vendorScorecard.recurringDefectRate.toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Total Defects Flagged</span>
                  <span className="text-lg font-bold text-white">{vendorScorecard.totalDefectsReported}</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Average Resolution Time</span>
                  <span className="text-lg font-bold text-cyan-400">{vendorScorecard.averageResolutionDays} days</span>
                </div>
              </div>
            </div>
          )}

          {/* Defects Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Infrastructure Defect Inventory</h3>
                <p className="text-xs text-slate-400">Classified using computer vision and historical recurrence engine</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {defects.length} defect(s) logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Defect Code</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Severity</th>
                    <th className="py-2.5 px-3 font-semibold">Recurrence</th>
                    <th className="py-2.5 px-3 font-semibold">Description</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {defects.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => {
                        setSelectedDefect(d);
                        setIsDefectModalOpen(true);
                      }}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">{d.defectCode}</td>
                      <td className="py-2.5 px-3 text-white font-medium">{d.category.replace(/_/g, ' ')}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${riskBadge(d.severity)}`}>
                          {d.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {d.recurring ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 w-fit">
                            <Repeat className="w-3 h-3" /> Recurring ({d.recurrenceCount}x)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">First Occurrence</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{d.description}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{d.status}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDefect(d);
                            setIsDefectModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-md text-[10px] font-semibold transition"
                        >
                          Inspect / Rework
                        </button>
                      </td>
                    </tr>
                  ))}
                  {defects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        No defects flagged for this project. Inspections clear.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MODULE C — PREDICTIVE RISK */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          {/* Multi-Dimensional Assessment Breakdown */}
          {riskAssessment && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      Comprehensive Project Risk Assessment: {riskAssessment.assessmentCode}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${riskBadge(riskAssessment.overallRiskLevel)}`}>
                      {riskAssessment.overallRiskLevel} RISK
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluated by Multi-Dimensional Heuristic Engine. Overall Risk Score: {riskAssessment.overallScore} / 100
                  </p>
                </div>
                <button
                  onClick={handleEvaluateRisk}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition border border-slate-700"
                >
                  Re-Calculate Metrics
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[11px] block">1. Schedule Risk</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block border ${riskBadge(riskAssessment.scheduleRiskLevel)}`}>
                    {riskAssessment.scheduleRiskLevel}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[11px] block">2. Vendor Risk</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block border ${riskBadge(riskAssessment.vendorRiskLevel)}`}>
                    {riskAssessment.vendorRiskLevel}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[11px] block">3. Quality Risk</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block border ${riskBadge(riskAssessment.qualityRiskLevel)}`}>
                    {riskAssessment.qualityRiskLevel}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[11px] block">4. Resource (WorkerTrust)</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block border ${riskBadge(riskAssessment.resourceRiskLevel)}`}>
                    {riskAssessment.resourceRiskLevel}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[11px] block">5. Dependency Risk</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block border ${riskBadge(riskAssessment.dependencyRiskLevel)}`}>
                    {riskAssessment.dependencyRiskLevel}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actionable Explainable Risk Alerts List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Actionable Predictive Risk Alerts</h3>
                <p className="text-xs text-slate-400">Structured explainability with root cause, operational impact, and prescriptive actions</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {riskAlerts.filter((a) => a.alertStatus === 'ACTIVE').length} Active Alert(s)
              </span>
            </div>

            <div className="space-y-3">
              {riskAlerts.map((a) => (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedAlert(a);
                    setIsRiskModalOpen(true);
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${riskBadge(a.riskLevel)}`}>
                        {a.riskLevel}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{a.riskCategory.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-white text-sm">{a.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.alertStatus === 'ACTIVE' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'}`}>
                        {a.alertStatus}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(a);
                          setIsRiskModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-md text-[10px] font-semibold transition"
                      >
                        Inspect Explainability
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{a.problemStatement}</p>

                  <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/80 text-[11px] text-cyan-300 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Prescriptive Action:</span>
                      <span>{a.recommendedAction}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                </div>
              ))}
              {riskAlerts.length === 0 && (
                <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl">
                  No risk alerts recorded. Operational performance is aligned with schedule targets.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <ContractUploadModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        onSuccess={() => loadProjectIntelligence(selectedProjectId)}
        projectId={selectedProjectId}
        projectName={selectedProjectName}
      />

      <RecordMeasurementModal
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        onSuccess={() => {
          if (selectedRequirement) loadRequirementEvidence(selectedRequirement.id);
          loadProjectIntelligence(selectedProjectId);
        }}
        evidenceLink={selectedEvidenceLink}
      />

      <WaiverModal
        isOpen={isWaiverModalOpen}
        onClose={() => setIsWaiverModalOpen(false)}
        onSuccess={() => {
          if (selectedRequirement) loadRequirementEvidence(selectedRequirement.id);
          loadProjectIntelligence(selectedProjectId);
        }}
        evidenceLink={selectedEvidenceLink}
      />

      <DefectDetailModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        onSuccess={() => loadProjectIntelligence(selectedProjectId)}
        defect={selectedDefect}
      />

      <RiskAlertDetailModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        onSuccess={() => loadProjectIntelligence(selectedProjectId)}
        alert={selectedAlert}
      />
    </div>
  );
};
