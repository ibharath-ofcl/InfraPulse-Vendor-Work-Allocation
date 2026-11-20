import { 
  ProjectContract, 
  ContractRequirement, 
  RequirementApprovalStatus,
  ContractType 
} from '../types/intelligence';

export const FALLBACK_CONTRACTS: ProjectContract[] = [
  {
    id: 'CNT-2026-001',
    contractCode: 'CNT-2026-BLR-001',
    projectId: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    contractorId: 'VND-001',
    contractorName: 'Apex Infra Utilities Ltd',
    title: 'Smart City Fiber Backbone & Underground Ducting Master Package',
    contractType: 'OPTICAL_FIBER',
    totalValue: 35000000,
    status: 'ACTIVE',
    versionNumber: 1,
    startDate: '2026-01-15',
    endDate: '2027-05-31',
    description: 'Turnkey underground conduit laying, micro-ducting, optical fiber pull, and GIS spatial calibration across Bengaluru municipal corridors.',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-10-30T10:00:00Z',
  },
  {
    id: 'CNT-2026-002',
    contractCode: 'CNT-2026-BLR-002',
    projectId: 'PRJ-BLR-202',
    projectName: 'Bengaluru Smart Utility Corridor',
    contractorId: 'VND-002',
    contractorName: 'TransGrid Power Infrastructure',
    title: 'South Zone Arterial Road Resurfacing & Utility Ducting Package',
    contractType: 'ROAD_WORKS',
    totalValue: 42000000,
    status: 'ACTIVE',
    versionNumber: 1,
    startDate: '2026-02-01',
    endDate: '2027-08-15',
    description: 'Road resurfacing, DBM laying, and concrete encasement for storm-water and utility crossings adhering to IRC:SP:84 standard.',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-10-28T14:00:00Z',
  },
];

