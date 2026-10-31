package com.infrapulse.modules.workzone.dto;

import com.infrapulse.modules.workzone.enums.ZoneStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateZoneStatusRequest(
    @NotNull(message = "New zone status is mandatory")
    ZoneStatus status,

    String reason
) {}
