package com.infrapulse.modules.vendor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AssociateVendorRequest {

    @NotBlank(message = "Vendor ID is required")
    private String vendorId;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    public AssociateVendorRequest() {
    }

    public AssociateVendorRequest(String vendorId, String notes) {
        this.vendorId = vendorId;
        this.notes = notes;
    }

    public String getVendorId() {
        return vendorId;
    }

    public void setVendorId(String vendorId) {
        this.vendorId = vendorId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
