package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.CertificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AddCertificationRequest(
    @NotNull(message = "Certification type is required")
    CertificationType certificationType,

    @NotBlank(message = "Issuing authority is required")
    String issuingAuthority,

    String certificateNumber,

    @NotNull(message = "Issue date is required")
    LocalDate issueDate,

    LocalDate expiryDate,

    String documentReference
) {}
