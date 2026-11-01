package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.IncidentSeverity;
import com.infrapulse.modules.workertrust.enums.IncidentStatus;
import com.infrapulse.modules.workertrust.enums.IncidentType;

import java.time.Instant;

public record WorkerIncidentDto(
    String id,
    String incidentReference,
    String projectId,
    String projectCode,
    String projectName,
    String workZoneId,
    String workZoneName,
    String workerId,
    String workerCode,
    String workerName,
    IncidentType incidentType,
    IncidentSeverity severity,
    String description,
    String immediateActionTaken,
    IncidentStatus incidentStatus,
    String reportedByName,
    String assignedInvestigatorName,
    String resolution,
    Instant reportedAt,
    Instant resolvedAt
) {}

