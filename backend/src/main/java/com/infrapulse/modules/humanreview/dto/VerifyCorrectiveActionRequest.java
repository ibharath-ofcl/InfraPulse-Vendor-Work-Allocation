package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VerifyCorrectiveActionRequest {

    @NotNull(message = "Verification outcome status is required")
    private CorrectiveActionStatus status;

    @NotBlank(message = "Reviewer remarks are required")
    private String reviewerRemarks;

    public VerifyCorrectiveActionRequest() {}

    public VerifyCorrectiveActionRequest(CorrectiveActionStatus status, String reviewerRemarks) {
        this.status = status;
        this.reviewerRemarks = reviewerRemarks;
    }

    public CorrectiveActionStatus getStatus() { return status; }
    public void setStatus(CorrectiveActionStatus status) { this.status = status; }

    public String getReviewerRemarks() { return reviewerRemarks; }
    public void setReviewerRemarks(String reviewerRemarks) { this.reviewerRemarks = reviewerRemarks; }
}
