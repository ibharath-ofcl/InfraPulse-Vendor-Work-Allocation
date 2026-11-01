package com.infrapulse.modules.intelligence.defect.dto;

import com.infrapulse.modules.intelligence.defect.model.DefectCategory;
import com.infrapulse.modules.intelligence.defect.model.DefectSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateDefectRequest(
    String evidenceId,
    String assignmentId,

    @NotBlank(message = "Project ID is mandatory")
    String projectId,

    String workZoneId,
    String vendorId,

    @NotNull(message = "Defect category is mandatory")
    DefectCategory category,

    DefectSeverity severity,
    BigDecimal confidence,
    String boundingBoxJson,
    String modelId,
    String modelVersion,

    @NotBlank(message = "Defect description is mandatory")
    String description
) {}
