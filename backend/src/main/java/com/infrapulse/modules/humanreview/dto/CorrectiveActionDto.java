package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.CorrectiveActionType;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.quality.model.FindingSeverity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class CorrectiveActionDto {
    private String id;
    private String actionCode;
    private String assessmentId;
    private String assignmentId;
    private String assignmentCode;
    private String assignmentTitle;
    private String findingId;
    private String vendorId;
    private String vendorName;
    private String assignedInspectorId;
    private String assignedInspectorName;
    private CorrectiveActionType actionType;
    private String description;
    private ReviewPriority priority;
    private FindingSeverity severity;
    private CorrectiveActionStatus status;
    private Instant dueAt;
    private Instant submittedAt;
    private Instant verifiedAt;
    private Instant closedAt;
    private String vendorNotes;
    private String reviewerRemarks;
    private String createdById;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
    private List<CorrectiveEvidenceDto> evidenceList = new ArrayList<>();

    public static class CorrectiveEvidenceDto {
        private String id;
        private String evidenceId;
        private String evidenceCode;
        private String fileUrl;
        private String submissionType;
        private String submittedByName;
        private Instant submittedAt;
        private String remarks;

        public CorrectiveEvidenceDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEvidenceId() { return evidenceId; }
        public void setEvidenceId(String evidenceId) { this.evidenceId = evidenceId; }
        public String getEvidenceCode() { return evidenceCode; }
        public void setEvidenceCode(String evidenceCode) { this.evidenceCode = evidenceCode; }
        public String getFileUrl() { return fileUrl; }
        public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
        public String getSubmissionType() { return submissionType; }
        public void setSubmissionType(String submissionType) { this.submissionType = submissionType; }
        public String getSubmittedByName() { return submittedByName; }
        public void setSubmittedByName(String submittedByName) { this.submittedByName = submittedByName; }
        public Instant getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    public CorrectiveActionDto() {}

    public static CorrectiveActionDto fromEntity(CorrectiveAction ca) {
        CorrectiveActionDto dto = new CorrectiveActionDto();
        dto.setId(ca.getId());
        dto.setActionCode(ca.getActionCode());
        if (ca.getAssessment() != null) dto.setAssessmentId(ca.getAssessment().getId());
        if (ca.getAssignment() != null) {
            dto.setAssignmentId(ca.getAssignment().getId());
            dto.setAssignmentCode(ca.getAssignment().getAssignmentCode());
            dto.setAssignmentTitle(ca.getAssignment().getTitle());
        }
        if (ca.getFinding() != null) dto.setFindingId(ca.getFinding().getId());
        if (ca.getVendor() != null) {
            dto.setVendorId(ca.getVendor().getId());
            dto.setVendorName(ca.getVendor().getCompanyName());
        }
        if (ca.getAssignedInspector() != null) {
            dto.setAssignedInspectorId(ca.getAssignedInspector().getId());
            dto.setAssignedInspectorName(ca.getAssignedInspector().getFullName());
        }
        dto.setActionType(ca.getActionType());
        dto.setDescription(ca.getDescription());
        dto.setPriority(ca.getPriority());
        dto.setSeverity(ca.getSeverity());
        dto.setStatus(ca.getStatus());
        dto.setDueAt(ca.getDueAt());
        dto.setSubmittedAt(ca.getSubmittedAt());
        dto.setVerifiedAt(ca.getVerifiedAt());
        dto.setClosedAt(ca.getClosedAt());
        dto.setVendorNotes(ca.getVendorNotes());
        dto.setReviewerRemarks(ca.getReviewerRemarks());
        if (ca.getCreatedBy() != null) {
            dto.setCreatedById(ca.getCreatedBy().getId());
            dto.setCreatedByName(ca.getCreatedBy().getFullName());
        }
        dto.setCreatedAt(ca.getCreatedAt());
        dto.setUpdatedAt(ca.getUpdatedAt());

        if (ca.getEvidenceList() != null) {
            for (var ev : ca.getEvidenceList()) {
                CorrectiveEvidenceDto evDto = new CorrectiveEvidenceDto();
                evDto.setId(ev.getId());
                if (ev.getEvidence() != null) {
                    evDto.setEvidenceId(ev.getEvidence().getId());
                    evDto.setEvidenceCode(ev.getEvidence().getEvidenceCode());
                    evDto.setFileUrl(ev.getEvidence().getStorageKey());
                }
                evDto.setSubmissionType(ev.getSubmissionType());
                if (ev.getSubmittedBy() != null) {
                    evDto.setSubmittedByName(ev.getSubmittedBy().getFullName());
                }
                evDto.setSubmittedAt(ev.getSubmittedAt());
                evDto.setRemarks(ev.getRemarks());
                dto.getEvidenceList().add(evDto);
            }
        }
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getAssignmentCode() { return assignmentCode; }
    public void setAssignmentCode(String assignmentCode) { this.assignmentCode = assignmentCode; }

    public String getAssignmentTitle() { return assignmentTitle; }
    public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }

    public String getFindingId() { return findingId; }
    public void setFindingId(String findingId) { this.findingId = findingId; }

    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getAssignedInspectorId() { return assignedInspectorId; }
    public void setAssignedInspectorId(String assignedInspectorId) { this.assignedInspectorId = assignedInspectorId; }

    public String getAssignedInspectorName() { return assignedInspectorName; }
    public void setAssignedInspectorName(String assignedInspectorName) { this.assignedInspectorName = assignedInspectorName; }

    public CorrectiveActionType getActionType() { return actionType; }
    public void setActionType(CorrectiveActionType actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ReviewPriority getPriority() { return priority; }
    public void setPriority(ReviewPriority priority) { this.priority = priority; }

    public FindingSeverity getSeverity() { return severity; }
    public void setSeverity(FindingSeverity severity) { this.severity = severity; }

    public CorrectiveActionStatus getStatus() { return status; }
    public void setStatus(CorrectiveActionStatus status) { this.status = status; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    public String getVendorNotes() { return vendorNotes; }
    public void setVendorNotes(String vendorNotes) { this.vendorNotes = vendorNotes; }

    public String getReviewerRemarks() { return reviewerRemarks; }
    public void setReviewerRemarks(String reviewerRemarks) { this.reviewerRemarks = reviewerRemarks; }

    public String getCreatedById() { return createdById; }
    public void setCreatedById(String createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<CorrectiveEvidenceDto> getEvidenceList() { return evidenceList; }
    public void setEvidenceList(List<CorrectiveEvidenceDto> evidenceList) { this.evidenceList = evidenceList; }
}
