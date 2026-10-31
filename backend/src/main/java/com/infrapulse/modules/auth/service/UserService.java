package com.infrapulse.modules.auth.service;

import com.infrapulse.modules.auth.dto.CreateUserRequest;
import com.infrapulse.modules.auth.dto.UpdateRoleRequest;
import com.infrapulse.modules.auth.dto.UpdateStatusRequest;
import com.infrapulse.modules.auth.dto.UserDto;
import com.infrapulse.modules.auth.model.AuthenticationAudit;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.AuthenticationAuditRepository;
import com.infrapulse.modules.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuthenticationAuditRepository auditRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
        UserRepository userRepository,
        AuthenticationAuditRepository auditRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.auditRepository = auditRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(UserDto::fromEntity)
            .toList();
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(String id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request, String adminUserId) {
        String normalizedEmail = request.email().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("User with email already exists: " + normalizedEmail);
        }

        User user = new User(
            null,
            request.fullName().trim(),
            normalizedEmail,
            passwordEncoder.encode(request.password()),
            request.phoneNumber(),
            request.role(),
            UserStatus.ACTIVE
        );

        User saved = userRepository.save(user);

        auditRepository.save(new AuthenticationAudit(
            adminUserId,
            normalizedEmail,
            "ADMIN_USER_CREATED",
            "SUCCESS",
            null,
            null,
            "Created user with role: " + saved.getRole().name()
        ));

        return UserDto.fromEntity(saved);
    }

    @Transactional
    public UserDto updateUserStatus(String targetUserId, UpdateStatusRequest request, String adminUserId) {
        User user = userRepository.findById(targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        // Prevent disabling or locking the last active platform administrator
        if (user.getRole() == UserRole.PLATFORM_ADMIN && request.status() != UserStatus.ACTIVE) {
            long activeAdmins = userRepository.countByRoleAndStatus(UserRole.PLATFORM_ADMIN, UserStatus.ACTIVE);
            if (activeAdmins <= 1) {
                throw new IllegalStateException("Cannot deactivate or lock the sole active Platform Administrator.");
            }
        }

        UserStatus oldStatus = user.getStatus();
        user.setStatus(request.status());
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        auditRepository.save(new AuthenticationAudit(
            adminUserId,
            user.getEmail(),
            "USER_STATUS_CHANGED",
            "SUCCESS",
            null,
            null,
            String.format("Status changed from %s to %s", oldStatus, request.status())
        ));

        return UserDto.fromEntity(updated);
    }

    @Transactional
    public UserDto updateUserRole(String targetUserId, UpdateRoleRequest request, String adminUserId) {
        User user = userRepository.findById(targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        // Prevent self-demotion
        if (targetUserId.equals(adminUserId) && request.role() != UserRole.PLATFORM_ADMIN) {
            throw new IllegalStateException("Administrators cannot demote their own account role.");
        }

        // Prevent removing the last active platform administrator
        if (user.getRole() == UserRole.PLATFORM_ADMIN && request.role() != UserRole.PLATFORM_ADMIN) {
            long activeAdmins = userRepository.countByRoleAndStatus(UserRole.PLATFORM_ADMIN, UserStatus.ACTIVE);
            if (activeAdmins <= 1) {
                throw new IllegalStateException("Cannot demote the sole active Platform Administrator.");
            }
        }

        UserRole oldRole = user.getRole();
        user.setRole(request.role());
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        auditRepository.save(new AuthenticationAudit(
            adminUserId,
            user.getEmail(),
            "USER_ROLE_CHANGED",
            "SUCCESS",
            null,
            null,
            String.format("Role changed from %s to %s", oldRole, request.role())
        ));

        return UserDto.fromEntity(updated);
    }
}
