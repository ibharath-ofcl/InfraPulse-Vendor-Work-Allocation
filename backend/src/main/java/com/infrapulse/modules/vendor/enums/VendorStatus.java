package com.infrapulse.modules.vendor.enums;

import java.util.EnumSet;

public enum VendorStatus {
    PENDING_VERIFICATION,
    ACTIVE,
    INACTIVE,
    SUSPENDED;

    public boolean canTransitionTo(VendorStatus next) {
        if (this == next) return true;
        return switch (this) {
            case PENDING_VERIFICATION -> EnumSet.of(ACTIVE, INACTIVE).contains(next);
            case ACTIVE -> EnumSet.of(INACTIVE, SUSPENDED).contains(next);
            case INACTIVE -> EnumSet.of(ACTIVE, SUSPENDED).contains(next);
            case SUSPENDED -> EnumSet.of(ACTIVE, INACTIVE).contains(next);
        };
    }
}
