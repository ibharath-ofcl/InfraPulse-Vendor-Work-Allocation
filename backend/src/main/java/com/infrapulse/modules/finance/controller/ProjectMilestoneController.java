package com.infrapulse.modules.finance.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.finance.dto.*;
import com.infrapulse.modules.finance.service.MilestoneEligibilityService;
import com.infrapulse.modules.finance.service.ProjectMilestoneService;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/milestones")
public class ProjectMilestoneController {

    private final ProjectMilestoneService milestoneService;
    private final MilestoneEligibilityService eligibilityService;
    private final VendorRepository vendorRepository;

    public ProjectMilestoneController(
            ProjectMilestoneService milestoneService,
            MilestoneEligibilityService eligibilityService,
            VendorRepository vendorRepository) {
        this.milestoneService = milestoneService;
        this.eligibilityService = eligibilityService;
        this.vendorRepository = vendorRepository;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectMilestoneResponse>> createMilestone(
            @Valid @RequestBody CreateMilestoneRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        ProjectMilestoneResponse response = milestoneService.createMilestone(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project milestone created successfully", response));
    }

    @PutMapping("/{milestoneId}")
    @PreAuthorize("hasAuthority('MANAGE_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectMilestoneResponse>> updateMilestone(
            @PathVariable String milestoneId,
            @Valid @RequestBody UpdateMilestoneRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        ProjectMilestoneResponse response = milestoneService.updateMilestone(milestoneId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Project milestone updated successfully", response));
    }

    @GetMapping("/{milestoneId}")
    @PreAuthorize("hasAuthority('VIEW_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER') or hasRole('VENDOR') or hasRole('FINANCE_OFFICER')")
    public ResponseEntity<ApiResponse<ProjectMilestoneResponse>> getMilestoneById(
            @PathVariable String milestoneId) {
        ProjectMilestoneResponse response = milestoneService.getMilestoneById(milestoneId);
        return ResponseEntity.ok(ApiResponse.success("Milestone retrieved successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER') or hasRole('FINANCE_OFFICER')")
    public ResponseEntity<ApiResponse<Page<ProjectMilestoneResponse>>> listMilestones(
            @RequestParam(required = false) String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "sequenceNumber,asc") String sort) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Page<ProjectMilestoneResponse> response = projectId != null && !projectId.isBlank()
                ? milestoneService.getMilestones(pageable) // Or filter by project
                : milestoneService.getMilestones(pageable);

        return ResponseEntity.ok(ApiResponse.success("Milestones retrieved successfully", response));
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAuthority('VIEW_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER') or hasRole('FINANCE_OFFICER')")
    public ResponseEntity<ApiResponse<List<ProjectMilestoneResponse>>> getMilestonesByProject(
            @PathVariable String projectId) {
        List<ProjectMilestoneResponse> response = milestoneService.getMilestonesByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success("Project milestones retrieved successfully", response));
    }

    @GetMapping("/vendor/me")
    @PreAuthorize("hasRole('VENDOR') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<ProjectMilestoneResponse>>> getVendorMyMilestones(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.ok(ApiResponse.success("Empty", Collections.emptyList()));
        }
        User user = principal.getUser();
        if (user.getRole() == UserRole.VENDOR) {
            Vendor vendor = vendorRepository.findByUserId(user.getId()).orElse(null);
            if (vendor != null) {
                List<ProjectMilestoneResponse> list = milestoneService.getMilestonesByVendor(vendor.getId());
                return ResponseEntity.ok(ApiResponse.success("Vendor milestones retrieved successfully", list));
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Vendor milestones retrieved successfully", Collections.emptyList()));
    }

    @PostMapping("/{milestoneId}/assignments")
    @PreAuthorize("hasAuthority('MANAGE_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectMilestoneResponse>> associateAssignments(
            @PathVariable String milestoneId,
            @Valid @RequestBody AssociateMilestoneAssignmentsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        ProjectMilestoneResponse response = milestoneService.associateAssignments(milestoneId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Assignments associated with milestone successfully", response));
    }

    @DeleteMapping("/{milestoneId}/assignments/{assignmentId}")
    @PreAuthorize("hasAuthority('MANAGE_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectMilestoneResponse>> removeAssignment(
            @PathVariable String milestoneId,
            @PathVariable String assignmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        ProjectMilestoneResponse response = milestoneService.removeAssignment(milestoneId, assignmentId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Assignment removed from milestone successfully", response));
    }

    @GetMapping("/{milestoneId}/eligibility")
    @PreAuthorize("hasAuthority('VIEW_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER') or hasRole('VENDOR') or hasRole('FINANCE_OFFICER')")
    public ResponseEntity<ApiResponse<MilestoneEligibilityResponse>> getEligibility(
            @PathVariable String milestoneId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        MilestoneEligibilityResponse response = eligibilityService.evaluateMilestoneEligibility(milestoneId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Milestone eligibility evaluated successfully", response));
    }

    @PostMapping("/{milestoneId}/evaluate-eligibility")
    @PreAuthorize("hasAuthority('VIEW_MILESTONES') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER') or hasRole('VENDOR') or hasRole('FINANCE_OFFICER')")
    public ResponseEntity<ApiResponse<MilestoneEligibilityResponse>> evaluateEligibility(
            @PathVariable String milestoneId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        MilestoneEligibilityResponse response = eligibilityService.evaluateMilestoneEligibility(milestoneId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Milestone eligibility evaluation completed", response));
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        return Sort.by(direction, property);
    }
}
