package com.infrapulse.modules.auth.dto;

import com.infrapulse.modules.auth.model.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
    @NotNull(message = "Status is required")
    UserStatus status
) {}
