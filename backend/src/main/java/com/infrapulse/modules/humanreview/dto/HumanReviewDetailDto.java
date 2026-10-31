package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
import com.infrapulse.modules.quality.dto.QualityAssessmentResponse;
import com.infrapulse.modules.quality.dto.QualityFindingDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class HumanReviewDetailDto {
    private String id;
    private String reviewCode;
    private ReviewStatus reviewStatus;
    private ReviewPriority priority;
    private String reviewerId;
    private String reviewerName;
    private Instant assignedAt;
    private Instant startedAt;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;

    // Assignment & Project details for UI workspace
    private String assessmentId;
    private String assessmentCode;
    private String assignmentId;
    private String assignmentCode;
    private String title;
    private String workType;
    private String projectId;
    private String projectName;
    private String projectCode;
    private String workZoneId;
    private String workZoneName;
    private String workZoneCode;
    private String pincode;
    private String vendorId;
    private String vendorName;
    private String templateId;
    private String templateCode;
    private String templateName;
    private String templateVersion;

    // AI Metrics
    private Double evidenceCompletenessScore;
    private int totalCriteriaEvaluated;
    private int passedCount;
    private int flaggedCount;
    private int failedCount;
    private int findingsCount;
    private String evaluationSummary;
    private ReviewDecisionType latestDecision;

    private QualityAssessmentResponse assessment;
    private List<QualityFindingDto> findings = new ArrayList<>();
    private List<DecisionResponseDto> decisions = new ArrayList<>();
    private List<PhysicalMeasurementDto> physicalMeasurements = new ArrayList<>();
    private List<CorrectiveActionDto> correctiveActions = new ArrayList<>();
    private List<InspectionEscalationDto> escalations = new ArrayList<>();
    private List<InspectionEvidenceItemDto> evidenceList = new ArrayList<>();

    public HumanReviewDetailDto() {}

    public static HumanReviewDetailDto fromEntity(HumanInspectionReview review) {
        HumanReviewDetailDto dto = new HumanReviewDetailDto();
        dto.setId(review.getId());
        dto.setReviewCode(review.getReviewCode());
        dto.setReviewStatus(review.getReviewStatus());
        dto.setPriority(review.getPriority());
        dto.setAssignedAt(review.getAssignedAt());
        dto.setStartedAt(review.getStartedAt());
        dto.setCompletedAt(review.getCompletedAt());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());

        if (review.getReviewer() != null) {
            dto.setReviewerId(review.getReviewer().getId());
            dto.setReviewerName(review.getReviewer().getFullName());
        }

        if (review.getAssignment() != null) {
            var asn = review.getAssignment();
            dto.setAssignmentId(asn.getId());
            dto.setAssignmentCode(asn.getAssignmentCode());
            dto.setTitle(asn.getTitle());
            dto.setWorkType(asn.getWorkType() != null ? asn.getWorkType().name() : null);
            if (asn.getProject() != null) {
                dto.setProjectId(asn.getProject().getId());
                dto.setProjectName(asn.getProject().getProjectName());
                dto.setProjectCode(asn.getProject().getProjectCode());
            }
            if (asn.getWorkZone() != null) {
                dto.setWorkZoneId(asn.getWorkZone().getId());
                dto.setWorkZoneName(asn.getWorkZone().getZoneName());
                dto.setWorkZoneCode(asn.getWorkZone().getZoneCode());
                dto.setPincode(asn.getWorkZone().getPincode());
            }
            if (asn.getVendor() != null) {
                dto.setVendorId(asn.getVendor().getId());
                dto.setVendorName(asn.getVendor().getCompanyName());
            }
        }

        if (review.getAssessment() != null) {
            var qa = review.getAssessment();
            dto.setAssessmentId(qa.getId());
            dto.setAssessmentCode(qa.getAssessmentCode());
            dto.setEvidenceCompletenessScore(qa.getEvidenceCompletenessScore());
            dto.setTotalCriteriaEvaluated(qa.getTotalCriteriaEvaluated());
            dto.setPassedCount(qa.getPassedCriteriaCount());
            dto.setFlaggedCount(qa.getFlaggedCriteriaCount());
            dto.setFailedCount(qa.getFailedCriteriaCount());
            dto.setFindingsCount(qa.getFindingsCount());
            dto.setEvaluationSummary(qa.getEvaluationSummary());
            if (qa.getTemplate() != null) {
                dto.setTemplateId(qa.getTemplate().getId());
                dto.setTemplateCode(qa.getTemplate().getTemplateCode());
                dto.setTemplateName(qa.getTemplate().getName());
            }
            dto.setTemplateVersion(qa.getTemplateVersion());
            dto.setAssessment(QualityAssessmentResponse.fromEntity(qa));

            if (qa.getFindings() != null) {
                for (var f : qa.getFindings()) {
                    dto.getFindings().add(QualityFindingDto.fromEntity(f));
                }
            }
        }

        if (review.getDecisions() != null) {
            for (var d : review.getDecisions()) {
                dto.getDecisions().add(DecisionResponseDto.fromEntity(d));
            }
            if (!dto.getDecisions().isEmpty()) {
                dto.setLatestDecision(dto.getDecisions().get(dto.getDecisions().size() - 1).getDecisionType());
            }
        }

        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReviewCode() { return reviewCode; }
    public void setReviewCode(String reviewCode) { this.reviewCode = reviewCode; }

    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }

    public String getStatus() { return reviewStatus != null ? reviewStatus.name() : "PENDING"; }
    public void setStatus(ReviewStatus status) { this.reviewStatus = status; }

    public ReviewPriority getPriority() { return priority; }
    public void setPriority(ReviewPriority priority) { this.priority = priority; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public String getAssignedReviewerId() { return reviewerId; }
    public String getAssignedReviewerName() { return reviewerName; }

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

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getAssessmentCode() { return assessmentCode; }
    public void setAssessmentCode(String assessmentCode) { this.assessmentCode = assessmentCode; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getAssignmentCode() { return assignmentCode; }
    public void setAssignmentCode(String assignmentCode) { this.assignmentCode = assignmentCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getWorkType() { return workType; }
    public void setWorkType(String workType) { this.workType = workType; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getProjectCode() { return projectCode; }
    public void setProjectCode(String projectCode) { this.projectCode = projectCode; }

    public String getWorkZoneId() { return workZoneId; }
    public void setWorkZoneId(String workZoneId) { this.workZoneId = workZoneId; }

    public String getWorkZoneName() { return workZoneName; }
    public void setWorkZoneName(String workZoneName) { this.workZoneName = workZoneName; }

    public String getWorkZoneCode() { return workZoneCode; }
    public void setWorkZoneCode(String workZoneCode) { this.workZoneCode = workZoneCode; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

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

    public Double getEvidenceCompletenessScore() { return evidenceCompletenessScore; }
    public void setEvidenceCompletenessScore(Double evidenceCompletenessScore) { this.evidenceCompletenessScore = evidenceCompletenessScore; }

    public int getTotalCriteriaEvaluated() { return totalCriteriaEvaluated; }
    public void setTotalCriteriaEvaluated(int totalCriteriaEvaluated) { this.totalCriteriaEvaluated = totalCriteriaEvaluated; }

    public int getPassedCount() { return passedCount; }
    public void setPassedCount(int passedCount) { this.passedCount = passedCount; }

    public int getFlaggedCount() { return flaggedCount; }
    public void setFlaggedCount(int flaggedCount) { this.flaggedCount = flaggedCount; }

    public int getFailedCount() { return failedCount; }
    public void setFailedCount(int failedCount) { this.failedCount = failedCount; }

    public int getFindingsCount() { return findingsCount; }
    public void setFindingsCount(int findingsCount) { this.findingsCount = findingsCount; }

    public String getEvaluationSummary() { return evaluationSummary; }
    public void setEvaluationSummary(String evaluationSummary) { this.evaluationSummary = evaluationSummary; }

    public ReviewDecisionType getLatestDecision() { return latestDecision; }
    public void setLatestDecision(ReviewDecisionType latestDecision) { this.latestDecision = latestDecision; }

    public QualityAssessmentResponse getAssessment() { return assessment; }
    public void setAssessment(QualityAssessmentResponse assessment) { this.assessment = assessment; }

    public List<QualityFindingDto> getFindings() { return findings; }
    public void setFindings(List<QualityFindingDto> findings) { this.findings = findings; }

    public List<DecisionResponseDto> getDecisions() { return decisions; }
    public void setDecisions(List<DecisionResponseDto> decisions) { this.decisions = decisions; }

    public List<PhysicalMeasurementDto> getPhysicalMeasurements() { return physicalMeasurements; }
    public void setPhysicalMeasurements(List<PhysicalMeasurementDto> physicalMeasurements) { this.physicalMeasurements = physicalMeasurements; }

    public List<PhysicalMeasurementDto> getMeasurements() { return physicalMeasurements; }
    public void setMeasurements(List<PhysicalMeasurementDto> measurements) { this.physicalMeasurements = measurements; }

    public List<CorrectiveActionDto> getCorrectiveActions() { return correctiveActions; }
    public void setCorrectiveActions(List<CorrectiveActionDto> correctiveActions) { this.correctiveActions = correctiveActions; }

    public List<InspectionEscalationDto> getEscalations() { return escalations; }
    public void setEscalations(List<InspectionEscalationDto> escalations) { this.escalations = escalations; }

    public List<InspectionEvidenceItemDto> getEvidenceList() { return evidenceList; }
    public void setEvidenceList(List<InspectionEvidenceItemDto> evidenceList) { this.evidenceList = evidenceList; }
}
