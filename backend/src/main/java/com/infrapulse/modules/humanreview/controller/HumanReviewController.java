package com.infrapulse.modules.humanreview.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.humanreview.dto.*;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
import com.infrapulse.modules.humanreview.service.HumanReviewService;
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
public class HumanReviewController {

    private final HumanReviewService humanReviewService;

    public HumanReviewController(HumanReviewService humanReviewService) {
        this.humanReviewService = humanReviewService;
    }

    /**
     * Get review queue with filtering by status, priority, reviewer, project, and vendor.
     */
    @GetMapping("/api/v1/human-reviews")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<HumanReviewSummaryDto>>> getReviewQueue(
            @RequestParam(value = "status", required = false) ReviewStatus status,
            @RequestParam(value = "priority", required = false) ReviewPriority priority,
            @RequestParam(value = "reviewerId", required = false) String reviewerId,
            @RequestParam(value = "projectId", required = false) String projectId,
            @RequestParam(value = "vendorId", required = false) String vendorId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<HumanReviewSummaryDto> page = humanReviewService.getReviewQueue(status, priority, reviewerId, projectId, vendorId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Human review queue retrieved", page));
    }

    /**
     * Get full detail workspace for a review.
     */
    @GetMapping("/api/v1/human-reviews/{reviewId}")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<HumanReviewDetailDto>> getReviewDetail(
            @PathVariable String reviewId
    ) {
        HumanReviewDetailDto detail = humanReviewService.getReviewDetail(reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review detail retrieved", detail));
    }

    /**
     * Get or initialize review detail for a quality assessment.
     */
    @GetMapping({"/api/v1/quality/assessments/{assessmentId}/review", "/api/v1/quality/assessments/{assessmentId}/human-review", "/api/v1/human-reviews/assessment/{assessmentId}"})
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<HumanReviewDetailDto>> getReviewForAssessment(
            @PathVariable String assessmentId
    ) {
        HumanReviewDetailDto detail = humanReviewService.getOrCreateReviewForAssessment(assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Assessment review detail retrieved", detail));
    }

    /**
     * Post to create or get human review for assessment.
     */
    @PostMapping("/api/v1/quality/assessments/{assessmentId}/human-review")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<HumanReviewDetailDto>> createOrGetReviewForAssessment(
            @PathVariable String assessmentId
    ) {
        HumanReviewDetailDto detail = humanReviewService.getOrCreateReviewForAssessment(assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Assessment review detail retrieved", detail));
    }

    /**
     * Assign a reviewer to a review item.
     */
    @RequestMapping(value = "/api/v1/human-reviews/{reviewId}/assign", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyAuthority('APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<HumanReviewSummaryDto>> assignReviewer(
            @PathVariable String reviewId,
            @RequestParam(value = "reviewerId", required = false) String reviewerIdParam,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        String reviewerId = reviewerIdParam;
        if ((reviewerId == null || reviewerId.isBlank()) && body != null) {
            reviewerId = body.get("reviewerId");
        }
        HumanReviewSummaryDto updated = humanReviewService.assignReviewer(reviewId, reviewerId, user);
        return ResponseEntity.ok(ApiResponse.success("Reviewer assigned successfully", updated));
    }

    /**
     * Record authoritative human engineering decision.
     */
    @PostMapping("/api/v1/human-reviews/{reviewId}/decisions")
    @PreAuthorize("hasAnyAuthority('APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<DecisionResponseDto>> recordDecision(
            @PathVariable String reviewId,
            @Valid @RequestBody RecordDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        DecisionResponseDto decision = humanReviewService.recordDecision(reviewId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Human inspection decision recorded: " + decision.getDecisionType(), decision));
    }

    /**
     * Get decision history for a review.
     */
    @GetMapping({"/api/v1/human-reviews/{reviewId}/decisions", "/api/v1/human-reviews/{reviewId}/decision-history"})
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<DecisionResponseDto>>> getReviewDecisions(
            @PathVariable String reviewId
    ) {
        List<DecisionResponseDto> decisions = humanReviewService.getReviewDecisions(reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review decisions retrieved", decisions));
    }

    /**
     * Get decision history for an assessment.
     */
    @GetMapping({"/api/v1/quality/assessments/{assessmentId}/decisions", "/api/v1/quality/assessments/{assessmentId}/decision-history"})
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<DecisionResponseDto>>> getAssessmentDecisions(
            @PathVariable String assessmentId
    ) {
        List<DecisionResponseDto> decisions = humanReviewService.getAssessmentDecisions(assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Assessment decisions retrieved", decisions));
    }

    /**
     * Escalate an inspection review.
     */
    @PostMapping("/api/v1/human-reviews/{reviewId}/escalate")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<InspectionEscalationDto>> escalateReview(
            @PathVariable String reviewId,
            @Valid @RequestBody CreateEscalationRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        InspectionEscalationDto escalation = humanReviewService.escalateReview(reviewId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inspection escalated successfully", escalation));
    }
}
