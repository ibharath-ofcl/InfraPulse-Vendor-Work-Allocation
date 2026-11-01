package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.IncidentSeverity;
import com.infrapulse.modules.workertrust.enums.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReportIncidentRequest(
    String projectId,

    String workZoneId,

    String workerId,

    @NotNull(message = "Incident type is required")
    IncidentType incidentType,

    @NotNull(message = "Incident severity is required")
    IncidentSeverity severity,

    @NotBlank(message = "Incident description is required")
    String description,

    String immediateActionTaken
) {}
