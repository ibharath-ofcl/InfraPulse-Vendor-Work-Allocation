package com.infrapulse.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class OperationalDashboardDto {

    // Executive KPI Summary Cards
    private long activeProjectsCount = 0L;
    private long activeVendorsCount = 0L;
    private long totalWorkAssignmentsCount = 0L;
    private long assignmentsInProgressCount = 0L;
    private long pendingHumanReviewsCount = 0L;
    private long openCorrectiveActionsCount = 0L;
    private long overdueAssignmentsCount = 0L;
    private long milestonesEligibleForPaymentCount = 0L;
    private long pendingPaymentRequestsCount = 0L;
    private long simulatedAuthorizationsCount = 0L;

    private BigDecimal totalContractValue = BigDecimal.ZERO;
    private BigDecimal totalAuthorizedAmount = BigDecimal.ZERO;
    private BigDecimal totalSimulatedSettledAmount = BigDecimal.ZERO;
    private String simulatedDisclaimer = "SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED";

    // Chart Data Breakdowns
    private Map<String, Long> workStatusDistribution = new HashMap<>();
    private Map<String, Long> qualityOutcomeDistribution = new HashMap<>();
    private Map<String, Long> correctiveActionStatusDistribution = new HashMap<>();
    private Map<String, Long> paymentStatusDistribution = new HashMap<>();

    public OperationalDashboardDto() {
    }

    public long getActiveProjectsCount() {
        return activeProjectsCount;
    }

    public void setActiveProjectsCount(long activeProjectsCount) {
        this.activeProjectsCount = activeProjectsCount;
    }

    public long getActiveVendorsCount() {
        return activeVendorsCount;
    }

    public void setActiveVendorsCount(long activeVendorsCount) {
        this.activeVendorsCount = activeVendorsCount;
    }

    public long getTotalWorkAssignmentsCount() {
        return totalWorkAssignmentsCount;
    }

    public void setTotalWorkAssignmentsCount(long totalWorkAssignmentsCount) {
        this.totalWorkAssignmentsCount = totalWorkAssignmentsCount;
    }

    public long getAssignmentsInProgressCount() {
        return assignmentsInProgressCount;
    }

    public void setAssignmentsInProgressCount(long assignmentsInProgressCount) {
        this.assignmentsInProgressCount = assignmentsInProgressCount;
    }

    public long getPendingHumanReviewsCount() {
        return pendingHumanReviewsCount;
    }

    public void setPendingHumanReviewsCount(long pendingHumanReviewsCount) {
        this.pendingHumanReviewsCount = pendingHumanReviewsCount;
    }

    public long getOpenCorrectiveActionsCount() {
        return openCorrectiveActionsCount;
    }

    public void setOpenCorrectiveActionsCount(long openCorrectiveActionsCount) {
        this.openCorrectiveActionsCount = openCorrectiveActionsCount;
    }

    public long getOverdueAssignmentsCount() {
        return overdueAssignmentsCount;
    }

    public void setOverdueAssignmentsCount(long overdueAssignmentsCount) {
        this.overdueAssignmentsCount = overdueAssignmentsCount;
    }

    public long getMilestonesEligibleForPaymentCount() {
        return milestonesEligibleForPaymentCount;
    }

    public void setMilestonesEligibleForPaymentCount(long milestonesEligibleForPaymentCount) {
        this.milestonesEligibleForPaymentCount = milestonesEligibleForPaymentCount;
    }

    public long getPendingPaymentRequestsCount() {
        return pendingPaymentRequestsCount;
    }

    public void setPendingPaymentRequestsCount(long pendingPaymentRequestsCount) {
        this.pendingPaymentRequestsCount = pendingPaymentRequestsCount;
    }

    public long getSimulatedAuthorizationsCount() {
        return simulatedAuthorizationsCount;
    }

    public void setSimulatedAuthorizationsCount(long simulatedAuthorizationsCount) {
        this.simulatedAuthorizationsCount = simulatedAuthorizationsCount;
    }

    public BigDecimal getTotalContractValue() {
        return totalContractValue;
    }

    public void setTotalContractValue(BigDecimal totalContractValue) {
        this.totalContractValue = totalContractValue;
    }

    public BigDecimal getTotalAuthorizedAmount() {
        return totalAuthorizedAmount;
    }

    public void setTotalAuthorizedAmount(BigDecimal totalAuthorizedAmount) {
        this.totalAuthorizedAmount = totalAuthorizedAmount;
    }

    public BigDecimal getTotalSimulatedSettledAmount() {
        return totalSimulatedSettledAmount;
    }

    public void setTotalSimulatedSettledAmount(BigDecimal totalSimulatedSettledAmount) {
        this.totalSimulatedSettledAmount = totalSimulatedSettledAmount;
    }

    public String getSimulatedDisclaimer() {
        return simulatedDisclaimer;
    }

    public void setSimulatedDisclaimer(String simulatedDisclaimer) {
        this.simulatedDisclaimer = simulatedDisclaimer;
    }

    public Map<String, Long> getWorkStatusDistribution() {
        return workStatusDistribution;
    }

    public void setWorkStatusDistribution(Map<String, Long> workStatusDistribution) {
        this.workStatusDistribution = workStatusDistribution;
    }

    public Map<String, Long> getQualityOutcomeDistribution() {
        return qualityOutcomeDistribution;
    }

    public void setQualityOutcomeDistribution(Map<String, Long> qualityOutcomeDistribution) {
        this.qualityOutcomeDistribution = qualityOutcomeDistribution;
    }

    public Map<String, Long> getCorrectiveActionStatusDistribution() {
        return correctiveActionStatusDistribution;
    }

    public void setCorrectiveActionStatusDistribution(Map<String, Long> correctiveActionStatusDistribution) {
        this.correctiveActionStatusDistribution = correctiveActionStatusDistribution;
    }

    public Map<String, Long> getPaymentStatusDistribution() {
        return paymentStatusDistribution;
    }

    public void setPaymentStatusDistribution(Map<String, Long> paymentStatusDistribution) {
        this.paymentStatusDistribution = paymentStatusDistribution;
    }
}
