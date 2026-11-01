package com.infrapulse.modules.intelligence.contract.dto;

import com.infrapulse.modules.intelligence.contract.model.RequirementCategory;
import com.infrapulse.modules.intelligence.contract.model.VerificationMethod;
import jakarta.validation.constraints.NotBlank;

public record CreateRequirementRequest(
    @NotBlank(message = "Work package is mandatory")
    String workPackage,

    String workZoneId,

    @NotBlank(message = "Requirement title is mandatory")
    String title,

    @NotBlank(message = "Requirement description is mandatory")
    String description,

    RequirementCategory category,

    @NotBlank(message = "Acceptance criteria is mandatory")
    String acceptanceCriteria,

    String measurementUnit,
    String requiredValue,
    String permittedTolerance,
    Boolean mandatory,
    Boolean requiresHumanInspection,
    Boolean requiresPhysicalMeasurement,
    VerificationMethod verificationMethod
) {}
