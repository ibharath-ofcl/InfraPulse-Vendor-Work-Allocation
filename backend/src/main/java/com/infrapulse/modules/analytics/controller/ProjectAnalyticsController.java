package com.infrapulse.modules.analytics.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.analytics.dto.ProjectPerformanceDto;
import com.infrapulse.modules.analytics.service.ProjectPerformanceAnalyticsService;
import com.infrapulse.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics/projects")
public class ProjectAnalyticsController {

    private final ProjectPerformanceAnalyticsService projectAnalyticsService;

    public ProjectAnalyticsController(ProjectPerformanceAnalyticsService projectAnalyticsService) {
        this.projectAnalyticsService = projectAnalyticsService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'VIEW_PROJECTS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<ProjectPerformanceDto>>> getAllProjectsPerformance(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        List<ProjectPerformanceDto> list = projectAnalyticsService.getAllProjectsPerformance();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{projectId}")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'VIEW_PROJECTS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ProjectPerformanceDto>> getProjectPerformance(
            @PathVariable String projectId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        ProjectPerformanceDto dto = projectAnalyticsService.getProjectPerformance(projectId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/{projectId}/performance")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'VIEW_PROJECTS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ProjectPerformanceDto>> getProjectDeepPerformance(
            @PathVariable String projectId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        ProjectPerformanceDto dto = projectAnalyticsService.getProjectPerformance(projectId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