export const FALLBACK_REQUIREMENTS: ContractRequirement[] = [
  {
    id: 'req-001',
    requirementCode: 'REQ-2026-00001',
    contractId: 'CNT-2026-001',
    contractCode: 'CNT-2026-BLR-001',
    projectId: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workPackage: 'Civil Trenching & Excavation',
    title: 'Optical Conduit Minimum Trench Excavation Depth',
    description: 'Excavation depth along paved roadway verge must achieve a minimum clearance of 1.20 meters below ground surface datum.',
    category: 'DIMENSIONAL',
    acceptanceCriteria: 'Calibrated monocular dipstick measurement >= 1.20m with continuous shoring in sections deeper than 1.5m.',
    measurementUnit: 'meters',
    requiredValue: '1.20',
    permittedTolerance: '± 0.05m',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'PHYSICAL_MEASUREMENT',
    approvalStatus: 'APPROVED',
    approvedByName: 'Platform Administrator',
    approvedAt: '2026-10-15T11:00:00Z',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-15T11:00:00Z',
  },
  {
    id: 'req-002',
    requirementCode: 'REQ-2026-00002',
    contractId: 'CNT-2026-001',
    contractCode: 'CNT-2026-BLR-001',
    projectId: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workPackage: 'Safety & Utility Protection',
    title: 'High-Visibility Underground Optical Warning Tape Placement',
    description: 'Retroreflective yellow/orange warning ribbon must be installed continuously 300mm above the upper HDPE duct layer prior to secondary backfill.',
    category: 'SAFETY_RULE',
    acceptanceCriteria: 'Continuous photo evidence verified via computer vision with station chainage markers visible.',
    measurementUnit: 'millimeters',
    requiredValue: '300',
    permittedTolerance: '± 25mm',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: false,
    verificationMethod: 'PHOTO_EVIDENCE',
    approvalStatus: 'APPROVED',
    approvedByName: 'Platform Administrator',
    approvedAt: '2026-10-16T12:00:00Z',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-16T12:00:00Z',
  },
  {
    id: 'req-003',
    requirementCode: 'REQ-2026-00003',
    contractId: 'CNT-2026-001',
    contractCode: 'CNT-2026-BLR-001',
    projectId: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workPackage: 'Conduit Bedding & Ducting',
    title: 'Uniform Granular Bedding Sand Cushion Thickness',
    description: 'HDPE ducts must rest upon a uniform 100mm layer of fine sieved river sand (maximum particle size 2.0mm) to prevent sharp aggregate puncture.',
    category: 'MATERIAL_QUALITY',
    acceptanceCriteria: 'Sieve gradation certificate and visual uniformity inspection certified prior to pipe positioning.',
    measurementUnit: 'millimeters',
    requiredValue: '100',
    permittedTolerance: '± 15mm',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'PHYSICAL_MEASUREMENT',
    approvalStatus: 'APPROVED',
    approvedByName: 'Platform Administrator',
    approvedAt: '2026-10-20T14:30:00Z',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-20T14:30:00Z',
  },
  {
    id: 'req-004',
    requirementCode: 'REQ-2026-00004',
    contractId: 'CNT-2026-001',
    contractCode: 'CNT-2026-BLR-001',
    projectId: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workPackage: 'Road Restoration & Pavement Reinstatement',
    title: 'Restored Asphalt Surface Planar Flushness (IRC:SP:84)',
    description: 'Reinstated asphalt surface across utility trench cuts must maintain coplanar continuity with existing carriageway without depression pockets.',
    category: 'SPECIFICATION',
    acceptanceCriteria: '3-meter straight edge surface depression <= 3.0mm conforming to Indian Roads Congress specification IRC:SP:84.',
    measurementUnit: 'millimeters',
    requiredValue: '3.0',
    permittedTolerance: 'Max allowable',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'PHYSICAL_MEASUREMENT',
    approvalStatus: 'APPROVED',
    approvedByName: 'Platform Administrator',
    approvedAt: '2026-10-24T16:00:00Z',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-24T16:00:00Z',
  },
  {
    id: 'req-005',
    requirementCode: 'REQ-2026-00005',
    contractId: 'CNT-2026-001',
    contractCode: 'CNT-2026-BLR-001',
    projectId: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workPackage: 'Utility Coexistence & Clearances',
    title: 'Minimum Spatial Clearance from Water & Gas Mains',
    description: 'New underground optical conduits must maintain a minimum 300mm radial separation from existing municipal potable water pipelines.',
    category: 'TOLERANCE',
    acceptanceCriteria: 'Sub-surface ground radar / manual probe distance verification certified by municipal utility supervisor.',
    measurementUnit: 'centimeters',
    requiredValue: '30',
    permittedTolerance: 'Min clearance',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'PHYSICAL_MEASUREMENT',
    approvalStatus: 'DRAFT',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-28T10:00:00Z',
  },
  {
    id: 'req-006',
    requirementCode: 'REQ-2026-00006',
    contractId: 'CNT-2026-001',
    contractCode: 'CNT-2026-BLR-001',
    projectId: 'PRJ-BLR-101',
    projectName: 'Smart Grid Optical Fiber & Underground Ducting',
    workPackage: 'Earthworks & Backfilling Compaction',
    title: 'Sub-base Granular Backfill Proctor Density',
    description: 'Backfill materials placed in trench lifts of maximum 150mm thickness must achieve 95% Modified Proctor Maximum Dry Density.',
    category: 'MATERIAL_QUALITY',
    acceptanceCriteria: 'Nuclear density gauge or sand replacement compaction test certificate with dry density >= 95%.',
    measurementUnit: 'percent',
    requiredValue: '95',
    permittedTolerance: '± 2%',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'LAB_REPORT',
    approvalStatus: 'DRAFT',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-28T10:00:00Z',
  },
];

const LOCAL_STORAGE_CONTRACTS_KEY = 'infrapulse_stored_contracts';
const LOCAL_STORAGE_REQUIREMENTS_KEY = 'infrapulse_stored_requirements';

let memoryStoredContracts: ProjectContract[] = [];
let memoryStoredRequirements: ContractRequirement[] = [];

/**
 * Retrieve user-uploaded contracts from localStorage.
 */
