package com.infrapulse.modules.workassignment.enums;

import java.util.EnumSet;
import java.util.Set;

public enum AssignmentStatus {
    DRAFT,
    ASSIGNED,
    ACCEPTED,
    IN_PROGRESS,
    SUBMITTED_FOR_REVIEW,
    COMPLETED,
    REJECTED,
    CANCELLED;

    public boolean canTransitionTo(AssignmentStatus next) {
        if (this == next) return true;
        return switch (this) {
            case DRAFT -> next == ASSIGNED || next == CANCELLED;
            case ASSIGNED -> next == ACCEPTED || next == REJECTED || next == CANCELLED;
            case ACCEPTED -> next == IN_PROGRESS || next == CANCELLED;
            case IN_PROGRESS -> next == SUBMITTED_FOR_REVIEW || next == CANCELLED;
            case SUBMITTED_FOR_REVIEW -> next == COMPLETED || next == REJECTED || next == CANCELLED;
            case REJECTED -> next == ASSIGNED || next == CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    public Set<AssignmentStatus> getAllowedTransitions() {
        return switch (this) {
            case DRAFT -> EnumSet.of(ASSIGNED, CANCELLED);
            case ASSIGNED -> EnumSet.of(ACCEPTED, REJECTED, CANCELLED);
            case ACCEPTED -> EnumSet.of(IN_PROGRESS, CANCELLED);
            case IN_PROGRESS -> EnumSet.of(SUBMITTED_FOR_REVIEW, CANCELLED);
            case SUBMITTED_FOR_REVIEW -> EnumSet.of(COMPLETED, REJECTED, CANCELLED);
            case REJECTED -> EnumSet.of(ASSIGNED, CANCELLED);
            case COMPLETED, CANCELLED -> EnumSet.noneOf(AssignmentStatus.class);
        };
    }
}
