package com.infrapulse.modules.analytics.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.analytics.dto.VendorComparisonDto;
import com.infrapulse.modules.analytics.dto.VendorPerformanceDto;
import com.infrapulse.modules.analytics.dto.VendorRankingDto;
import com.infrapulse.modules.analytics.service.VendorPerformanceAnalyticsService;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.security.UserPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics/vendors")
public class VendorAnalyticsController {

    private final VendorPerformanceAnalyticsService analyticsService;

    public VendorAnalyticsController(VendorPerformanceAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    private User extractUser(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.getUser();
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<VendorPerformanceDto>>> getAllVendorsPerformance(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        // Vendors can only view their own analytics
        if (user.getRole() == UserRole.VENDOR) {
            VendorPerformanceDto dto = analyticsService.getVendorPerformance(user.getId(), projectId, null, null);
            return ResponseEntity.ok(ApiResponse.success(List.of(dto)));
        }

        List<VendorPerformanceDto> list = analyticsService.getAllVendorsPerformance(projectId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{vendorId}")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorPerformanceDto>> getVendorPerformance(
            @PathVariable String vendorId,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        if (user.getRole() == UserRole.VENDOR && !user.getId().equals(vendorId)) {
            throw new AccessDeniedException("Vendors are only permitted to access their own performance analytics");
        }

        VendorPerformanceDto dto = analyticsService.getVendorPerformance(vendorId, projectId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/{vendorId}/performance")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorPerformanceDto>> getVendorDeepPerformance(
            @PathVariable String vendorId,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        if (user.getRole() == UserRole.VENDOR && !user.getId().equals(vendorId)) {
            throw new AccessDeniedException("Vendors are only permitted to access their own performance analytics");
        }

        VendorPerformanceDto dto = analyticsService.getVendorPerformance(vendorId, projectId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/comparison")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorComparisonDto>> compareVendors(
            @RequestParam List<String> vendorIds,
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        if (user.getRole() == UserRole.VENDOR) {
            throw new AccessDeniedException("Vendors do not have authorization to view comparative multi-vendor benchmarks");
        }

        VendorComparisonDto comparison = analyticsService.compareVendors(vendorIds, projectId);
        return ResponseEntity.ok(ApiResponse.success(comparison));
    }

    @GetMapping("/rankings")
    @PreAuthorize("hasAnyAuthority('VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<VendorRankingDto>>> getVendorRankings(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        if (user.getRole() == UserRole.VENDOR) {
            throw new AccessDeniedException("Vendors do not have authorization to view full vendor rankings");
        }

        List<VendorRankingDto> rankings = analyticsService.getVendorRankings(projectId);
        return ResponseEntity.ok(ApiResponse.success(rankings));
    }
}
