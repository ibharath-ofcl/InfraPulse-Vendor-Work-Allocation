package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.AgreementStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateAgreementRequest {

    @NotBlank(message = "Contract reference is mandatory")
    private String contractReference;

    @NotNull(message = "Contract value is mandatory")
    @DecimalMin(value = "0.01", message = "Contract value must be greater than zero")
    private BigDecimal contractValue;

    private String paymentTerms;

    @DecimalMin(value = "0.00", message = "Retention percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "Retention percentage cannot exceed 100")
    private BigDecimal retentionPercentage = BigDecimal.ZERO;

    @DecimalMin(value = "0.00", message = "Tax percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "Tax percentage cannot exceed 100")
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    private LocalDate startDate;

    private LocalDate endDate;

    private AgreementStatus status;

    private String supportingDocumentUrl;

    @NotBlank(message = "Change reason is required for versioning")
    private String changeReason;

    public String getContractReference() {
        return contractReference;
    }

    public void setContractReference(String contractReference) {
        this.contractReference = contractReference;
    }

    public BigDecimal getContractValue() {
        return contractValue;
    }

    public void setContractValue(BigDecimal contractValue) {
        this.contractValue = contractValue;
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

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public AgreementStatus getStatus() {
        return status;
    }

    public void setStatus(AgreementStatus status) {
        this.status = status;
    }

    public String getSupportingDocumentUrl() {
        return supportingDocumentUrl;
    }

    public void setSupportingDocumentUrl(String supportingDocumentUrl) {
        this.supportingDocumentUrl = supportingDocumentUrl;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }
}
