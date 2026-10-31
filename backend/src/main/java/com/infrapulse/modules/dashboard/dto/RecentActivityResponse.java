package com.infrapulse.modules.dashboard.dto;

import java.util.List;

public record RecentActivityResponse(
    List<RecentActivityItem> events,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
