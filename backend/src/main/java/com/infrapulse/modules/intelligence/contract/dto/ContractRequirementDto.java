package com.infrapulse.modules.intelligence.contract.dto;

import com.infrapulse.modules.intelligence.contract.model.RequirementApprovalStatus;
import com.infrapulse.modules.intelligence.contract.model.RequirementCategory;
import com.infrapulse.modules.intelligence.contract.model.VerificationMethod;
import java.time.Instant;

public record ContractRequirementDto(
    String id,
    String requirementCode,
    String contractId,
    String contractCode,
    String projectId,
    String projectName,
    String workPackage,
    String workZoneId,
    String workZoneName,
    String title,
    String description,
    RequirementCategory category,
    String acceptanceCriteria,
    String measurementUnit,
    String requiredValue,
    String permittedTolerance,
    boolean mandatory,
    boolean requiresHumanInspection,
    boolean requiresPhysicalMeasurement,
    VerificationMethod verificationMethod,
    RequirementApprovalStatus approvalStatus,
    String approvedById,
    String approvedByName,
    Instant approvedAt,
    String approvalNotes,
    long linkedEvidenceCount,
    Instant createdAt
) {}
