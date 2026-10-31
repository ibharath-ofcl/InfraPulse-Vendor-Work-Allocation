package com.infrapulse.modules.workassignment.enums;

public enum ReleaseStatus {
    PENDING_RELEASE("Pending Prerequisite Release"),
    RELEASED("Released & Cleared"),
    REJECTED("Release Rejected");

    private final String displayName;

    ReleaseStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
