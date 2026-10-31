package com.infrapulse.modules.humanreview.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.humanreview.dto.*;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.service.CorrectiveActionService;
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

import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;

import java.util.List;

@RestController
public class CorrectiveActionController {

    private final CorrectiveActionService correctiveActionService;
    private final VendorRepository vendorRepository;

    public CorrectiveActionController(CorrectiveActionService correctiveActionService, VendorRepository vendorRepository) {
        this.correctiveActionService = correctiveActionService;
        this.vendorRepository = vendorRepository;
    }

    /**
     * Get paginated corrective actions with optional filtering.
     */
    @GetMapping("/api/v1/corrective-actions")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<CorrectiveActionDto>>> getCorrectiveActions(
            @RequestParam(value = "vendorId", required = false) String vendorId,
            @RequestParam(value = "status", required = false) CorrectiveActionStatus status,
            @RequestParam(value = "priority", required = false) ReviewPriority priority,
            @RequestParam(value = "projectId", required = false) String projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<CorrectiveActionDto> page = correctiveActionService.getFilteredActions(vendorId, status, priority, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Corrective actions retrieved", page));
    }

    /**
     * Get corrective action by ID.
     */
    @GetMapping("/api/v1/corrective-actions/{actionId}")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'SUBMIT_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<CorrectiveActionDto>> getActionById(
            @PathVariable String actionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        CorrectiveActionDto dto = correctiveActionService.getActionById(actionId, user);
        return ResponseEntity.ok(ApiResponse.success("Corrective action details retrieved", dto));
    }

    /**
     * List corrective actions for an assessment.
     */
    @GetMapping("/api/v1/quality/assessments/{assessmentId}/corrective-actions")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<CorrectiveActionDto>>> getActionsForAssessment(
            @PathVariable String assessmentId
    ) {
        List<CorrectiveActionDto> list = correctiveActionService.getActionsForAssessment(assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Assessment corrective actions retrieved", list));
    }

    /**
     * Create a new corrective action for a quality assessment finding.
     */
    @PostMapping("/api/v1/quality/assessments/{assessmentId}/corrective-actions")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<CorrectiveActionDto>> createCorrectiveAction(
            @PathVariable String assessmentId,
            @Valid @RequestBody CreateCorrectiveActionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        CorrectiveActionDto dto = correctiveActionService.createCorrectiveAction(assessmentId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Corrective action opened successfully: " + dto.getActionCode(), dto));
    }

    /**
     * Submit rework completion proof evidence for a corrective action (Vendors & Field Engineers).
     */
    @PostMapping("/api/v1/corrective-actions/{actionId}/submit")
    @PreAuthorize("hasAnyAuthority('SUBMIT_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<CorrectiveActionDto>> submitReworkEvidence(
            @PathVariable String actionId,
            @Valid @RequestBody SubmitCorrectiveEvidenceRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        CorrectiveActionDto dto = correctiveActionService.submitReworkEvidence(actionId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Rework evidence submitted for verification", dto));
    }

    /**
     * Verify and sign-off on a corrective action (Inspectors only - Vendors cannot approve).
     */
    @PostMapping("/api/v1/corrective-actions/{actionId}/verify")
    @PreAuthorize("hasAnyAuthority('APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<CorrectiveActionDto>> verifyCorrectiveAction(
            @PathVariable String actionId,
            @Valid @RequestBody VerifyCorrectiveActionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        CorrectiveActionDto dto = correctiveActionService.verifyCorrectiveAction(actionId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Corrective action verification updated: " + dto.getStatus(), dto));
    }

    /**
     * Get corrective actions assigned to currently authenticated vendor.
     */
    @GetMapping("/api/v1/vendors/me/corrective-actions")
    @PreAuthorize("hasAnyAuthority('SUBMIT_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<CorrectiveActionDto>>> getMyVendorCorrectiveActions(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        Vendor ownVendor = vendorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Authenticated user is not linked to any vendor profile"));

        List<CorrectiveActionDto> list = correctiveActionService.getVendorActions(ownVendor.getId());
        return ResponseEntity.ok(ApiResponse.success("Vendor corrective actions retrieved", list));
    }
}
