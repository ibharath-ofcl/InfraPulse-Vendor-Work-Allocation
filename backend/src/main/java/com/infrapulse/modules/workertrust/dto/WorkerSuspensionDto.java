package com.infrapulse.modules.workertrust.dto;

import com.infrapulse.modules.workertrust.enums.SuspensionStatus;

import java.time.Instant;
import java.time.LocalDate;

public record WorkerSuspensionDto(
    String id,
    String reason,
    String imposedByName,
    Instant startTime,
    LocalDate reviewDate,
    Instant endTime,
    SuspensionStatus suspensionStatus,
    String resolutionNotes,
    boolean isActive
) {}

