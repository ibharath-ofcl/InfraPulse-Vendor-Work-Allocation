package com.infrapulse.modules.workassignment.enums;

public enum WorkType {
    TRENCHING("Trenching", "Excavation and trench preparation"),
    UNDERGROUND_CABLE_INSTALLATION("Underground Cable Installation", "Cable laying and installation"),
    BACKFILLING("Backfilling", "Filling and restoration of excavated trenches"),
    ROAD_RESURFACING("Road Resurfacing", "Road surface restoration"),
    FINAL_INSPECTION("Final Inspection", "Final infrastructure verification");

    private final String displayName;
    private final String description;

    WorkType(String displayName, String description) {
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
