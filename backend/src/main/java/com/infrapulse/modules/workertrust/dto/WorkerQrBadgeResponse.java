package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.CredentialStatus;

import java.time.Instant;

public record WorkerQrBadgeResponse(
    String credentialId,
    String workerId,
    String workerCode,
    String fullName,
    String jobRole,
    String photoReference,
    String vendorName,
    String vendorCode,
    String activeProjectName,
    String activeWorkZoneName,
    String tokenHash,
    String opaqueToken,
    CredentialStatus credentialStatus,
    Instant issuedAt,
    Instant expiresAt,
    boolean isValid
) {}

