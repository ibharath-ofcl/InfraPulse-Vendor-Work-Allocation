package com.infrapulse.modules.vendor.dto;

import com.infrapulse.modules.vendor.enums.VendorStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateVendorStatusRequest {

    @NotNull(message = "Status is required")
    private VendorStatus status;

    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;

    public UpdateVendorStatusRequest() {
    }

    public UpdateVendorStatusRequest(VendorStatus status, String reason) {
        this.status = status;
        this.reason = reason;
    }

    public VendorStatus getStatus() {
        return status;
    }

    public void setStatus(VendorStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
