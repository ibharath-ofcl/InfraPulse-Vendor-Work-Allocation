package com.infrapulse.modules.analytics.service;

import com.infrapulse.modules.analytics.dto.VendorComparisonDto;
import com.infrapulse.modules.analytics.dto.VendorPerformanceDto;
import com.infrapulse.modules.analytics.dto.VendorRankingDto;
import com.infrapulse.modules.analytics.entity.VendorScoringConfiguration;
import com.infrapulse.modules.analytics.enums.DataSufficiencyStatus;
import com.infrapulse.modules.finance.entity.PaymentAuthorization;
import com.infrapulse.modules.finance.entity.VendorPaymentRequest;
import com.infrapulse.modules.finance.enums.PaymentAuthorizationStatus;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.VendorPaymentRequestRepository;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionDecisionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionReviewRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VendorPerformanceAnalyticsService {

    private final VendorRepository vendorRepository;
    private final WorkAssignmentRepository assignmentRepository;
    private final HumanInspectionReviewRepository reviewRepository;
    private final HumanInspectionDecisionRepository decisionRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final VendorPaymentRequestRepository paymentRequestRepository;
    private final PaymentAuthorizationRepository authorizationRepository;
    private final VendorScoringConfigurationService scoringConfigService;

    public VendorPerformanceAnalyticsService(
            VendorRepository vendorRepository,
            WorkAssignmentRepository assignmentRepository,
            HumanInspectionReviewRepository reviewRepository,
            HumanInspectionDecisionRepository decisionRepository,
            CorrectiveActionRepository correctiveActionRepository,
            VendorPaymentRequestRepository paymentRequestRepository,
            PaymentAuthorizationRepository authorizationRepository,
            VendorScoringConfigurationService scoringConfigService
    ) {
        this.vendorRepository = vendorRepository;
        this.assignmentRepository = assignmentRepository;
        this.reviewRepository = reviewRepository;
        this.decisionRepository = decisionRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.paymentRequestRepository = paymentRequestRepository;
        this.authorizationRepository = authorizationRepository;
        this.scoringConfigService = scoringConfigService;
    }

    @Transactional(readOnly = true)
    public List<VendorPerformanceDto> getAllVendorsPerformance(String projectId) {
        List<Vendor> vendors = vendorRepository.findAll();
        VendorScoringConfiguration config = scoringConfigService.getActiveConfigurationEntity();

        return vendors.stream()
                .map(v -> calculateVendorPerformance(v, projectId, null, null, config))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VendorPerformanceDto calculateVendorPerformance(Vendor vendor, String projectId) {
        VendorScoringConfiguration config = scoringConfigService.getActiveConfigurationEntity();
        return calculateVendorPerformance(vendor, projectId, null, null, config);
    }

    @Transactional(readOnly = true)
    public VendorPerformanceDto getVendorPerformance(String vendorId, String projectId, LocalDate startDate, LocalDate endDate) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found: " + vendorId));
        VendorScoringConfiguration config = scoringConfigService.getActiveConfigurationEntity();

        return calculateVendorPerformance(vendor, projectId, startDate, endDate, config);
    }

    @Transactional(readOnly = true)
    public VendorComparisonDto compareVendors(List<String> vendorIds, String projectId) {
        if (vendorIds == null || vendorIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one vendorId is required for comparison");
        }

        VendorScoringConfiguration config = scoringConfigService.getActiveConfigurationEntity();
        List<VendorPerformanceDto> performanceList = new ArrayList<>();

        for (String vId : vendorIds) {
            vendorRepository.findById(vId).ifPresent(v -> {
                performanceList.add(calculateVendorPerformance(v, projectId, null, null, config));
            });
        }

        VendorComparisonDto comparison = new VendorComparisonDto();
        comparison.setVendors(performanceList);

        if (!performanceList.isEmpty()) {
            BigDecimal totalQuality = BigDecimal.ZERO;
            BigDecimal totalOnTime = BigDecimal.ZERO;
            BigDecimal totalRework = BigDecimal.ZERO;
            BigDecimal totalCompletion = BigDecimal.ZERO;
            BigDecimal totalScore = BigDecimal.ZERO;

            for (VendorPerformanceDto dto : performanceList) {
                totalQuality = totalQuality.add(dto.getQualityPassRate());
                totalOnTime = totalOnTime.add(dto.getOnTimeRate());
                totalRework = totalRework.add(dto.getReworkRate());
                totalCompletion = totalCompletion.add(dto.getCompletionRate());
                totalScore = totalScore.add(dto.getOverallScore());
            }

            BigDecimal count = BigDecimal.valueOf(performanceList.size());
            comparison.setBenchmarkQualityPassRate(totalQuality.divide(count, 2, RoundingMode.HALF_UP));
            comparison.setBenchmarkOnTimeRate(totalOnTime.divide(count, 2, RoundingMode.HALF_UP));
            comparison.setBenchmarkReworkRate(totalRework.divide(count, 2, RoundingMode.HALF_UP));
            comparison.setBenchmarkCompletionRate(totalCompletion.divide(count, 2, RoundingMode.HALF_UP));
            comparison.setBenchmarkOverallScore(totalScore.divide(count, 2, RoundingMode.HALF_UP));
        }

        return comparison;
    }

    @Transactional(readOnly = true)
    public List<VendorRankingDto> getVendorRankings(String projectId) {
        List<VendorPerformanceDto> all = getAllVendorsPerformance(projectId);

        // Filter and sort: Sufficient data first sorted by overallScore descending
        List<VendorPerformanceDto> sorted = all.stream()
                .sorted((a, b) -> {
                    if (a.getDataSufficiencyStatus() == DataSufficiencyStatus.SUFFICIENT_DATA &&
                        b.getDataSufficiencyStatus() != DataSufficiencyStatus.SUFFICIENT_DATA) {
                        return -1;
                    }
                    if (a.getDataSufficiencyStatus() != DataSufficiencyStatus.SUFFICIENT_DATA &&
                        b.getDataSufficiencyStatus() == DataSufficiencyStatus.SUFFICIENT_DATA) {
                        return 1;
                    }
                    return b.getOverallScore().compareTo(a.getOverallScore());
                })
                .collect(Collectors.toList());

        List<VendorRankingDto> rankings = new ArrayList<>();
        int rank = 1;
        for (VendorPerformanceDto p : sorted) {
            VendorRankingDto r = new VendorRankingDto();
            r.setRank(p.getDataSufficiencyStatus() == DataSufficiencyStatus.SUFFICIENT_DATA ? rank++ : 0);
            r.setVendorId(p.getVendorId());
            r.setVendorCode(p.getVendorCode());
            r.setCompanyName(p.getCompanyName());
            r.setOverallScore(p.getOverallScore());
            r.setTier(p.getRankingTier());
            r.setDataSufficiencyStatus(p.getDataSufficiencyStatus());
            r.setQualityPassRate(p.getQualityPassRate());
            r.setOnTimeRate(p.getOnTimeRate());
            r.setReworkRate(p.getReworkRate());
            r.setCompletionRate(p.getCompletionRate());
            r.setTotalAssignments(p.getSampleCounts().getOrDefault("totalEligibleAssignments", 0L));
            rankings.add(r);
        }

        return rankings;
    }

    /**
     * Compute mathematically rigorous, explainable vendor KPIs strictly from persisted records.
     */
    public VendorPerformanceDto calculateVendorPerformance(
            Vendor vendor,
            String projectId,
            LocalDate startDate,
            LocalDate endDate,
            VendorScoringConfiguration config
    ) {
        VendorPerformanceDto dto = new VendorPerformanceDto();
        dto.setVendorId(vendor.getId());
        dto.setVendorCode(vendor.getVendorCode());
        dto.setCompanyName(vendor.getCompanyName());
        dto.setScoringConfigurationVersion(config != null ? config.getVersion() : 1);

        // 1. Fetch vendor assignments filtered by project & date
        List<WorkAssignment> allAssignments = assignmentRepository.findByVendorId(vendor.getId());
        List<WorkAssignment> filteredAssignments = allAssignments.stream()
                .filter(a -> projectId == null || (a.getProject() != null && projectId.equals(a.getProject().getId())))
                .filter(a -> startDate == null || (a.getPlannedStartDate() != null && !a.getPlannedStartDate().isBefore(startDate)))
                .filter(a -> endDate == null || (a.getTargetEndDate() != null && !a.getTargetEndDate().isAfter(endDate)))
                .collect(Collectors.toList());

        // Eligible assignments = all excluding CANCELLED
        List<WorkAssignment> eligibleAssignments = filteredAssignments.stream()
                .filter(a -> a.getStatus() != AssignmentStatus.CANCELLED)
                .collect(Collectors.toList());

        long totalEligible = eligibleAssignments.size();
        dto.getSampleCounts().put("totalEligibleAssignments", totalEligible);

        // 2. Identify human review approved assignments
        Set<String> approvedAssignmentIds = new HashSet<>();
        long approvedOnTimeCount = 0;
        long totalTurnaroundHours = 0;
        long turnaroundCases = 0;

        for (WorkAssignment a : eligibleAssignments) {
            Optional<HumanInspectionDecision> latestDecision = decisionRepository.findFirstByAssignmentIdOrderByDecidedAtDesc(a.getId());
            if (latestDecision.isPresent() && latestDecision.get().getDecisionType() == ReviewDecisionType.APPROVED) {
                if (a.getStatus() == AssignmentStatus.COMPLETED && a.getReleaseStatus() == ReleaseStatus.RELEASED) {
                    approvedAssignmentIds.add(a.getId());

                    // Check On-Time: finished on or before targetEndDate
                    LocalDate finishDate = a.getActualEndDate();
                    if (finishDate == null && latestDecision.get().getDecidedAt() != null) {
                        finishDate = LocalDate.ofInstant(latestDecision.get().getDecidedAt(), ZoneOffset.UTC);
                    }
                    if (finishDate != null && a.getTargetEndDate() != null && !finishDate.isAfter(a.getTargetEndDate())) {
                        approvedOnTimeCount++;
                    }
                }
            }

            // Inspection turnaround calculation
            if (latestDecision.isPresent() && latestDecision.get().getDecidedAt() != null && a.getCreatedAt() != null) {
                long hours = Duration.between(a.getCreatedAt(), latestDecision.get().getDecidedAt()).toHours();
                if (hours >= 0) {
                    totalTurnaroundHours += hours;
                    turnaroundCases++;
                }
            }
        }

        long approvedCompleted = approvedAssignmentIds.size();
        dto.getSampleCounts().put("approvedCompletedAssignments", approvedCompleted);

        // KPI 1 — Completion Rate
        BigDecimal completionRate = totalEligible > 0
                ? BigDecimal.valueOf(approvedCompleted * 100.0 / totalEligible).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setCompletionRate(completionRate);

        // KPI 2 — On-Time Completion Rate
        BigDecimal onTimeRate = approvedCompleted > 0
                ? BigDecimal.valueOf(approvedOnTimeCount * 100.0 / approvedCompleted).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setOnTimeRate(onTimeRate);
        dto.getSampleCounts().put("approvedOnTimeAssignments", approvedOnTimeCount);

        // 3. Quality Pass Rate (Human Inspection Reviews)
        Set<String> assignmentIds = eligibleAssignments.stream().map(WorkAssignment::getId).collect(Collectors.toSet());
        long completedReviewsCount = 0;
        long approvedReviewsCount = 0;

        for (WorkAssignment a : eligibleAssignments) {
            List<HumanInspectionReview> reviews = reviewRepository.findByAssignmentIdOrderByCreatedAtDesc(a.getId());
            for (HumanInspectionReview r : reviews) {
                Optional<HumanInspectionDecision> dec = decisionRepository.findFirstByReviewIdOrderByDecidedAtDesc(r.getId());
                if (r.getReviewStatus() == ReviewStatus.COMPLETED || dec.isPresent()) {
                    completedReviewsCount++;
                    if (dec.isPresent() && dec.get().getDecisionType() == ReviewDecisionType.APPROVED) {
                        approvedReviewsCount++;
                    }
                }
            }
        }

        dto.getSampleCounts().put("completedInspectionReviews", completedReviewsCount);
        dto.getSampleCounts().put("approvedInspectionReviews", approvedReviewsCount);

        BigDecimal qualityPassRate = completedReviewsCount > 0
                ? BigDecimal.valueOf(approvedReviewsCount * 100.0 / completedReviewsCount).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setQualityPassRate(qualityPassRate);

        // 4. Rework Rate (Corrective Actions)
        List<CorrectiveAction> vendorCorrectiveActions = correctiveActionRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId());
        Set<String> distinctAssignmentsWithRework = vendorCorrectiveActions.stream()
                .filter(ca -> ca.getAssignment() != null && assignmentIds.contains(ca.getAssignment().getId()))
                .map(ca -> ca.getAssignment().getId())
                .collect(Collectors.toSet());

        long inspectedAssignmentsCount = completedReviewsCount > 0 ? eligibleAssignments.stream()
                .filter(a -> !reviewRepository.findByAssignmentIdOrderByCreatedAtDesc(a.getId()).isEmpty())
                .count() : 0;

        long reworkCount = distinctAssignmentsWithRework.size();
        dto.getSampleCounts().put("assignmentsWithRework", reworkCount);
        dto.getSampleCounts().put("inspectedAssignments", inspectedAssignmentsCount);

        BigDecimal reworkRate = inspectedAssignmentsCount > 0
                ? BigDecimal.valueOf(reworkCount * 100.0 / inspectedAssignmentsCount).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setReworkRate(reworkRate);

        // 5. Evidence Compliance
        long assignmentsWithEvidence = eligibleAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.SUBMITTED_FOR_REVIEW ||
                             a.getStatus() == AssignmentStatus.COMPLETED ||
                             approvedAssignmentIds.contains(a.getId()))
                .count();
        BigDecimal evidenceRate = totalEligible > 0
                ? BigDecimal.valueOf(assignmentsWithEvidence * 100.0 / totalEligible).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setEvidenceComplianceRate(evidenceRate);
        dto.getSampleCounts().put("assignmentsWithEvidence", assignmentsWithEvidence);

        // 6. Turnaround Hours
        if (turnaroundCases > 0) {
            dto.setAvgInspectionTurnaroundHours(BigDecimal.valueOf((double) totalTurnaroundHours / turnaroundCases).setScale(2, RoundingMode.HALF_UP));
        }

        // 7. Corrective Action Resolution Hours
        long totalCaHours = 0;
        long resolvedCaCases = 0;
        for (CorrectiveAction ca : vendorCorrectiveActions) {
            if (ca.getStatus() == CorrectiveActionStatus.CLOSED && ca.getClosedAt() != null && ca.getCreatedAt() != null) {
                long h = Duration.between(ca.getCreatedAt(), ca.getClosedAt()).toHours();
                if (h >= 0) {
                    totalCaHours += h;
                    resolvedCaCases++;
                }
            }
        }
        if (resolvedCaCases > 0) {
            dto.setAvgCorrectiveActionResolutionHours(BigDecimal.valueOf((double) totalCaHours / resolvedCaCases).setScale(2, RoundingMode.HALF_UP));
        }

        // 8. Overdue assignments
        LocalDate today = LocalDate.now();
        long overdue = eligibleAssignments.stream()
                .filter(a -> a.getStatus() != AssignmentStatus.COMPLETED &&
                             a.getTargetEndDate() != null &&
                             a.getTargetEndDate().isBefore(today))
                .count();
        dto.setOverdueAssignmentsCount(overdue);

        if (overdue > 0) {
            long totalDelayDays = eligibleAssignments.stream()
                    .filter(a -> a.getStatus() != AssignmentStatus.COMPLETED &&
                                 a.getTargetEndDate() != null &&
                                 a.getTargetEndDate().isBefore(today))
                    .mapToLong(a -> ChronoUnit.DAYS.between(a.getTargetEndDate(), today))
                    .sum();
            dto.setAvgDelayDays(BigDecimal.valueOf((double) totalDelayDays / overdue).setScale(1, RoundingMode.HALF_UP));
        }

        // 9. Payment Performance
        List<VendorPaymentRequest> payments = paymentRequestRepository.findByVendorId(vendor.getId());
        BigDecimal reqSum = BigDecimal.ZERO;
        BigDecimal appSum = BigDecimal.ZERO;
        long pendingReqCount = 0;
        long rejectedReqCount = 0;

        for (VendorPaymentRequest pr : payments) {
            if (projectId == null || (pr.getProject() != null && projectId.equals(pr.getProject().getId()))) {
                reqSum = reqSum.add(pr.getRequestedAmount() != null ? pr.getRequestedAmount() : BigDecimal.ZERO);
                if (pr.getStatus() == PaymentRequestStatus.APPROVED || pr.getStatus() == PaymentRequestStatus.AUTHORIZED) {
                    appSum = appSum.add(pr.getRequestedAmount() != null ? pr.getRequestedAmount() : BigDecimal.ZERO);
                } else if (pr.getStatus() == PaymentRequestStatus.SUBMITTED || pr.getStatus() == PaymentRequestStatus.UNDER_FINANCIAL_REVIEW) {
                    pendingReqCount++;
                } else if (pr.getStatus() == PaymentRequestStatus.REJECTED) {
                    rejectedReqCount++;
                }
            }
        }

        dto.setTotalPaymentRequested(reqSum);
        dto.setTotalPaymentApproved(appSum);
        dto.setPendingFinancialRequestsCount(pendingReqCount);
        dto.setRejectedFinancialRequestsCount(rejectedReqCount);

        List<PaymentAuthorization> auths = authorizationRepository.findByVendorId(vendor.getId());
        BigDecimal settledSum = auths.stream()
                .filter(pa -> pa.getStatus() == PaymentAuthorizationStatus.SETTLED_SIMULATED)
                .map(PaymentAuthorization::getAuthorizedAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalSimulatedSettled(settledSum);

        // 10. Workload
        long activeCount = eligibleAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.ASSIGNED ||
                             a.getStatus() == AssignmentStatus.ACCEPTED ||
                             a.getStatus() == AssignmentStatus.IN_PROGRESS ||
                             a.getStatus() == AssignmentStatus.SUBMITTED_FOR_REVIEW)
                .count();
        dto.setActiveAssignmentsCount(activeCount);
        dto.setCompletedAssignmentsCount(eligibleAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.COMPLETED).count());
        dto.setPendingInspectionsCount(eligibleAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.SUBMITTED_FOR_REVIEW).count());
        dto.setOpenCorrectiveActionsCount(vendorCorrectiveActions.stream()
                .filter(ca -> ca.getStatus() == CorrectiveActionStatus.OPEN || ca.getStatus() == CorrectiveActionStatus.IN_PROGRESS)
                .count());

        // 11. Performance Score Calculation
        if (totalEligible == 0 || completedReviewsCount == 0) {
            dto.setDataSufficiencyStatus(DataSufficiencyStatus.INSUFFICIENT_DATA);
            dto.setRankingTier("INSUFFICIENT_DATA");
            dto.setOverallScore(BigDecimal.ZERO);
        } else {
            dto.setDataSufficiencyStatus(DataSufficiencyStatus.SUFFICIENT_DATA);

            BigDecimal wQ = config != null ? config.getQualityWeight() : new BigDecimal("30.00");
            BigDecimal wT = config != null ? config.getOnTimeWeight() : new BigDecimal("25.00");
            BigDecimal wE = config != null ? config.getEvidenceWeight() : new BigDecimal("15.00");
            BigDecimal wR = config != null ? config.getReworkWeight() : new BigDecimal("20.00");
            BigDecimal wC = config != null ? config.getCompletionWeight() : new BigDecimal("10.00");

            BigDecimal reworkScore = BigDecimal.valueOf(Math.max(0.0, 100.0 - reworkRate.doubleValue()));

            BigDecimal weightedScore = qualityPassRate.multiply(wQ)
                    .add(onTimeRate.multiply(wT))
                    .add(evidenceRate.multiply(wE))
                    .add(reworkScore.multiply(wR))
                    .add(completionRate.multiply(wC))
                    .divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);

            dto.setOverallScore(weightedScore);

            if (weightedScore.compareTo(new BigDecimal("85.00")) >= 0) {
                dto.setRankingTier("ELITE");
            } else if (weightedScore.compareTo(new BigDecimal("65.00")) >= 0) {
                dto.setRankingTier("SATISFACTORY");
            } else {
                dto.setRankingTier("NEEDS_IMPROVEMENT");
            }
        }

        return dto;
    }
}
