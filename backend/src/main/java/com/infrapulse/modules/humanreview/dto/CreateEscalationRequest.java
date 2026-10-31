package com.infrapulse.modules.humanreview.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateEscalationRequest {

    @NotBlank(message = "Escalation reason is required")
    private String escalationReason;

    private String severity = "HIGH";
    private String assignedRole;
    private String assignedReviewerId;

    public CreateEscalationRequest() {}

    public CreateEscalationRequest(String escalationReason, String severity, String assignedRole, String assignedReviewerId) {
        this.escalationReason = escalationReason;
        this.severity = severity != null ? severity : "HIGH";
        this.assignedRole = assignedRole;
        this.assignedReviewerId = assignedReviewerId;
    }

    public String getEscalationReason() { return escalationReason; }
    public void setEscalationReason(String escalationReason) { this.escalationReason = escalationReason; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getAssignedRole() { return assignedRole; }
    public void setAssignedRole(String assignedRole) { this.assignedRole = assignedRole; }

    public String getAssignedReviewerId() { return assignedReviewerId; }
    public void setAssignedReviewerId(String assignedReviewerId) { this.assignedReviewerId = assignedReviewerId; }
}
