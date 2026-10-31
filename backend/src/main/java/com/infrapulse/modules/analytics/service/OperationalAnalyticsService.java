package com.infrapulse.modules.analytics.service;

import com.infrapulse.modules.analytics.dto.OperationalDashboardDto;
import com.infrapulse.modules.finance.entity.PaymentAuthorization;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.entity.VendorPaymentRequest;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentAuthorizationStatus;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.finance.repository.VendorAgreementRepository;
import com.infrapulse.modules.finance.repository.VendorPaymentRequestRepository;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionDecisionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionReviewRepository;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class OperationalAnalyticsService {

    private final ProjectRepository projectRepository;
    private final VendorRepository vendorRepository;
    private final WorkAssignmentRepository assignmentRepository;
    private final HumanInspectionReviewRepository reviewRepository;
    private final HumanInspectionDecisionRepository decisionRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final VendorPaymentRequestRepository paymentRequestRepository;
    private final PaymentAuthorizationRepository authorizationRepository;
    private final VendorAgreementRepository agreementRepository;

    public OperationalAnalyticsService(
            ProjectRepository projectRepository,
            VendorRepository vendorRepository,
            WorkAssignmentRepository assignmentRepository,
            HumanInspectionReviewRepository reviewRepository,
            HumanInspectionDecisionRepository decisionRepository,
            CorrectiveActionRepository correctiveActionRepository,
            ProjectMilestoneRepository milestoneRepository,
            VendorPaymentRequestRepository paymentRequestRepository,
            PaymentAuthorizationRepository authorizationRepository,
            VendorAgreementRepository agreementRepository
    ) {
        this.projectRepository = projectRepository;
        this.vendorRepository = vendorRepository;
        this.assignmentRepository = assignmentRepository;
        this.reviewRepository = reviewRepository;
        this.decisionRepository = decisionRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.milestoneRepository = milestoneRepository;
        this.paymentRequestRepository = paymentRequestRepository;
        this.authorizationRepository = authorizationRepository;
        this.agreementRepository = agreementRepository;
    }

    @Transactional(readOnly = true)
    public OperationalDashboardDto getOperationalDashboardSummary(String projectId) {
        OperationalDashboardDto dto = new OperationalDashboardDto();

        // 1. Projects & Vendors
        long activeProjects = projectRepository.findAll().stream()
                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                .count();
        dto.setActiveProjectsCount(activeProjects);

        long activeVendors = vendorRepository.findAll().stream()
                .filter(v -> v.getStatus() == VendorStatus.ACTIVE)
                .count();
        dto.setActiveVendorsCount(activeVendors);

        // 2. Work Assignments
        List<WorkAssignment> assignments = (projectId != null && !projectId.isBlank())
                ? assignmentRepository.findByProjectId(projectId)
                : assignmentRepository.findAll();

        dto.setTotalWorkAssignmentsCount(assignments.size());

        long inProgress = 0;
        long overdue = 0;
        LocalDate today = LocalDate.now();

        Map<String, Long> statusDist = new HashMap<>();

        for (WorkAssignment a : assignments) {
            String s = a.getStatus() != null ? a.getStatus().name() : "ASSIGNED";
            statusDist.put(s, statusDist.getOrDefault(s, 0L) + 1);

            if (a.getStatus() == AssignmentStatus.IN_PROGRESS) {
                inProgress++;
            }
            if (a.getStatus() != AssignmentStatus.COMPLETED && a.getTargetEndDate() != null && a.getTargetEndDate().isBefore(today)) {
                overdue++;
            }
        }

        dto.setAssignmentsInProgressCount(inProgress);
        dto.setOverdueAssignmentsCount(overdue);
        dto.setWorkStatusDistribution(statusDist);

        // 3. Inspections & Quality
        List<HumanInspectionReview> reviews = reviewRepository.findAll();
        long pendingReviews = reviews.stream()
                .filter(r -> r.getReviewStatus() == ReviewStatus.PENDING || r.getReviewStatus() == ReviewStatus.IN_REVIEW)
                .count();
        dto.setPendingHumanReviewsCount(pendingReviews);

        Map<String, Long> qualityDist = new HashMap<>();
        List<HumanInspectionDecision> decisions = decisionRepository.findAll();
        for (HumanInspectionDecision d : decisions) {
            String dt = d.getDecisionType() != null ? d.getDecisionType().name() : "APPROVED";
            qualityDist.put(dt, qualityDist.getOrDefault(dt, 0L) + 1);
        }
        dto.setQualityOutcomeDistribution(qualityDist);

        // 4. Corrective Actions
        List<CorrectiveAction> cas = correctiveActionRepository.findAll();
        long openCas = cas.stream()
                .filter(ca -> ca.getStatus() == CorrectiveActionStatus.OPEN || ca.getStatus() == CorrectiveActionStatus.IN_PROGRESS)
                .count();
        dto.setOpenCorrectiveActionsCount(openCas);

        Map<String, Long> caDist = new HashMap<>();
        for (CorrectiveAction ca : cas) {
            String casName = ca.getStatus() != null ? ca.getStatus().name() : "OPEN";
            caDist.put(casName, caDist.getOrDefault(casName, 0L) + 1);
        }
        dto.setCorrectiveActionStatusDistribution(caDist);

        // 5. Milestones & Financials
        List<ProjectMilestone> milestones = milestoneRepository.findAll();
        long eligibleMs = milestones.stream()
                .filter(m -> m.getStatus() == MilestoneStatus.ELIGIBLE_FOR_PAYMENT)
                .count();
        dto.setMilestonesEligibleForPaymentCount(eligibleMs);

        List<VendorPaymentRequest> prs = paymentRequestRepository.findAll();
        long pendingPrs = prs.stream()
                .filter(pr -> pr.getStatus() == PaymentRequestStatus.SUBMITTED || pr.getStatus() == PaymentRequestStatus.UNDER_FINANCIAL_REVIEW)
                .count();
        dto.setPendingPaymentRequestsCount(pendingPrs);

        Map<String, Long> prDist = new HashMap<>();
        for (VendorPaymentRequest pr : prs) {
            String prStatus = pr.getStatus() != null ? pr.getStatus().name() : "SUBMITTED";
            prDist.put(prStatus, prDist.getOrDefault(prStatus, 0L) + 1);
        }
        dto.setPaymentStatusDistribution(prDist);

        List<PaymentAuthorization> auths = authorizationRepository.findAll();
        dto.setSimulatedAuthorizationsCount(auths.size());

        BigDecimal authSum = auths.stream()
                .map(PaymentAuthorization::getAuthorizedAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal settledSum = auths.stream()
                .filter(pa -> pa.getStatus() == PaymentAuthorizationStatus.SETTLED_SIMULATED)
                .map(PaymentAuthorization::getAuthorizedAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        dto.setTotalAuthorizedAmount(authSum);
        dto.setTotalSimulatedSettledAmount(settledSum);

        return dto;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getWorkStatusDistribution(String projectId) {
        List<WorkAssignment> assignments = (projectId != null && !projectId.isBlank())
                ? assignmentRepository.findByProjectId(projectId)
                : assignmentRepository.findAll();

        Map<String, Long> map = new HashMap<>();
        for (WorkAssignment a : assignments) {
            String s = a.getStatus() != null ? a.getStatus().name() : "ASSIGNED";
            map.put(s, map.getOrDefault(s, 0L) + 1);
        }
        return map;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getQualityOutcomeDistribution() {
        Map<String, Long> map = new HashMap<>();
        List<HumanInspectionDecision> decisions = decisionRepository.findAll();
        for (HumanInspectionDecision d : decisions) {
            String type = d.getDecisionType() != null ? d.getDecisionType().name() : "APPROVED";
            map.put(type, map.getOrDefault(type, 0L) + 1);
        }
        return map;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getCorrectiveActionTrends() {
        Map<String, Long> map = new HashMap<>();
        List<CorrectiveAction> cas = correctiveActionRepository.findAll();
        for (CorrectiveAction ca : cas) {
            String s = ca.getStatus() != null ? ca.getStatus().name() : "OPEN";
            map.put(s, map.getOrDefault(s, 0L) + 1);
        }
        return map;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFinancialSummaryDistribution() {
        Map<String, Object> map = new HashMap<>();
        List<VendorPaymentRequest> prs = paymentRequestRepository.findAll();
        Map<String, Long> statusCounts = new HashMap<>();
        for (VendorPaymentRequest pr : prs) {
            String s = pr.getStatus() != null ? pr.getStatus().name() : "SUBMITTED";
            statusCounts.put(s, statusCounts.getOrDefault(s, 0L) + 1);
        }
        map.put("paymentRequestStatuses", statusCounts);

        List<PaymentAuthorization> auths = authorizationRepository.findAll();
        BigDecimal authTotal = auths.stream().map(PaymentAuthorization::getAuthorizedAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal settledTotal = auths.stream().filter(pa -> pa.getStatus() == PaymentAuthorizationStatus.SETTLED_SIMULATED).map(PaymentAuthorization::getAuthorizedAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);

        map.put("authorizedTotal", authTotal);
        map.put("simulatedSettledTotal", settledTotal);
        map.put("simulationDisclaimer", "SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED");

        return map;
    }
}
