package com.infrapulse.modules.finance.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.enums.FinanceDecisionType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "financial_approval_decisions")
public class FinancialApprovalDecision {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_request_id", nullable = false)
    private VendorPaymentRequest paymentRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Column(name = "reviewer_role", length = 64, nullable = false)
    private String reviewerRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_type", length = 64, nullable = false)
    private FinanceDecisionType decisionType;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "approved_amount", precision = 15, scale = 2)
    private BigDecimal approvedAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_decision_id")
    private FinancialApprovalDecision previousDecision;

    @Column(name = "decided_at", nullable = false)
    private Instant decidedAt;

    public FinancialApprovalDecision() {
        this.id = UUID.randomUUID().toString();
        this.decidedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public VendorPaymentRequest getPaymentRequest() {
        return paymentRequest;
    }

    public void setPaymentRequest(VendorPaymentRequest paymentRequest) {
        this.paymentRequest = paymentRequest;
    }

    public User getReviewer() {
        return reviewer;
    }

    public void setReviewer(User reviewer) {
        this.reviewer = reviewer;
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

    public FinancialApprovalDecision getPreviousDecision() {
        return previousDecision;
    }

    public void setPreviousDecision(FinancialApprovalDecision previousDecision) {
        this.previousDecision = previousDecision;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(Instant decidedAt) {
        this.decidedAt = decidedAt;
    }
}
