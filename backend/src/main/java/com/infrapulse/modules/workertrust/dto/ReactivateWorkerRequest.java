package com.infrapulse.modules.workertrust.dto;

import jakarta.validation.constraints.NotBlank;

public record ReactivateWorkerRequest(
    @NotBlank(message = "Documented reactivation justification notes are mandatory")
    String resolutionNotes
) {}

