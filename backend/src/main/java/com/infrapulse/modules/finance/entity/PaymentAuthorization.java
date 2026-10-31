package com.infrapulse.modules.finance.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.enums.PaymentAuthorizationStatus;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "payment_authorizations")
public class PaymentAuthorization {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "payment_code", length = 64, nullable = false, unique = true)
    private String paymentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_request_id", nullable = false)
    private VendorPaymentRequest paymentRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false)
    private ProjectMilestone milestone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "authorized_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal authorizedAmount;

    @Column(name = "currency", length = 10, nullable = false)
    private String currency = "USD";

    @Column(name = "authorization_reference", length = 128, nullable = false, unique = true)
    private String authorizationReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 64, nullable = false)
    private PaymentAuthorizationStatus status = PaymentAuthorizationStatus.AUTHORIZED;

    @Column(name = "simulation_disclaimer", length = 255, nullable = false)
    private String simulationDisclaimer = "SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorized_by", nullable = false)
    private User authorizedBy;

    @Column(name = "authorized_at", nullable = false)
    private Instant authorizedAt;

    @Column(name = "settled_at")
    private Instant settledAt;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "idempotency_key", length = 128, nullable = false, unique = true)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "paymentAuthorization", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FinancialTransaction> transactions = new ArrayList<>();

    public PaymentAuthorization() {
        this.id = UUID.randomUUID().toString();
        this.authorizedAt = Instant.now();
        this.createdAt = Instant.now();
    }

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

    public VendorPaymentRequest getPaymentRequest() {
        return paymentRequest;
    }

    public void setPaymentRequest(VendorPaymentRequest paymentRequest) {
        this.paymentRequest = paymentRequest;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public ProjectMilestone getMilestone() {
        return milestone;
    }

    public void setMilestone(ProjectMilestone milestone) {
        this.milestone = milestone;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
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

    public User getAuthorizedBy() {
        return authorizedBy;
    }

    public void setAuthorizedBy(User authorizedBy) {
        this.authorizedBy = authorizedBy;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<FinancialTransaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<FinancialTransaction> transactions) {
        this.transactions = transactions;
    }
}
