package com.infrapulse.modules.finance.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FinanceDashboardSummaryResponse {

    private BigDecimal totalContractualValue = BigDecimal.ZERO;
    private BigDecimal totalMilestoneValue = BigDecimal.ZERO;
    private BigDecimal eligibleMilestoneValue = BigDecimal.ZERO;
    private long pendingPaymentRequests;
    private long requestsUnderReview;
    private BigDecimal approvedPaymentAmount = BigDecimal.ZERO;
    private BigDecimal simulatedSettledAmount = BigDecimal.ZERO;
    private BigDecimal outstandingMilestoneBalance = BigDecimal.ZERO;
    private long rejectedRequests;
    private long onHoldRequests;

    private List<ProjectFinancialBreakdownDto> projectBreakdown = new ArrayList<>();
    private List<VendorFinancialBreakdownDto> vendorBreakdown = new ArrayList<>();
    private Map<String, Long> statusBreakdown = new HashMap<>();

    public static class ProjectFinancialBreakdownDto {
        private String projectId;
        private String projectName;
        private String projectCode;
        private BigDecimal totalContractValue = BigDecimal.ZERO;
        private BigDecimal authorizedAmount = BigDecimal.ZERO;
        private BigDecimal settledAmount = BigDecimal.ZERO;
        private BigDecimal outstandingBalance = BigDecimal.ZERO;

        public String getProjectId() {
            return projectId;
        }

        public void setProjectId(String projectId) {
            this.projectId = projectId;
        }

        public String getProjectName() {
            return projectName;
        }

        public void setProjectName(String projectName) {
            this.projectName = projectName;
        }

        public String getProjectCode() {
            return projectCode;
        }

        public void setProjectCode(String projectCode) {
            this.projectCode = projectCode;
        }

        public BigDecimal getTotalContractValue() {
            return totalContractValue;
        }

        public void setTotalContractValue(BigDecimal totalContractValue) {
            this.totalContractValue = totalContractValue;
        }

        public BigDecimal getAuthorizedAmount() {
            return authorizedAmount;
        }

        public void setAuthorizedAmount(BigDecimal authorizedAmount) {
            this.authorizedAmount = authorizedAmount;
        }

        public BigDecimal getSettledAmount() {
            return settledAmount;
        }

        public void setSettledAmount(BigDecimal settledAmount) {
            this.settledAmount = settledAmount;
        }

        public BigDecimal getOutstandingBalance() {
            return outstandingBalance;
        }

        public void setOutstandingBalance(BigDecimal outstandingBalance) {
            this.outstandingBalance = outstandingBalance;
        }
    }

    public static class VendorFinancialBreakdownDto {
        private String vendorId;
        private String vendorName;
        private String vendorCode;
        private BigDecimal requestedAmount = BigDecimal.ZERO;
        private BigDecimal approvedAmount = BigDecimal.ZERO;
        private BigDecimal settledAmount = BigDecimal.ZERO;
        private BigDecimal outstandingBalance = BigDecimal.ZERO;

        public String getVendorId() {
            return vendorId;
        }

        public void setVendorId(String vendorId) {
            this.vendorId = vendorId;
        }

        public String getVendorName() {
            return vendorName;
        }

        public void setVendorName(String vendorName) {
            this.vendorName = vendorName;
        }

        public String getVendorCode() {
            return vendorCode;
        }

        public void setVendorCode(String vendorCode) {
            this.vendorCode = vendorCode;
        }

        public BigDecimal getRequestedAmount() {
            return requestedAmount;
        }

        public void setRequestedAmount(BigDecimal requestedAmount) {
            this.requestedAmount = requestedAmount;
        }

        public BigDecimal getApprovedAmount() {
            return approvedAmount;
        }

        public void setApprovedAmount(BigDecimal approvedAmount) {
            this.approvedAmount = approvedAmount;
        }

        public BigDecimal getSettledAmount() {
            return settledAmount;
        }

        public void setSettledAmount(BigDecimal settledAmount) {
            this.settledAmount = settledAmount;
        }

        public BigDecimal getOutstandingBalance() {
            return outstandingBalance;
        }

        public void setOutstandingBalance(BigDecimal outstandingBalance) {
            this.outstandingBalance = outstandingBalance;
        }
    }

    public BigDecimal getTotalContractualValue() {
        return totalContractualValue;
    }

    public void setTotalContractualValue(BigDecimal totalContractualValue) {
        this.totalContractualValue = totalContractualValue;
    }

    public BigDecimal getTotalMilestoneValue() {
        return totalMilestoneValue;
    }

    public void setTotalMilestoneValue(BigDecimal totalMilestoneValue) {
        this.totalMilestoneValue = totalMilestoneValue;
    }

    public BigDecimal getEligibleMilestoneValue() {
        return eligibleMilestoneValue;
    }

    public void setEligibleMilestoneValue(BigDecimal eligibleMilestoneValue) {
        this.eligibleMilestoneValue = eligibleMilestoneValue;
    }

    public long getPendingPaymentRequests() {
        return pendingPaymentRequests;
    }

    public void setPendingPaymentRequests(long pendingPaymentRequests) {
        this.pendingPaymentRequests = pendingPaymentRequests;
    }

    public long getRequestsUnderReview() {
        return requestsUnderReview;
    }

    public void setRequestsUnderReview(long requestsUnderReview) {
        this.requestsUnderReview = requestsUnderReview;
    }

    public BigDecimal getApprovedPaymentAmount() {
        return approvedPaymentAmount;
    }

    public void setApprovedPaymentAmount(BigDecimal approvedPaymentAmount) {
        this.approvedPaymentAmount = approvedPaymentAmount;
    }

    public BigDecimal getSimulatedSettledAmount() {
        return simulatedSettledAmount;
    }

    public void setSimulatedSettledAmount(BigDecimal simulatedSettledAmount) {
        this.simulatedSettledAmount = simulatedSettledAmount;
    }

    public BigDecimal getOutstandingMilestoneBalance() {
        return outstandingMilestoneBalance;
    }

    public void setOutstandingMilestoneBalance(BigDecimal outstandingMilestoneBalance) {
        this.outstandingMilestoneBalance = outstandingMilestoneBalance;
    }

    public long getRejectedRequests() {
        return rejectedRequests;
    }

    public void setRejectedRequests(long rejectedRequests) {
        this.rejectedRequests = rejectedRequests;
    }

    public long getOnHoldRequests() {
        return onHoldRequests;
    }

    public void setOnHoldRequests(long onHoldRequests) {
        this.onHoldRequests = onHoldRequests;
    }

    public List<ProjectFinancialBreakdownDto> getProjectBreakdown() {
        return projectBreakdown;
    }

    public void setProjectBreakdown(List<ProjectFinancialBreakdownDto> projectBreakdown) {
        this.projectBreakdown = projectBreakdown;
    }

    public List<VendorFinancialBreakdownDto> getVendorBreakdown() {
        return vendorBreakdown;
    }

    public void setVendorBreakdown(List<VendorFinancialBreakdownDto> vendorBreakdown) {
        this.vendorBreakdown = vendorBreakdown;
    }

    public Map<String, Long> getStatusBreakdown() {
        return statusBreakdown;
    }

    public void setStatusBreakdown(Map<String, Long> statusBreakdown) {
        this.statusBreakdown = statusBreakdown;
    }
}
