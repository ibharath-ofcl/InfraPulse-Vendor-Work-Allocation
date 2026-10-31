package com.infrapulse.modules.project.dto;

import com.infrapulse.modules.project.enums.ProjectStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateProjectStatusRequest {

    @NotNull(message = "Status is required")
    private ProjectStatus status;

    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;

    public UpdateProjectStatusRequest() {
    }

    public UpdateProjectStatusRequest(ProjectStatus status, String reason) {
        this.status = status;
        this.reason = reason;
    }

    public ProjectStatus getStatus() {
        return status;
    }

    public void setStatus(ProjectStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
