package com.infrapulse.modules.dashboard.dto;

import java.math.BigDecimal;

public record WorkZoneOverviewItem(
    String workZoneId,
    String zoneCode,
    String zoneName,
    String pincode,
    String locality,
    String district,
    String state,
    String projectId,
    String projectCode,
    String projectName,
    BigDecimal centerLatitude,
    BigDecimal centerLongitude,
    long totalAssignments,
    long activeWork,
    long blockedWork,
    long completedWork,
    String operationalStatus
) {}
