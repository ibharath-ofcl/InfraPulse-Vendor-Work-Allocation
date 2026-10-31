package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.InvoiceVerificationStatus;
import jakarta.validation.constraints.NotNull;

public class VerifyInvoiceRequest {

    @NotNull(message = "Verification status is mandatory")
    private InvoiceVerificationStatus verificationStatus;

    private String verificationReason;

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
}
