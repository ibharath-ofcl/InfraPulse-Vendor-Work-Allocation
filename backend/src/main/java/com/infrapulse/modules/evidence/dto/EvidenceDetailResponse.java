package com.infrapulse.modules.evidence.dto;

import com.infrapulse.modules.evidence.entity.WorkEvidence;
import java.math.BigDecimal;
import java.time.Instant;

public class EvidenceDetailResponse {

    private String id;
    private String evidenceCode;
    private String projectId;
    private String projectName;
    private String projectCode;
    private String workZoneId;
    private String workZoneName;
    private String zoneCode;
    private String assignmentId;
    private String assignmentCode;
    private String workType;
    private String workTypeDisplayName;
    private String vendorId;
    private String vendorName;
    private String vendorCode;
    private String uploadedById;
    private String uploadedByName;
    private String uploadedByRole;
    private String evidenceCategory;
    private String evidenceCategoryDisplayName;
    private String originalFileName;
    private String mimeType;
    private Long fileSize;
    private String fileSizeFormatted;
    private String checksumSha256;
    private Integer imageWidth;
    private Integer imageHeight;
    private Instant captureTimestamp;
    private Instant uploadedAt;
    private String description;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Boolean isUserProvidedLocation;
    private String metadataJson;
    private String processingStatus;
    private String processingStatusDisplayName;
    private String reviewStatus;
    private String reviewStatusDisplayName;
    private String reviewNotes;
    private String reviewedByName;
    private Instant reviewedAt;
    private boolean hasPreview;
    private String fileDownloadUrl;
    private String previewUrl;

    private BigDecimal gpsAccuracyMeters;
    private Instant serverReceiptTimestamp;
    private String geofenceStatus;
    private BigDecimal distanceFromZoneCenterMeters;
    private String perceptualHash;
    private String duplicateStatus;
    private String duplicateOfEvidenceId;
    private String deviceOrientationJson;
    private String deviceIntegrityStatus;

    public EvidenceDetailResponse() {}

    public static EvidenceDetailResponse fromEntity(WorkEvidence e) {
        EvidenceDetailResponse r = new EvidenceDetailResponse();
        r.setId(e.getId());
        r.setEvidenceCode(e.getEvidenceCode());

        if (e.getProject() != null) {
            r.setProjectId(e.getProject().getId());
            r.setProjectName(e.getProject().getProjectName());
            r.setProjectCode(e.getProject().getProjectCode());
        }

        if (e.getWorkZone() != null) {
            r.setWorkZoneId(e.getWorkZone().getId());
            r.setWorkZoneName(e.getWorkZone().getZoneName());
            r.setZoneCode(e.getWorkZone().getZoneCode());
        }

        if (e.getWorkAssignment() != null) {
            r.setAssignmentId(e.getWorkAssignment().getId());
            r.setAssignmentCode(e.getWorkAssignment().getAssignmentCode());
            if (e.getWorkAssignment().getWorkType() != null) {
                r.setWorkType(e.getWorkAssignment().getWorkType().name());
                r.setWorkTypeDisplayName(e.getWorkAssignment().getWorkType().getDisplayName());
            }
        }

        if (e.getVendor() != null) {
            r.setVendorId(e.getVendor().getId());
            r.setVendorName(e.getVendor().getCompanyName());
            r.setVendorCode(e.getVendor().getVendorCode());
        }

        if (e.getUploadedBy() != null) {
            r.setUploadedById(e.getUploadedBy().getId());
            r.setUploadedByName(e.getUploadedBy().getFullName());
            r.setUploadedByRole(e.getUploadedBy().getRole() != null ? e.getUploadedBy().getRole().name() : null);
        }

        if (e.getEvidenceCategory() != null) {
            r.setEvidenceCategory(e.getEvidenceCategory().name());
            r.setEvidenceCategoryDisplayName(e.getEvidenceCategory().getDisplayName());
        }

        r.setOriginalFileName(e.getOriginalFileName());
        r.setMimeType(e.getMimeType());
        r.setFileSize(e.getFileSize());
        r.setFileSizeFormatted(formatFileSize(e.getFileSize()));
        r.setChecksumSha256(e.getChecksumSha256());
        r.setImageWidth(e.getImageWidth());
        r.setImageHeight(e.getImageHeight());
        r.setCaptureTimestamp(e.getCaptureTimestamp());
        r.setUploadedAt(e.getUploadedAt());
        r.setDescription(e.getDescription());
        r.setLatitude(e.getLatitude());
        r.setLongitude(e.getLongitude());
        r.setMetadataJson(e.getMetadataJson());

        r.setGpsAccuracyMeters(e.getGpsAccuracyMeters());
        r.setServerReceiptTimestamp(e.getServerReceiptTimestamp());
        if (e.getGeofenceStatus() != null) {
            r.setGeofenceStatus(e.getGeofenceStatus().name());
        }
        r.setDistanceFromZoneCenterMeters(e.getDistanceFromZoneCenterMeters());
        r.setPerceptualHash(e.getPerceptualHash());
        if (e.getDuplicateStatus() != null) {
            r.setDuplicateStatus(e.getDuplicateStatus().name());
        }
        r.setDuplicateOfEvidenceId(e.getDuplicateOfEvidenceId());
        r.setDeviceOrientationJson(e.getDeviceOrientationJson());
        if (e.getDeviceIntegrityStatus() != null) {
            r.setDeviceIntegrityStatus(e.getDeviceIntegrityStatus().name());
        }

        if (e.getProcessingStatus() != null) {
            r.setProcessingStatus(e.getProcessingStatus().name());
            r.setProcessingStatusDisplayName(e.getProcessingStatus().getDisplayName());
        }

        if (e.getReviewStatus() != null) {
            r.setReviewStatus(e.getReviewStatus().name());
            r.setReviewStatusDisplayName(e.getReviewStatus().getDisplayName());
        }

        r.setReviewNotes(e.getReviewNotes());
        if (e.getReviewedBy() != null) {
            r.setReviewedByName(e.getReviewedBy().getFullName());
        }
        r.setReviewedAt(e.getReviewedAt());

        r.setHasPreview(e.getPreviewStorageKey() != null);
        r.setFileDownloadUrl("/api/v1/evidence/" + e.getId() + "/file");
        r.setPreviewUrl("/api/v1/evidence/" + e.getId() + "/preview");

        return r;
    }

