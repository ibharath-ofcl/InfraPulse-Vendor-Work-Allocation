package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.workertrust.enums.DocumentStatus;
import com.infrapulse.modules.workertrust.enums.DocumentType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "worker_documents")
public class WorkerDocument {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 100, nullable = false)
    private DocumentType documentType;

    @Column(name = "secure_storage_reference", length = 500, nullable = false)
    private String secureStorageReference;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "content_type", length = 100, nullable = false)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_status", length = 50, nullable = false)
    private DocumentStatus documentStatus = DocumentStatus.PENDING;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    public WorkerDocument() {
        this.id = UUID.randomUUID().toString();
        this.uploadedAt = Instant.now();
        this.documentStatus = DocumentStatus.PENDING;
    }

    public WorkerDocument(Worker worker, DocumentType documentType, String secureStorageReference,
                          String originalFilename, String contentType, Long fileSize, User uploadedBy) {
        this();
        this.worker = worker;
        this.documentType = documentType;
        this.secureStorageReference = secureStorageReference;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.uploadedBy = uploadedBy;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (uploadedAt == null) uploadedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }

    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }

    public String getSecureStorageReference() { return secureStorageReference; }
    public void setSecureStorageReference(String secureStorageReference) { this.secureStorageReference = secureStorageReference; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public DocumentStatus getDocumentStatus() { return documentStatus; }
    public void setDocumentStatus(DocumentStatus documentStatus) { this.documentStatus = documentStatus; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }
}