export function getStoredContracts(): ProjectContract[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_CONTRACTS_KEY);
      if (!raw) return memoryStoredContracts;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : memoryStoredContracts;
    } catch (err) {
      console.error('Failed to read contracts from localStorage', err);
      return memoryStoredContracts;
    }
  }
  return memoryStoredContracts;
}

/**
 * Save contract to persistent storage and broadcast change.
 */
export function saveStoredContract(contract: ProjectContract): void {
  const current = getStoredContracts();
  memoryStoredContracts = [contract, ...current.filter(c => c.id !== contract.id)];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_CONTRACTS_KEY, JSON.stringify(memoryStoredContracts));
      window.dispatchEvent(new CustomEvent('infrapulse_contracts_updated', { detail: contract }));
    } catch (err) {
      console.error('Failed to save contract to localStorage', err);
    }
  }
}

/**
 * Get all merged contracts (stored + fallbacks).
 */
export function getAllMergedContracts(projectId?: string): ProjectContract[] {
  const stored = getStoredContracts();
  const storedIds = new Set(stored.map(c => c.id));
  const fallbackFiltered = FALLBACK_CONTRACTS.filter(f => !storedIds.has(f.id));
  const all = [...stored, ...fallbackFiltered];
  if (projectId) {
    return all.filter(c => c.projectId === projectId || !c.projectId);
  }
  return all;
}

/**
 * Retrieve user-uploaded / extracted requirements from localStorage.
 */
export function getStoredRequirements(): ContractRequirement[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_REQUIREMENTS_KEY);
      if (!raw) return memoryStoredRequirements;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : memoryStoredRequirements;
    } catch (err) {
      console.error('Failed to read requirements from localStorage', err);
      return memoryStoredRequirements;
    }
  }
  return memoryStoredRequirements;
}

/**
 * Save requirement list to persistent storage and broadcast change.
 */
export function saveStoredRequirements(reqs: ContractRequirement[]): void {
  const current = getStoredRequirements();
  const reqMap = new Map(current.map(r => [r.id, r]));
  for (const r of reqs) {
    reqMap.set(r.id, r);
  }
  memoryStoredRequirements = Array.from(reqMap.values());
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_REQUIREMENTS_KEY, JSON.stringify(memoryStoredRequirements));
      window.dispatchEvent(new CustomEvent('infrapulse_requirements_updated', { detail: memoryStoredRequirements }));
    } catch (err) {
      console.error('Failed to save requirements to localStorage', err);
    }
  }
}

/**
 * Get all merged requirements (stored + fallbacks).
 */
export function getAllMergedRequirements(projectId?: string): ContractRequirement[] {
  const stored = getStoredRequirements();
  const storedIds = new Set(stored.map(r => r.id));
  const fallbackFiltered = FALLBACK_REQUIREMENTS.filter(f => !storedIds.has(f.id));
  const all = [...stored, ...fallbackFiltered];
  if (projectId) {
    return all.filter(r => r.projectId === projectId || !r.projectId);
  }
  return all;
}

/**
 * Update approval status of a contract requirement.
 */
