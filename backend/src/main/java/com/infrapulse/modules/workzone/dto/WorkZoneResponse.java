package com.infrapulse.modules.workzone.dto;

import com.infrapulse.modules.workzone.enums.ZoneStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record WorkZoneResponse(
    String id,
    String zoneCode,
    String projectId,
    String projectName,
    String zoneName,
    String description,
    String pincode,
    String locality,
    String district,
    String state,
    BigDecimal centerLatitude,
    BigDecimal centerLongitude,
    ZoneStatus status,
    long activeAssignmentsCount,
    Instant createdAt,
    Instant updatedAt
) {}
