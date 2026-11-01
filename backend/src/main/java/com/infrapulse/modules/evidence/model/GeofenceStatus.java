package com.infrapulse.modules.evidence.model;

public enum GeofenceStatus {
    VERIFIED("Verified Within Zone", "Coordinates verified within authorized work-zone geofence tolerance"),
    OUT_OF_BOUNDS("Location Outside Zone", "Reported location is outside the authorized work-zone boundary"),
    ACCURACY_TOO_LOW("Poor GPS Accuracy", "Reported GPS accuracy radius exceeds acceptable engineering tolerance (>50m)"),
    UNVERIFIED_NO_GPS("Unverified (No GPS)", "No geographical coordinates were provided or GPS was unavailable");

    private final String displayName;
    private final String description;

    GeofenceStatus(String displayName, String description) {
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
