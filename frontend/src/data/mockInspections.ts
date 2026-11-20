import { QualityInspection, InspectionStatus } from '../types';
import { getStoredEvidence } from './mockEvidence';

const TRENCH_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
  '<rect width="800" height="450" fill="#0f172a"/>' +
  '<rect x="0" y="70" width="800" height="30" fill="#334155"/>' +
  '<line x1="0" y1="70" x2="800" y2="70" stroke="#94a3b8" stroke-width="2"/>' +
  '<rect x="0" y="100" width="800" height="350" fill="#2d1f14"/>' +
  '<rect x="180" y="70" width="440" height="330" fill="#1e140d"/>' +
  '<rect x="180" y="70" width="440" height="330" stroke="#10b981" stroke-width="2" stroke-dasharray="6,4" fill="none"/>' +
  '<rect x="185" y="90" width="16" height="290" fill="#ca8a04" rx="2"/>' +
  '<rect x="599" y="90" width="16" height="290" fill="#ca8a04" rx="2"/>' +
  '<rect x="201" y="340" width="398" height="60" fill="#d97706" opacity="0.8"/>' +
  '<circle cx="280" cy="365" r="20" fill="#ea580c" stroke="#fed7aa" stroke-width="3"/>' +
  '<circle cx="360" cy="365" r="20" fill="#ea580c" stroke="#fed7aa" stroke-width="3"/>' +
  '<circle cx="440" cy="365" r="20" fill="#ea580c" stroke="#fed7aa" stroke-width="3"/>' +
  '<circle cx="520" cy="365" r="20" fill="#ea580c" stroke="#fed7aa" stroke-width="3"/>' +
  '<rect x="201" y="240" width="398" height="18" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>' +
  '<text x="300" y="253" font-family="sans-serif" font-size="10" font-weight="bold" fill="#000">CAUTION: BURIED OPTICAL FIBER</text>' +
  '<line x1="140" y1="70" x2="140" y2="400" stroke="#10b981" stroke-width="2"/>' +
  '<line x1="130" y1="70" x2="150" y2="70" stroke="#10b981" stroke-width="2"/>' +
  '<line x1="130" y1="400" x2="150" y2="400" stroke="#10b981" stroke-width="2"/>' +
  '<text x="50" y="240" font-family="monospace" font-size="14" font-weight="bold" fill="#34d399">1.25m DEPTH</text>' +
  '<text x="50" y="260" font-family="sans-serif" font-size="10" fill="#94a3b8">(Req: 1.20m min)</text>' +
  '<rect x="20" y="20" width="230" height="32" rx="6" fill="#0f172a" fill-opacity="0.85" stroke="#334155"/>' +
  '<text x="32" y="41" font-family="monospace" font-size="11" font-weight="bold" fill="#2dd4bf">AI VISION: DEPTH OK [94%]</text>' +
  '</svg>';

const FINAL_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
  '<rect width="800" height="450" fill="#1e293b"/>' +
  '<rect x="0" y="100" width="800" height="280" fill="#334155"/>' +
  '<line x1="0" y1="240" x2="800" y2="240" stroke="#f1f5f9" stroke-width="6" stroke-dasharray="30,20"/>' +
  '<circle cx="400" cy="240" r="90" fill="#1e293b" stroke="#475569" stroke-width="8"/>' +
  '<circle cx="400" cy="240" r="75" fill="#0f172a" stroke="#64748b" stroke-width="3" stroke-dasharray="8,4"/>' +
  '<text x="330" y="246" font-family="monospace" font-size="14" font-weight="bold" fill="#38bdf8">UTILITY CHAMBER</text>' +
  '<rect x="20" y="20" width="260" height="32" rx="6" fill="#0f172a" fill-opacity="0.85" stroke="#334155"/>' +
  '<text x="32" y="41" font-family="monospace" font-size="11" font-weight="bold" fill="#34d399">SURFACE FLUSH LEVEL [98%]</text>' +
  '</svg>';

const BACKFILL_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
  '<rect width="800" height="450" fill="#0f172a"/>' +
  '<rect x="0" y="80" width="800" height="370" fill="#451a03"/>' +
  '<rect x="150" y="80" width="500" height="370" fill="#78350f" opacity="0.9"/>' +
  '<line x1="150" y1="220" x2="650" y2="220" stroke="#f43f5e" stroke-width="3" stroke-dasharray="10,6"/>' +
  '<rect x="20" y="20" width="280" height="32" rx="6" fill="#0f172a" fill-opacity="0.85" stroke="#334155"/>' +
  '<text x="32" y="41" font-family="monospace" font-size="11" font-weight="bold" fill="#f43f5e">LIFT THICKNESS DEFICIT [91%]</text>' +
  '</svg>';

