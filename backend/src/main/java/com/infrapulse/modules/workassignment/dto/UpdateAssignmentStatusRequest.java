package com.infrapulse.modules.workassignment.dto;

import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAssignmentStatusRequest(
    @NotNull(message = "New assignment status is mandatory")
    AssignmentStatus status,

    String reason
) {}
