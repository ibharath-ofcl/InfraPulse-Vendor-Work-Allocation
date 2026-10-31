package com.infrapulse.modules.dashboard.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.dashboard.dto.*;
import com.infrapulse.modules.dashboard.service.DashboardAnalyticsService;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.security.UserPrincipal;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardAnalyticsService analyticsService;

    public DashboardController(DashboardAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    private User extractUser(UserPrincipal principal) {
        return principal != null ? principal.getUser() : null;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('VIEW_OVERVIEW', 'VIEW_ASSIGNED_WORK', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) String pincode,
        @RequestParam(required = false) String workZoneId,
        @RequestParam(required = false) String vendorId,
        @RequestParam(required = false) WorkType workType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        DashboardSummaryResponse response = analyticsService.getSummary(
            projectId, pincode, workZoneId, vendorId, workType, startDate, endDate, extractUser(principal)
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assignment-distribution")
    @PreAuthorize("hasAnyAuthority('VIEW_OVERVIEW', 'VIEW_ASSIGNED_WORK', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentDistributionResponse>> getAssignmentDistribution(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) String pincode,
        @RequestParam(required = false) String workZoneId,
        @RequestParam(required = false) String vendorId,
        @RequestParam(required = false) WorkType workType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssignmentDistributionResponse response = analyticsService.getAssignmentDistribution(
            projectId, pincode, workZoneId, vendorId, workType, startDate, endDate, extractUser(principal)
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/project-progress")
    @PreAuthorize("hasAnyAuthority('VIEW_OVERVIEW', 'VIEW_PROJECTS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ProjectProgressResponse>> getProjectProgress(
        @RequestParam(required = false) String projectId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectProgressResponse response = analyticsService.getProjectProgress(projectId, extractUser(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/work-zones")
    @PreAuthorize("hasAnyAuthority('VIEW_OVERVIEW', 'VIEW_WORK_ZONES', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkZoneOverviewResponse>> getWorkZones(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) String pincode,
        @RequestParam(required = false) String workZoneId,
        @RequestParam(required = false) String vendorId,
        @RequestParam(required = false) WorkType workType,
        @RequestParam(required = false) AssignmentStatus status,
        @PageableDefault(size = 20, sort = "zoneName", direction = Sort.Direction.ASC) Pageable pageable,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkZoneOverviewResponse response = analyticsService.getWorkZoneOverview(
            projectId, pincode, workZoneId, vendorId, workType, status, pageable, extractUser(principal)
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/dependency-monitoring")
    @PreAuthorize("hasAnyAuthority('VIEW_OVERVIEW', 'DEPENDENCY_VIEW', 'VIEW_ASSIGNED_WORK', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<DependencyMonitoringResponse>> getDependencyMonitoring(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) String workZoneId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        DependencyMonitoringResponse response = analyticsService.getDependencyMonitoring(
            projectId, workZoneId, extractUser(principal)
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/vendor-workload")
    @PreAuthorize("hasAnyAuthority('VIEW_OVERVIEW', 'VENDOR_VIEW', 'VIEW_ASSIGNED_WORK', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorWorkloadResponse>> getVendorWorkload(
        @RequestParam(required = false) String projectId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        VendorWorkloadResponse response = analyticsService.getVendorWorkload(projectId, extractUser(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recent-activity")
    @PreAuthorize("hasAnyAuthority('VIEW_OVERVIEW', 'VIEW_AUDIT_TRAIL', 'VIEW_ASSIGNED_WORK', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<RecentActivityResponse>> getRecentActivity(
        @RequestParam(required = false) String projectId,
        @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        RecentActivityResponse response = analyticsService.getRecentActivity(projectId, pageable, extractUser(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DashboardSearchResponse>> globalSearch(
        @RequestParam(name = "q", required = false) String query,
        @RequestParam(name = "search", required = false) String searchAlias,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        String effectiveQuery = query != null && !query.isBlank() ? query : searchAlias;
        DashboardSearchResponse response = analyticsService.globalSearch(effectiveQuery, extractUser(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
