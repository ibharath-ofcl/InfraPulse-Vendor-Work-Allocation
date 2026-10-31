package com.infrapulse.common.dto;

import java.time.Instant;

public class AuditEventDto {
    private String id;
    private String actorId;
    private String eventType;
    private String entityType;
    private String entityId;
    private String summary;
    private String reason;
    private Instant createdAt;

    public AuditEventDto() {
    }

    public AuditEventDto(String id, String actorId, String eventType, String entityType, String entityId, String summary, String reason, Instant createdAt) {
        this.id = id;
        this.actorId = actorId;
        this.eventType = eventType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.summary = summary;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
