package com.infrapulse.modules.humanreview.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "human_inspection_decisions")
public class HumanInspectionDecision {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private HumanInspectionReview review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private QualityAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private WorkAssignment assignment;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_type", length = 64, nullable = false)
    private ReviewDecisionType decisionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Column(name = "reviewer_role", length = 64, nullable = false)
    private String reviewerRole;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_decision_id")
    private HumanInspectionDecision previousDecision;

    @Column(name = "decided_at", nullable = false)
    private Instant decidedAt;

    public HumanInspectionDecision() {
        this.id = UUID.randomUUID().toString();
        this.decidedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (decidedAt == null) decidedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public HumanInspectionReview getReview() { return review; }
    public void setReview(HumanInspectionReview review) { this.review = review; }

    public QualityAssessment getAssessment() { return assessment; }
    public void setAssessment(QualityAssessment assessment) { this.assessment = assessment; }

    public WorkAssignment getAssignment() { return assignment; }
    public void setAssignment(WorkAssignment assignment) { this.assignment = assignment; }

    public ReviewDecisionType getDecisionType() { return decisionType; }
    public void setDecisionType(ReviewDecisionType decisionType) { this.decisionType = decisionType; }

    public User getReviewer() { return reviewer; }
    public void setReviewer(User reviewer) { this.reviewer = reviewer; }

    public String getReviewerRole() { return reviewerRole; }
    public void setReviewerRole(String reviewerRole) { this.reviewerRole = reviewerRole; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public HumanInspectionDecision getPreviousDecision() { return previousDecision; }
    public void setPreviousDecision(HumanInspectionDecision previousDecision) { this.previousDecision = previousDecision; }

    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
}
