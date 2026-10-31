package com.infrapulse.common.audit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_events")
public class AuditEvent {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "event_code", length = 64)
    private String eventCode;

    @Column(name = "actor_id", length = 36)
    private String actorId;

    @Column(name = "actor_role", length = 32)
    private String actorRole;

    @Column(name = "actor_name", length = 100)
    private String actorName;

    @Column(name = "event_type", length = 100, nullable = false)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_category", length = 50)
    private AuditCategory eventCategory = AuditCategory.SYSTEM;

    @Column(name = "action", length = 100)
    private String action;

    @Column(name = "entity_type", length = 50, nullable = false)
    private String entityType;

    @Column(name = "entity_id", length = 36, nullable = false)
    private String entityId;

    @Column(name = "entity_reference", length = 100)
    private String entityReference;

    @Column(name = "project_id", length = 36)
    private String projectId;

    @Column(name = "vendor_id", length = 36)
    private String vendorId;

    @Column(name = "summary", length = 500, nullable = false)
    private String summary;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", length = 32, nullable = false)
    private AuditOutcome outcome = AuditOutcome.SUCCESS;

    @Column(name = "correlation_id", length = 64)
    private String correlationId;

    @Column(name = "source_module", length = 50)
    private String sourceModule;

    @Column(name = "before_state", columnDefinition = "TEXT")
    private String beforeState;

    @Column(name = "after_state", columnDefinition = "TEXT")
    private String afterState;

    @Column(name = "event_payload", columnDefinition = "TEXT")
    private String eventPayload;

    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    @Column(name = "event_hash", length = 64)
    private String eventHash;

    @Column(name = "chain_scope", length = 100)
    private String chainScope = "GLOBAL";

    @Column(name = "sequence_number")
    private Long sequenceNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AuditEvent() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    public AuditEvent(String actorId, String eventType, String entityType, String entityId, String summary, String reason) {
        this.id = UUID.randomUUID().toString();
        this.actorId = actorId;
        this.eventType = eventType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.summary = summary != null ? summary : eventType + " on " + entityType + ":" + entityId;
        this.reason = reason;
        this.outcome = AuditOutcome.SUCCESS;
        this.chainScope = "GLOBAL";
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.summary == null) {
            this.summary = (this.eventType != null ? this.eventType : "ACTION") + " on " + this.entityType + ":" + this.entityId;
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEventCode() {
        return eventCode;
    }

    public void setEventCode(String eventCode) {
        this.eventCode = eventCode;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public AuditCategory getEventCategory() {
        return eventCategory;
    }

    public void setEventCategory(AuditCategory eventCategory) {
        this.eventCategory = eventCategory;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getEntityReference() {
        return entityReference;
    }

    public void setEntityReference(String entityReference) {
        this.entityReference = entityReference;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getVendorId() {
        return vendorId;
    }

    public void setVendorId(String vendorId) {
        this.vendorId = vendorId;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public AuditOutcome getOutcome() {
        return outcome;
    }

    public void setOutcome(AuditOutcome outcome) {
        this.outcome = outcome;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public String getSourceModule() {
        return sourceModule;
    }

    public void setSourceModule(String sourceModule) {
        this.sourceModule = sourceModule;
    }

    public String getBeforeState() {
        return beforeState;
    }

    public void setBeforeState(String beforeState) {
        this.beforeState = beforeState;
    }

    public String getAfterState() {
        return afterState;
    }

    public void setAfterState(String afterState) {
        this.afterState = afterState;
    }

    public String getEventPayload() {
        return eventPayload;
    }

    public void setEventPayload(String eventPayload) {
        this.eventPayload = eventPayload;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public void setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
    }

    public String getEventHash() {
        return eventHash;
    }

    public void setEventHash(String eventHash) {
        this.eventHash = eventHash;
    }

    public String getChainScope() {
        return chainScope;
    }

    public void setChainScope(String chainScope) {
        this.chainScope = chainScope;
    }

    public Long getSequenceNumber() {
        return sequenceNumber;
    }

    public void setSequenceNumber(Long sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
