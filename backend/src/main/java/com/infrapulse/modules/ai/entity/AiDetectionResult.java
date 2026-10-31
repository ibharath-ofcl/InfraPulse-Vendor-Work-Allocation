package com.infrapulse.modules.ai.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_detections")
public class AiDetectionResult {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inference_id", nullable = false)
    private AiInferenceResult inference;

    @Column(name = "class_id", nullable = false, length = 64)
    private String classId;

    @Column(name = "class_label", nullable = false, length = 128)
    private String classLabel;

    @Column(name = "confidence", nullable = false)
    private Double confidence;

    @Column(name = "bounding_box_json", nullable = false, columnDefinition = "TEXT")
    private String boundingBoxJson;

    @Column(name = "segmentation_reference", length = 256)
    private String segmentationReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AiDetectionResult() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public AiInferenceResult getInference() { return inference; }
    public void setInference(AiInferenceResult inference) { this.inference = inference; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getClassLabel() { return classLabel; }
    public void setClassLabel(String classLabel) { this.classLabel = classLabel; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getBoundingBoxJson() { return boundingBoxJson; }
    public void setBoundingBoxJson(String boundingBoxJson) { this.boundingBoxJson = boundingBoxJson; }

    public String getSegmentationReference() { return segmentationReference; }
    public void setSegmentationReference(String segmentationReference) { this.segmentationReference = segmentationReference; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
