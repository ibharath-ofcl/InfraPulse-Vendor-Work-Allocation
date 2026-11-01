package com.infrapulse.modules.intelligence.defect.dto;

import java.util.Map;

public record VendorDefectScorecardDto(
    String vendorId,
    String vendorName,
    long totalAssignments,
    long totalInspections,
    long firstPassApprovals,
    double firstPassApprovalRate,
    long totalDefectsReported,
    long confirmedDefects,
    long recurringDefectsCount,
    double recurringDefectRate,
    long resolvedDefects,
    double averageResolutionDays,
    Map<String, Long> defectsByCategory
) {}
