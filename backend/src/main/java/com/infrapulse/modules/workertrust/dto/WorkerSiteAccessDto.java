package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.SiteAccessStatus;

import java.time.Instant;

public record WorkerSiteAccessDto(
    String id,
    String workerId,
    String workerCode,
    String workerName,
    String workerRole,
    String vendorName,
    String projectId,
    String projectCode,
    String projectName,
    String workZoneId,
    String workZoneName,
    Instant entryTime,
    Instant exitTime,
    SiteAccessStatus accessStatus,
    String blockingReason,
    String recordingOfficerName,
    boolean isCurrentlyOnSite
) {}
