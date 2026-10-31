package com.infrapulse.modules.humanreview.dto;

import jakarta.validation.constraints.NotBlank;

public class SubmitCorrectiveEvidenceRequest {

    @NotBlank(message = "Evidence ID is required")
    private String evidenceId;

    private String submissionType = "REWORK_COMPLETION";
    private String remarks;
    private String vendorNotes;

    public SubmitCorrectiveEvidenceRequest() {}

    public SubmitCorrectiveEvidenceRequest(String evidenceId, String remarks, String vendorNotes) {
        this.evidenceId = evidenceId;
        this.remarks = remarks;
        this.vendorNotes = vendorNotes;
    }

    public String getEvidenceId() { return evidenceId; }
    public void setEvidenceId(String evidenceId) { this.evidenceId = evidenceId; }

    public String getSubmissionType() { return submissionType; }
    public void setSubmissionType(String submissionType) { this.submissionType = submissionType; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getVendorNotes() { return vendorNotes; }
    public void setVendorNotes(String vendorNotes) { this.vendorNotes = vendorNotes; }
}
