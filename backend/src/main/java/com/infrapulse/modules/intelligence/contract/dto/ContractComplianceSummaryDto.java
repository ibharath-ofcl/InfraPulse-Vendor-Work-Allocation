package com.infrapulse.modules.intelligence.contract.dto;

import java.util.Map;

public record ContractComplianceSummaryDto(
    String projectId,
    String projectName,
    long totalContracts,
    long totalRequirements,
    long approvedRequirements,
    long draftRequirements,
    long verifiedEvidenceRequirements,
    long pendingEvidenceRequirements,
    long nonCompliantRequirements,
    long physicalMeasurementRequiredCount,
    double overallCompliancePercentage,
    Map<String, Long> requirementsByCategory,
    Map<String, Long> statusBreakdown
) {}

