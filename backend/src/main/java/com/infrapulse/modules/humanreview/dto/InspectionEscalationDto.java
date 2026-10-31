package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.entity.InspectionEscalation;

import java.time.Instant;

public class InspectionEscalationDto {
    private String id;
    private String assessmentId;
    private String reviewId;
    private String escalationReason;
    private String severity;
    private String escalatedById;
    private String escalatedByName;
    private String assignedRole;
    private String assignedReviewerId;
    private String assignedReviewerName;
    private String status;
    private String resolutionNotes;
    private Instant createdAt;
    private Instant resolvedAt;

    public InspectionEscalationDto() {}

    public static InspectionEscalationDto fromEntity(InspectionEscalation e) {
        InspectionEscalationDto dto = new InspectionEscalationDto();
        dto.setId(e.getId());
        if (e.getAssessment() != null) dto.setAssessmentId(e.getAssessment().getId());
        if (e.getReview() != null) dto.setReviewId(e.getReview().getId());
        dto.setEscalationReason(e.getEscalationReason());
        dto.setSeverity(e.getSeverity());
        if (e.getEscalatedBy() != null) {
            dto.setEscalatedById(e.getEscalatedBy().getId());
            dto.setEscalatedByName(e.getEscalatedBy().getFullName());
        }
        dto.setAssignedRole(e.getAssignedRole());
        if (e.getAssignedReviewer() != null) {
            dto.setAssignedReviewerId(e.getAssignedReviewer().getId());
            dto.setAssignedReviewerName(e.getAssignedReviewer().getFullName());
        }
        dto.setStatus(e.getStatus());
        dto.setResolutionNotes(e.getResolutionNotes());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setResolvedAt(e.getResolvedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }

    public String getEscalationReason() { return escalationReason; }
    public void setEscalationReason(String escalationReason) { this.escalationReason = escalationReason; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getEscalatedById() { return escalatedById; }
    public void setEscalatedById(String escalatedById) { this.escalatedById = escalatedById; }

    public String getEscalatedByName() { return escalatedByName; }
    public void setEscalatedByName(String escalatedByName) { this.escalatedByName = escalatedByName; }

    public String getAssignedRole() { return assignedRole; }
    public void setAssignedRole(String assignedRole) { this.assignedRole = assignedRole; }

    public String getAssignedReviewerId() { return assignedReviewerId; }
    public void setAssignedReviewerId(String assignedReviewerId) { this.assignedReviewerId = assignedReviewerId; }

    public String getAssignedReviewerName() { return assignedReviewerName; }
    public void setAssignedReviewerName(String assignedReviewerName) { this.assignedReviewerName = assignedReviewerName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
