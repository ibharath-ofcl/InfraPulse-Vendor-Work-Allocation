package com.infrapulse.modules.intelligence.contract.dto;

import com.infrapulse.modules.intelligence.contract.model.RequirementEvidenceStatus;
import java.time.Instant;

public record RequirementEvidenceDto(
    String id,
    String requirementId,
    String requirementCode,
    String requirementTitle,
    String evidenceId,
    String evidenceCode,
    String evidenceThumbnailUrl,
    String assignmentId,
    String assignmentCode,
    RequirementEvidenceStatus status,
    String measuredValue,
    String measurementUnit,
    String physicalMeasurementTool,
    String measurementNotes,
    String measuredById,
    String measuredByName,
    Instant measuredAt,
    String waiverReason,
    String waivedById,
    String waivedByName,
    Instant verifiedAt,
    Instant createdAt
) {}
