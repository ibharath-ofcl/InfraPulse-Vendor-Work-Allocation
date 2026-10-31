package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.FinanceDecisionType;
import java.math.BigDecimal;
import java.time.Instant;

public class FinancialApprovalDecisionResponse {

    private String id;
    private String paymentRequestId;
    private String reviewerId;
    private String reviewerName;
    private String reviewerRole;
    private FinanceDecisionType decisionType;
    private String reason;
    private String comments;
    private BigDecimal approvedAmount;
    private String previousDecisionId;
    private Instant decidedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPaymentRequestId() {
        return paymentRequestId;
    }

    public void setPaymentRequestId(String paymentRequestId) {
        this.paymentRequestId = paymentRequestId;
    }

    public String getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(String reviewerId) {
        this.reviewerId = reviewerId;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    public String getReviewerRole() {
        return reviewerRole;
    }

    public void setReviewerRole(String reviewerRole) {
        this.reviewerRole = reviewerRole;
    }

    public FinanceDecisionType getDecisionType() {
        return decisionType;
    }

    public void setDecisionType(FinanceDecisionType decisionType) {
        this.decisionType = decisionType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public String getPreviousDecisionId() {
        return previousDecisionId;
    }

    public void setPreviousDecisionId(String previousDecisionId) {
        this.previousDecisionId = previousDecisionId;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(Instant decidedAt) {
        this.decidedAt = decidedAt;
    }
}
