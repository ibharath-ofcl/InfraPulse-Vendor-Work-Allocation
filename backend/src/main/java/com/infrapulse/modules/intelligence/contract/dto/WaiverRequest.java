package com.infrapulse.modules.intelligence.contract.dto;

import jakarta.validation.constraints.NotBlank;

public record WaiverRequest(
    @NotBlank(message = "Documented waiver rationale is mandatory")
    String waiverReason
) {}

