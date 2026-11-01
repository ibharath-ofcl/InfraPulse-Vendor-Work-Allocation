package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.DocumentStatus;
import com.infrapulse.modules.workertrust.enums.DocumentType;

import java.time.Instant;

public record WorkerDocumentDto(
    String id,
    DocumentType documentType,
    String secureStorageReference,
    String originalFilename,
    String contentType,
    Long fileSize,
    DocumentStatus documentStatus,
    String reviewNotes,
    Instant uploadedAt,
    String uploadedByName
) {}

