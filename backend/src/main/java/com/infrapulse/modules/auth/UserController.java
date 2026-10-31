package com.infrapulse.modules.auth;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.dto.CreateUserRequest;
import com.infrapulse.modules.auth.dto.UpdateRoleRequest;
import com.infrapulse.modules.auth.dto.UpdateStatusRequest;
import com.infrapulse.modules.auth.dto.UserDto;
import com.infrapulse.modules.auth.service.UserService;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAuthority('MANAGE_USERS')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable String id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> createUser(
        @Valid @RequestBody CreateUserRequest request,
        @AuthenticationPrincipal UserPrincipal adminPrincipal
    ) {
        String adminId = adminPrincipal != null ? adminPrincipal.getId() : "system";
        UserDto user = userService.createUser(request, adminId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("User created successfully", user));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
        @PathVariable String id,
        @Valid @RequestBody UpdateStatusRequest request,
        @AuthenticationPrincipal UserPrincipal adminPrincipal
    ) {
        String adminId = adminPrincipal != null ? adminPrincipal.getId() : "system";
        UserDto user = userService.updateUserStatus(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", user));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserDto>> updateUserRole(
        @PathVariable String id,
        @Valid @RequestBody UpdateRoleRequest request,
        @AuthenticationPrincipal UserPrincipal adminPrincipal
    ) {
        String adminId = adminPrincipal != null ? adminPrincipal.getId() : "system";
        UserDto user = userService.updateUserRole(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", user));
    }
}
