package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.AssignmentStatus;

import java.time.Instant;
import java.time.LocalDate;

public record WorkerAssignmentDto(
    String id,
    String projectId,
    String projectCode,
    String projectName,
    String workZoneId,
    String workZoneCode,
    String workZoneName,
    String vendorId,
    String vendorName,
    LocalDate startDate,
    LocalDate endDate,
    AssignmentStatus assignmentStatus,
    String requiredRole,
    String assignedByName,
    Instant createdAt
) {}
