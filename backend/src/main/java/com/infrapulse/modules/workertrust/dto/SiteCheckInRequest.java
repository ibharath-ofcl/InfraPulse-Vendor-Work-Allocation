package com.infrapulse.modules.workertrust.dto;

import jakarta.validation.constraints.NotBlank;

public record SiteCheckInRequest(
    @NotBlank(message = "QR Token or Worker Code is required")
    String tokenOrWorkerCode,

    @NotBlank(message = "Project ID is required")
    String projectId,

    String workZoneId,

    String deviceReference
) {}

