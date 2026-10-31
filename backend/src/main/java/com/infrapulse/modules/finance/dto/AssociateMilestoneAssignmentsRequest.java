package com.infrapulse.modules.finance.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class AssociateMilestoneAssignmentsRequest {

    @NotEmpty(message = "At least one assignment ID is required")
    private List<String> assignmentIds;

    public List<String> getAssignmentIds() {
        return assignmentIds;
    }

    public void setAssignmentIds(List<String> assignmentIds) {
        this.assignmentIds = assignmentIds;
    }
}
