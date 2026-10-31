package com.infrapulse.modules.project.dto;

import java.time.Instant;

public class ProjectManagerAssignmentDto {

    private String id;
    private String managerId;
    private String managerName;
    private String managerEmail;
    private Instant assignedAt;
    private String assignedByName;
    private boolean active;

    public ProjectManagerAssignmentDto() {
    }

    public ProjectManagerAssignmentDto(String id, String managerId, String managerName, String managerEmail, Instant assignedAt, String assignedByName, boolean active) {
        this.id = id;
        this.managerId = managerId;
        this.managerName = managerName;
        this.managerEmail = managerEmail;
        this.assignedAt = assignedAt;
        this.assignedByName = assignedByName;
        this.active = active;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getManagerId() {
        return managerId;
    }

    public void setManagerId(String managerId) {
        this.managerId = managerId;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getManagerEmail() {
        return managerEmail;
    }

    public void setManagerEmail(String managerEmail) {
        this.managerEmail = managerEmail;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Instant assignedAt) {
        this.assignedAt = assignedAt;
    }

    public String getAssociatedByName() {
        return assignedByName;
    }

    public void setAssociatedByName(String assignedByName) {
        this.assignedByName = assignedByName;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
