package com.infrapulse.modules.intelligence.risk.dto;

import com.infrapulse.modules.intelligence.risk.model.RiskAlertStatus;
import com.infrapulse.modules.intelligence.risk.model.RiskCategory;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import java.time.Instant;

public record ProjectRiskAlertDto(
    String id,
    String assessmentId,
    String projectId,
    String projectName,
    String workZoneId,
    String workZoneName,
    String vendorId,
    String vendorName,
    String workAssignmentId,
    String workAssignmentCode,
    RiskCategory riskCategory,
    RiskLevel riskLevel,
    String title,
    String problemStatement,
    String supportingEvidenceData,
    String rootCauseReason,
    String operationalImpact,
    String recommendedAction,
    String missingDataNotes,
    RiskAlertStatus alertStatus,
    String resolvedById,
    String resolvedByName,
    String resolutionNotes,
    Instant resolvedAt,
    Instant createdAt
) {}