// High-fidelity fallback SVG graphics for civil infrastructure scenes
export const CIVIL_FALLBACK_SVGS: Record<string, string> = {
  Trenching: 'data:image/svg+xml;utf8,' + encodeURIComponent(TRENCH_SVG),
  'Final Inspection': 'data:image/svg+xml;utf8,' + encodeURIComponent(FINAL_SVG),
  Backfilling: 'data:image/svg+xml;utf8,' + encodeURIComponent(BACKFILL_SVG),
};

export const mockInspections: QualityInspection[] = [
  {
    id: 'INS-2026-881',
    assignmentId: 'ASN-101',
    workZoneName: 'MG Road - Brigade Junction Corridor',
    pinCode: '560001',
    workType: 'Trenching',
    vendorName: 'Apex Infra Utilities Ltd',
    submissionTimestamp: '2026-10-30 16:42:10 IST',
    status: 'REVIEW_REQUIRED',
    reviewPriority: 'HIGH',
    evidenceImageUrl: 'https://images.unsplash.com/photo-1579847188804-ecba0e2ea330?auto=format&fit=crop&w=1200&q=80',
    checklist: [
      { label: 'Trench depth complies with standard (min 1.2m)', passed: true },
      { label: 'Warning ribbon and safety barricades in place', passed: true },
      { label: 'Bedding layer granular sand uniform', passed: false },
      { label: 'Separation distance from adjacent water pipeline (>30cm)', passed: true },
    ],
    aiFindings: [
      {
        feature: 'Excavation Depth Profile',
        confidence: 0.94,
        verdict: 'COMPLIANT',
        note: 'Estimated vertical depth: 1.25m from curb reference plane (Passes IRC:SP:84 depth threshold).',
      },
      {
        feature: 'Bedding Sand Granularity',
        confidence: 0.72,
        verdict: 'AMBIGUOUS',
        note: 'Coarse gravel mixed with bedding sand detected in sector 4B; potential sharp stone contact with HDPE duct.',
      },
      {
        feature: 'Safety Barricading',
        confidence: 0.96,
        verdict: 'COMPLIANT',
        note: 'Reflective cones and continuous perimeter warning mesh detected across excavation boundary.',
      },
    ],
    humanReviewer: 'Pending Assignment (Senior Field Inspector)',
    inspectorNotes: 'Borderline bedding sand score detected by computer vision filter. Visual review required before clearing duct laying milestone.',
  },
  {
    id: 'INS-2026-880',
    assignmentId: 'ASN-105',
    workZoneName: 'Yelahanka Satellite Town Outer Ring',
    pinCode: '560064',
    workType: 'Final Inspection',
    vendorName: 'Apex Infra Utilities Ltd',
    submissionTimestamp: '2026-10-25 11:15:30 IST',
    status: 'PASS',
    reviewPriority: 'LOW',
    evidenceImageUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1200&q=80',
    checklist: [
      { label: 'Surface restoration flush with surrounding asphalt', passed: true },
      { label: 'Chamber cover flush level within ±3mm', passed: true },
      { label: 'Debris completely cleared from roadway and drains', passed: true },
    ],
    aiFindings: [
      {
        feature: 'Surface Regularity Index',
        confidence: 0.98,
        verdict: 'COMPLIANT',
        note: 'Zero surface undulations or depression pockets detected. Surface flatness meets IRC:SP:84.',
      },
      {
        feature: 'Manhole & Handhole Alignment',
        confidence: 0.95,
        verdict: 'COMPLIANT',
        note: 'Frame flush with grade line; no tripping elevation step detected.',
      },
    ],
    humanReviewer: 'K. S. Narayanan (Divisional QA Auditor)',
    inspectorNotes: 'Certified as compliant with municipal civil code spec IRC:SP:84. Approved for final contractor milestone release.',
  },
  {
    id: 'INS-2026-879',
    assignmentId: 'ASN-104',
    workZoneName: 'Sarjapur Main Link Road',
    pinCode: '560034',
    workType: 'Backfilling',
    vendorName: 'Vanguard Civil Engineering',
    submissionTimestamp: '2026-10-28 14:02:45 IST',
    status: 'FAIL',
    reviewPriority: 'CRITICAL',
    evidenceImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80',
    checklist: [
      { label: 'Compacted layer thickness <= 150mm per lift', passed: false },
      { label: 'Soil moisture content optimal during compaction', passed: false },
      { label: 'Proctor compaction test density >= 95%', passed: false },
    ],
    aiFindings: [
      {
        feature: 'Layer Lift Thickness Analysis',
        confidence: 0.91,
        verdict: 'NON_COMPLIANT',
        note: 'Uncompacted loose fill lift exceeds 320mm; exceeds 150mm municipal max compaction lift.',
      },
      {
        feature: 'Surface Moisture Visual Index',
        confidence: 0.88,
        verdict: 'NON_COMPLIANT',
        note: 'Dry voids and aggregate segregation visible across backfill trench surface.',
      },
    ],
    humanReviewer: 'Priya Sundaram (Quality Inspector Grade I)',
    inspectorNotes: 'FAILED: Work rejected. Vendor instructed to excavate loose backfill and re-compact in 150mm certified lifts using pneumatic rammers.',
  },
];

