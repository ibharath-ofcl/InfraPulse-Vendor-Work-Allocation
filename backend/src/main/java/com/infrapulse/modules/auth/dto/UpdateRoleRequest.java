package com.infrapulse.modules.auth.dto;

import com.infrapulse.modules.auth.model.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
    @NotNull(message = "Role is required")
    UserRole role
) {}
