package com.infrapulse.modules.ai.dto;

import java.time.Instant;
import java.util.List;

public class AiInferenceResponse {
    private String id;
    private String inferenceCode;
    private String evidenceId;
    private String evidenceCode;
    private String projectId;
    private String assignmentId;
    private String modelId;
    private String modelVersion;
    private String inferenceType;
    private String processingStatus;
    private Instant startedAt;
    private Instant completedAt;
    private Long processingDurationMs;
    private AiImageQualityDto imageQuality;
    private List<AiDetectionDto> detections;
    private Integer totalDetections;
    private List<String> unsupportedCategories;
    private List<String> warnings;
    private String errorCode;
    private String errorMessage;
    private Instant createdAt;

    public AiInferenceResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInferenceCode() { return inferenceCode; }
    public void setInferenceCode(String inferenceCode) { this.inferenceCode = inferenceCode; }

    public String getEvidenceId() { return evidenceId; }
    public void setEvidenceId(String evidenceId) { this.evidenceId = evidenceId; }

    public String getEvidenceCode() { return evidenceCode; }
    public void setEvidenceCode(String evidenceCode) { this.evidenceCode = evidenceCode; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getInferenceType() { return inferenceType; }
    public void setInferenceType(String inferenceType) { this.inferenceType = inferenceType; }

    public String getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(String processingStatus) { this.processingStatus = processingStatus; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Long getProcessingDurationMs() { return processingDurationMs; }
    public void setProcessingDurationMs(Long processingDurationMs) { this.processingDurationMs = processingDurationMs; }

    public AiImageQualityDto getImageQuality() { return imageQuality; }
    public void setImageQuality(AiImageQualityDto imageQuality) { this.imageQuality = imageQuality; }

    public List<AiDetectionDto> getDetections() { return detections; }
    public void setDetections(List<AiDetectionDto> detections) { this.detections = detections; }

    public Integer getTotalDetections() { return totalDetections; }
    public void setTotalDetections(Integer totalDetections) { this.totalDetections = totalDetections; }

    public List<String> getUnsupportedCategories() { return unsupportedCategories; }
    public void setUnsupportedCategories(List<String> unsupportedCategories) { this.unsupportedCategories = unsupportedCategories; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
