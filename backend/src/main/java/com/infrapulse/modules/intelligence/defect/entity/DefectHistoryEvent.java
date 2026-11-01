package com.infrapulse.modules.intelligence.defect.entity;

import com.infrapulse.modules.auth.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "defect_history_events")
public class DefectHistoryEvent {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defect_id", nullable = false)
    private InfrastructureDefect defect;

    @Column(name = "previous_status", length = 32)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 32)
    private String newStatus;

    @Column(name = "action_taken", nullable = false, length = 128)
    private String actionTaken;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(name = "actor_role", length = 32)
    private String actorRole;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public DefectHistoryEvent() {
        this.id = UUID.randomUUID().toString();
    }

    public DefectHistoryEvent(InfrastructureDefect defect, String previousStatus, String newStatus, String actionTaken, String notes, User actor, String actorRole) {
        this();
        this.defect = defect;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.actionTaken = actionTaken;
        this.notes = notes;
        this.actor = actor;
        this.actorRole = actorRole;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public InfrastructureDefect getDefect() { return defect; }
    public void setDefect(InfrastructureDefect defect) { this.defect = defect; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getActionTaken() { return actionTaken; }
    public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public User getActor() { return actor; }
    public void setActor(User actor) { this.actor = actor; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
