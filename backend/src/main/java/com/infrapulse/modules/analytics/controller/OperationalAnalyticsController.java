package com.infrapulse.modules.analytics.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.analytics.dto.OperationalDashboardDto;
import com.infrapulse.modules.analytics.service.OperationalAnalyticsService;
import com.infrapulse.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics/dashboard")
public class OperationalAnalyticsController {

    private final OperationalAnalyticsService operationalAnalyticsService;

    public OperationalAnalyticsController(OperationalAnalyticsService operationalAnalyticsService) {
        this.operationalAnalyticsService = operationalAnalyticsService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'VIEW_OVERVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<OperationalDashboardDto>> getDashboardSummary(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        OperationalDashboardDto dto = operationalAnalyticsService.getOperationalDashboardSummary(projectId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/work-status")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'VIEW_OVERVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getWorkStatusDistribution(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        Map<String, Long> dist = operationalAnalyticsService.getWorkStatusDistribution(projectId);
        return ResponseEntity.ok(ApiResponse.success(dist));
    }

    @GetMapping("/quality")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'VIEW_OVERVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getQualityDistribution(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        Map<String, Long> dist = operationalAnalyticsService.getQualityOutcomeDistribution();
        return ResponseEntity.ok(ApiResponse.success(dist));
    }

    @GetMapping("/corrective-actions")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'VIEW_OVERVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCorrectiveActionTrends(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        Map<String, Long> dist = operationalAnalyticsService.getCorrectiveActionTrends();
        return ResponseEntity.ok(ApiResponse.success(dist));
    }

    @GetMapping("/financial")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'VIEW_OVERVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFinancialDistribution(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        Map<String, Object> dist = operationalAnalyticsService.getFinancialSummaryDistribution();
        return ResponseEntity.ok(ApiResponse.success(dist));
    }
}
