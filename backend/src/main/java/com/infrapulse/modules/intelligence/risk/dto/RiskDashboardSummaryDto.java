package com.infrapulse.modules.intelligence.risk.dto;

import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record RiskDashboardSummaryDto(
    String projectId,
    String projectName,
    RiskLevel overallRiskLevel,
    BigDecimal overallScore,
    long totalActiveAlerts,
    long criticalAlerts,
    long highAlerts,
    long mediumAlerts,
    long lowAlerts,
    Map<String, Long> alertsByCategory,
    List<ProjectRiskAlertDto> topAlerts
) {}

