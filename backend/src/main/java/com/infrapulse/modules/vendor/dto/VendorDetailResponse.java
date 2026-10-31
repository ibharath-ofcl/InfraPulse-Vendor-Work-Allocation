package com.infrapulse.modules.vendor.dto;

import com.infrapulse.common.dto.AuditEventDto;

import java.util.ArrayList;
import java.util.List;

public class VendorDetailResponse extends VendorResponse {

    private List<VendorProjectDto> associatedProjects = new ArrayList<>();
    private List<AuditEventDto> auditTrail = new ArrayList<>();

    public VendorDetailResponse() {
    }

    public List<VendorProjectDto> getAssociatedProjects() {
        return associatedProjects;
    }

    public void setAssociatedProjects(List<VendorProjectDto> associatedProjects) {
        this.associatedProjects = associatedProjects;
    }

    public List<AuditEventDto> getAuditTrail() {
        return auditTrail;
    }

    public void setAuditTrail(List<AuditEventDto> auditTrail) {
        this.auditTrail = auditTrail;
    }
}
