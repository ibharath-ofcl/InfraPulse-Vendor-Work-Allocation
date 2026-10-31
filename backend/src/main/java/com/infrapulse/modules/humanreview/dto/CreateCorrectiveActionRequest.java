package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.model.CorrectiveActionType;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.quality.model.FindingSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class CreateCorrectiveActionRequest {

    private String findingId;

    @NotNull(message = "Action type is required")
    private CorrectiveActionType actionType;

    @NotBlank(message = "Description is required")
    private String description;

    private ReviewPriority priority = ReviewPriority.MEDIUM;
    private FindingSeverity severity = FindingSeverity.HIGH;
    private String assignedInspectorId;
    private Instant dueAt;

    public CreateCorrectiveActionRequest() {}

    public String getFindingId() { return findingId; }
    public void setFindingId(String findingId) { this.findingId = findingId; }

    public CorrectiveActionType getActionType() { return actionType; }
    public void setActionType(CorrectiveActionType actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ReviewPriority getPriority() { return priority; }
    public void setPriority(ReviewPriority priority) { this.priority = priority; }

    public FindingSeverity getSeverity() { return severity; }
    public void setSeverity(FindingSeverity severity) { this.severity = severity; }

    public String getAssignedInspectorId() { return assignedInspectorId; }
    public void setAssignedInspectorId(String assignedInspectorId) { this.assignedInspectorId = assignedInspectorId; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
}
