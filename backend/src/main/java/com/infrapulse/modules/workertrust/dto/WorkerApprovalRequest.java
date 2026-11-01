package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.ApprovalDecision;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WorkerApprovalRequest(
    @NotNull(message = "Decision is required")
    ApprovalDecision decision,

    @NotBlank(message = "A documented reason or review justification is required")
    String reason
) {}
