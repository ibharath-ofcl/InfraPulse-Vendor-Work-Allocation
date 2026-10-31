package com.infrapulse.modules.dashboard.dto;

import java.util.List;

public record DependencyMonitoringResponse(
    List<BlockedDependencyItem> blockedAssignments,
    List<ReadyDependencyItem> readyAssignments,
    long totalBlocked,
    long totalReady
) {}
