package com.infrapulse.modules.quality.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.quality.dto.QualityAssessmentResponse;
import com.infrapulse.modules.quality.dto.QualityTemplateDto;
import com.infrapulse.modules.quality.service.QualityInspectionService;
import com.infrapulse.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class QualityInspectionController {

    private final QualityInspectionService qualityInspectionService;

    public QualityInspectionController(QualityInspectionService qualityInspectionService) {
        this.qualityInspectionService = qualityInspectionService;
    }

    @PostMapping("/work-assignments/{assignmentId}/quality-assessments")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> triggerAssessment(
            @PathVariable String assignmentId,
            @RequestParam(value = "predecessorAssessmentId", required = false) String predecessorAssessmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        QualityAssessmentResponse response = qualityInspectionService.assessAssignmentQuality(
                assignmentId, predecessorAssessmentId, currentUser
        );
        return ResponseEntity.ok(ApiResponse.success("Quality inspection assessment generated successfully", response));
    }

    @GetMapping("/work-assignments/{assignmentId}/quality-assessments")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<QualityAssessmentResponse>>> getAssignmentAssessments(
            @PathVariable String assignmentId) {
        List<QualityAssessmentResponse> list = qualityInspectionService.getAssignmentAssessments(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/quality/assessments/{assessmentId}")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> getAssessmentById(
            @PathVariable String assessmentId) {
        QualityAssessmentResponse response = qualityInspectionService.getAssessmentById(assessmentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/quality/templates")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<QualityTemplateDto>>> getAllTemplates() {
        List<QualityTemplateDto> templates = qualityInspectionService.getAllTemplates();
        return ResponseEntity.ok(ApiResponse.success(templates));
    }
}
