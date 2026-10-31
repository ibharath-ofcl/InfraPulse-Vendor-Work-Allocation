package com.infrapulse.modules.quality.dto;

import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;

import java.time.Instant;

public class QualityFindingDto {
    private String id;
    private String criterionId;
    private String criterionCode;
    private String criterionName;
    private String severity;
    private String outcome;
    private String title;
    private String description;
    private String evidenceId;
    private String detectionId;
    private String technicalNotes;
    private String suggestedAction;
    private Instant createdAt;

    public QualityFindingDto() {}

    public static QualityFindingDto fromEntity(QualityAssessmentFinding f) {
        QualityFindingDto dto = new QualityFindingDto();
        dto.setId(f.getId());
        dto.setCriterionId(f.getCriterion() != null ? f.getCriterion().getId() : null);
        dto.setCriterionCode(f.getCriterionCode());
        dto.setCriterionName(f.getCriterionName());
        dto.setSeverity(f.getSeverity() != null ? f.getSeverity().name() : "HIGH");
        dto.setOutcome(f.getOutcome() != null ? f.getOutcome().name() : "INCONCLUSIVE");
        dto.setTitle(f.getTitle());
        dto.setDescription(f.getDescription());
        dto.setEvidenceId(f.getEvidence() != null ? f.getEvidence().getId() : null);
        dto.setDetectionId(f.getDetectionId());
        dto.setTechnicalNotes(f.getTechnicalNotes());
        dto.setSuggestedAction(f.getSuggestedAction());
        dto.setCreatedAt(f.getCreatedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCriterionId() { return criterionId; }
    public void setCriterionId(String criterionId) { this.criterionId = criterionId; }

    public String getCriterionCode() { return criterionCode; }
    public void setCriterionCode(String criterionCode) { this.criterionCode = criterionCode; }

    public String getCriterionName() { return criterionName; }
    public void setCriterionName(String criterionName) { this.criterionName = criterionName; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEvidenceId() { return evidenceId; }
    public void setEvidenceId(String evidenceId) { this.evidenceId = evidenceId; }

    public String getDetectionId() { return detectionId; }
    public void setDetectionId(String detectionId) { this.detectionId = detectionId; }

    public String getTechnicalNotes() { return technicalNotes; }
    public void setTechnicalNotes(String technicalNotes) { this.technicalNotes = technicalNotes; }

    public String getSuggestedAction() { return suggestedAction; }
    public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
