package com.infrapulse.modules.evidence.model;

public enum DeviceIntegrityStatus {
    WEB_UNATTESTED("Web Capture (Unattested)", "Standard web browser environment; hardware cryptographic attestation not supported on web platforms"),
    SENSOR_RECORDED("Sensors Captured", "Device orientation and sensor metadata recorded from device sensors"),
    ATTESTATION_UNAVAILABLE_ON_WEB("Attestation Unavailable on Web", "Genuine hardware attestation requires native mobile integration (Google Play Integrity / Apple DeviceCheck)"),
    NATIVE_ATTESTED("Hardware Attested", "Cryptographic hardware-backed attestation token verified by backend");

    private final String displayName;
    private final String description;

    DeviceIntegrityStatus(String displayName, String description) {
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
