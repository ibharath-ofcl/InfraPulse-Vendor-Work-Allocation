package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
import com.infrapulse.modules.quality.dto.QualityAssessmentResponse;

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

    private QualityAssessmentResponse assessment;
    private List<DecisionResponseDto> decisions = new ArrayList<>();
    private List<PhysicalMeasurementDto> physicalMeasurements = new ArrayList<>();

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

        if (review.getAssessment() != null) {
            dto.setAssessment(QualityAssessmentResponse.fromEntity(review.getAssessment()));
        }

        if (review.getDecisions() != null) {
            for (var d : review.getDecisions()) {
                dto.getDecisions().add(DecisionResponseDto.fromEntity(d));
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

    public ReviewPriority getPriority() { return priority; }
    public void setPriority(ReviewPriority priority) { this.priority = priority; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

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

    public QualityAssessmentResponse getAssessment() { return assessment; }
    public void setAssessment(QualityAssessmentResponse assessment) { this.assessment = assessment; }

    public List<DecisionResponseDto> getDecisions() { return decisions; }
    public void setDecisions(List<DecisionResponseDto> decisions) { this.decisions = decisions; }

    public List<PhysicalMeasurementDto> getPhysicalMeasurements() { return physicalMeasurements; }
    public void setPhysicalMeasurements(List<PhysicalMeasurementDto> physicalMeasurements) { this.physicalMeasurements = physicalMeasurements; }
}
