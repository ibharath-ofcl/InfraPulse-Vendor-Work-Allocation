package com.infrapulse.modules.project.dto;

import com.infrapulse.common.dto.AuditEventDto;

import java.util.ArrayList;
import java.util.List;

public class ProjectDetailResponse extends ProjectResponse {

    private List<ProjectVendorDto> associatedVendors = new ArrayList<>();
    private List<ProjectManagerAssignmentDto> managerAssignments = new ArrayList<>();
    private List<AuditEventDto> auditTrail = new ArrayList<>();

    public ProjectDetailResponse() {
    }

    public List<ProjectVendorDto> getAssociatedVendors() {
        return associatedVendors;
    }

    public void setAssociatedVendors(List<ProjectVendorDto> associatedVendors) {
        this.associatedVendors = associatedVendors;
    }

    public List<ProjectManagerAssignmentDto> getManagerAssignments() {
        return managerAssignments;
    }

    public void setManagerAssignments(List<ProjectManagerAssignmentDto> managerAssignments) {
        this.managerAssignments = managerAssignments;
    }

    public List<AuditEventDto> getAuditTrail() {
        return auditTrail;
    }

    public void setAuditTrail(List<AuditEventDto> auditTrail) {
        this.auditTrail = auditTrail;
    }
}
