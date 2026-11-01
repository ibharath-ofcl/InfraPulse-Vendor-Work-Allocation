package com.infrapulse.modules.workertrust.dto;

import jakarta.validation.constraints.NotBlank;

public record SiteCheckOutRequest(
    @NotBlank(message = "Site access ID or Worker Code is required")
    String identifier
) {}
