package com.infrapulse.modules.finance.entity;

import com.infrapulse.modules.auth.model.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vendor_agreement_versions")
public class VendorAgreementVersion {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agreement_id", nullable = false)
    private VendorAgreement agreement;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "contract_value", precision = 15, scale = 2, nullable = false)
    private BigDecimal contractValue;

    @Column(name = "currency", length = 10, nullable = false)
    private String currency;

    @Column(name = "payment_terms", columnDefinition = "TEXT")
    private String paymentTerms;

    @Column(name = "retention_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal retentionPercentage = BigDecimal.ZERO;

    @Column(name = "tax_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @Column(name = "commercial_terms_snapshot", columnDefinition = "TEXT")
    private String commercialTermsSnapshot;

    @Column(name = "change_reason", columnDefinition = "TEXT")
    private String changeReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public VendorAgreementVersion() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public VendorAgreement getAgreement() {
        return agreement;
    }

    public void setAgreement(VendorAgreement agreement) {
        this.agreement = agreement;
    }

    public int getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(int versionNumber) {
        this.versionNumber = versionNumber;
    }

    public BigDecimal getContractValue() {
        return contractValue;
    }

    public void setContractValue(BigDecimal contractValue) {
        this.contractValue = contractValue;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPaymentTerms() {
        return paymentTerms;
    }

    public void setPaymentTerms(String paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public BigDecimal getRetentionPercentage() {
        return retentionPercentage;
    }

    public void setRetentionPercentage(BigDecimal retentionPercentage) {
        this.retentionPercentage = retentionPercentage;
    }

    public BigDecimal getTaxPercentage() {
        return taxPercentage;
    }

    public void setTaxPercentage(BigDecimal taxPercentage) {
        this.taxPercentage = taxPercentage;
    }

    public String getCommercialTermsSnapshot() {
        return commercialTermsSnapshot;
    }

    public void setCommercialTermsSnapshot(String commercialTermsSnapshot) {
        this.commercialTermsSnapshot = commercialTermsSnapshot;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(User changedBy) {
        this.changedBy = changedBy;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
