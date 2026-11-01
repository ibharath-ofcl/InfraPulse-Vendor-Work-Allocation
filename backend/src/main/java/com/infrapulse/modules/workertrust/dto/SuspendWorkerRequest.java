package com.infrapulse.modules.workertrust.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SuspendWorkerRequest(
    @NotBlank(message = "Documented suspension reason is mandatory")
    String reason,

    LocalDate reviewDate
) {}

