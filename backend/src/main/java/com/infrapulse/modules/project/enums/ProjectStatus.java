package com.infrapulse.modules.project.enums;

import java.util.EnumSet;
import java.util.Set;

public enum ProjectStatus {
    PLANNED,
    ACTIVE,
    ON_HOLD,
    COMPLETED,
    CANCELLED;

    public boolean canTransitionTo(ProjectStatus next) {
        if (this == next) return true;
        return switch (this) {
            case PLANNED -> EnumSet.of(ACTIVE, ON_HOLD, CANCELLED).contains(next);
            case ACTIVE -> EnumSet.of(ON_HOLD, COMPLETED, CANCELLED).contains(next);
            case ON_HOLD -> EnumSet.of(ACTIVE, CANCELLED).contains(next);
            case COMPLETED, CANCELLED -> false; // Completed or Cancelled projects are terminal in ordinary workflow
        };
    }
}
