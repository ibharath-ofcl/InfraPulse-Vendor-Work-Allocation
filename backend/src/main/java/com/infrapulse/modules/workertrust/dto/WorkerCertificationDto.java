package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.CertificationStatus;
import com.infrapulse.modules.workertrust.enums.CertificationType;

import java.time.Instant;
import java.time.LocalDate;

public record WorkerCertificationDto(
    String id,
    CertificationType certificationType,
    String issuingAuthority,
    String certificateNumber,
    LocalDate issueDate,
    LocalDate expiryDate,
    CertificationStatus verificationStatus,
    String documentReference,
    boolean isExpired,
    Instant verifiedAt,
    String verifiedByName
) {}

