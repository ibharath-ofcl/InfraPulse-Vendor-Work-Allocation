package com.infrapulse.modules.evidence.model;

public enum DuplicateStatus {
    UNIQUE("Unique Evidence", "No duplicate or repeated photographic evidence detected"),
    DUPLICATE_SUSPECTED("Duplicate Suspected", "Perceptual image hash matches previously submitted evidence within threshold"),
    DUPLICATE_CONFIRMED("Duplicate Confirmed", "Exact cryptographic SHA-256 or identical perceptual hash match found"),
    STALE_CAPTURE_TIMESTAMP("Stale Capture Timestamp", "Significant suspicious delay between capture and upload timestamps");

    private final String displayName;
    private final String description;

    DuplicateStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}
