package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.PaymentDocumentType;
import java.time.Instant;

public class PaymentRequestDocumentResponse {

    private String id;
    private String paymentRequestId;
    private String documentName;
    private String evidenceOrDocumentReference;
    private PaymentDocumentType documentType;
    private String uploadedById;
    private String uploadedByName;
    private Instant uploadedAt;

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

    public String getUploadedById() {
        return uploadedById;
    }

    public void setUploadedById(String uploadedById) {
        this.uploadedById = uploadedById;
    }

    public String getUploadedByName() {
        return uploadedByName;
    }

    public void setUploadedByName(String uploadedByName) {
        this.uploadedByName = uploadedByName;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
