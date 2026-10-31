package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.InvoiceVerificationStatus;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class VendorPaymentRequestResponse {

    private String id;
    private String paymentRequestCode;
    private String projectId;
    private String projectName;
    private String agreementId;
    private String agreementCode;
    private String milestoneId;
    private String milestoneCode;
    private String milestoneName;
    private String vendorId;
    private String vendorCode;
    private String vendorName;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private BigDecimal requestedAmount;
    private String currency;
    private String description;
    private String supportingDocumentUrl;
    private PaymentRequestStatus status;
    private Instant submittedAt;
    private String financeReviewerId;
    private String financeReviewerName;
    private String decisionReason;

    private InvoiceVerificationSummaryDto invoiceVerification;
    private FinancialCalculationBreakdownDto calculationBreakdown;
    private List<PaymentRequestDocumentResponse> documents = new ArrayList<>();
    private List<FinancialApprovalDecisionResponse> decisions = new ArrayList<>();

    // Quality and Human Review Context
    private String qualityAssessmentSummary;
    private String humanInspectionDecisionType;
    private String humanInspectionReviewerName;

    private String createdById;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;

    public static class InvoiceVerificationSummaryDto {
        private String verifiedById;
        private String verifiedByName;
        private InvoiceVerificationStatus status;
        private String reason;
        private Instant verifiedAt;

        public String getVerifiedById() {
            return verifiedById;
        }

        public void setVerifiedById(String verifiedById) {
            this.verifiedById = verifiedById;
        }

        public String getVerifiedByName() {
            return verifiedByName;
        }

        public void setVerifiedByName(String verifiedByName) {
            this.verifiedByName = verifiedByName;
        }

        public InvoiceVerificationStatus getStatus() {
            return status;
        }

        public void setStatus(InvoiceVerificationStatus status) {
            this.status = status;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public Instant getVerifiedAt() {
            return verifiedAt;
        }

        public void setVerifiedAt(Instant verifiedAt) {
            this.verifiedAt = verifiedAt;
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPaymentRequestCode() {
        return paymentRequestCode;
    }

    public void setPaymentRequestCode(String paymentRequestCode) {
        this.paymentRequestCode = paymentRequestCode;
    }

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

    public String getAgreementId() {
        return agreementId;
    }

    public void setAgreementId(String agreementId) {
        this.agreementId = agreementId;
    }

    public String getAgreementCode() {
        return agreementCode;
    }

    public void setAgreementCode(String agreementCode) {
        this.agreementCode = agreementCode;
    }

    public String getMilestoneId() {
        return milestoneId;
    }

    public void setMilestoneId(String milestoneId) {
        this.milestoneId = milestoneId;
    }

    public String getMilestoneCode() {
        return milestoneCode;
    }

    public void setMilestoneCode(String milestoneCode) {
        this.milestoneCode = milestoneCode;
    }

    public String getMilestoneName() {
        return milestoneName;
    }

    public void setMilestoneName(String milestoneName) {
        this.milestoneName = milestoneName;
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

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDate invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public BigDecimal getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(BigDecimal requestedAmount) {
        this.requestedAmount = requestedAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSupportingDocumentUrl() {
        return supportingDocumentUrl;
    }

    public void setSupportingDocumentUrl(String supportingDocumentUrl) {
        this.supportingDocumentUrl = supportingDocumentUrl;
    }

    public PaymentRequestStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentRequestStatus status) {
        this.status = status;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getFinanceReviewerId() {
        return financeReviewerId;
    }

    public void setFinanceReviewerId(String financeReviewerId) {
        this.financeReviewerId = financeReviewerId;
    }

    public String getFinanceReviewerName() {
        return financeReviewerName;
    }

    public void setFinanceReviewerName(String financeReviewerName) {
        this.financeReviewerName = financeReviewerName;
    }

    public String getDecisionReason() {
        return decisionReason;
    }

    public void setDecisionReason(String decisionReason) {
        this.decisionReason = decisionReason;
    }

    public InvoiceVerificationSummaryDto getInvoiceVerification() {
        return invoiceVerification;
    }

    public void setInvoiceVerification(InvoiceVerificationSummaryDto invoiceVerification) {
        this.invoiceVerification = invoiceVerification;
    }

    public FinancialCalculationBreakdownDto getCalculationBreakdown() {
        return calculationBreakdown;
    }

    public void setCalculationBreakdown(FinancialCalculationBreakdownDto calculationBreakdown) {
        this.calculationBreakdown = calculationBreakdown;
    }

    public List<PaymentRequestDocumentResponse> getDocuments() {
        return documents;
    }

    public void setDocuments(List<PaymentRequestDocumentResponse> documents) {
        this.documents = documents;
    }

    public List<FinancialApprovalDecisionResponse> getDecisions() {
        return decisions;
    }

    public void setDecisions(List<FinancialApprovalDecisionResponse> decisions) {
        this.decisions = decisions;
    }

    public String getQualityAssessmentSummary() {
        return qualityAssessmentSummary;
    }

    public void setQualityAssessmentSummary(String qualityAssessmentSummary) {
        this.qualityAssessmentSummary = qualityAssessmentSummary;
    }

    public String getHumanInspectionDecisionType() {
        return humanInspectionDecisionType;
    }

    public void setHumanInspectionDecisionType(String humanInspectionDecisionType) {
        this.humanInspectionDecisionType = humanInspectionDecisionType;
    }

    public String getHumanInspectionReviewerName() {
        return humanInspectionReviewerName;
    }

    public void setHumanInspectionReviewerName(String humanInspectionReviewerName) {
        this.humanInspectionReviewerName = humanInspectionReviewerName;
    }

    public String getCreatedById() {
        return createdById;
    }

    public void setCreatedById(String createdById) {
        this.createdById = createdById;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
