package com.infrapulse.modules.intelligence.risk.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.security.UserPrincipal;
import com.infrapulse.modules.intelligence.risk.dto.*;
import com.infrapulse.modules.intelligence.risk.model.RiskAlertStatus;
import com.infrapulse.modules.intelligence.risk.model.RiskCategory;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import com.infrapulse.modules.intelligence.risk.service.PredictiveRiskService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/intelligence/risk")
public class PredictiveRiskController {

    private final PredictiveRiskService riskService;

    public PredictiveRiskController(PredictiveRiskService riskService) {
        this.riskService = riskService;
    }

    @PostMapping("/evaluate")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('RISK_MANAGE')")
    public ResponseEntity<ApiResponse<ProjectRiskAssessmentDto>> evaluateProjectRisk(
            @RequestParam String projectId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectRiskAssessmentDto res = riskService.evaluateProjectRisk(projectId, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Project risk evaluated successfully", res));
    }

    @GetMapping("/assessments/latest")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('RISK_VIEW')")
    public ResponseEntity<ApiResponse<ProjectRiskAssessmentDto>> getLatestAssessment(
            @RequestParam String projectId
    ) {
        return riskService.getLatestAssessment(projectId)
                .map(res -> ResponseEntity.ok(ApiResponse.success("Latest project risk assessment retrieved", res)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("No risk assessment recorded yet", null)));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('RISK_VIEW')")
    public ResponseEntity<ApiResponse<Page<ProjectRiskAlertDto>>> searchAlerts(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) RiskCategory category,
            @RequestParam(required = false) RiskLevel level,
            @RequestParam(required = false) RiskAlertStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ProjectRiskAlertDto> res = riskService.searchAlerts(projectId, category, level, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Risk alerts retrieved", res));
    }

    @GetMapping("/alerts/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('RISK_VIEW')")
    public ResponseEntity<ApiResponse<ProjectRiskAlertDto>> getAlertById(@PathVariable String id) {
        ProjectRiskAlertDto res = riskService.getAlertById(id);
        return ResponseEntity.ok(ApiResponse.success("Risk alert details retrieved", res));
    }

    @PatchMapping("/alerts/{id}/status")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('RISK_MANAGE')")
    public ResponseEntity<ApiResponse<ProjectRiskAlertDto>> updateAlertStatus(
            @PathVariable String id,
            @Valid @RequestBody RiskResolutionRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectRiskAlertDto res = riskService.updateAlertStatus(id, req, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Risk alert status updated successfully", res));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('RISK_VIEW')")
    public ResponseEntity<ApiResponse<RiskDashboardSummaryDto>> getRiskDashboardSummary(
            @RequestParam String projectId
    ) {
        RiskDashboardSummaryDto res = riskService.getRiskDashboardSummary(projectId);
        return ResponseEntity.ok(ApiResponse.success("Risk dashboard summary retrieved", res));
    }
}
