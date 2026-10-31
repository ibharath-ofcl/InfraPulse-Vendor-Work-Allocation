package com.infrapulse.modules.dashboard.dto;

public record BlockedDependencyItem(
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
    String requiredPredecessorWorkType,
    String requiredPredecessorWorkTypeDisplayName,
    String predecessorAssignmentCode,
    String predecessorVendorName,
    String predecessorStatus,
    String releaseStatus,
    String blockingReason,
    String requiredAction
) {}
