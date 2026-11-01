package com.infrapulse.modules.evidence.model;

public enum EvidenceCategory {
    BEFORE_WORK("Before Work", "Site condition before work begins"),
    WORK_IN_PROGRESS("Work in Progress", "Evidence captured during execution"),
    AFTER_WORK("After Work", "Evidence captured after work completion"),
    COMPLETION("Completion", "Final handover and completion photographic evidence"),
    CORRECTIVE_ACTION("Corrective Action", "Photographic proof of resolved defect or corrective action rework"),
    MATERIAL_EVIDENCE("Material Evidence", "Materials used in the infrastructure activity"),
    SITE_CONDITION("Site Condition", "General work-zone condition"),
    COMPLETION_EVIDENCE("Completion Evidence", "Supporting evidence submitted with completion"),
    SUPPORTING_DOCUMENT("Supporting Document", "Relevant supporting documentation");

    private final String displayName;
    private final String description;

    EvidenceCategory(String displayName, String description) {
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