    private static String formatFileSize(Long bytes) {
        if (bytes == null || bytes <= 0) return "0 B";
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }

    // Getters and Setters

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEvidenceCode() { return evidenceCode; }
    public void setEvidenceCode(String evidenceCode) { this.evidenceCode = evidenceCode; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getProjectCode() { return projectCode; }
    public void setProjectCode(String projectCode) { this.projectCode = projectCode; }

    public String getWorkZoneId() { return workZoneId; }
    public void setWorkZoneId(String workZoneId) { this.workZoneId = workZoneId; }

    public String getWorkZoneName() { return workZoneName; }
    public void setWorkZoneName(String workZoneName) { this.workZoneName = workZoneName; }

    public String getZoneCode() { return zoneCode; }
    public void setZoneCode(String zoneCode) { this.zoneCode = zoneCode; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getAssignmentCode() { return assignmentCode; }
    public void setAssignmentCode(String assignmentCode) { this.assignmentCode = assignmentCode; }

    public String getWorkType() { return workType; }
    public void setWorkType(String workType) { this.workType = workType; }

    public String getWorkTypeDisplayName() { return workTypeDisplayName; }
    public void setWorkTypeDisplayName(String workTypeDisplayName) { this.workTypeDisplayName = workTypeDisplayName; }

    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getVendorCode() { return vendorCode; }
    public void setVendorCode(String vendorCode) { this.vendorCode = vendorCode; }

    public String getUploadedById() { return uploadedById; }
    public void setUploadedById(String uploadedById) { this.uploadedById = uploadedById; }

    public String getUploadedByName() { return uploadedByName; }
    public void setUploadedByName(String uploadedByName) { this.uploadedByName = uploadedByName; }

    public String getUploadedByRole() { return uploadedByRole; }
    public void setUploadedByRole(String uploadedByRole) { this.uploadedByRole = uploadedByRole; }

    public String getEvidenceCategory() { return evidenceCategory; }
    public void setEvidenceCategory(String evidenceCategory) { this.evidenceCategory = evidenceCategory; }

    public String getEvidenceCategoryDisplayName() { return evidenceCategoryDisplayName; }
    public void setEvidenceCategoryDisplayName(String evidenceCategoryDisplayName) { this.evidenceCategoryDisplayName = evidenceCategoryDisplayName; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getFileSizeFormatted() { return fileSizeFormatted; }
    public void setFileSizeFormatted(String fileSizeFormatted) { this.fileSizeFormatted = fileSizeFormatted; }

    public String getChecksumSha256() { return checksumSha256; }
    public void setChecksumSha256(String checksumSha256) { this.checksumSha256 = checksumSha256; }

    public Integer getImageWidth() { return imageWidth; }
    public void setImageWidth(Integer imageWidth) { this.imageWidth = imageWidth; }

    public Integer getImageHeight() { return imageHeight; }
    public void setImageHeight(Integer imageHeight) { this.imageHeight = imageHeight; }

    public Instant getCaptureTimestamp() { return captureTimestamp; }
    public void setCaptureTimestamp(Instant captureTimestamp) { this.captureTimestamp = captureTimestamp; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public Boolean getIsUserProvidedLocation() { return isUserProvidedLocation; }
    public void setIsUserProvidedLocation(Boolean isUserProvidedLocation) { this.isUserProvidedLocation = isUserProvidedLocation; }

    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }

    public String getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(String processingStatus) { this.processingStatus = processingStatus; }

    public String getProcessingStatusDisplayName() { return processingStatusDisplayName; }
    public void setProcessingStatusDisplayName(String processingStatusDisplayName) { this.processingStatusDisplayName = processingStatusDisplayName; }

    public String getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }

    public String getReviewStatusDisplayName() { return reviewStatusDisplayName; }
    public void setReviewStatusDisplayName(String reviewStatusDisplayName) { this.reviewStatusDisplayName = reviewStatusDisplayName; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public String getReviewedByName() { return reviewedByName; }
    public void setReviewedByName(String reviewedByName) { this.reviewedByName = reviewedByName; }

    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }

    public boolean isHasPreview() { return hasPreview; }
    public void setHasPreview(boolean hasPreview) { this.hasPreview = hasPreview; }

    public String getFileDownloadUrl() { return fileDownloadUrl; }
    public void setFileDownloadUrl(String fileDownloadUrl) { this.fileDownloadUrl = fileDownloadUrl; }

    public String getPreviewUrl() { return previewUrl; }
    public void setPreviewUrl(String previewUrl) { this.previewUrl = previewUrl; }

    public BigDecimal getGpsAccuracyMeters() { return gpsAccuracyMeters; }
    public void setGpsAccuracyMeters(BigDecimal gpsAccuracyMeters) { this.gpsAccuracyMeters = gpsAccuracyMeters; }

    public Instant getServerReceiptTimestamp() { return serverReceiptTimestamp; }
    public void setServerReceiptTimestamp(Instant serverReceiptTimestamp) { this.serverReceiptTimestamp = serverReceiptTimestamp; }

    public String getGeofenceStatus() { return geofenceStatus; }
    public void setGeofenceStatus(String geofenceStatus) { this.geofenceStatus = geofenceStatus; }

    public BigDecimal getDistanceFromZoneCenterMeters() { return distanceFromZoneCenterMeters; }
    public void setDistanceFromZoneCenterMeters(BigDecimal distanceFromZoneCenterMeters) { this.distanceFromZoneCenterMeters = distanceFromZoneCenterMeters; }

    public String getPerceptualHash() { return perceptualHash; }
    public void setPerceptualHash(String perceptualHash) { this.perceptualHash = perceptualHash; }

    public String getDuplicateStatus() { return duplicateStatus; }
    public void setDuplicateStatus(String duplicateStatus) { this.duplicateStatus = duplicateStatus; }

    public String getDuplicateOfEvidenceId() { return duplicateOfEvidenceId; }
    public void setDuplicateOfEvidenceId(String duplicateOfEvidenceId) { this.duplicateOfEvidenceId = duplicateOfEvidenceId; }

    public String getDeviceOrientationJson() { return deviceOrientationJson; }
    public void setDeviceOrientationJson(String deviceOrientationJson) { this.deviceOrientationJson = deviceOrientationJson; }

    public String getDeviceIntegrityStatus() { return deviceIntegrityStatus; }
    public void setDeviceIntegrityStatus(String deviceIntegrityStatus) { this.deviceIntegrityStatus = deviceIntegrityStatus; }
}
