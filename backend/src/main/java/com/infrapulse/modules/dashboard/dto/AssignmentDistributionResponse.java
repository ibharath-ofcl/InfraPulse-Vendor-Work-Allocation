package com.infrapulse.modules.dashboard.dto;

import java.util.List;

public record AssignmentDistributionResponse(
    List<AssignmentDistributionItem> distribution,
    long total
) {}
