package com.infrapulse.modules.quality.entity;

import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.quality.model.FindingOutcome;
import com.infrapulse.modules.quality.model.FindingSeverity;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quality_assessment_findings")
public class QualityAssessmentFinding {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private QualityAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criterion_id")
    private QualityInspectionCriterion criterion;

    @Column(name = "criterion_code", length = 50, nullable = false)
    private String criterionCode;

    @Column(name = "criterion_name", length = 200, nullable = false)
    private String criterionName;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 32, nullable = false)
    private FindingSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", length = 64, nullable = false)
    private FindingOutcome outcome;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id")
    private WorkEvidence evidence;

    @Column(name = "detection_id", length = 36)
    private String detectionId;

    @Column(name = "technical_notes", columnDefinition = "TEXT")
    private String technicalNotes;

    @Column(name = "suggested_action", columnDefinition = "TEXT")
    private String suggestedAction;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public QualityAssessmentFinding() {
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

    public QualityInspectionCriterion getCriterion() { return criterion; }
    public void setCriterion(QualityInspectionCriterion criterion) { this.criterion = criterion; }

    public String getCriterionCode() { return criterionCode; }
    public void setCriterionCode(String criterionCode) { this.criterionCode = criterionCode; }

    public String getCriterionName() { return criterionName; }
    public void setCriterionName(String criterionName) { this.criterionName = criterionName; }

    public FindingSeverity getSeverity() { return severity; }
    public void setSeverity(FindingSeverity severity) { this.severity = severity; }

    public FindingOutcome getOutcome() { return outcome; }
    public void setOutcome(FindingOutcome outcome) { this.outcome = outcome; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public WorkEvidence getEvidence() { return evidence; }
    public void setEvidence(WorkEvidence evidence) { this.evidence = evidence; }

    public String getDetectionId() { return detectionId; }
    public void setDetectionId(String detectionId) { this.detectionId = detectionId; }

    public String getTechnicalNotes() { return technicalNotes; }
    public void setTechnicalNotes(String technicalNotes) { this.technicalNotes = technicalNotes; }

    public String getSuggestedAction() { return suggestedAction; }
    public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
