package com.infrapulse.modules.intelligence.contract.entity;

import com.infrapulse.modules.auth.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contract_documents")
public class ContractDocument {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private ProjectContract contract;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 64)
    private String fileType;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "storage_path", nullable = false, length = 512)
    private String storagePath;

    @Column(name = "sha256_hash", nullable = false, length = 64)
    private String sha256Hash;

    @Column(name = "extraction_status", nullable = false, length = 32)
    private String extractionStatus = "UPLOADED";

    @Column(name = "extracted_text_preview", columnDefinition = "TEXT")
    private String extractedTextPreview;

    @Column(name = "extracted_requirements_count")
    private int extractedRequirementsCount = 0;

    @Column(name = "version")
    private int version = 1;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    public ContractDocument() {
        this.id = UUID.randomUUID().toString();
    }

    public ContractDocument(ProjectContract contract, String fileName, String fileType, long fileSizeBytes, String storagePath, String sha256Hash, User uploadedBy) {
        this();
        this.contract = contract;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSizeBytes = fileSizeBytes;
        this.storagePath = storagePath;
        this.sha256Hash = sha256Hash;
        this.uploadedBy = uploadedBy;
        this.extractionStatus = "UPLOADED";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ProjectContract getContract() { return contract; }
    public void setContract(ProjectContract contract) { this.contract = contract; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public String getExtractionStatus() { return extractionStatus; }
    public void setExtractionStatus(String extractionStatus) { this.extractionStatus = extractionStatus; }

    public String getExtractedTextPreview() { return extractedTextPreview; }
    public void setExtractedTextPreview(String extractedTextPreview) { this.extractedTextPreview = extractedTextPreview; }

    public int getExtractedRequirementsCount() { return extractedRequirementsCount; }
    public void setExtractedRequirementsCount(int extractedRequirementsCount) { this.extractedRequirementsCount = extractedRequirementsCount; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }
}

