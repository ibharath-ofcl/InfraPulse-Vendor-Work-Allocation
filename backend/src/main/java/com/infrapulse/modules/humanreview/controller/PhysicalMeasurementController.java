package com.infrapulse.modules.humanreview.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.humanreview.dto.PhysicalMeasurementDto;
import com.infrapulse.modules.humanreview.dto.RecordMeasurementRequest;
import com.infrapulse.modules.humanreview.dto.VerifyMeasurementRequest;
import com.infrapulse.modules.humanreview.service.PhysicalMeasurementService;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PhysicalMeasurementController {

    private final PhysicalMeasurementService physicalMeasurementService;

    public PhysicalMeasurementController(PhysicalMeasurementService physicalMeasurementService) {
        this.physicalMeasurementService = physicalMeasurementService;
    }

    /**
     * Record physical onsite measurement for an assessment.
     */
    @PostMapping("/api/v1/quality/assessments/{assessmentId}/measurements")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<PhysicalMeasurementDto>> recordMeasurement(
            @PathVariable String assessmentId,
            @Valid @RequestBody RecordMeasurementRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        PhysicalMeasurementDto dto = physicalMeasurementService.recordMeasurement(assessmentId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Physical measurement recorded successfully", dto));
    }

    /**
     * Get all physical measurements for an assessment.
     */
    @GetMapping("/api/v1/quality/assessments/{assessmentId}/measurements")
    @PreAuthorize("hasAnyAuthority('REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<PhysicalMeasurementDto>>> getMeasurements(
            @PathVariable String assessmentId
    ) {
        List<PhysicalMeasurementDto> list = physicalMeasurementService.getMeasurementsForAssessment(assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Physical measurements retrieved", list));
    }

    /**
     * Verify or update status of a physical measurement.
     */
    @RequestMapping(value = {"/api/v1/quality/measurements/{measurementId}/verify", "/api/v1/measurements/{measurementId}/verify"},
                    method = {RequestMethod.POST, RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasAnyAuthority('APPROVE_QUALITY_REVIEW', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<PhysicalMeasurementDto>> verifyMeasurement(
            @PathVariable String measurementId,
            @Valid @RequestBody VerifyMeasurementRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = principal != null ? principal.getUser() : null;
        PhysicalMeasurementDto dto = physicalMeasurementService.verifyMeasurement(measurementId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Measurement verification status updated", dto));
    }
}
