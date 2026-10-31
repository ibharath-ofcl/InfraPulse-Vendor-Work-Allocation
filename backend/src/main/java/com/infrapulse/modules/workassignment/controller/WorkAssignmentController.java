package com.infrapulse.modules.workassignment.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.workassignment.dto.CancelAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.CreateWorkAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.UpdateAssignmentStatusRequest;
import com.infrapulse.modules.workassignment.dto.UpdateWorkAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.WorkAssignmentResponse;
import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.service.WorkAssignmentService;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
public class WorkAssignmentController {

    private final WorkAssignmentService workAssignmentService;

    public WorkAssignmentController(WorkAssignmentService workAssignmentService) {
        this.workAssignmentService = workAssignmentService;
    }

    @PostMapping("/api/v1/work-assignments")
    @PreAuthorize("hasAnyAuthority('WORK_ASSIGNMENT_CREATE', 'ALLOCATE_WORK', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkAssignmentResponse>> createAssignment(
        @Valid @RequestBody CreateWorkAssignmentRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkAssignmentResponse response = workAssignmentService.createAssignment(request, principal != null ? principal.getUser() : null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Work assignment created successfully", response));
    }

    @GetMapping("/api/v1/work-assignments")
    @PreAuthorize("hasAnyAuthority('WORK_ASSIGNMENT_VIEW', 'VIEW_ASSIGNED_WORK')")
    public ResponseEntity<ApiResponse<Page<WorkAssignmentResponse>>> getAssignments(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) String workZoneId,
        @RequestParam(required = false) String pincode,
        @RequestParam(required = false) String vendorId,
        @RequestParam(required = false) WorkType workType,
        @RequestParam(required = false) AssignmentStatus status,
        @RequestParam(required = false) AssignmentPriority priority,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDateFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDateTo,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Page<WorkAssignmentResponse> page = workAssignmentService.getAssignments(
            projectId, workZoneId, pincode, vendorId, workType, status, priority, startDateFrom, startDateTo, search, pageable, principal != null ? principal.getUser() : null
        );
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/api/v1/work-assignments/{id}")
    @PreAuthorize("hasAnyAuthority('WORK_ASSIGNMENT_VIEW', 'VIEW_ASSIGNED_WORK')")
    public ResponseEntity<ApiResponse<WorkAssignmentResponse>> getAssignmentById(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkAssignmentResponse response = workAssignmentService.getAssignmentById(id, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/api/v1/work-assignments/{id}")
    @PreAuthorize("hasAnyAuthority('WORK_ASSIGNMENT_UPDATE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkAssignmentResponse>> updateAssignment(
        @PathVariable String id,
        @Valid @RequestBody UpdateWorkAssignmentRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkAssignmentResponse response = workAssignmentService.updateAssignment(id, request, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success("Work assignment updated successfully", response));
    }

    @PatchMapping("/api/v1/work-assignments/{id}/status")
    @PreAuthorize("hasAnyAuthority('WORK_ASSIGNMENT_UPDATE', 'WORK_ASSIGNMENT_ACCEPT', 'WORK_ASSIGNMENT_REJECT', 'WORK_ASSIGNMENT_START', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkAssignmentResponse>> updateAssignmentStatus(
        @PathVariable String id,
        @Valid @RequestBody UpdateAssignmentStatusRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkAssignmentResponse response = workAssignmentService.updateAssignmentStatus(id, request, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success("Assignment status updated successfully", response));
    }

    @PostMapping("/api/v1/work-assignments/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('WORK_ASSIGNMENT_CANCEL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkAssignmentResponse>> cancelAssignment(
        @PathVariable String id,
        @Valid @RequestBody CancelAssignmentRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkAssignmentResponse response = workAssignmentService.cancelAssignment(id, request, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success("Work assignment cancelled successfully", response));
    }

    @GetMapping("/api/v1/vendors/me/work-assignments")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<Page<WorkAssignmentResponse>>> getVendorMyAssignments(
        @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Page<WorkAssignmentResponse> page = workAssignmentService.getVendorAssignments(pageable, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success(page));
    }
}
