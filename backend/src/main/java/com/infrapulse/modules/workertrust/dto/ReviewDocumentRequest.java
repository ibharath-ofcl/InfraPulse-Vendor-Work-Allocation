package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.DocumentStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewDocumentRequest(
    @NotNull(message = "Document status is required")
    DocumentStatus documentStatus,

    String reviewNotes
) {}
