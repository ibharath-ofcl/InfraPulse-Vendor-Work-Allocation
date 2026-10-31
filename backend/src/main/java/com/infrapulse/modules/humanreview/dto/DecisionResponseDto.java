package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;

import java.time.Instant;

public class DecisionResponseDto {
    private String id;
    private String reviewId;
    private String assessmentId;
    private String assignmentId;
    private ReviewDecisionType decisionType;
    private String reviewerId;
    private String reviewerName;
    private String reviewerRole;
    private String reason;
    private String comments;
    private String previousDecisionId;
    private Instant decidedAt;

    public DecisionResponseDto() {}

    public static DecisionResponseDto fromEntity(HumanInspectionDecision d) {
        DecisionResponseDto dto = new DecisionResponseDto();
        dto.setId(d.getId());
        if (d.getReview() != null) dto.setReviewId(d.getReview().getId());
        if (d.getAssessment() != null) dto.setAssessmentId(d.getAssessment().getId());
        if (d.getAssignment() != null) dto.setAssignmentId(d.getAssignment().getId());
        dto.setDecisionType(d.getDecisionType());
        if (d.getReviewer() != null) {
            dto.setReviewerId(d.getReviewer().getId());
            dto.setReviewerName(d.getReviewer().getFullName());
        }
        dto.setReviewerRole(d.getReviewerRole());
        dto.setReason(d.getReason());
        dto.setComments(d.getComments());
        if (d.getPreviousDecision() != null) dto.setPreviousDecisionId(d.getPreviousDecision().getId());
        dto.setDecidedAt(d.getDecidedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public ReviewDecisionType getDecisionType() { return decisionType; }
    public void setDecisionType(ReviewDecisionType decisionType) { this.decisionType = decisionType; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public String getReviewerRole() { return reviewerRole; }
    public void setReviewerRole(String reviewerRole) { this.reviewerRole = reviewerRole; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public String getPreviousDecisionId() { return previousDecisionId; }
    public void setPreviousDecisionId(String previousDecisionId) { this.previousDecisionId = previousDecisionId; }

    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
}
