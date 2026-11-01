package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.VerificationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateVerificationRequest(
    @NotNull(message = "Verification status is required")
    VerificationStatus verificationStatus,

    String reviewNotes
) {}
