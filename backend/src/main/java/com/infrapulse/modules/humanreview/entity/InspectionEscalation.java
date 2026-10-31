package com.infrapulse.modules.humanreview.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inspection_escalations")
public class InspectionEscalation {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private QualityAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private HumanInspectionReview review;

    @Column(name = "escalation_reason", columnDefinition = "TEXT", nullable = false)
    private String escalationReason;

    @Column(name = "severity", length = 32, nullable = false)
    private String severity = "HIGH";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalated_by", nullable = false)
    private User escalatedBy;

    @Column(name = "assigned_role", length = 64)
    private String assignedRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_reviewer_id")
    private User assignedReviewer;

    @Column(name = "status", length = 32, nullable = false)
    private String status = "OPEN";

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public InspectionEscalation() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public QualityAssessment getAssessment() { return assessment; }
    public void setAssessment(QualityAssessment assessment) { this.assessment = assessment; }

    public HumanInspectionReview getReview() { return review; }
    public void setReview(HumanInspectionReview review) { this.review = review; }

    public String getEscalationReason() { return escalationReason; }
    public void setEscalationReason(String escalationReason) { this.escalationReason = escalationReason; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public User getEscalatedBy() { return escalatedBy; }
    public void setEscalatedBy(User escalatedBy) { this.escalatedBy = escalatedBy; }

    public String getAssignedRole() { return assignedRole; }
    public void setAssignedRole(String assignedRole) { this.assignedRole = assignedRole; }

    public User getAssignedReviewer() { return assignedReviewer; }
    public void setAssignedReviewer(User assignedReviewer) { this.assignedReviewer = assignedReviewer; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
