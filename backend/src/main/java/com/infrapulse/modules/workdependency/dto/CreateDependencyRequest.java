package com.infrapulse.modules.workdependency.dto;

import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import jakarta.validation.constraints.NotNull;

public record CreateDependencyRequest(
    String projectId,
    @NotNull(message = "Predecessor work type is mandatory")
    WorkType predecessorWorkType,
    @NotNull(message = "Successor work type is mandatory")
    WorkType successorWorkType,
    AssignmentStatus requiredPredecessorStatus,
    Boolean requiresReleaseApproval,
    Boolean isActive,
    Integer priority,
    String description
) {}
