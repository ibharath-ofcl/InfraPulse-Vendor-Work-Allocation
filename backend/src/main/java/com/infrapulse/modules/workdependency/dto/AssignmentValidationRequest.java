package com.infrapulse.modules.workdependency.dto;

import com.infrapulse.modules.workassignment.enums.WorkType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record AssignmentValidationRequest(
    @NotNull(message = "Project ID is mandatory")
    String projectId,

    @NotNull(message = "Work Zone ID is mandatory")
    String workZoneId,

    @NotNull(message = "Work type is mandatory")
    WorkType workType,

    String vendorId,

    LocalDate plannedStartDate,

    LocalDate targetEndDate
) {}
