package com.infrapulse.modules.humanreview.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "corrective_action_evidence")
public class CorrectiveActionEvidence {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corrective_action_id", nullable = false)
    private CorrectiveAction correctiveAction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private WorkEvidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @Column(name = "submission_type", length = 64, nullable = false)
    private String submissionType = "REWORK_COMPLETION";

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    public CorrectiveActionEvidence() {
        this.id = UUID.randomUUID().toString();
        this.submittedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (submittedAt == null) submittedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public CorrectiveAction getCorrectiveAction() { return correctiveAction; }
    public void setCorrectiveAction(CorrectiveAction correctiveAction) { this.correctiveAction = correctiveAction; }

    public WorkEvidence getEvidence() { return evidence; }
    public void setEvidence(WorkEvidence evidence) { this.evidence = evidence; }

    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }

    public String getSubmissionType() { return submissionType; }
    public void setSubmissionType(String submissionType) { this.submissionType = submissionType; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
