package com.infrapulse.modules.quality.dto;

import com.infrapulse.modules.quality.entity.QualityAssessment;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class QualityAssessmentResponse {
    private String id;
    private String assessmentCode;
    private String assignmentId;
    private String assignmentCode;
    private String workType;
    private String projectId;
    private String projectName;
    private String workZoneId;
    private String workZoneName;
    private String pinCode;
    private String vendorId;
    private String vendorName;
    private String templateId;
    private String templateCode;
    private String templateName;
    private String templateVersion;
    private String status;
    private Double evidenceCompletenessScore;
    private int totalCriteriaEvaluated;
    private int passedCriteriaCount;
    private int flaggedCriteriaCount;
    private int failedCriteriaCount;
    private int findingsCount;
    private String predecessorAssessmentId;
    private int revisionNumber;
    private String evaluationSummary;
    private String createdById;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
    private List<QualityFindingDto> findings = new ArrayList<>();

    public QualityAssessmentResponse() {}

    public static QualityAssessmentResponse fromEntity(QualityAssessment qa) {
        QualityAssessmentResponse r = new QualityAssessmentResponse();
        r.setId(qa.getId());
        r.setAssessmentCode(qa.getAssessmentCode());
        if (qa.getAssignment() != null) {
            r.setAssignmentId(qa.getAssignment().getId());
            r.setAssignmentCode(qa.getAssignment().getAssignmentCode());
            r.setWorkType(qa.getAssignment().getWorkType() != null ? qa.getAssignment().getWorkType().name() : null);
            if (qa.getAssignment().getProject() != null) {
                r.setProjectId(qa.getAssignment().getProject().getId());
                r.setProjectName(qa.getAssignment().getProject().getProjectName());
            }
            if (qa.getAssignment().getWorkZone() != null) {
                r.setWorkZoneId(qa.getAssignment().getWorkZone().getId());
                r.setWorkZoneName(qa.getAssignment().getWorkZone().getZoneName());
                r.setPinCode(qa.getAssignment().getWorkZone().getPincode());
            }
            if (qa.getAssignment().getVendor() != null) {
                r.setVendorId(qa.getAssignment().getVendor().getId());
                r.setVendorName(qa.getAssignment().getVendor().getCompanyName());
            }
        }
        if (qa.getTemplate() != null) {
            r.setTemplateId(qa.getTemplate().getId());
            r.setTemplateCode(qa.getTemplate().getTemplateCode());
            r.setTemplateName(qa.getTemplate().getName());
        }
        r.setTemplateVersion(qa.getTemplateVersion());
        r.setStatus(qa.getStatus() != null ? qa.getStatus().name() : "INCONCLUSIVE");
        r.setEvidenceCompletenessScore(qa.getEvidenceCompletenessScore());
        r.setTotalCriteriaEvaluated(qa.getTotalCriteriaEvaluated());
        r.setPassedCriteriaCount(qa.getPassedCriteriaCount());
        r.setFlaggedCriteriaCount(qa.getFlaggedCriteriaCount());
        r.setFailedCriteriaCount(qa.getFailedCriteriaCount());
        r.setFindingsCount(qa.getFindingsCount());
        if (qa.getPredecessorAssessment() != null) {
            r.setPredecessorAssessmentId(qa.getPredecessorAssessment().getId());
        }
        r.setRevisionNumber(qa.getRevisionNumber());
        r.setEvaluationSummary(qa.getEvaluationSummary());
        if (qa.getCreatedBy() != null) {
            r.setCreatedById(qa.getCreatedBy().getId());
            r.setCreatedByName(qa.getCreatedBy().getFullName());
        }
        r.setCreatedAt(qa.getCreatedAt());
        r.setUpdatedAt(qa.getUpdatedAt());

        if (qa.getFindings() != null) {
            r.setFindings(qa.getFindings().stream().map(QualityFindingDto::fromEntity).collect(Collectors.toList()));
        }

        return r;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentCode() { return assessmentCode; }
    public void setAssessmentCode(String assessmentCode) { this.assessmentCode = assessmentCode; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getAssignmentCode() { return assignmentCode; }
    public void setAssignmentCode(String assignmentCode) { this.assignmentCode = assignmentCode; }

    public String getWorkType() { return workType; }
    public void setWorkType(String workType) { this.workType = workType; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getWorkZoneId() { return workZoneId; }
    public void setWorkZoneId(String workZoneId) { this.workZoneId = workZoneId; }

    public String getWorkZoneName() { return workZoneName; }
    public void setWorkZoneName(String workZoneName) { this.workZoneName = workZoneName; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

    public String getTemplateCode() { return templateCode; }
    public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }

    public String getTemplateName() { return templateName; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }

    public String getTemplateVersion() { return templateVersion; }
    public void setTemplateVersion(String templateVersion) { this.templateVersion = templateVersion; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

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

    public String getPredecessorAssessmentId() { return predecessorAssessmentId; }
    public void setPredecessorAssessmentId(String predecessorAssessmentId) { this.predecessorAssessmentId = predecessorAssessmentId; }

    public int getRevisionNumber() { return revisionNumber; }
    public void setRevisionNumber(int revisionNumber) { this.revisionNumber = revisionNumber; }

    public String getEvaluationSummary() { return evaluationSummary; }
    public void setEvaluationSummary(String evaluationSummary) { this.evaluationSummary = evaluationSummary; }

    public String getCreatedById() { return createdById; }
    public void setCreatedById(String createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<QualityFindingDto> getFindings() { return findings; }
    public void setFindings(List<QualityFindingDto> findings) { this.findings = findings; }
}
