package com.infrapulse.modules.workertrust.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record EmergencyHeadcountResponse(
    long totalCheckedIn,
    Map<String, Long> workersByProject,
    Map<String, Long> workersByWorkZone,
    Map<String, Long> workersByVendor,
    List<WorkerSiteAccessDto> activePersonnel,
    Instant generatedAt
) {}

