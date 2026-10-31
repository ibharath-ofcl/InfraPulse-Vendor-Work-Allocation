package com.infrapulse.modules.evidence.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.evidence.dto.*;
import com.infrapulse.modules.evidence.model.EvidenceCategory;
import com.infrapulse.modules.evidence.service.EvidenceService;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@RestController
public class EvidenceController {

    private final EvidenceService evidenceService;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    /**
     * Upload photographic evidence for a work assignment.
     */
    @PostMapping(value = "/api/v1/work-assignments/{assignmentId}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('SUBMIT_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<EvidenceDetailResponse>>> uploadEvidence(
            @PathVariable String assignmentId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("category") EvidenceCategory category,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "captureTimestamp", required = false) String captureTimestamp,
            @RequestParam(value = "latitude", required = false) BigDecimal latitude,
            @RequestParam(value = "longitude", required = false) BigDecimal longitude,
            @AuthenticationPrincipal UserPrincipal principal
    ) throws IOException {
        User user = principal != null ? principal.getUser() : null;
        EvidenceUploadRequest request = new EvidenceUploadRequest(category, description, captureTimestamp, latitude, longitude);
        List<EvidenceDetailResponse> uploaded = evidenceService.uploadEvidence(assignmentId, files, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Photographic evidence uploaded successfully", uploaded));
    }

    /**
     * List paginated evidence for a work assignment.
     */
    @GetMapping("/api/v1/work-assignments/{assignmentId}/evidence")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<EvidenceListResponse>> getAssignmentEvidence(
            @PathVariable String assignmentId,
            @RequestParam(required = false) EvidenceCategory category,
            @PageableDefault(size = 20, sort = "uploadedAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        EvidenceListResponse response = evidenceService.getAssignmentEvidence(assignmentId, category, pageable, user);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get details of a specific evidence record.
     */
    @GetMapping("/api/v1/evidence/{evidenceId}")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<EvidenceDetailResponse>> getEvidenceDetails(
            @PathVariable String evidenceId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        EvidenceDetailResponse response = evidenceService.getEvidenceById(evidenceId, user);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Authenticated download/stream of original image file.
     */
    @GetMapping("/api/v1/evidence/{evidenceId}/file")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<Resource> getEvidenceFile(
            @PathVariable String evidenceId,
            @AuthenticationPrincipal UserPrincipal principal
    ) throws IOException {
        User user = principal != null ? principal.getUser() : null;
        EvidenceDetailResponse details = evidenceService.getEvidenceById(evidenceId, user);
        Resource fileResource = evidenceService.getEvidenceFile(evidenceId, user);

        MediaType mediaType = MediaType.parseMediaType(details.getMimeType() != null ? details.getMimeType() : MediaType.IMAGE_JPEG_VALUE);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + details.getOriginalFileName() + "\"")
                .body(fileResource);
    }

    /**
     * Authenticated retrieval of preview thumbnail.
     */
    @GetMapping("/api/v1/evidence/{evidenceId}/preview")
    @PreAuthorize("hasAnyAuthority('VIEW_ASSIGNED_WORK', 'WORK_ASSIGNMENT_VIEW', 'SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<Resource> getEvidencePreview(
            @PathVariable String evidenceId,
            @AuthenticationPrincipal UserPrincipal principal
    ) throws IOException {
        User user = principal != null ? principal.getUser() : null;
        Resource previewResource = evidenceService.getEvidencePreview(evidenceId, user);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"preview_" + evidenceId + ".jpg\"")
                .body(previewResource);
    }

    /**
     * Verify cryptographic SHA-256 integrity of stored evidence against database record.
     */
    @GetMapping("/api/v1/evidence/{evidenceId}/integrity")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<EvidenceIntegrityResponse>> verifyEvidenceIntegrity(
            @PathVariable String evidenceId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        EvidenceIntegrityResponse response = evidenceService.verifyIntegrity(evidenceId, user);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Review evidence (approve or reject with notes).
     */
    @PostMapping("/api/v1/evidence/{evidenceId}/review")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<EvidenceDetailResponse>> reviewEvidence(
            @PathVariable String evidenceId,
            @Valid @RequestBody EvidenceReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        EvidenceDetailResponse response = evidenceService.reviewEvidence(evidenceId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Evidence review status updated successfully", response));
    }

    /**
     * Withdraw/delete evidence record.
     */
    @DeleteMapping("/api/v1/evidence/{evidenceId}")
    @PreAuthorize("hasAnyAuthority('SUBMIT_EVIDENCE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvidence(
            @PathVariable String evidenceId,
            @RequestParam(value = "reason", required = false, defaultValue = "Withdrawn by uploader") String reason,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        evidenceService.deleteEvidence(evidenceId, reason, user);
        return ResponseEntity.ok(ApiResponse.success("Evidence withdrawn successfully", null));
    }
}
