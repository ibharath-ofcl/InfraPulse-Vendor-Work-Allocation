package com.infrapulse.modules.finance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.MilestoneEligibilityResponse;
import com.infrapulse.modules.finance.entity.MilestoneVerification;
import com.infrapulse.modules.finance.entity.MilestoneWorkAssignment;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.enums.AgreementStatus;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.repository.MilestoneVerificationRepository;
import com.infrapulse.modules.finance.repository.MilestoneWorkAssignmentRepository;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.entity.PhysicalMeasurement;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.MeasurementVerificationStatus;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionDecisionRepository;
import com.infrapulse.modules.humanreview.repository.PhysicalMeasurementRepository;
import com.infrapulse.modules.intelligence.contract.repository.ContractRequirementEvidenceRepository;
import com.infrapulse.modules.intelligence.risk.model.RiskAlertStatus;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import com.infrapulse.modules.intelligence.risk.repository.ProjectRiskAlertRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.model.AssessmentStatus;
import com.infrapulse.modules.quality.repository.QualityAssessmentRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class MilestoneEligibilityService {

    private static final Logger log = LoggerFactory.getLogger(MilestoneEligibilityService.class);

    private final ProjectMilestoneRepository milestoneRepository;
    private final MilestoneWorkAssignmentRepository milestoneWorkAssignmentRepository;
    private final MilestoneVerificationRepository verificationRepository;
    private final PaymentAuthorizationRepository paymentAuthorizationRepository;
    private final ProjectVendorRepository projectVendorRepository;
    private final QualityAssessmentRepository qualityAssessmentRepository;
    private final HumanInspectionDecisionRepository humanInspectionDecisionRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final PhysicalMeasurementRepository physicalMeasurementRepository;
    private final ContractRequirementEvidenceRepository contractRequirementEvidenceRepository;
    private final ProjectRiskAlertRepository riskAlertRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public MilestoneEligibilityService(
            ProjectMilestoneRepository milestoneRepository,
            MilestoneWorkAssignmentRepository milestoneWorkAssignmentRepository,
            MilestoneVerificationRepository verificationRepository,
            PaymentAuthorizationRepository paymentAuthorizationRepository,
            ProjectVendorRepository projectVendorRepository,
            QualityAssessmentRepository qualityAssessmentRepository,
            HumanInspectionDecisionRepository humanInspectionDecisionRepository,
            CorrectiveActionRepository correctiveActionRepository,
            PhysicalMeasurementRepository physicalMeasurementRepository,
            ContractRequirementEvidenceRepository contractRequirementEvidenceRepository,
            ProjectRiskAlertRepository riskAlertRepository,
            AuditService auditService,
            ObjectMapper objectMapper) {
        this.milestoneRepository = milestoneRepository;
        this.milestoneWorkAssignmentRepository = milestoneWorkAssignmentRepository;
        this.verificationRepository = verificationRepository;
        this.paymentAuthorizationRepository = paymentAuthorizationRepository;
        this.projectVendorRepository = projectVendorRepository;
        this.qualityAssessmentRepository = qualityAssessmentRepository;
        this.humanInspectionDecisionRepository = humanInspectionDecisionRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.physicalMeasurementRepository = physicalMeasurementRepository;
        this.contractRequirementEvidenceRepository = contractRequirementEvidenceRepository;
        this.riskAlertRepository = riskAlertRepository;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MilestoneEligibilityResponse evaluateMilestoneEligibility(String milestoneId, User evaluator) {
        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Milestone not found with id: " + milestoneId));

        List<String> blockingConditions = new ArrayList<>();
        Map<String, Boolean> checklist = new LinkedHashMap<>();

        // 1. Agreement Active & Not Expired
        boolean agreementActive = milestone.getAgreement() != null &&
                milestone.getAgreement().getStatus() == AgreementStatus.ACTIVE;
        boolean agreementNotExpired = milestone.getAgreement() != null &&
                !LocalDate.now().isAfter(milestone.getAgreement().getEndDate());

        checklist.put("COMMERCIAL_AGREEMENT_ACTIVE", agreementActive);
        checklist.put("COMMERCIAL_AGREEMENT_NOT_EXPIRED", agreementNotExpired);

        if (!agreementActive) {
            blockingConditions.add("Vendor commercial agreement is not in ACTIVE status (" +
                    (milestone.getAgreement() != null ? milestone.getAgreement().getStatus() : "MISSING") + ")");
        }
        if (!agreementNotExpired) {
            blockingConditions.add("Vendor commercial agreement has expired (ended on " +
                    (milestone.getAgreement() != null ? milestone.getAgreement().getEndDate() : "N/A") + ")");
        }

        // 2. Vendor Project Association
        boolean vendorAssociated = milestone.getProject() != null && milestone.getVendor() != null &&
                projectVendorRepository.hasActiveAssociation(milestone.getProject().getId(), milestone.getVendor().getId());
        checklist.put("VENDOR_ACTIVE_IN_PROJECT", vendorAssociated);
        if (!vendorAssociated) {
            blockingConditions.add("Vendor is not actively associated with project " +
                    (milestone.getProject() != null ? milestone.getProject().getProjectName() : ""));
        }

        // 3. Predecessor Sequence Check
        boolean predecessorsSatisfied = !milestoneRepository.hasUnsatisfiedPredecessors(
                milestone.getAgreement().getId(), milestone.getSequenceNumber());
        checklist.put("PREDECESSOR_MILESTONES_SATISFIED", predecessorsSatisfied);
        if (!predecessorsSatisfied) {
            blockingConditions.add("Predecessor milestones in agreement schedule must be paid or approved before this milestone");
        }

        // 4. Milestone Not Already Paid / Has Balance
        BigDecimal authorizedSoFar = paymentAuthorizationRepository.sumAuthorizedAmountByMilestoneId(milestone.getId());
        BigDecimal remainingPayable = milestone.getMilestoneValue().subtract(authorizedSoFar);
        boolean balanceAvailable = remainingPayable.compareTo(BigDecimal.ZERO) > 0 && milestone.getStatus() != MilestoneStatus.PAID;
        checklist.put("OUTSTANDING_BALANCE_AVAILABLE", balanceAvailable);
        if (!balanceAvailable) {
            blockingConditions.add("Milestone has zero payable balance remaining or is already marked PAID");
        }

        // 5. Associated Work Assignments
        List<MilestoneWorkAssignment> mwaList = milestoneWorkAssignmentRepository.findByMilestoneId(milestone.getId());
        boolean hasAssignments = !mwaList.isEmpty();
        checklist.put("ASSIGNMENTS_ASSOCIATED", hasAssignments);

        if (!hasAssignments) {
            blockingConditions.add("Milestone does not have any work assignments associated with it");
        }

        boolean allAssignmentsCompletedAndReleased = true;
        boolean allQualityAssessmentsPresent = true;
        boolean allHumanApprovalsGranted = true;
        boolean allMeasurementsVerified = true;
        boolean allCorrectiveActionsClosed = true;

        for (MilestoneWorkAssignment mwa : mwaList) {
            WorkAssignment assignment = mwa.getAssignment();
            if (assignment == null) continue;

            // Vendor ownership check
            if (assignment.getVendor() == null || !assignment.getVendor().getId().equals(milestone.getVendor().getId())) {
                blockingConditions.add("Assignment " + assignment.getAssignmentCode() + " does not belong to milestone vendor");
            }

            // Lifecycle check (Must be COMPLETED and RELEASED)
            if (assignment.getStatus() != AssignmentStatus.COMPLETED) {
                allAssignmentsCompletedAndReleased = false;
                blockingConditions.add("Assignment " + assignment.getAssignmentCode() + " is in status " +
                        assignment.getStatus() + " (COMPLETED status required)");
            }
            if (assignment.getReleaseStatus() != ReleaseStatus.RELEASED) {
                allAssignmentsCompletedAndReleased = false;
                blockingConditions.add("Assignment " + assignment.getAssignmentCode() + " has release status " +
                        assignment.getReleaseStatus() + " (RELEASED status required)");
            }

            // Stage 10 Quality Assessment check
            List<QualityAssessment> assessments = qualityAssessmentRepository.findByAssignmentIdOrderByCreatedAtDesc(assignment.getId());
            if (assessments.isEmpty()) {
                allQualityAssessmentsPresent = false;
                blockingConditions.add("Assignment " + assignment.getAssignmentCode() + " is missing mandatory Stage 10 Quality Assessment");
            } else {
                QualityAssessment latestAssessment = assessments.get(0);

                // Configurable Contract/Project Quality Score Policy Check (85% baseline)
                if (latestAssessment.getTotalCriteriaEvaluated() > 0 || (latestAssessment.getEvidenceCompletenessScore() != null && latestAssessment.getEvidenceCompletenessScore() > 0.0)) {
                    double threshold = (latestAssessment.getTemplate() != null && latestAssessment.getTemplate().getPassingScoreThreshold() != null)
                            ? latestAssessment.getTemplate().getPassingScoreThreshold().doubleValue()
                            : 85.0;
                    double actualScore = latestAssessment.getEvidenceCompletenessScore() != null ? latestAssessment.getEvidenceCompletenessScore() : 0.0;
                    if (actualScore < threshold) {
                        blockingConditions.add(String.format(
                                "Assignment %s quality compliance score (%.1f%%) does not meet contract policy threshold (%.1f%%)",
                                assignment.getAssignmentCode(), actualScore, threshold));
                    }
                } else if (latestAssessment.getStatus() != AssessmentStatus.PASS) {
                    blockingConditions.add(String.format(
                            "Assignment %s quality assessment status is %s (PASS required)",
                            assignment.getAssignmentCode(), latestAssessment.getStatus()));
                }

                // Stage 11 Human Inspection Decision check (MANDATORY human approval)
                Optional<HumanInspectionDecision> decisionOpt = humanInspectionDecisionRepository
                        .findFirstByAssignmentIdOrderByDecidedAtDesc(assignment.getId());

                if (decisionOpt.isEmpty() || decisionOpt.get().getDecisionType() != ReviewDecisionType.APPROVED) {
                    allHumanApprovalsGranted = false;
                    String decText = decisionOpt.map(d -> d.getDecisionType().name()).orElse("PENDING");
                    blockingConditions.add("Assignment " + assignment.getAssignmentCode() +
                            " human inspection approval is missing or not APPROVED (current: " + decText + ")");
                }

                // Physical measurements check
                List<PhysicalMeasurement> measurements = physicalMeasurementRepository.findByAssessmentIdOrderByMeasuredAtDesc(latestAssessment.getId());
                for (PhysicalMeasurement pm : measurements) {
                    if (pm.getVerificationStatus() != MeasurementVerificationStatus.VERIFIED_PASS) {
                        allMeasurementsVerified = false;
                        blockingConditions.add("Physical measurement " + pm.getMeasurementCode() + " (" +
                                pm.getMeasurementType() + ") is " + pm.getVerificationStatus() + " (VERIFIED_PASS required)");
                    }
                }

                // Stage 11 Corrective actions check
                List<CorrectiveAction> actions = correctiveActionRepository.findByAssignmentIdOrderByCreatedAtDesc(assignment.getId());
                for (CorrectiveAction ca : actions) {
                    if (ca.getStatus() == CorrectiveActionStatus.OPEN ||
                            ca.getStatus() == CorrectiveActionStatus.ASSIGNED ||
                            ca.getStatus() == CorrectiveActionStatus.IN_PROGRESS ||
                            ca.getStatus() == CorrectiveActionStatus.SUBMITTED_FOR_VERIFICATION ||
                            ca.getStatus() == CorrectiveActionStatus.VERIFICATION_FAILED) {
                        allCorrectiveActionsClosed = false;
                        blockingConditions.add("Corrective action " + ca.getActionCode() + " remains in active status: " + ca.getStatus());
                    }
                }
            }
        }

        checklist.put("ALL_WORK_COMPLETED_AND_RELEASED", hasAssignments && allAssignmentsCompletedAndReleased);
        checklist.put("STAGE10_QUALITY_ASSESSMENTS_PRESENT", hasAssignments && allQualityAssessmentsPresent);
        checklist.put("STAGE11_HUMAN_INSPECTION_APPROVED", hasAssignments && allHumanApprovalsGranted);
        checklist.put("PHYSICAL_MEASUREMENTS_VERIFIED", allMeasurementsVerified);
        checklist.put("MANDATORY_CORRECTIVE_ACTIONS_CLOSED", allCorrectiveActionsClosed);

        // 6. Contract Intelligence Requirements Compliance check (if configured for project)
        if (milestone.getProject() != null) {
            String projId = milestone.getProject().getId();
            long totalReqs = contractRequirementEvidenceRepository.countTotalByProjectId(projId);
            if (totalReqs > 0) {
                long compliantReqs = contractRequirementEvidenceRepository.countCompliantByProjectId(projId);
                boolean contractReqsSatisfied = compliantReqs >= totalReqs;
                checklist.put("CONTRACT_INTELLIGENCE_REQUIREMENTS_COMPLIANT", contractReqsSatisfied);
                if (!contractReqsSatisfied) {
                    blockingConditions.add(String.format("Contract intelligence requirements incomplete: %d/%d compliant (VERIFIED or WAIVED)", compliantReqs, totalReqs));
                }
            }

            // 7. Predictive Risk Intelligence - Critical Risk Alert Gate
            long activeCriticalAlerts = riskAlertRepository.countByProjectIdAndRiskLevelAndAlertStatus(
                    projId, RiskLevel.CRITICAL, RiskAlertStatus.ACTIVE
            );
            boolean noCriticalRisks = activeCriticalAlerts == 0;
            checklist.put("NO_CRITICAL_PREDICTIVE_RISK_ALERTS", noCriticalRisks);
            if (!noCriticalRisks) {
                blockingConditions.add(String.format("Milestone blocked by %d unaddressed CRITICAL predictive risk alert(s)", activeCriticalAlerts));
            }
        }

        boolean isEligible = blockingConditions.isEmpty();

        String reason = isEligible
                ? "All contractual, quality, human inspection, and corrective action conditions are satisfied."
                : "Milestone is blocked by " + blockingConditions.size() + " condition(s): " + blockingConditions.get(0);

        // Update milestone status if applicable
        if (isEligible) {
            if (milestone.getStatus() == MilestoneStatus.DRAFT ||
                    milestone.getStatus() == MilestoneStatus.SCHEDULED ||
                    milestone.getStatus() == MilestoneStatus.IN_PROGRESS ||
                    milestone.getStatus() == MilestoneStatus.PENDING_VERIFICATION ||
                    milestone.getStatus() == MilestoneStatus.VERIFICATION_FAILED) {
                milestone.setStatus(MilestoneStatus.ELIGIBLE_FOR_PAYMENT);
                milestoneRepository.save(milestone);
            }
        } else {
            if (milestone.getStatus() == MilestoneStatus.PENDING_VERIFICATION ||
                    milestone.getStatus() == MilestoneStatus.IN_PROGRESS) {
                milestone.setStatus(MilestoneStatus.VERIFICATION_FAILED);
                milestoneRepository.save(milestone);
            }
        }

        // Persist Verification Record
        MilestoneVerification verification = new MilestoneVerification();
        verification.setMilestone(milestone);
        verification.setVerificationStatus(isEligible ? "ELIGIBLE" : "INELIGIBLE");
        verification.setEligibilityResult(isEligible);
        verification.setReason(reason);
        try {
            verification.setBlockingConditions(objectMapper.writeValueAsString(blockingConditions));
        } catch (Exception e) {
            verification.setBlockingConditions(String.join("; ", blockingConditions));
        }
        verification.setVerifiedBy(evaluator);
        verificationRepository.save(verification);

        auditService.recordEvent(
                evaluator != null ? evaluator.getId() : null,
                isEligible ? "MILESTONE_ELIGIBILITY_CONFIRMED" : "MILESTONE_ELIGIBILITY_BLOCKED",
                "MILESTONE",
                milestone.getId(),
                "Evaluated eligibility for milestone " + milestone.getMilestoneCode() + ": " + (isEligible ? "ELIGIBLE" : "BLOCKED"),
                reason
        );

        MilestoneEligibilityResponse response = new MilestoneEligibilityResponse();
        response.setMilestoneId(milestone.getId());
        response.setMilestoneCode(milestone.getMilestoneCode());
        response.setMilestoneName(milestone.getName());
        response.setEligible(isEligible);
        response.setReason(reason);
        response.setBlockingConditions(blockingConditions);
        response.setChecklist(checklist);
        response.setMilestoneValue(milestone.getMilestoneValue());
        response.setRemainingPayableAmount(remainingPayable.max(BigDecimal.ZERO));
        response.setCurrency(milestone.getCurrency());

        return response;
    }
}
