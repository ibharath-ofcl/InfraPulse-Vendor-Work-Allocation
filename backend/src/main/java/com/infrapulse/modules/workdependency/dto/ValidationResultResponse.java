package com.infrapulse.modules.workdependency.dto;

import java.util.List;

public record ValidationResultResponse(
    boolean eligible,
    String code,
    String message,
    List<BlockedDependencyDetail> blockedDependencies,
    List<SchedulingConflictDetail> conflicts,
    boolean hasDuplicate,
    String duplicateAssignmentCode
) {
    public static ValidationResultResponse createEligible() {
        return new ValidationResultResponse(
            true,
            "ELIGIBLE",
            "Assignment request satisfies all prerequisite dependencies and operational scheduling constraints.",
            List.of(),
            List.of(),
            false,
            null
        );
    }
}

