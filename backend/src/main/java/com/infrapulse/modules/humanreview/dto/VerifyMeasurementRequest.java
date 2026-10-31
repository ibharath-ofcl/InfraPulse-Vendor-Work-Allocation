package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.model.MeasurementVerificationStatus;
import jakarta.validation.constraints.NotNull;

public class VerifyMeasurementRequest {

    @NotNull(message = "Verification status is required")
    private MeasurementVerificationStatus verificationStatus;

    private String remarks;

    public VerifyMeasurementRequest() {}

    public VerifyMeasurementRequest(MeasurementVerificationStatus verificationStatus, String remarks) {
        this.verificationStatus = verificationStatus;
        this.remarks = remarks;
    }

    public MeasurementVerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(MeasurementVerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
