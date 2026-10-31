package com.infrapulse.modules.dashboard.dto;

import java.util.List;

public record WorkZoneOverviewResponse(
    List<WorkZoneOverviewItem> workZones,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
