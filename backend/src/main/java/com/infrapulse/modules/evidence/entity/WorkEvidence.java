package com.infrapulse.modules.evidence.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.evidence.model.*;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "work_evidence")
public class WorkEvidence {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "evidence_code", length = 50, nullable = false, unique = true)
    private String evidenceCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id", nullable = false)
    private WorkZone workZone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private WorkAssignment workAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_category", length = 64, nullable = false)
    private EvidenceCategory evidenceCategory;

    @Column(name = "original_file_name", length = 255, nullable = false)
    private String originalFileName;

    @Column(name = "storage_key", length = 500, nullable = false)
    private String storageKey;

    @Column(name = "preview_storage_key", length = 500)
    private String previewStorageKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_provider", length = 32, nullable = false)
    private StorageProvider storageProvider = StorageProvider.LOCAL;

    @Column(name = "mime_type", length = 100, nullable = false)
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "checksum_sha256", length = 64, nullable = false)
    private String checksumSha256;

    @Column(name = "image_width")
    private Integer imageWidth;

    @Column(name = "image_height")
    private Integer imageHeight;

    @Column(name = "capture_timestamp")
    private Instant captureTimestamp;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "latitude", precision = 10, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 6)
    private BigDecimal longitude;

    @Column(name = "gps_accuracy_meters", precision = 8, scale = 2)
    private BigDecimal gpsAccuracyMeters;

    @Column(name = "server_receipt_timestamp", nullable = false)
    private Instant serverReceiptTimestamp = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "geofence_status", length = 32, nullable = false)
    private GeofenceStatus geofenceStatus = GeofenceStatus.UNVERIFIED_NO_GPS;

    @Column(name = "distance_from_zone_center_meters", precision = 10, scale = 2)
    private BigDecimal distanceFromZoneCenterMeters;

    @Column(name = "perceptual_hash", length = 64)
    private String perceptualHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "duplicate_status", length = 32, nullable = false)
    private DuplicateStatus duplicateStatus = DuplicateStatus.UNIQUE;

    @Column(name = "duplicate_of_evidence_id", length = 36)
    private String duplicateOfEvidenceId;

    @Column(name = "device_orientation_json", columnDefinition = "TEXT")
    private String deviceOrientationJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_integrity_status", length = 32, nullable = false)
    private DeviceIntegrityStatus deviceIntegrityStatus = DeviceIntegrityStatus.WEB_UNATTESTED;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", length = 32, nullable = false)
    private EvidenceProcessingStatus processingStatus = EvidenceProcessingStatus.UPLOADED;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", length = 32, nullable = false)
    private EvidenceReviewStatus reviewStatus = EvidenceReviewStatus.NOT_REVIEWED;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public WorkEvidence() {
        this.id = UUID.randomUUID().toString();
        this.uploadedAt = Instant.now();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.uploadedAt == null) {
            this.uploadedAt = Instant.now();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
        if (this.processingStatus == null) {
            this.processingStatus = EvidenceProcessingStatus.UPLOADED;
        }
        if (this.reviewStatus == null) {
            this.reviewStatus = EvidenceReviewStatus.NOT_REVIEWED;
        }
        if (this.storageProvider == null) {
            this.storageProvider = StorageProvider.LOCAL;
        }
        if (this.serverReceiptTimestamp == null) {
            this.serverReceiptTimestamp = Instant.now();
        }
        if (this.geofenceStatus == null) {
            this.geofenceStatus = GeofenceStatus.UNVERIFIED_NO_GPS;
        }
        if (this.duplicateStatus == null) {
            this.duplicateStatus = DuplicateStatus.UNIQUE;
        }
        if (this.deviceIntegrityStatus == null) {
            this.deviceIntegrityStatus = DeviceIntegrityStatus.WEB_UNATTESTED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEvidenceCode() {
        return evidenceCode;
    }

    public void setEvidenceCode(String evidenceCode) {
        this.evidenceCode = evidenceCode;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public WorkZone getWorkZone() {
        return workZone;
    }

    public void setWorkZone(WorkZone workZone) {
        this.workZone = workZone;
    }

    public WorkAssignment getWorkAssignment() {
        return workAssignment;
    }

    public void setWorkAssignment(WorkAssignment workAssignment) {
        this.workAssignment = workAssignment;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public User getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(User uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public EvidenceCategory getEvidenceCategory() {
        return evidenceCategory;
    }

    public void setEvidenceCategory(EvidenceCategory evidenceCategory) {
        this.evidenceCategory = evidenceCategory;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getPreviewStorageKey() {
        return previewStorageKey;
    }

    public void setPreviewStorageKey(String previewStorageKey) {
        this.previewStorageKey = previewStorageKey;
    }

    public StorageProvider getStorageProvider() {
        return storageProvider;
    }

    public void setStorageProvider(StorageProvider storageProvider) {
        this.storageProvider = storageProvider;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getChecksumSha256() {
        return checksumSha256;
    }

    public void setChecksumSha256(String checksumSha256) {
        this.checksumSha256 = checksumSha256;
    }

    public Integer getImageWidth() {
        return imageWidth;
    }

    public void setImageWidth(Integer imageWidth) {
        this.imageWidth = imageWidth;
    }

    public Integer getImageHeight() {
        return imageHeight;
    }

    public void setImageHeight(Integer imageHeight) {
        this.imageHeight = imageHeight;
    }

    public Instant getCaptureTimestamp() {
        return captureTimestamp;
    }

    public void setCaptureTimestamp(Instant captureTimestamp) {
        this.captureTimestamp = captureTimestamp;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(String metadataJson) {
        this.metadataJson = metadataJson;
    }

    public EvidenceProcessingStatus getProcessingStatus() {
        return processingStatus;
    }

    public void setProcessingStatus(EvidenceProcessingStatus processingStatus) {
        this.processingStatus = processingStatus;
    }

    public EvidenceReviewStatus getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(EvidenceReviewStatus reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(User reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public boolean isDeleted() {
        return isDeleted;
    }

    public void setDeleted(boolean deleted) {
        isDeleted = deleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public BigDecimal getGpsAccuracyMeters() {
        return gpsAccuracyMeters;
    }

    public void setGpsAccuracyMeters(BigDecimal gpsAccuracyMeters) {
        this.gpsAccuracyMeters = gpsAccuracyMeters;
    }

    public Instant getServerReceiptTimestamp() {
        return serverReceiptTimestamp;
    }

    public void setServerReceiptTimestamp(Instant serverReceiptTimestamp) {
        this.serverReceiptTimestamp = serverReceiptTimestamp;
    }

    public GeofenceStatus getGeofenceStatus() {
        return geofenceStatus;
    }

    public void setGeofenceStatus(GeofenceStatus geofenceStatus) {
        this.geofenceStatus = geofenceStatus != null ? geofenceStatus : GeofenceStatus.UNVERIFIED_NO_GPS;
    }

    public BigDecimal getDistanceFromZoneCenterMeters() {
        return distanceFromZoneCenterMeters;
    }

    public void setDistanceFromZoneCenterMeters(BigDecimal distanceFromZoneCenterMeters) {
        this.distanceFromZoneCenterMeters = distanceFromZoneCenterMeters;
    }

    public String getPerceptualHash() {
        return perceptualHash;
    }

    public void setPerceptualHash(String perceptualHash) {
        this.perceptualHash = perceptualHash;
    }

    public DuplicateStatus getDuplicateStatus() {
        return duplicateStatus;
    }

    public void setDuplicateStatus(DuplicateStatus duplicateStatus) {
        this.duplicateStatus = duplicateStatus != null ? duplicateStatus : DuplicateStatus.UNIQUE;
    }

    public String getDuplicateOfEvidenceId() {
        return duplicateOfEvidenceId;
    }

    public void setDuplicateOfEvidenceId(String duplicateOfEvidenceId) {
        this.duplicateOfEvidenceId = duplicateOfEvidenceId;
    }

    public String getDeviceOrientationJson() {
        return deviceOrientationJson;
    }

    public void setDeviceOrientationJson(String deviceOrientationJson) {
        this.deviceOrientationJson = deviceOrientationJson;
    }

    public DeviceIntegrityStatus getDeviceIntegrityStatus() {
        return deviceIntegrityStatus;
    }

    public void setDeviceIntegrityStatus(DeviceIntegrityStatus deviceIntegrityStatus) {
        this.deviceIntegrityStatus = deviceIntegrityStatus != null ? deviceIntegrityStatus : DeviceIntegrityStatus.WEB_UNATTESTED;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WorkEvidence that = (WorkEvidence) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
