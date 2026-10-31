package com.infrapulse.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class ProjectPerformanceDto {

    private String projectId;
    private String projectCode;
    private String projectName;
    private String status;

    private long totalAssignments = 0L;
    private long approvedAssignments = 0L;
    private long pendingInspections = 0L;
    private long openCorrectiveActions = 0L;
    private long overdueAssignments = 0L;

    private BigDecimal completionRate = BigDecimal.ZERO;
    private BigDecimal qualityPassRate = BigDecimal.ZERO;
    private BigDecimal milestoneProgressPercentage = BigDecimal.ZERO;

    private BigDecimal totalContractValue = BigDecimal.ZERO;
    private BigDecimal authorizedPaymentAmount = BigDecimal.ZERO;
    private BigDecimal simulatedSettledAmount = BigDecimal.ZERO;

    private Map<String, Long> workTypeDistribution = new HashMap<>();
    private Map<String, Long> zoneStatusDistribution = new HashMap<>();

    public ProjectPerformanceDto() {
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getProjectCode() {
        return projectCode;
    }

    public void setProjectCode(String projectCode) {
        this.projectCode = projectCode;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getTotalAssignments() {
        return totalAssignments;
    }

    public void setTotalAssignments(long totalAssignments) {
        this.totalAssignments = totalAssignments;
    }

    public long getApprovedAssignments() {
        return approvedAssignments;
    }

    public void setApprovedAssignments(long approvedAssignments) {
        this.approvedAssignments = approvedAssignments;
    }

    public long getPendingInspections() {
        return pendingInspections;
    }

    public void setPendingInspections(long pendingInspections) {
        this.pendingInspections = pendingInspections;
    }

    public long getOpenCorrectiveActions() {
        return openCorrectiveActions;
    }

    public void setOpenCorrectiveActions(long openCorrectiveActions) {
        this.openCorrectiveActions = openCorrectiveActions;
    }

    public long getOverdueAssignments() {
        return overdueAssignments;
    }

    public void setOverdueAssignments(long overdueAssignments) {
        this.overdueAssignments = overdueAssignments;
    }

    public BigDecimal getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(BigDecimal completionRate) {
        this.completionRate = completionRate;
    }

    public BigDecimal getQualityPassRate() {
        return qualityPassRate;
    }

    public void setQualityPassRate(BigDecimal qualityPassRate) {
        this.qualityPassRate = qualityPassRate;
    }

    public BigDecimal getMilestoneProgressPercentage() {
        return milestoneProgressPercentage;
    }

    public void setMilestoneProgressPercentage(BigDecimal milestoneProgressPercentage) {
        this.milestoneProgressPercentage = milestoneProgressPercentage;
    }

    public BigDecimal getTotalContractValue() {
        return totalContractValue;
    }

    public void setTotalContractValue(BigDecimal totalContractValue) {
        this.totalContractValue = totalContractValue;
    }

    public BigDecimal getAuthorizedPaymentAmount() {
        return authorizedPaymentAmount;
    }

    public void setAuthorizedPaymentAmount(BigDecimal authorizedPaymentAmount) {
        this.authorizedPaymentAmount = authorizedPaymentAmount;
    }

    public BigDecimal getSimulatedSettledAmount() {
        return simulatedSettledAmount;
    }

    public void setSimulatedSettledAmount(BigDecimal simulatedSettledAmount) {
        this.simulatedSettledAmount = simulatedSettledAmount;
    }

    public Map<String, Long> getWorkTypeDistribution() {
        return workTypeDistribution;
    }

    public void setWorkTypeDistribution(Map<String, Long> workTypeDistribution) {
        this.workTypeDistribution = workTypeDistribution;
    }

    public Map<String, Long> getZoneStatusDistribution() {
        return zoneStatusDistribution;
    }

    public void setZoneStatusDistribution(Map<String, Long> zoneStatusDistribution) {
        this.zoneStatusDistribution = zoneStatusDistribution;
    }
}