export interface VisualAnnotationBox {
  id: string;
  label: string;
  confidence: number;
  status: 'COMPLIANT' | 'AMBIGUOUS' | 'NON_COMPLIANT';
  style: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
  note: string;
}

/**
 * Returns computer vision bounding boxes for an inspection.
 */
export function getInspectionAnnotations(inspection: QualityInspection): VisualAnnotationBox[] {
  if (inspection.id === 'INS-2026-881' || inspection.workType === 'Trenching') {
    return [
      {
        id: 'box-depth',
        label: 'EXCAVATION DEPTH: 1.25m',
        confidence: 0.94,
        status: 'COMPLIANT',
        style: { top: '22%', left: '20%', width: '42%', height: '52%' },
        note: 'Complies with 1.20m minimum standard (IRC:SP:84)',
      },
      {
        id: 'box-sand',
        label: 'BEDDING SAND: GRAVEL DEFECT',
        confidence: 0.72,
        status: 'AMBIGUOUS',
        style: { top: '58%', left: '52%', width: '30%', height: '26%' },
        note: 'Coarse aggregate mixed with sand in sector 4B',
      },
      {
        id: 'box-safety',
        label: 'SAFETY BARRICADES & MESH',
        confidence: 0.96,
        status: 'COMPLIANT',
        style: { top: '8%', left: '6%', width: '88%', height: '22%' },
        note: 'Continuous orange warning barricade detected',
      },
    ];
  }

  if (inspection.id === 'INS-2026-880' || inspection.workType === 'Final Inspection') {
    return [
      {
        id: 'box-surface',
        label: 'SURFACE REGULARITY: 0.0mm',
        confidence: 0.98,
        status: 'COMPLIANT',
        style: { top: '32%', left: '16%', width: '68%', height: '42%' },
        note: 'Planar uniformity certified across lane span',
      },
      {
        id: 'box-chamber',
        label: 'CHAMBER COVER: FLUSH LEVEL',
        confidence: 0.95,
        status: 'COMPLIANT',
        style: { top: '48%', left: '42%', width: '26%', height: '30%' },
        note: 'Frame flush within ±1.2mm grade tolerance',
      },
    ];
  }

  // Default / Backfilling
  return [
    {
      id: 'box-lift',
      label: 'LIFT THICKNESS: 320mm (OVERSIZE)',
      confidence: 0.91,
      status: 'NON_COMPLIANT',
      style: { top: '24%', left: '26%', width: '48%', height: '52%' },
      note: 'Lift exceeds 150mm compaction limit',
    },
    {
      id: 'box-moisture',
      label: 'MOISTURE VOIDS DETECTED',
      confidence: 0.88,
      status: 'NON_COMPLIANT',
      style: { top: '44%', left: '62%', width: '28%', height: '32%' },
      note: 'Aggregate segregation and compaction voiding',
    },
  ];
}

const LOCAL_STORAGE_INSPECTIONS_KEY = 'infrapulse_stored_inspections';
let memoryStoredInspections: QualityInspection[] = [];

/**
 * Read stored inspections from localStorage.
 */
export function getStoredInspections(): QualityInspection[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_INSPECTIONS_KEY);
      if (!raw) return memoryStoredInspections;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : memoryStoredInspections;
    } catch (err) {
      console.error('Failed to read stored inspections from localStorage', err);
      return memoryStoredInspections;
    }
  }
  return memoryStoredInspections;
}

/**
 * Save inspection collection to localStorage and broadcast update.
 */
export function saveStoredInspections(inspections: QualityInspection[]): void {
  memoryStoredInspections = inspections;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_INSPECTIONS_KEY, JSON.stringify(inspections));
      window.dispatchEvent(new CustomEvent('infrapulse_inspection_updated', { detail: inspections }));
    } catch (err) {
      console.error('Failed to save inspections to localStorage', err);
    }
  }
}

