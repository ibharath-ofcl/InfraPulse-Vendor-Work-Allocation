package com.infrapulse.modules.intelligence.defect.dto;

import com.infrapulse.modules.intelligence.defect.model.DefectCategory;
import com.infrapulse.modules.intelligence.defect.model.DefectSeverity;
import com.infrapulse.modules.intelligence.defect.model.DefectStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record DefectDto(
    String id,
    String defectCode,
    String evidenceId,
    String evidenceCode,
    String evidenceThumbnailUrl,
    String assignmentId,
    String assignmentCode,
    String projectId,
    String projectName,
    String workZoneId,
    String workZoneName,
    String vendorId,
    String vendorName,
    DefectCategory category,
    DefectSeverity severity,
    DefectStatus status,
    BigDecimal confidence,
    String boundingBoxJson,
    String modelId,
    String modelVersion,
    String description,
    boolean recurring,
    String recurringClusterId,
    int recurrenceCount,
    Instant initialDetectedAt,
    Instant resolvedAt,
    String reviewedById,
    String reviewedByName,
    String reviewNotes,
    Instant createdAt
) {}

