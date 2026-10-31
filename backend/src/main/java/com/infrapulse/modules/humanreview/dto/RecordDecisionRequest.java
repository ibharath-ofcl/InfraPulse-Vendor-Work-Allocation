package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RecordDecisionRequest {

    @NotNull(message = "Decision type is required")
    private ReviewDecisionType decisionType;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String comments;

    public RecordDecisionRequest() {}

    public RecordDecisionRequest(ReviewDecisionType decisionType, String reason, String comments) {
        this.decisionType = decisionType;
        this.reason = reason;
        this.comments = comments;
    }

    public ReviewDecisionType getDecisionType() { return decisionType; }
    public void setDecisionType(ReviewDecisionType decisionType) { this.decisionType = decisionType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
}
