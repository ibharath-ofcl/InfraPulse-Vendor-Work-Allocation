package com.infrapulse.modules.dashboard.dto;

public record DashboardSearchItem(
    String id,
    String type,
    String code,
    String title,
    String subtitle,
    String status,
    String link
) {}
