package com.infrapulse.modules.finance.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.enums.InvoiceVerificationStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invoice_verifications")
public class InvoiceVerification {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_request_id", nullable = false)
    private VendorPaymentRequest paymentRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by", nullable = false)
    private User verifiedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 64, nullable = false)
    private InvoiceVerificationStatus verificationStatus;

    @Column(name = "verification_reason", columnDefinition = "TEXT")
    private String verificationReason;

    @Column(name = "verified_at", nullable = false)
    private Instant verifiedAt;

    public InvoiceVerification() {
        this.id = UUID.randomUUID().toString();
        this.verifiedAt = Instant.now();
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

    public User getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(User verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public InvoiceVerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(InvoiceVerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getVerificationReason() {
        return verificationReason;
    }

    public void setVerificationReason(String verificationReason) {
        this.verificationReason = verificationReason;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
