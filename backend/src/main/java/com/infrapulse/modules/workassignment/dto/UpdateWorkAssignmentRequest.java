package com.infrapulse.modules.workassignment.dto;

import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record UpdateWorkAssignmentRequest(
    @NotBlank(message = "Assignment title is mandatory")
    @Size(max = 255, message = "Assignment title cannot exceed 255 characters")
    String title,

    String description,

    @NotNull(message = "Planned start date is mandatory")
    LocalDate plannedStartDate,

    @NotNull(message = "Target completion date is mandatory")
    LocalDate targetEndDate,

    @NotNull(message = "Priority is mandatory")
    AssignmentPriority priority,

    String instructions
) {}
