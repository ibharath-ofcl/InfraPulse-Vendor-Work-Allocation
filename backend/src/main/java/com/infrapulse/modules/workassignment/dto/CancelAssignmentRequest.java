package com.infrapulse.modules.workassignment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelAssignmentRequest(
    @NotBlank(message = "Cancellation reason is mandatory")
    @Size(min = 5, max = 500, message = "Cancellation reason must be between 5 and 500 characters")
    String reason
) {}
