package com.infrapulse.modules.humanreview.dto;

public class InspectionDetectionDto {
    private String id;
    private String classId;
    private String classLabel;
    private Double confidence;
    private String boundingBoxJson;

    public InspectionDetectionDto() {}

    public InspectionDetectionDto(String id, String classId, String classLabel, Double confidence, String boundingBoxJson) {
        this.id = id;
        this.classId = classId;
        this.classLabel = classLabel;
        this.confidence = confidence;
        this.boundingBoxJson = boundingBoxJson;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getClassLabel() { return classLabel; }
    public void setClassLabel(String classLabel) { this.classLabel = classLabel; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getBoundingBoxJson() { return boundingBoxJson; }
    public void setBoundingBoxJson(String boundingBoxJson) { this.boundingBoxJson = boundingBoxJson; }
}
