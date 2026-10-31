package com.infrapulse.modules.dashboard.dto;

public record DashboardSummaryResponse(
    long totalProjects,
    long activeAssignments,
    long pendingAcceptance,
    long inProgress,
    long awaitingReview,
    long dependencyBlocked,
    long readyForNextStage,
    long completedAssignments,
    long totalAssignments
) {}
