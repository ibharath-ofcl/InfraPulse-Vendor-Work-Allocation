package com.infrapulse.modules.analytics.dto;

import com.infrapulse.modules.analytics.enums.DataSufficiencyStatus;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class VendorPerformanceDto {

    private String vendorId;
    private String vendorCode;
    private String companyName;

    // KPI 1 — Assignment Completion Rate (Approved Completed / Eligible)
    private BigDecimal completionRate = BigDecimal.ZERO;

    // KPI 2 — On-Time Completion Rate (Approved On-or-Before Target / Approved)
    private BigDecimal onTimeRate = BigDecimal.ZERO;

    // KPI 3 — Quality Pass Rate (Approved Human Inspections / Completed Inspections)
    private BigDecimal qualityPassRate = BigDecimal.ZERO;

    // KPI 4 — Rework Rate (Distinct Assignments with Corrective Actions / Inspected Assignments)
    private BigDecimal reworkRate = BigDecimal.ZERO;

    // KPI 5 — Evidence Compliance Rate (Assignments with Evidence / Total Eligible Assignments)
    private BigDecimal evidenceComplianceRate = BigDecimal.ZERO;

    // KPI 6 — Average Inspection Turnaround (Submission to Human Inspection Decision in Hours)
    private BigDecimal avgInspectionTurnaroundHours = BigDecimal.ZERO;

    // KPI 7 — Corrective Action Resolution Time (Creation to Verified Closure in Hours)
    private BigDecimal avgCorrectiveActionResolutionHours = BigDecimal.ZERO;

    // KPI 8 — Assignment Delay (Overdue count & average delay days)
    private long overdueAssignmentsCount = 0L;
    private BigDecimal avgDelayDays = BigDecimal.ZERO;

    // KPI 9 — Payment Performance (Clearly labeled simulated)
    private BigDecimal totalPaymentRequested = BigDecimal.ZERO;
    private BigDecimal totalPaymentApproved = BigDecimal.ZERO;
    private BigDecimal totalSimulatedSettled = BigDecimal.ZERO;
    private long pendingFinancialRequestsCount = 0L;
    private long rejectedFinancialRequestsCount = 0L;
    private String simulationDisclaimer = "SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED";

    // KPI 10 — Vendor Workload
    private long activeAssignmentsCount = 0L;
    private long completedAssignmentsCount = 0L;
    private long pendingInspectionsCount = 0L;
    private long openCorrectiveActionsCount = 0L;

    // Overall Performance Score
    private BigDecimal overallScore = BigDecimal.ZERO;
    private DataSufficiencyStatus dataSufficiencyStatus = DataSufficiencyStatus.SUFFICIENT_DATA;
    private int scoringConfigurationVersion = 1;
    private String rankingTier = "SATISFACTORY";

    // Sample counts behind metrics
    private Map<String, Long> sampleCounts = new HashMap<>();

    public VendorPerformanceDto() {
    }

    public String getVendorId() {
        return vendorId;
    }

    public void setVendorId(String vendorId) {
        this.vendorId = vendorId;
    }

    public String getVendorCode() {
        return vendorCode;
    }

    public void setVendorCode(String vendorCode) {
        this.vendorCode = vendorCode;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public BigDecimal getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(BigDecimal completionRate) {
        this.completionRate = completionRate;
    }

    public BigDecimal getOnTimeRate() {
        return onTimeRate;
    }

    public void setOnTimeRate(BigDecimal onTimeRate) {
        this.onTimeRate = onTimeRate;
    }

    public BigDecimal getQualityPassRate() {
        return qualityPassRate;
    }

    public void setQualityPassRate(BigDecimal qualityPassRate) {
        this.qualityPassRate = qualityPassRate;
    }

    public BigDecimal getReworkRate() {
        return reworkRate;
    }

    public void setReworkRate(BigDecimal reworkRate) {
        this.reworkRate = reworkRate;
    }

    public BigDecimal getEvidenceComplianceRate() {
        return evidenceComplianceRate;
    }

    public void setEvidenceComplianceRate(BigDecimal evidenceComplianceRate) {
        this.evidenceComplianceRate = evidenceComplianceRate;
    }

    public BigDecimal getAvgInspectionTurnaroundHours() {
        return avgInspectionTurnaroundHours;
    }

    public void setAvgInspectionTurnaroundHours(BigDecimal avgInspectionTurnaroundHours) {
        this.avgInspectionTurnaroundHours = avgInspectionTurnaroundHours;
    }

    public BigDecimal getAvgCorrectiveActionResolutionHours() {
        return avgCorrectiveActionResolutionHours;
    }

    public void setAvgCorrectiveActionResolutionHours(BigDecimal avgCorrectiveActionResolutionHours) {
        this.avgCorrectiveActionResolutionHours = avgCorrectiveActionResolutionHours;
    }

    public long getOverdueAssignmentsCount() {
        return overdueAssignmentsCount;
    }

    public void setOverdueAssignmentsCount(long overdueAssignmentsCount) {
        this.overdueAssignmentsCount = overdueAssignmentsCount;
    }

    public BigDecimal getAvgDelayDays() {
        return avgDelayDays;
    }

    public void setAvgDelayDays(BigDecimal avgDelayDays) {
        this.avgDelayDays = avgDelayDays;
    }

    public BigDecimal getTotalPaymentRequested() {
        return totalPaymentRequested;
    }

    public void setTotalPaymentRequested(BigDecimal totalPaymentRequested) {
        this.totalPaymentRequested = totalPaymentRequested;
    }

    public BigDecimal getTotalPaymentApproved() {
        return totalPaymentApproved;
    }

    public void setTotalPaymentApproved(BigDecimal totalPaymentApproved) {
        this.totalPaymentApproved = totalPaymentApproved;
    }

    public BigDecimal getTotalSimulatedSettled() {
        return totalSimulatedSettled;
    }

    public void setTotalSimulatedSettled(BigDecimal totalSimulatedSettled) {
        this.totalSimulatedSettled = totalSimulatedSettled;
    }

    public long getPendingFinancialRequestsCount() {
        return pendingFinancialRequestsCount;
    }

    public void setPendingFinancialRequestsCount(long pendingFinancialRequestsCount) {
        this.pendingFinancialRequestsCount = pendingFinancialRequestsCount;
    }

    public long getRejectedFinancialRequestsCount() {
        return rejectedFinancialRequestsCount;
    }

    public void setRejectedFinancialRequestsCount(long rejectedFinancialRequestsCount) {
        this.rejectedFinancialRequestsCount = rejectedFinancialRequestsCount;
    }

    public String getSimulationDisclaimer() {
        return simulationDisclaimer;
    }

    public void setSimulationDisclaimer(String simulationDisclaimer) {
        this.simulationDisclaimer = simulationDisclaimer;
    }

    public long getActiveAssignmentsCount() {
        return activeAssignmentsCount;
    }

    public void setActiveAssignmentsCount(long activeAssignmentsCount) {
        this.activeAssignmentsCount = activeAssignmentsCount;
    }

    public long getCompletedAssignmentsCount() {
        return completedAssignmentsCount;
    }

    public void setCompletedAssignmentsCount(long completedAssignmentsCount) {
        this.completedAssignmentsCount = completedAssignmentsCount;
    }

    public long getPendingInspectionsCount() {
        return pendingInspectionsCount;
    }

    public void setPendingInspectionsCount(long pendingInspectionsCount) {
        this.pendingInspectionsCount = pendingInspectionsCount;
    }

    public long getOpenCorrectiveActionsCount() {
        return openCorrectiveActionsCount;
    }

    public void setOpenCorrectiveActionsCount(long openCorrectiveActionsCount) {
        this.openCorrectiveActionsCount = openCorrectiveActionsCount;
    }

    public BigDecimal getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(BigDecimal overallScore) {
        this.overallScore = overallScore;
    }

    public DataSufficiencyStatus getDataSufficiencyStatus() {
        return dataSufficiencyStatus;
    }

    public void setDataSufficiencyStatus(DataSufficiencyStatus dataSufficiencyStatus) {
        this.dataSufficiencyStatus = dataSufficiencyStatus;
    }

    public int getScoringConfigurationVersion() {
        return scoringConfigurationVersion;
    }

    public void setScoringConfigurationVersion(int scoringConfigurationVersion) {
        this.scoringConfigurationVersion = scoringConfigurationVersion;
    }

    public String getRankingTier() {
        return rankingTier;
    }

    public void setRankingTier(String rankingTier) {
        this.rankingTier = rankingTier;
    }

    public Map<String, Long> getSampleCounts() {
        return sampleCounts;
    }

    public void setSampleCounts(Map<String, Long> sampleCounts) {
        this.sampleCounts = sampleCounts;
    }

    public long getTotalAssignments() {
        return activeAssignmentsCount + completedAssignmentsCount;
    }

    public BigDecimal getOverallPerformanceScore() {
        return overallScore;
    }
}