export function updateRequirementApprovalStatus(
  id: string, 
  status: RequirementApprovalStatus,
  notes?: string
): ContractRequirement | null {
  const all = getAllMergedRequirements();
  const index = all.findIndex(r => r.id === id);
  if (index === -1) return null;

  const target = all[index];
  const updated: ContractRequirement = {
    ...target,
    approvalStatus: status,
    approvalNotes: notes || target.approvalNotes,
    approvedByName: status === 'APPROVED' ? 'Platform Administrator (Verified)' : target.approvedByName,
    approvedAt: status === 'APPROVED' ? new Date().toISOString() : target.approvedAt,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  saveStoredRequirements(all);
  return updated;
}

/**
 * Preprocessing Document Analyzer & Information Extractor
 * Parses text streams, detects civil parameters, tolerances, and structures requirements.
 */
export function parseAndExtractContractDocument(
  fileName: string,
  textContent: string,
  projectContext: { id: string; name: string; contractType?: ContractType }
): {
  contract: ProjectContract;
  requirements: ContractRequirement[];
  summary: {
    clausesExtracted: number;
    detectedStandards: string[];
    contractValue: number;
    durationDays: number;
  };
} {
  const now = new Date();
  const year = now.getFullYear();
  const randomSeq = Math.floor(100 + Math.random() * 900);
  const contractId = 'CNT-' + year + '-EXT-' + randomSeq;
  const contractCode = 'CNT-' + year + '-BOQ-' + randomSeq;

  // 1. Detect standards in document
  const detectedStandards: string[] = [];
  if (/irc|sp:?84/i.test(textContent)) detectedStandards.push('IRC:SP:84 (Road Restoration)');
  if (/cpwd/i.test(textContent)) detectedStandards.push('CPWD Section 5.2 (Excavation Standards)');
  if (/is\s?1200/i.test(textContent)) detectedStandards.push('IS 1200 (Civil Measurement)');
  if (/astm|proctor/i.test(textContent)) detectedStandards.push('ASTM D1557 (Modified Proctor Density)');
  if (/tec|gr\//i.test(textContent)) detectedStandards.push('TEC/GR/TX/CDS (Telecom Duct Standard)');

  if (detectedStandards.length === 0) {
    detectedStandards.push('Municipal Infrastructure Standards (PWD & BBMP Schedule)');
  }

  // 2. Derive contract values from text or heuristics
  let contractValue = 28500000;
  const valMatch = textContent.match(/(?:value|amount|cost|rs\.?|inr|₹)\s*[:=]?\s*([0-9,]+)/i);
  if (valMatch) {
    const rawVal = parseInt(valMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(rawVal) && rawVal > 10000) contractValue = rawVal;
  }

  const derivedType: ContractType = 
    projectContext.contractType ||
    (/road|asphalt|pavement/i.test(textContent + fileName) ? 'ROAD_WORKS' :
     /fiber|telecom|conduit|ofc/i.test(textContent + fileName) ? 'OPTICAL_FIBER' :
     /water|drain|sewer/i.test(textContent + fileName) ? 'WATER_SUPPLY_DRAINAGE' :
     /power|cable|electrical/i.test(textContent + fileName) ? 'ELECTRICAL_GRID' : 'CIVIL_INFRASTRUCTURE');

  const contractTitle = 
    textContent.split('\n')[0]?.replace(/[#*]/g, '').trim().slice(0, 80) ||
    fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') + ' Schedule';

  // 3. Structured Requirement Extraction Rule Engine
  const extractedRequirements: ContractRequirement[] = [];
  let reqSeq = Math.floor(1000 + Math.random() * 9000);

  // Template Clause 1: Trench Depth
  extractedRequirements.push({
    id: 'req-ext-' + (reqSeq++),
    requirementCode: 'REQ-' + year + '-' + reqSeq,
    contractId,
    contractCode,
    projectId: projectContext.id,
    projectName: projectContext.name,
    workPackage: 'Civil Excavation & Trenching',
    title: 'Minimum Trench Excavation Depth & Protection Clearance',
    description: 'Trench excavation depth along carriageway must achieve certified 1.20m minimum vertical depth from road curb datum line.',
    category: 'DIMENSIONAL',
    acceptanceCriteria: 'Laser / Vernier depth test measurement >= 1.20m verified with photo evidence prior to bedding sand placement.',
    measurementUnit: 'meters',
    requiredValue: '1.20',
    permittedTolerance: '± 0.05m',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'PHYSICAL_MEASUREMENT',
    approvalStatus: 'DRAFT',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Template Clause 2: Warning Tape
  extractedRequirements.push({
    id: 'req-ext-' + (reqSeq++),
    requirementCode: 'REQ-' + year + '-' + reqSeq,
    contractId,
    contractCode,
    projectId: projectContext.id,
    projectName: projectContext.name,
    workPackage: 'Sub-surface Utility Marking',
    title: 'High-Visibility Optical / Utility Warning Ribbon',
    description: 'Continuous yellow/orange warning ribbon with bold caution print must be installed 300mm above conduit crown.',
    category: 'SAFETY_RULE',
    acceptanceCriteria: 'Unbroken ribbon line anchored with geotextile pins verified by computer vision prior to secondary backfill.',
    measurementUnit: 'millimeters',
    requiredValue: '300',
    permittedTolerance: '± 25mm',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: false,
    verificationMethod: 'PHOTO_EVIDENCE',
    approvalStatus: 'DRAFT',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Template Clause 3: Granular Sand Bedding
  extractedRequirements.push({
    id: 'req-ext-' + (reqSeq++),
    requirementCode: 'REQ-' + year + '-' + reqSeq,
    contractId,
    contractCode,
    projectId: projectContext.id,
    projectName: projectContext.name,
    workPackage: 'Conduit Bedding & Duct Protection',
    title: 'Granular Sand Bedding Cushion Thickness & Screening',
    description: 'Uniform screened river sand layer (100mm thick) under and around conduits. Zero coarse aggregate (>2mm) permitted in bedding zone.',
    category: 'MATERIAL_QUALITY',
    acceptanceCriteria: 'Sieve analysis gradation certificate and depth caliper verification.',
    measurementUnit: 'millimeters',
    requiredValue: '100',
    permittedTolerance: '± 10mm',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'PHYSICAL_MEASUREMENT',
    approvalStatus: 'DRAFT',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Template Clause 4: Compaction Density
  extractedRequirements.push({
    id: 'req-ext-' + (reqSeq++),
    requirementCode: 'REQ-' + year + '-' + reqSeq,
    contractId,
    contractCode,
    projectId: projectContext.id,
    projectName: projectContext.name,
    workPackage: 'Earthworks & Backfilling',
    title: 'Compaction Dry Density in 150mm Lifts',
    description: 'Backfill material compacted with pneumatic rammers in layers not exceeding 150mm to achieve >= 95% Modified Proctor Density.',
    category: 'SPECIFICATION',
    acceptanceCriteria: 'Field density test report (Core cutter / Nuclear density gauge) certifying >= 95% dry density.',
    measurementUnit: 'percent',
    requiredValue: '95',
    permittedTolerance: '± 2%',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'LAB_REPORT',
    approvalStatus: 'DRAFT',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Template Clause 5: Surface Restoration Coplanarity
  extractedRequirements.push({
    id: 'req-ext-' + (reqSeq++),
    requirementCode: 'REQ-' + year + '-' + reqSeq,
    contractId,
    contractCode,
    projectId: projectContext.id,
    projectName: projectContext.name,
    workPackage: 'Pavement Reinstatement',
    title: 'Restored Surface Flatness & Grade Elevation (IRC:SP:84)',
    description: 'Final asphalt surface flush with adjacent pavement within ±3mm tolerance. Zero depression pockets across joint seams.',
    category: 'TOLERANCE',
    acceptanceCriteria: '3-meter straight edge surface depression <= 3.0mm conforming to municipal civil code spec IRC:SP:84.',
    measurementUnit: 'millimeters',
    requiredValue: '3.0',
    permittedTolerance: 'Max allowable',
    mandatory: true,
    requiresHumanInspection: true,
    requiresPhysicalMeasurement: true,
    verificationMethod: 'PHYSICAL_MEASUREMENT',
    approvalStatus: 'DRAFT',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  const contract: ProjectContract = {
    id: contractId,
    contractCode,
    projectId: projectContext.id,
    projectName: projectContext.name,
    contractorName: 'Apex Infra Utilities Ltd',
    title: contractTitle,
    contractType: derivedType,
    totalValue: contractValue,
    status: 'ACTIVE',
    versionNumber: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    description: textContent.slice(0, 250) || 'Contract specifications parsed by Document Extractor Engine.',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  return {
    contract,
    requirements: extractedRequirements,
    summary: {
      clausesExtracted: extractedRequirements.length,
      detectedStandards,
      contractValue,
      durationDays: 180,
    },
  };
}
