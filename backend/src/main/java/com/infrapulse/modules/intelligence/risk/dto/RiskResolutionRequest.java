package com.infrapulse.modules.intelligence.risk.dto;

import com.infrapulse.modules.intelligence.risk.model.RiskAlertStatus;
import jakarta.validation.constraints.NotNull;

public record RiskResolutionRequest(
    @NotNull(message = "Alert status is mandatory")
    RiskAlertStatus status,

    String resolutionNotes
) {}
