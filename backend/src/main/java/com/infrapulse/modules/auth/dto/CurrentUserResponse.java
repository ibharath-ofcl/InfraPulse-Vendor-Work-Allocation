package com.infrapulse.modules.auth.dto;

import com.infrapulse.modules.auth.model.Permission;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;

import java.util.Set;

public record CurrentUserResponse(
    String id,
    String fullName,
    String email,
    UserRole role,
    UserStatus status,
    Set<Permission> permissions
) {}
