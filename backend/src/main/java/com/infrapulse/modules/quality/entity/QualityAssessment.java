package com.infrapulse.modules.quality.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.quality.model.AssessmentStatus;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quality_assessments")
public class QualityAssessment {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "assessment_code", length = 64, nullable = false, unique = true)
    private String assessmentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private WorkAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private QualityInspectionTemplate template;

    @Column(name = "template_version", length = 32, nullable = false)
    private String templateVersion = "1.0.0";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 64, nullable = false)
    private AssessmentStatus status;

    @Column(name = "evidence_completeness_score", nullable = false)
    private Double evidenceCompletenessScore = 0.0;

    @Column(name = "total_criteria_evaluated", nullable = false)
    private int totalCriteriaEvaluated = 0;

    @Column(name = "passed_criteria_count", nullable = false)
    private int passedCriteriaCount = 0;

    @Column(name = "flagged_criteria_count", nullable = false)
    private int flaggedCriteriaCount = 0;

    @Column(name = "failed_criteria_count", nullable = false)
    private int failedCriteriaCount = 0;

    @Column(name = "findings_count", nullable = false)
    private int findingsCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "predecessor_assessment_id")
    private QualityAssessment predecessorAssessment;

    @Column(name = "revision_number", nullable = false)
    private int revisionNumber = 1;

    @Column(name = "evaluation_summary", columnDefinition = "TEXT")
    private String evaluationSummary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<QualityAssessmentFinding> findings = new ArrayList<>();

    public QualityAssessment() {
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

    public String getAssessmentCode() { return assessmentCode; }
    public void setAssessmentCode(String assessmentCode) { this.assessmentCode = assessmentCode; }

    public WorkAssignment getAssignment() { return assignment; }
    public void setAssignment(WorkAssignment assignment) { this.assignment = assignment; }

    public QualityInspectionTemplate getTemplate() { return template; }
    public void setTemplate(QualityInspectionTemplate template) { this.template = template; }

    public String getTemplateVersion() { return templateVersion; }
    public void setTemplateVersion(String templateVersion) { this.templateVersion = templateVersion; }

    public AssessmentStatus getStatus() { return status; }
    public void setStatus(AssessmentStatus status) { this.status = status; }

    public Double getEvidenceCompletenessScore() { return evidenceCompletenessScore; }
    public void setEvidenceCompletenessScore(Double evidenceCompletenessScore) { this.evidenceCompletenessScore = evidenceCompletenessScore; }

    public int getTotalCriteriaEvaluated() { return totalCriteriaEvaluated; }
    public void setTotalCriteriaEvaluated(int totalCriteriaEvaluated) { this.totalCriteriaEvaluated = totalCriteriaEvaluated; }

    public int getPassedCriteriaCount() { return passedCriteriaCount; }
    public void setPassedCriteriaCount(int passedCriteriaCount) { this.passedCriteriaCount = passedCriteriaCount; }

    public int getFlaggedCriteriaCount() { return flaggedCriteriaCount; }
    public void setFlaggedCriteriaCount(int flaggedCriteriaCount) { this.flaggedCriteriaCount = flaggedCriteriaCount; }

    public int getFailedCriteriaCount() { return failedCriteriaCount; }
    public void setFailedCriteriaCount(int failedCriteriaCount) { this.failedCriteriaCount = failedCriteriaCount; }

    public int getFindingsCount() { return findingsCount; }
    public void setFindingsCount(int findingsCount) { this.findingsCount = findingsCount; }

    public QualityAssessment getPredecessorAssessment() { return predecessorAssessment; }
    public void setPredecessorAssessment(QualityAssessment predecessorAssessment) { this.predecessorAssessment = predecessorAssessment; }

    public int getRevisionNumber() { return revisionNumber; }
    public void setRevisionNumber(int revisionNumber) { this.revisionNumber = revisionNumber; }

    public String getEvaluationSummary() { return evaluationSummary; }
    public void setEvaluationSummary(String evaluationSummary) { this.evaluationSummary = evaluationSummary; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<QualityAssessmentFinding> getFindings() { return findings; }
    public void setFindings(List<QualityAssessmentFinding> findings) { this.findings = findings; }
}
