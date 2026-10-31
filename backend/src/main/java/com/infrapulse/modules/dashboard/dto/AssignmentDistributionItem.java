package com.infrapulse.modules.dashboard.dto;

public record AssignmentDistributionItem(
    String status,
    String statusDisplayName,
    long count,
    double percentage
) {}
