package com.infrapulse.modules.workertrust.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AssignWorkerRequest(
    @NotBlank(message = "Project ID is required")
    String projectId,

    @NotBlank(message = "Work Zone ID is required")
    String workZoneId,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    @NotNull(message = "End date is required")
    LocalDate endDate,

    String requiredRole
) {}

