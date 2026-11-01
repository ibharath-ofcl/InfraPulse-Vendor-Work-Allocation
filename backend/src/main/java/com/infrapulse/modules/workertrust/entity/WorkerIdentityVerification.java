package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.workertrust.enums.VerificationMethod;
import com.infrapulse.modules.workertrust.enums.VerificationStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "worker_identity_verifications")
public class WorkerIdentityVerification {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method", length = 100, nullable = false)
    private VerificationMethod verificationMethod;

    @Column(name = "verification_reference")
    private String verificationReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 50, nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public WorkerIdentityVerification() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.verificationStatus = VerificationStatus.PENDING;
    }

    public WorkerIdentityVerification(Worker worker, VerificationMethod verificationMethod, String verificationReference) {
        this();
        this.worker = worker;
        this.verificationMethod = verificationMethod;
        this.verificationReference = verificationReference;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }

    public VerificationMethod getVerificationMethod() { return verificationMethod; }
    public void setVerificationMethod(VerificationMethod verificationMethod) { this.verificationMethod = verificationMethod; }

    public String getVerificationReference() { return verificationReference; }
    public void setVerificationReference(String verificationReference) { this.verificationReference = verificationReference; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public User getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(User verifiedBy) { this.verifiedBy = verifiedBy; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