/**
 * Update single inspection record.
 */
export function updateStoredInspection(item: QualityInspection): void {
  const all = getAllMergedInspections();
  const index = all.findIndex(i => i.id === item.id);
  let updatedList: QualityInspection[];
  if (index >= 0) {
    all[index] = item;
    updatedList = [...all];
  } else {
    updatedList = [item, ...all];
  }
  saveStoredInspections(updatedList);
}

/**
 * Get all merged inspections combining user updates, baseline items, and field evidence from vault.
 */
export function getAllMergedInspections(): QualityInspection[] {
  const stored = getStoredInspections();
  const storedMap = new Map<string, QualityInspection>(stored.map(i => [i.id, i]));

  // 1. Start with stored items
  const result: QualityInspection[] = [...stored];

  // 2. Add default baseline items if not overridden in stored
  for (const base of mockInspections) {
    if (!storedMap.has(base.id)) {
      result.push(base);
      storedMap.set(base.id, base);
    }
  }

  // 3. Sync any newly captured field evidence from Mobile Field Capture
  try {
    const evidenceList = getStoredEvidence();
    for (const ev of evidenceList) {
      const derivedId = 'INS-' + ev.id.replace('EVD-', '');
      if (!storedMap.has(derivedId)) {
        const isFlagged = ev.verificationStatus === 'FLAGGED' || ev.geofenceStatus === 'OUT_OF_BOUNDS' || ev.duplicateStatus !== 'UNIQUE';
        const isRejected = ev.verificationStatus === 'REJECTED';
        const status: InspectionStatus = isRejected ? 'FAIL' : isFlagged ? 'REVIEW_REQUIRED' : 'PASS';
        const priority = isRejected ? 'CRITICAL' : isFlagged ? 'HIGH' : 'LOW';

        const newInspection: QualityInspection = {
          id: derivedId,
          assignmentId: ev.assignmentId,
          workZoneName: ev.workZoneName,
          pinCode: ev.pinCode,
          workType: ev.evidenceType === 'COMPLETION' ? 'Final Inspection' : ev.evidenceType === 'BEFORE_WORK' ? 'Final Inspection' : 'Trenching',
          vendorName: ev.vendorName,
          submissionTimestamp: ev.submissionDate,
          status,
          reviewPriority: priority,
          evidenceImageUrl: ev.imageUrl,
          checklist: [
            { label: 'Geofence coordinate tolerance (< 5m)', passed: ev.geofenceStatus === 'VERIFIED' },
            { label: 'Hardware device integrity attested', passed: !ev.deviceIntegrityStatus?.includes('WEB_UNATTESTED') },
            { label: 'Perceptual hash collision gate passed', passed: ev.duplicateStatus === 'UNIQUE' },
            { label: 'Monocular depth / physical measurement certified', passed: !ev.physicalMeasurementStatus?.includes('BLOCKED') },
          ],
          aiFindings: [
            {
              feature: 'Photometric & Spatial Alignment',
              confidence: 0.95,
              verdict: ev.geofenceStatus === 'VERIFIED' ? 'COMPLIANT' : 'NON_COMPLIANT',
              note: ev.geofenceStatus === 'VERIFIED' ? 'GPS coordinates validated within project GIS polygon.' : 'Location deviates from work zone boundary.',
            },
            {
              feature: 'Optical Depth Estimate',
              confidence: 0.91,
              verdict: ev.monocularDepthEstimate?.includes('DEFICIT') ? 'NON_COMPLIANT' : 'COMPLIANT',
              note: ev.monocularDepthEstimate || 'Visual scene depth geometry compliant.',
            },
            {
              feature: 'Perceptual Integrity Analysis',
              confidence: 0.99,
              verdict: ev.duplicateStatus === 'UNIQUE' ? 'COMPLIANT' : 'NON_COMPLIANT',
              note: ev.duplicateStatus === 'UNIQUE' ? 'Unique image fingerprint recorded.' : 'Visual duplicate collision detected.',
            },
          ],
          humanReviewer: 'Senior Field Inspector (Assigned)',
          inspectorNotes: ev.monocularDepthEstimate || 'Evidence synchronized from Mobile Field Capture.',
        };

        result.unshift(newInspection);
        storedMap.set(derivedId, newInspection);
      }
    }
  } catch (err) {
    console.error('Error syncing evidence with inspections:', err);
  }

  return result;
}
