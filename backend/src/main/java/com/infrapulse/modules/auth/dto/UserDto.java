package com.infrapulse.modules.auth.dto;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;

import java.time.Instant;

public record UserDto(
    String id,
    String fullName,
    String email,
    String phoneNumber,
    UserRole role,
    UserStatus status,
    Instant createdAt,
    Instant lastLoginAt
) {
    public static UserDto fromEntity(User user) {
        return new UserDto(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhoneNumber(),
            user.getRole(),
            user.getStatus(),
            user.getCreatedAt(),
            user.getLastLoginAt()
        );
    }
}
