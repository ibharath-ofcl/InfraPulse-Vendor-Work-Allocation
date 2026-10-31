package com.infrapulse.modules.humanreview.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class InspectionEvidenceItemDto {
    private String id;
    private String evidenceCode;
    private String evidenceCategory;
    private String fileName;
    private Long fileSize;
    private String mimeType;
    private String previewUrl;
    private String fileUrl;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Instant uploadedAt;
    private String submittedByName;
    private String vendorName;
    private String aiQualityStatus;
    private Double aiClarityScore;
    private String aiModelName;
    private String aiModelVersion;
    private List<InspectionDetectionDto> detections = new ArrayList<>();

    public InspectionEvidenceItemDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEvidenceCode() { return evidenceCode; }
    public void setEvidenceCode(String evidenceCode) { this.evidenceCode = evidenceCode; }

    public String getEvidenceCategory() { return evidenceCategory; }
    public void setEvidenceCategory(String evidenceCategory) { this.evidenceCategory = evidenceCategory; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public String getPreviewUrl() { return previewUrl; }
    public void setPreviewUrl(String previewUrl) { this.previewUrl = previewUrl; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }

    public String getSubmittedByName() { return submittedByName; }
    public void setSubmittedByName(String submittedByName) { this.submittedByName = submittedByName; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getAiQualityStatus() { return aiQualityStatus; }
    public void setAiQualityStatus(String aiQualityStatus) { this.aiQualityStatus = aiQualityStatus; }

    public Double getAiClarityScore() { return aiClarityScore; }
    public void setAiClarityScore(Double aiClarityScore) { this.aiClarityScore = aiClarityScore; }

    public String getAiModelName() { return aiModelName; }
    public void setAiModelName(String aiModelName) { this.aiModelName = aiModelName; }

    public String getAiModelVersion() { return aiModelVersion; }
    public void setAiModelVersion(String aiModelVersion) { this.aiModelVersion = aiModelVersion; }

    public List<InspectionDetectionDto> getDetections() { return detections; }
    public void setDetections(List<InspectionDetectionDto> detections) { this.detections = detections; }
}
