package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.VerificationMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RegisterWorkerRequest(
    @NotBlank(message = "Worker full name is required")
    String fullName,

    @NotBlank(message = "Mobile number is required")
    String mobileNumber,

    String email,

    LocalDate dateOfBirth,

    String jobRole,

    String skillsExperience,

    String emergencyContactName,

    String emergencyContactPhone,

    String vendorId,

    @NotNull(message = "Explicit privacy consent must be acknowledged")
    Boolean consentGranted,

    VerificationMethod verificationMethod,

    String verificationReference
) {}
