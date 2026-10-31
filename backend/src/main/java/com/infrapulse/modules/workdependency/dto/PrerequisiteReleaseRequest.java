package com.infrapulse.modules.workdependency.dto;

import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PrerequisiteReleaseRequest(
    @NotNull(message = "Release decision is mandatory (RELEASED or REJECTED)")
    ReleaseStatus decision,

    @NotBlank(message = "Review note / justification is mandatory")
    String notes
) {}
