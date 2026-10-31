package com.infrapulse.common.audit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_chain_heads")
public class AuditChainHead {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "chain_scope", length = 100, nullable = false, unique = true)
    private String chainScope = "GLOBAL";

    @Column(name = "last_sequence", nullable = false)
    private long lastSequence = 0L;

    @Column(name = "last_event_hash", length = 64, nullable = false)
    private String lastEventHash = "0000000000000000000000000000000000000000000000000000000000000000";

    @Column(name = "updated_at")
    private Instant updatedAt;

    public AuditChainHead() {
        this.id = UUID.randomUUID().toString();
        this.updatedAt = Instant.now();
    }

    public AuditChainHead(String chainScope, long lastSequence, String lastEventHash) {
        this.id = UUID.randomUUID().toString();
        this.chainScope = chainScope;
        this.lastSequence = lastSequence;
        this.lastEventHash = lastEventHash;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getChainScope() {
        return chainScope;
    }

    public void setChainScope(String chainScope) {
        this.chainScope = chainScope;
    }

    public long getLastSequence() {
        return lastSequence;
    }

    public void setLastSequence(long lastSequence) {
        this.lastSequence = lastSequence;
    }

    public String getLastEventHash() {
        return lastEventHash;
    }

    public void setLastEventHash(String lastEventHash) {
        this.lastEventHash = lastEventHash;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
