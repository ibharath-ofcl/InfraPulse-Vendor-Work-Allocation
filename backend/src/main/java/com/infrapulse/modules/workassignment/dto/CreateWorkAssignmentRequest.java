package com.infrapulse.modules.workassignment.dto;

import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.WorkType;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record CreateWorkAssignmentRequest(
    @NotBlank(message = "Project ID is mandatory")
    String projectId,

    @NotBlank(message = "Work zone ID is mandatory")
    String workZoneId,

    @NotBlank(message = "Vendor ID is mandatory")
    String vendorId,

    @NotNull(message = "Infrastructure work type is mandatory")
    WorkType workType,

    @NotBlank(message = "Assignment title is mandatory")
    @Size(max = 255, message = "Assignment title cannot exceed 255 characters")
    String title,

    String description,

    @NotNull(message = "Planned start date is mandatory")
    LocalDate plannedStartDate,

    @NotNull(message = "Target completion date is mandatory")
    LocalDate targetEndDate,

    AssignmentPriority priority,

    String instructions
) {}
