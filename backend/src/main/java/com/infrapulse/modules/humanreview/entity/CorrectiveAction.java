package com.infrapulse.modules.humanreview.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.CorrectiveActionType;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;
import com.infrapulse.modules.quality.model.FindingSeverity;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "corrective_actions")
public class CorrectiveAction {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "action_code", length = 64, nullable = false, unique = true)
    private String actionCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private QualityAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private WorkAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finding_id")
    private QualityAssessmentFinding finding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_inspector_id")
    private User assignedInspector;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", length = 64, nullable = false)
    private CorrectiveActionType actionType;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 32, nullable = false)
    private ReviewPriority priority = ReviewPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 32, nullable = false)
    private FindingSeverity severity = FindingSeverity.HIGH;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 64, nullable = false)
    private CorrectiveActionStatus status = CorrectiveActionStatus.OPEN;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "vendor_notes", columnDefinition = "TEXT")
    private String vendorNotes;

    @Column(name = "reviewer_remarks", columnDefinition = "TEXT")
    private String reviewerRemarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "correctiveAction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CorrectiveActionEvidence> evidenceList = new ArrayList<>();

    public CorrectiveAction() {
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

    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }

    public QualityAssessment getAssessment() { return assessment; }
    public void setAssessment(QualityAssessment assessment) { this.assessment = assessment; }

    public WorkAssignment getAssignment() { return assignment; }
    public void setAssignment(WorkAssignment assignment) { this.assignment = assignment; }

    public QualityAssessmentFinding getFinding() { return finding; }
    public void setFinding(QualityAssessmentFinding finding) { this.finding = finding; }

    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }

    public User getAssignedInspector() { return assignedInspector; }
    public void setAssignedInspector(User assignedInspector) { this.assignedInspector = assignedInspector; }

    public CorrectiveActionType getActionType() { return actionType; }
    public void setActionType(CorrectiveActionType actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ReviewPriority getPriority() { return priority; }
    public void setPriority(ReviewPriority priority) { this.priority = priority; }

    public FindingSeverity getSeverity() { return severity; }
    public void setSeverity(FindingSeverity severity) { this.severity = severity; }

    public CorrectiveActionStatus getStatus() { return status; }
    public void setStatus(CorrectiveActionStatus status) { this.status = status; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    public String getVendorNotes() { return vendorNotes; }
    public void setVendorNotes(String vendorNotes) { this.vendorNotes = vendorNotes; }

    public String getReviewerRemarks() { return reviewerRemarks; }
    public void setReviewerRemarks(String reviewerRemarks) { this.reviewerRemarks = reviewerRemarks; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<CorrectiveActionEvidence> getEvidenceList() { return evidenceList; }
    public void setEvidenceList(List<CorrectiveActionEvidence> evidenceList) { this.evidenceList = evidenceList; }
}
