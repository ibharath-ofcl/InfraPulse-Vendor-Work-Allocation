package com.infrapulse.modules.intelligence.defect.dto;

import com.infrapulse.modules.intelligence.defect.model.DefectStatus;
import jakarta.validation.constraints.NotNull;

public record DefectStatusUpdateRequest(
    @NotNull(message = "New defect status is mandatory")
    DefectStatus newStatus,

    String reviewNotes,

    String actionTaken
) {}

