package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.VerificationMethod;
import com.infrapulse.modules.workertrust.enums.VerificationStatus;

import java.time.Instant;

public record WorkerVerificationDto(
    String id,
    VerificationMethod verificationMethod,
    String verificationReference,
    VerificationStatus verificationStatus,
    String verifiedByName,
    Instant verifiedAt,
    String reviewNotes,
    Instant createdAt
) {}
