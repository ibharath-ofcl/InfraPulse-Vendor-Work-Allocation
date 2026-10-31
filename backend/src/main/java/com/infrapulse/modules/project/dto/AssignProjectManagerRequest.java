package com.infrapulse.modules.project.dto;

import jakarta.validation.constraints.NotBlank;

public class AssignProjectManagerRequest {

    @NotBlank(message = "Manager ID is required")
    private String managerId;

    public AssignProjectManagerRequest() {
    }

    public AssignProjectManagerRequest(String managerId) {
        this.managerId = managerId;
    }

    public String getManagerId() {
        return managerId;
    }

    public void setManagerId(String managerId) {
        this.managerId = managerId;
    }
}
