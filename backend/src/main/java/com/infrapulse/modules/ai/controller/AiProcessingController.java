package com.infrapulse.modules.ai.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.ai.dto.AiInferenceResponse;
import com.infrapulse.modules.ai.dto.AiModelMetadataDto;
import com.infrapulse.modules.ai.service.AiProcessingService;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class AiProcessingController {

    private final AiProcessingService aiProcessingService;

    public AiProcessingController(AiProcessingService aiProcessingService) {
        this.aiProcessingService = aiProcessingService;
    }

    @PostMapping("/evidence/{evidenceId}/analyze")
    @PreAuthorize("hasAnyAuthority('SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<AiInferenceResponse>> analyzeEvidence(
            @PathVariable String evidenceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        AiInferenceResponse response = aiProcessingService.analyzeEvidence(evidenceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("AI computer vision analysis completed successfully", response));
    }

    @GetMapping("/evidence/{evidenceId}/analysis")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<AiInferenceResponse>>> getEvidenceInferences(
            @PathVariable String evidenceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        List<AiInferenceResponse> list = aiProcessingService.getEvidenceInferences(evidenceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/ai/inferences/{inferenceId}")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<AiInferenceResponse>> getInferenceById(
            @PathVariable String inferenceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        AiInferenceResponse response = aiProcessingService.getInferenceById(inferenceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/ai/models")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<AiModelMetadataDto>>> getAvailableModels() {
        List<AiModelMetadataDto> models = aiProcessingService.getAvailableModels();
        return ResponseEntity.ok(ApiResponse.success(models));
    }
}
