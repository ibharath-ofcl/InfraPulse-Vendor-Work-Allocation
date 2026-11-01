package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.WorkerStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record WorkerDetailResponse(
    String id,
    String workerCode,
    String fullName,
    String photoReference,
    String mobileNumber,
    String email,
    LocalDate dateOfBirth,
    String jobRole,
    String skillsExperience,
    String emergencyContactName,
    String emergencyContactPhone,
    WorkerStatus currentStatus,
    String vendorId,
    String vendorName,
    String vendorCode,
    String activeProjectId,
    String activeProjectName,
    String activeWorkZoneId,
    String activeWorkZoneName,
    boolean isCurrentlyOnSite,
    boolean isSuspended,
    List<WorkerDocumentDto> documents,
    List<WorkerVerificationDto> verifications,
    List<WorkerCertificationDto> certifications,
    List<WorkerAssignmentDto> assignments,
    List<WorkerSiteAccessDto> recentSiteAccess,
    List<WorkerIncidentDto> incidents,
    List<WorkerSuspensionDto> suspensions,
    WorkerQrBadgeResponse qrBadge,
    Instant createdAt,
    Instant updatedAt
) {}
