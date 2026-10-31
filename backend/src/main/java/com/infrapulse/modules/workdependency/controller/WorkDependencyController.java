package com.infrapulse.modules.workdependency.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workdependency.dto.CreateDependencyRequest;
import com.infrapulse.modules.workdependency.dto.UpdateDependencyRequest;
import com.infrapulse.modules.workdependency.dto.WorkTypeDependencyResponse;
import com.infrapulse.modules.workdependency.service.WorkDependencyService;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/work-dependencies")
public class WorkDependencyController {

    private final WorkDependencyService dependencyService;

    public WorkDependencyController(WorkDependencyService dependencyService) {
        this.dependencyService = dependencyService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('DEPENDENCY_VIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<WorkTypeDependencyResponse>>> getAllRules(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) Boolean isActive,
        @PageableDefault(size = 20, sort = "priority", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<WorkTypeDependencyResponse> rules = dependencyService.getAllRules(projectId, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @GetMapping("/work-type/{workType}")
    @PreAuthorize("hasAnyAuthority('DEPENDENCY_VIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<WorkTypeDependencyResponse>>> getApplicableRules(
        @PathVariable WorkType workType,
        @RequestParam(required = false) String projectId
    ) {
        List<WorkTypeDependencyResponse> rules = dependencyService.getApplicableRules(projectId, workType);
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('DEPENDENCY_VIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkTypeDependencyResponse>> getRuleById(@PathVariable String id) {
        WorkTypeDependencyResponse rule = dependencyService.getRuleById(id);
        return ResponseEntity.ok(ApiResponse.success(rule));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('DEPENDENCY_MANAGE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkTypeDependencyResponse>> createRule(
        @Valid @RequestBody CreateDependencyRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkTypeDependencyResponse rule = dependencyService.createRule(request, principal != null ? principal.getUser() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Dependency rule created successfully", rule));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('DEPENDENCY_MANAGE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkTypeDependencyResponse>> updateRule(
        @PathVariable String id,
        @Valid @RequestBody UpdateDependencyRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkTypeDependencyResponse rule = dependencyService.updateRule(id, request, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success("Dependency rule updated successfully", rule));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('DEPENDENCY_MANAGE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkTypeDependencyResponse>> toggleStatus(
        @PathVariable String id,
        @RequestBody Map<String, Boolean> body,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean active = body.getOrDefault("isActive", true);
        WorkTypeDependencyResponse rule = dependencyService.toggleRuleStatus(id, active, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success("Dependency rule status updated successfully", rule));
    }
}
