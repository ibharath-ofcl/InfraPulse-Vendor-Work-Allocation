package com.infrapulse.modules.workdependency.dto;

import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;

import java.time.LocalDate;

public record SchedulingConflictDetail(
    String conflictType,
    String assignmentCode,
    WorkType workType,
    String workTypeDisplayName,
    AssignmentStatus assignmentStatus,
    String vendorName,
    LocalDate plannedStartDate,
    LocalDate targetEndDate,
    String reason
) {}
