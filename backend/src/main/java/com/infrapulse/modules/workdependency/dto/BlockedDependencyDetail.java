package com.infrapulse.modules.workdependency.dto;

import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;

public record BlockedDependencyDetail(
    WorkType predecessorWorkType,
    String predecessorWorkTypeDisplayName,
    String assignmentCode,
    AssignmentStatus assignmentStatus,
    ReleaseStatus releaseStatus,
    String workZoneId,
    String workZoneName,
    String assignedVendorName,
    String reason,
    String requiredAction
) {}
