package com.infrapulse.modules.intelligence.orchestration.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.intelligence.orchestration.dto.IntelligenceOverviewDto;
import com.infrapulse.modules.intelligence.orchestration.service.IntelligenceOrchestrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/intelligence")
public class IntelligenceSuiteController {

    private final IntelligenceOrchestrationService orchestrationService;

    public IntelligenceSuiteController(IntelligenceOrchestrationService orchestrationService) {
        this.orchestrationService = orchestrationService;
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('INTELLIGENCE_VIEW')")
    public ResponseEntity<ApiResponse<IntelligenceOverviewDto>> getProjectIntelligenceOverview(
            @RequestParam String projectId
    ) {
        IntelligenceOverviewDto res = orchestrationService.getProjectIntelligenceOverview(projectId);
        return ResponseEntity.ok(ApiResponse.success("Project intelligence overview retrieved", res));
    }
}
