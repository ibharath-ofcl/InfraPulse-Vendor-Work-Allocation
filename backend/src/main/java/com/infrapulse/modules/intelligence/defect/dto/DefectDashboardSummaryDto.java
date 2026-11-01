package com.infrapulse.modules.intelligence.defect.dto;

import java.util.Map;

public record DefectDashboardSummaryDto(
    String projectId,
    String projectName,
    long totalDefects,
    long openDefects,
    long confirmedDefects,
    long recurringDefects,
    long resolvedDefects,
    long correctiveActionsPending,
    double recurringPercentage,
    Map<String, Long> defectsByCategory,
    Map<String, Long> defectsBySeverity,
    Map<String, Long> defectsByZone
) {}
