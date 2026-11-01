package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.WorkerStatus;

import java.time.Instant;
import java.time.LocalDate;

public record WorkerSummaryResponse(
    String id,
    String workerCode,
    String fullName,
    String mobileNumber,
    String email,
    LocalDate dateOfBirth,
    String jobRole,
    WorkerStatus currentStatus,
    String vendorId,
    String vendorName,
    String vendorCode,
    String activeProjectId,
    String activeProjectName,
    String activeWorkZoneId,
    String activeWorkZoneName,
    int activeCertificationsCount,
    int expiredCertificationsCount,
    boolean isCurrentlyOnSite,
    boolean isSuspended,
    Instant createdAt
) {}
