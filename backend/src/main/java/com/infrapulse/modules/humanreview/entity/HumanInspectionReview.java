package com.infrapulse.modules.humanreview.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "human_inspection_reviews")
public class HumanInspectionReview {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "review_code", length = 64, nullable = false, unique = true)
    private String reviewCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private QualityAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private WorkAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", length = 64, nullable = false)
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 32, nullable = false)
    private ReviewPriority priority = ReviewPriority.MEDIUM;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<HumanInspectionDecision> decisions = new ArrayList<>();

    public HumanInspectionReview() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReviewCode() { return reviewCode; }
    public void setReviewCode(String reviewCode) { this.reviewCode = reviewCode; }

    public QualityAssessment getAssessment() { return assessment; }
    public void setAssessment(QualityAssessment assessment) { this.assessment = assessment; }

    public WorkAssignment getAssignment() { return assignment; }
    public void setAssignment(WorkAssignment assignment) { this.assignment = assignment; }

    public User getReviewer() { return reviewer; }
    public void setReviewer(User reviewer) { this.reviewer = reviewer; }

    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }

    public ReviewPriority getPriority() { return priority; }
    public void setPriority(ReviewPriority priority) { this.priority = priority; }

    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<HumanInspectionDecision> getDecisions() { return decisions; }
    public void setDecisions(List<HumanInspectionDecision> decisions) { this.decisions = decisions; }
}
