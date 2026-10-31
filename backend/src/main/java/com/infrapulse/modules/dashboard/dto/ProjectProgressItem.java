package com.infrapulse.modules.dashboard.dto;

public record ProjectProgressItem(
    String projectId,
    String projectCode,
    String projectName,
    String location,
    String projectManagerName,
    long totalAssignments,
    long completedAssignments,
    long inProgressAssignments,
    long blockedAssignments,
    double completionPercentage,
    String projectStatus
) {}
