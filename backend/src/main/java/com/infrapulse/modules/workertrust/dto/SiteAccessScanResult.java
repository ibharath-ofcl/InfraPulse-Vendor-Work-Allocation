package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.SiteAccessStatus;
import com.infrapulse.modules.workertrust.enums.SiteBlockingReason;

import java.time.Instant;

public record SiteAccessScanResult(
    boolean allowed,
    SiteAccessStatus accessStatus,
    SiteBlockingReason blockingReason,
    String humanReadableReason,
    String siteAccessId,
    String workerId,
    String workerCode,
    String fullName,
    String jobRole,
    String vendorName,
    String projectId,
    String projectName,
    String workZoneId,
    String workZoneName,
    String photoReference,
    Instant timestamp
) {}

