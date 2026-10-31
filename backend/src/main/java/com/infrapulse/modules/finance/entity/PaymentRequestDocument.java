package com.infrapulse.modules.finance.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.enums.PaymentDocumentType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_request_documents")
public class PaymentRequestDocument {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_request_id", nullable = false)
    private VendorPaymentRequest paymentRequest;

    @Column(name = "document_name", length = 255, nullable = false)
    private String documentName;

    @Column(name = "evidence_or_document_reference", columnDefinition = "TEXT", nullable = false)
    private String evidenceOrDocumentReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 64, nullable = false)
    private PaymentDocumentType documentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    public PaymentRequestDocument() {
        this.id = UUID.randomUUID().toString();
        this.uploadedAt = Instant.now();
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

    public String getDocumentName() {
        return documentName;
    }

    public void setDocumentName(String documentName) {
        this.documentName = documentName;
    }

    public String getEvidenceOrDocumentReference() {
        return evidenceOrDocumentReference;
    }

    public void setEvidenceOrDocumentReference(String evidenceOrDocumentReference) {
        this.evidenceOrDocumentReference = evidenceOrDocumentReference;
    }

    public PaymentDocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(PaymentDocumentType documentType) {
        this.documentType = documentType;
    }

    public User getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(User uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
