package com.infrapulse.modules.dashboard.dto;

public record ReadyDependencyItem(
    String assignmentId,
    String assignmentCode,
    String title,
    String workType,
    String workTypeDisplayName,
    String projectId,
    String projectCode,
    String projectName,
    String workZoneId,
    String workZoneName,
    String pincode,
    String assignedVendorName,
    String currentStatus,
    String releaseStatus,
    String action
) {}
