package com.infrapulse.modules.dashboard.dto;

import java.time.Instant;

public record RecentActivityItem(
    String id,
    String eventType,
    String eventTitle,
    String entityType,
    String entityId,
    String summary,
    String reason,
    String actorId,
    String actorName,
    String actorRole,
    String projectReference,
    String workZoneReference,
    String assignmentCode,
    Instant timestamp
) {}
