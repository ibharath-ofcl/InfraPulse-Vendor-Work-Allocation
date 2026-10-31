package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
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
    private String workZoneId;
    private String workZoneName;
    private String vendorId;
    private String vendorName;
    private String reviewerId;
    private String reviewerName;
    private ReviewStatus reviewStatus;
    private ReviewPriority priority;
    private String assessmentStatus;
    private Double evidenceCompletenessScore;
    private Integer flaggedCriteriaCount;
    private Integer failedCriteriaCount;
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
            dto.setAssessmentId(review.getAssessment().getId());
            dto.setAssessmentCode(review.getAssessment().getAssessmentCode());
            dto.setAssessmentStatus(review.getAssessment().getStatus() != null ? review.getAssessment().getStatus().name() : null);
            dto.setEvidenceCompletenessScore(review.getAssessment().getEvidenceCompletenessScore());
            dto.setFlaggedCriteriaCount(review.getAssessment().getFlaggedCriteriaCount());
            dto.setFailedCriteriaCount(review.getAssessment().getFailedCriteriaCount());
        }

        if (review.getAssignment() != null) {
            dto.setAssignmentId(review.getAssignment().getId());
            dto.setAssignmentCode(review.getAssignment().getAssignmentCode());
            dto.setTitle(review.getAssignment().getTitle());
            dto.setWorkType(review.getAssignment().getWorkType() != null ? review.getAssignment().getWorkType().name() : null);
            if (review.getAssignment().getProject() != null) {
                dto.setProjectId(review.getAssignment().getProject().getId());
                dto.setProjectName(review.getAssignment().getProject().getProjectName());
            }
            if (review.getAssignment().getWorkZone() != null) {
                dto.setWorkZoneId(review.getAssignment().getWorkZone().getId());
                dto.setWorkZoneName(review.getAssignment().getWorkZone().getZoneName());
            }
            if (review.getAssignment().getVendor() != null) {
                dto.setVendorId(review.getAssignment().getVendor().getId());
                dto.setVendorName(review.getAssignment().getVendor().getCompanyName());
            }
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

    public String getWorkZoneId() { return workZoneId; }
    public void setWorkZoneId(String workZoneId) { this.workZoneId = workZoneId; }

    public String getWorkZoneName() { return workZoneName; }
    public void setWorkZoneName(String workZoneName) { this.workZoneName = workZoneName; }

    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }

    public ReviewPriority getPriority() { return priority; }
    public void setPriority(ReviewPriority priority) { this.priority = priority; }

    public String getAssessmentStatus() { return assessmentStatus; }
    public void setAssessmentStatus(String assessmentStatus) { this.assessmentStatus = assessmentStatus; }

    public Double getEvidenceCompletenessScore() { return evidenceCompletenessScore; }
    public void setEvidenceCompletenessScore(Double evidenceCompletenessScore) { this.evidenceCompletenessScore = evidenceCompletenessScore; }

    public Integer getFlaggedCriteriaCount() { return flaggedCriteriaCount; }
    public void setFlaggedCriteriaCount(Integer flaggedCriteriaCount) { this.flaggedCriteriaCount = flaggedCriteriaCount; }

    public Integer getFailedCriteriaCount() { return failedCriteriaCount; }
    public void setFailedCriteriaCount(Integer failedCriteriaCount) { this.failedCriteriaCount = failedCriteriaCount; }

    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
