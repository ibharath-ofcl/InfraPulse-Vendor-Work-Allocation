package com.infrapulse.modules.intelligence.risk.dto;

import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import java.math.BigDecimal;
import java.time.Instant;

public record ProjectRiskAssessmentDto(
    String id,
    String assessmentCode,
    String projectId,
    String projectName,
    String workZoneId,
    String workZoneName,
    RiskLevel overallRiskLevel,
    RiskLevel scheduleRiskLevel,
    RiskLevel vendorRiskLevel,
    RiskLevel qualityRiskLevel,
    RiskLevel resourceRiskLevel,
    RiskLevel dependencyRiskLevel,
    BigDecimal overallScore,
    String calculationMethod,
    Instant evaluatedAt,
    long activeAlertsCount
) {}
