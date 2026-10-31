package com.infrapulse.modules.dashboard.dto;

import java.util.List;

public record DashboardSearchResponse(
    List<DashboardSearchItem> results,
    long total
) {}
