package com.infrapulse.modules.analytics.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.analytics.dto.ScoringConfigurationDto;
import com.infrapulse.modules.analytics.service.VendorScoringConfigurationService;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics/scoring-configurations")
public class ScoringConfigurationController {

    private final VendorScoringConfigurationService service;

    public ScoringConfigurationController(VendorScoringConfigurationService service) {
        this.service = service;
    }

    private User extractUser(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.getUser();
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<ScoringConfigurationDto>>> getAllConfigurations(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        extractUser(principal);
        List<ScoringConfigurationDto> list = service.getAllConfigurations();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ScoringConfigurationDto>> getActiveConfiguration(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        extractUser(principal);
        ScoringConfigurationDto dto = service.getActiveConfiguration();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('MANAGE_SCORING_CONFIG', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ScoringConfigurationDto>> createConfiguration(
            @Valid @RequestBody ScoringConfigurationDto request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        ScoringConfigurationDto created = service.createConfiguration(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @PatchMapping("/{configurationId}/activate")
    @PreAuthorize("hasAnyAuthority('MANAGE_SCORING_CONFIG', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ScoringConfigurationDto>> activateConfiguration(
            @PathVariable String configurationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        ScoringConfigurationDto activated = service.activateConfiguration(configurationId, user);
        return ResponseEntity.ok(ApiResponse.success(activated));
    }
}
