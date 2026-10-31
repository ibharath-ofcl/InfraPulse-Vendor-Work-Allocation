package com.infrapulse.modules.workdependency.dto;

import com.infrapulse.modules.workassignment.enums.AssignmentStatus;

public record UpdateDependencyRequest(
    AssignmentStatus requiredPredecessorStatus,
    Boolean requiresReleaseApproval,
    Boolean isActive,
    Integer priority,
    String description
) {}
