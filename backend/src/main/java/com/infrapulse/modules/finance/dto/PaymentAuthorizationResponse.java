package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.PaymentAuthorizationStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class PaymentAuthorizationResponse {

    private String id;
    private String paymentCode;
    private String paymentRequestId;
    private String paymentRequestCode;
    private String projectId;
    private String projectName;
    private String milestoneId;
    private String milestoneCode;
    private String milestoneName;
    private String vendorId;
    private String vendorCode;
    private String vendorName;
    private BigDecimal authorizedAmount;
    private String currency;
    private String authorizationReference;
    private PaymentAuthorizationStatus status;
    private String simulationDisclaimer = "SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED";
    private String authorizedById;
    private String authorizedByName;
    private Instant authorizedAt;
    private Instant settledAt;
    private String failureReason;
    private String idempotencyKey;
    private List<FinancialTransactionResponse> transactions = new ArrayList<>();
    private Instant createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPaymentCode() {
        return paymentCode;
    }

    public void setPaymentCode(String paymentCode) {
        this.paymentCode = paymentCode;
    }

    public String getPaymentRequestId() {
        return paymentRequestId;
    }

    public void setPaymentRequestId(String paymentRequestId) {
        this.paymentRequestId = paymentRequestId;
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

    public BigDecimal getAuthorizedAmount() {
        return authorizedAmount;
    }

    public void setAuthorizedAmount(BigDecimal authorizedAmount) {
        this.authorizedAmount = authorizedAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getAuthorizationReference() {
        return authorizationReference;
    }

    public void setAuthorizationReference(String authorizationReference) {
        this.authorizationReference = authorizationReference;
    }

    public PaymentAuthorizationStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentAuthorizationStatus status) {
        this.status = status;
    }

    public String getSimulationDisclaimer() {
        return simulationDisclaimer;
    }

    public void setSimulationDisclaimer(String simulationDisclaimer) {
        this.simulationDisclaimer = simulationDisclaimer;
    }

    public String getAuthorizedById() {
        return authorizedById;
    }

    public void setAuthorizedById(String authorizedById) {
        this.authorizedById = authorizedById;
    }

    public String getAuthorizedByName() {
        return authorizedByName;
    }

    public void setAuthorizedByName(String authorizedByName) {
        this.authorizedByName = authorizedByName;
    }

    public Instant getAuthorizedAt() {
        return authorizedAt;
    }

    public void setAuthorizedAt(Instant authorizedAt) {
        this.authorizedAt = authorizedAt;
    }

    public Instant getSettledAt() {
        return settledAt;
    }

    public void setSettledAt(Instant settledAt) {
        this.settledAt = settledAt;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public List<FinancialTransactionResponse> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<FinancialTransactionResponse> transactions) {
        this.transactions = transactions;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
