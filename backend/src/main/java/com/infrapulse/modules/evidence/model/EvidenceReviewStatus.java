package com.infrapulse.modules.evidence.model;

public enum EvidenceReviewStatus {
    NOT_REVIEWED("Not Reviewed", "Awaiting initial review"),
    PENDING_REVIEW("Pending Review", "Under active review by field engineer or inspector"),
    APPROVED("Approved", "Reviewed and accepted as compliant"),
    REJECTED("Rejected", "Reviewed and rejected with specified findings");

    private final String displayName;
    private final String description;

    EvidenceReviewStatus(String displayName, String description) {
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
