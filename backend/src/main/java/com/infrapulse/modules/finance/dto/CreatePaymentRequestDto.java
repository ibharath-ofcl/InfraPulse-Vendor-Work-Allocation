package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.PaymentDocumentType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CreatePaymentRequestDto {

    @NotBlank(message = "Invoice number is mandatory")
    private String invoiceNumber;

    @NotNull(message = "Invoice date is mandatory")
    private LocalDate invoiceDate;

    @NotNull(message = "Requested amount is mandatory")
    @DecimalMin(value = "0.01", message = "Requested amount must be greater than zero")
    private BigDecimal requestedAmount;

    private String currency = "USD";

    private String description;

    private String supportingDocumentUrl;

    private List<DocumentAttachmentDto> supportingDocuments = new ArrayList<>();

    public static class DocumentAttachmentDto {
        @NotBlank(message = "Document name is mandatory")
        private String documentName;

        @NotBlank(message = "Document reference is mandatory")
        private String evidenceOrDocumentReference;

        private PaymentDocumentType documentType = PaymentDocumentType.INVOICE;

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

    public List<DocumentAttachmentDto> getSupportingDocuments() {
        return supportingDocuments;
    }

    public void setSupportingDocuments(List<DocumentAttachmentDto> supportingDocuments) {
        this.supportingDocuments = supportingDocuments;
    }
}
