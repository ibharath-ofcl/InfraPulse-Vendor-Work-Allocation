package com.infrapulse.modules.ai.dto;

public class AiDetectionDto {
    private String id;
    private String classId;
    private String classLabel;
    private Double confidence;
    private BoundingBoxDto boundingBox;
    private String segmentationReference;

    public AiDetectionDto() {}

    public AiDetectionDto(String id, String classId, String classLabel, Double confidence, BoundingBoxDto boundingBox, String segmentationReference) {
        this.id = id;
        this.classId = classId;
        this.classLabel = classLabel;
        this.confidence = confidence;
        this.boundingBox = boundingBox;
        this.segmentationReference = segmentationReference;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getClassLabel() { return classLabel; }
    public void setClassLabel(String classLabel) { this.classLabel = classLabel; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public BoundingBoxDto getBoundingBox() { return boundingBox; }
    public void setBoundingBox(BoundingBoxDto boundingBox) { this.boundingBox = boundingBox; }

    public String getSegmentationReference() { return segmentationReference; }
    public void setSegmentationReference(String segmentationReference) { this.segmentationReference = segmentationReference; }
}
