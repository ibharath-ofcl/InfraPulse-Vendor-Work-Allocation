package com.infrapulse.modules.intelligence.defect.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.security.UserPrincipal;
import com.infrapulse.modules.intelligence.defect.dto.*;
import com.infrapulse.modules.intelligence.defect.model.DefectCategory;
import com.infrapulse.modules.intelligence.defect.model.DefectStatus;
import com.infrapulse.modules.intelligence.defect.service.DefectIntelligenceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/intelligence/defects")
public class DefectIntelligenceController {

    private final DefectIntelligenceService defectService;

    public DefectIntelligenceController(DefectIntelligenceService defectService) {
        this.defectService = defectService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER') or hasAuthority('DEFECT_MANAGE')")
    public ResponseEntity<ApiResponse<DefectDto>> createDefect(
            @Valid @RequestBody CreateDefectRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DefectDto res = defectService.createDefect(req, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Defect recorded successfully", res));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('DEFECT_VIEW')")
    public ResponseEntity<ApiResponse<Page<DefectDto>>> searchDefects(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String vendorId,
            @RequestParam(required = false) DefectCategory category,
            @RequestParam(required = false) DefectStatus status,
            @RequestParam(required = false) Boolean recurring,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<DefectDto> res = defectService.searchDefects(projectId, vendorId, category, status, recurring, pageable);
        return ResponseEntity.ok(ApiResponse.success("Defects retrieved", res));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('DEFECT_VIEW')")
    public ResponseEntity<ApiResponse<DefectDto>> getDefectById(@PathVariable String id) {
        DefectDto res = defectService.getDefectById(id);
        return ResponseEntity.ok(ApiResponse.success("Defect details retrieved", res));
    }

    @GetMapping("/{id}/recurrence-candidates")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('DEFECT_VIEW')")
    public ResponseEntity<ApiResponse<List<DefectRecurrenceCandidateDto>>> getRecurrenceCandidates(@PathVariable String id) {
        List<DefectRecurrenceCandidateDto> res = defectService.getRecurrenceCandidates(id);
        return ResponseEntity.ok(ApiResponse.success("Recurrence similarity candidates retrieved", res));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER', 'VENDOR') or hasAuthority('DEFECT_MANAGE')")
    public ResponseEntity<ApiResponse<DefectDto>> updateDefectStatus(
            @PathVariable String id,
            @Valid @RequestBody DefectStatusUpdateRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DefectDto res = defectService.updateDefectStatus(id, req, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Defect status updated successfully", res));
    }

    @PostMapping("/recurrence/{candidateId}/confirm")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER') or hasAuthority('DEFECT_MANAGE')")
    public ResponseEntity<ApiResponse<Void>> confirmRecurrence(
            @PathVariable String candidateId,
            @RequestParam(defaultValue = "true") boolean confirmed,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        defectService.confirmRecurrence(candidateId, confirmed, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success(confirmed ? "Recurrence confirmed" : "Recurrence rejected", null));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('DEFECT_VIEW')")
    public ResponseEntity<ApiResponse<DefectDashboardSummaryDto>> getDefectDashboardSummary(
            @RequestParam String projectId
    ) {
        DefectDashboardSummaryDto res = defectService.getDefectDashboardSummary(projectId);
        return ResponseEntity.ok(ApiResponse.success("Defect dashboard summary retrieved", res));
    }

    @GetMapping("/vendor-scorecard/{vendorId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('DEFECT_VIEW')")
    public ResponseEntity<ApiResponse<VendorDefectScorecardDto>> getVendorDefectScorecard(
            @PathVariable String vendorId
    ) {
        VendorDefectScorecardDto res = defectService.getVendorDefectScorecard(vendorId);
        return ResponseEntity.ok(ApiResponse.success("Vendor defect scorecard retrieved", res));
    }
}
