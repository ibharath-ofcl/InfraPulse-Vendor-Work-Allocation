export type ProjectStatus = 'ACTIVE' | 'PLANNED' | 'ON_TRACK' | 'AT_RISK' | 'COMPLETED';
export type ZoneStatus = 'AVAILABLE' | 'ACTIVE' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
export type DependencyStatus = 'SATISFIED' | 'BLOCKED' | 'PENDING_INSPECTION' | 'NONE';
export type WorkType = 
  | 'Trenching' 
  | 'Underground Cable Installation' 
  | 'Backfilling' 
  | 'Road Resurfacing' 
  | 'Final Inspection';

export type AssignmentStatus = 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED' 
  | 'VERIFIED' 
  | 'APPROVED' 
  | 'BLOCKED' 
  | 'REJECTED';

export type InspectionStatus = 'PENDING' | 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
export type InspectionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type VendorStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED';

export interface Project {
  id: string;
  name: string;
  code: string;
  region: string;
  pinCode: string;
  totalZones: number;
  assignedVendorsCount: number;
  progressPercent: number;
  status: ProjectStatus;
  targetDate: string;
  budgetEstimated: string;
  budgetSpent: string;
}

export interface WorkZone {
  id: string;
  code: string;
  name: string;
  pinCode: string;
  region: string;
  projectId: string;
  projectName: string;
  status: ZoneStatus;
  currentWorkType: WorkType;
  assignedVendorId?: string;
  assignedVendorName?: string;
  dependencyStatus: DependencyStatus;
  blockingReason?: string;
  lat: number;
  lng: number;
}

export interface Vendor {
  id: string;
  companyName: string;
  registrationNo: string;
  contactPerson: string;
  email: string;
  phone: string;
  serviceCategories: WorkType[];
  assignedZonesCount: number;
  activeAssignmentsCount: number;
  completionRate: number;
  qualityScore: number; // 0 - 100
  status: VendorStatus;
  joinedDate: string;
}

export interface WorkAssignment {
  id: string;
  pinCode: string;
  workZoneId: string;
  workZoneName: string;
  workType: WorkType;
  vendorId: string;
  vendorName: string;
  startDate: string;
  dueDate: string;
  status: AssignmentStatus;
  progress: number;
  conflictReason?: string;
  notes?: string;
}

export interface InspectionChecklist {
  label: string;
  passed: boolean;
}

export interface AIFinding {
  feature: string;
  confidence: number;
  verdict: 'COMPLIANT' | 'NON_COMPLIANT' | 'AMBIGUOUS';
  note: string;
}

export interface QualityInspection {
  id: string;
  assignmentId: string;
  workZoneName: string;
  pinCode: string;
  workType: WorkType;
  vendorName: string;
  submissionTimestamp: string;
  status: InspectionStatus;
  reviewPriority: InspectionPriority;
  evidenceImageUrl: string;
  checklist: InspectionChecklist[];
  aiFindings: AIFinding[];
  humanReviewer?: string;
  inspectorNotes?: string;
}

export interface EvidenceItem {
  id: string;
  assignmentId: string;
  workZoneName: string;
  pinCode: string;
  vendorName: string;
  submissionDate: string;
  evidenceType: 'PRE_WORK' | 'EXCAVATION_DEPTH' | 'CONDUIT_PLACEMENT' | 'BACKFILL_COMPACT' | 'SURFACE_FINISH';
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FLAGGED' | 'REJECTED';
  imageUrl: string;
  coordinates: { lat: number; lng: number };
  fileSize: string;
}

export interface Milestone {
  id: string;
  milestoneName: string;
  projectId: string;
  projectName: string;
  workZoneName: string;
  pinCode: string;
  vendorName: string;
  amount: number;
  inspectionStatus: 'PENDING' | 'PASSED' | 'FAILED';
  approvalStatus: 'LOCKED' | 'ELIGIBLE' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'UNPAID' | 'PROCESSING' | 'DISBURSED' | 'BLOCKED';
  dueDate: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entityType: 'ZONE' | 'ASSIGNMENT' | 'EVIDENCE' | 'INSPECTION' | 'MILESTONE' | 'PROJECT';
  entityReference: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'BLOCKED';
  details: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'ALLOCATION' | 'EVIDENCE' | 'INSPECTION' | 'CONFLICT' | 'MILESTONE';
  title: string;
  description: string;
  tag: string;
}

export interface HealthStatus {
  status: 'UP' | 'DOWN' | 'PENDING';
  application?: string;
  service?: string;
  timestamp?: string;
}
