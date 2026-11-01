package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.IncidentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResolveIncidentRequest(
    @NotBlank(message = "Resolution details are required")
    String resolution,

    @NotNull(message = "Incident target status is required")
    IncidentStatus incidentStatus
) {}
