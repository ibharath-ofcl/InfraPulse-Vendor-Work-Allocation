package com.infrapulse.modules.evidence.dto;

import com.infrapulse.modules.evidence.model.EvidenceReviewStatus;
import jakarta.validation.constraints.NotNull;

public class EvidenceReviewRequest {

    @NotNull(message = "Review status is required")
    private EvidenceReviewStatus reviewStatus;

    private String reviewNotes;

    public EvidenceReviewRequest() {}

    public EvidenceReviewRequest(EvidenceReviewStatus reviewStatus, String reviewNotes) {
        this.reviewStatus = reviewStatus;
        this.reviewNotes = reviewNotes;
    }

    public EvidenceReviewStatus getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(EvidenceReviewStatus reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }
}
