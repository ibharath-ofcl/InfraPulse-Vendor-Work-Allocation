package com.infrapulse.modules.ai.entity;

import com.infrapulse.modules.ai.model.AiProcessingStatus;
import com.infrapulse.modules.ai.model.InferenceType;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ai_inferences")
public class AiInferenceResult {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "inference_code", nullable = false, unique = true, length = 64)
    private String inferenceCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private WorkEvidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private WorkAssignment assignment;

    @Column(name = "model_id", nullable = false, length = 64)
    private String modelId;

    @Column(name = "model_version", nullable = false, length = 32)
    private String modelVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "inference_type", nullable = false, length = 64)
    private InferenceType inferenceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 32)
    private AiProcessingStatus processingStatus;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "processing_duration_ms")
    private Long processingDurationMs;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToOne(mappedBy = "inference", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private AiImageQualityResult imageQuality;

    @OneToMany(mappedBy = "inference", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<AiDetectionResult> detections = new ArrayList<>();

    public AiInferenceResult() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.startedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (startedAt == null) {
            startedAt = Instant.now();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInferenceCode() { return inferenceCode; }
    public void setInferenceCode(String inferenceCode) { this.inferenceCode = inferenceCode; }

    public WorkEvidence getEvidence() { return evidence; }
    public void setEvidence(WorkEvidence evidence) { this.evidence = evidence; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public WorkAssignment getAssignment() { return assignment; }
    public void setAssignment(WorkAssignment assignment) { this.assignment = assignment; }

    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public InferenceType getInferenceType() { return inferenceType; }
    public void setInferenceType(InferenceType inferenceType) { this.inferenceType = inferenceType; }

    public AiProcessingStatus getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(AiProcessingStatus processingStatus) { this.processingStatus = processingStatus; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Long getProcessingDurationMs() { return processingDurationMs; }
    public void setProcessingDurationMs(Long processingDurationMs) { this.processingDurationMs = processingDurationMs; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public AiImageQualityResult getImageQuality() { return imageQuality; }
    public void setImageQuality(AiImageQualityResult imageQuality) { this.imageQuality = imageQuality; }

    public List<AiDetectionResult> getDetections() { return detections; }
    public void setDetections(List<AiDetectionResult> detections) { this.detections = detections; }
}
