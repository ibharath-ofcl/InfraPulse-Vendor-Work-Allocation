package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.model.ReviewStatus;

import java.time.Instant;

public class HumanReviewSummaryDto {
    private String id;
    private String reviewCode;
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
    private String reviewerId;
    private String reviewerName;
    private String templateName;
    private ReviewStatus reviewStatus;
    private ReviewPriority priority;
    private String assessmentStatus;
    private Double evidenceCompletenessScore;
    private Integer passedCount = 0;
    private Integer flaggedCriteriaCount = 0;
    private Integer failedCriteriaCount = 0;
    private Integer findingsCount = 0;
    private Integer openCorrectiveActionsCount = 0;
    private Integer pendingMeasurementsCount = 0;
    private ReviewDecisionType latestDecision;
    private Instant assignedAt;
    private Instant createdAt;
    private Instant completedAt;

    public HumanReviewSummaryDto() {}

    public static HumanReviewSummaryDto fromEntity(HumanInspectionReview review) {
        HumanReviewSummaryDto dto = new HumanReviewSummaryDto();
        dto.setId(review.getId());
        dto.setReviewCode(review.getReviewCode());
        dto.setReviewStatus(review.getReviewStatus());
        dto.setPriority(review.getPriority());
        dto.setAssignedAt(review.getAssignedAt());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setCompletedAt(review.getCompletedAt());

        if (review.getReviewer() != null) {
            dto.setReviewerId(review.getReviewer().getId());
            dto.setReviewerName(review.getReviewer().getFullName());
        }

        if (review.getAssessment() != null) {
            var qa = review.getAssessment();
            dto.setAssessmentId(qa.getId());
            dto.setAssessmentCode(qa.getAssessmentCode());
            dto.setAssessmentStatus(qa.getStatus() != null ? qa.getStatus().name() : null);
            dto.setEvidenceCompletenessScore(qa.getEvidenceCompletenessScore());
            dto.setPassedCount(qa.getPassedCriteriaCount());
            dto.setFlaggedCriteriaCount(qa.getFlaggedCriteriaCount());
            dto.setFailedCriteriaCount(qa.getFailedCriteriaCount());
            dto.setFindingsCount(qa.getFindingsCount());
            if (qa.getTemplate() != null) {
                dto.setTemplateName(qa.getTemplate().getName());
            }
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

        if (review.getDecisions() != null && !review.getDecisions().isEmpty()) {
            dto.setLatestDecision(review.getDecisions().get(review.getDecisions().size() - 1).getDecisionType());
        }

        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReviewCode() { return reviewCode; }
    public void setReviewCode(String reviewCode) { this.reviewCode = reviewCode; }

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

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public String getAssignedReviewerId() { return reviewerId; }
    public String getAssignedReviewerName() { return reviewerName; }

    public String getTemplateName() { return templateName; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }

    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }

    public String getStatus() { return reviewStatus != null ? reviewStatus.name() : "PENDING"; }
    public void setStatus(ReviewStatus status) { this.reviewStatus = status; }

    public ReviewPriority getPriority() { return priority; }
    public void setPriority(ReviewPriority priority) { this.priority = priority; }

    public String getAssessmentStatus() { return assessmentStatus; }
    public void setAssessmentStatus(String assessmentStatus) { this.assessmentStatus = assessmentStatus; }

    public Double getEvidenceCompletenessScore() { return evidenceCompletenessScore; }
    public void setEvidenceCompletenessScore(Double evidenceCompletenessScore) { this.evidenceCompletenessScore = evidenceCompletenessScore; }

    public Integer getPassedCount() { return passedCount; }
    public void setPassedCount(Integer passedCount) { this.passedCount = passedCount; }

    public Integer getFlaggedCriteriaCount() { return flaggedCriteriaCount; }
    public void setFlaggedCriteriaCount(Integer flaggedCriteriaCount) { this.flaggedCriteriaCount = flaggedCriteriaCount; }

    public Integer getFlaggedCount() { return flaggedCriteriaCount; }
    public void setFlaggedCount(Integer flaggedCount) { this.flaggedCriteriaCount = flaggedCount; }

    public Integer getFailedCriteriaCount() { return failedCriteriaCount; }
    public void setFailedCriteriaCount(Integer failedCriteriaCount) { this.failedCriteriaCount = failedCriteriaCount; }

    public Integer getFailedCount() { return failedCriteriaCount; }
    public void setFailedCount(Integer failedCount) { this.failedCriteriaCount = failedCount; }

    public Integer getFindingsCount() { return findingsCount; }
    public void setFindingsCount(Integer findingsCount) { this.findingsCount = findingsCount; }

    public Integer getOpenCorrectiveActionsCount() { return openCorrectiveActionsCount; }
    public void setOpenCorrectiveActionsCount(Integer openCorrectiveActionsCount) { this.openCorrectiveActionsCount = openCorrectiveActionsCount; }

    public Integer getPendingMeasurementsCount() { return pendingMeasurementsCount; }
    public void setPendingMeasurementsCount(Integer pendingMeasurementsCount) { this.pendingMeasurementsCount = pendingMeasurementsCount; }

    public ReviewDecisionType getLatestDecision() { return latestDecision; }
    public void setLatestDecision(ReviewDecisionType latestDecision) { this.latestDecision = latestDecision; }

    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
