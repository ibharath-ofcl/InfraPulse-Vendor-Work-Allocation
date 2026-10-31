package com.infrapulse.modules.evidence.model;

public enum EvidenceProcessingStatus {
    UPLOADED("Uploaded", "Evidence uploaded and staged"),
    VALIDATING("Validating", "Validating file content and metadata"),
    READY("Ready", "Validated and ready for downstream processing"),
    PROCESSING_FAILED("Processing Failed", "Validation, decoding, or metadata processing failed");

    private final String displayName;
    private final String description;

    EvidenceProcessingStatus(String displayName, String description) {
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
