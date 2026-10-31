package com.infrapulse.modules.auth.dto;

import com.infrapulse.modules.auth.model.Permission;

import java.util.Set;

public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    UserDto user,
    Set<Permission> permissions
) {
    public static AuthResponse of(String accessToken, long expiresInSeconds, UserDto user, Set<Permission> permissions) {
        return new AuthResponse(
            accessToken,
            "Bearer",
            expiresInSeconds,
            user,
            permissions
        );
    }
}
