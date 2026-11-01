package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.workertrust.enums.CredentialStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "worker_qr_credentials")
public class WorkerQrCredential {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Column(name = "token_hash", length = 64, nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "credential_payload", columnDefinition = "TEXT", nullable = false)
    private String credentialPayload;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "credential_status", length = 50, nullable = false)
    private CredentialStatus credentialStatus = CredentialStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by")
    private User issuedBy;

    public WorkerQrCredential() {
        this.id = UUID.randomUUID().toString();
        this.issuedAt = Instant.now();
        this.credentialStatus = CredentialStatus.ACTIVE;
    }

    public WorkerQrCredential(Worker worker, String tokenHash, String credentialPayload,
                              Instant expiresAt, User issuedBy) {
        this();
        this.worker = worker;
        this.tokenHash = tokenHash;
        this.credentialPayload = credentialPayload;
        this.expiresAt = expiresAt;
        this.issuedBy = issuedBy;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (issuedAt == null) issuedAt = Instant.now();
    }

    public boolean isValid() {
        return credentialStatus == CredentialStatus.ACTIVE &&
               revokedAt == null &&
               Instant.now().isBefore(expiresAt);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public String getCredentialPayload() { return credentialPayload; }
    public void setCredentialPayload(String credentialPayload) { this.credentialPayload = credentialPayload; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }

    public CredentialStatus getCredentialStatus() { return credentialStatus; }
    public void setCredentialStatus(CredentialStatus credentialStatus) { this.credentialStatus = credentialStatus; }

    public User getIssuedBy() { return issuedBy; }
    public void setIssuedBy(User issuedBy) { this.issuedBy = issuedBy; }
}

