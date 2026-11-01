package com.infrapulse.modules.intelligence.orchestration.dto;

import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public record IntelligenceOverviewDto(
    String projectId,
    String projectName,
    // Contract Intelligence
    long totalContracts,
    long totalRequirements,
    long approvedRequirements,
    long verifiedEvidenceCount,
    long waivedRequirements,
    double contractCompliancePercentage,
    // Defect Intelligence
    long totalDefects,
    long openDefects,
    long recurringDefects,
    double defectRecurrencePercentage,
    long resolvedDefects,
    Map<String, Long> defectsByCategory,
    // Predictive Risk Intelligence
    RiskLevel overallRiskLevel,
    BigDecimal overallRiskScore,
    long activeRiskAlerts,
    long criticalRiskAlerts,
    Instant lastEvaluatedAt
) {}
