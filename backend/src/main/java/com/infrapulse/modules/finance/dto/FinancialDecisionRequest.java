package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.FinanceDecisionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class FinancialDecisionRequest {

    @NotNull(message = "Decision type is mandatory")
    private FinanceDecisionType decisionType;

    @NotBlank(message = "Reason is mandatory")
    private String reason;

    private String comments;

    private BigDecimal approvedAmount;

    public FinanceDecisionType getDecisionType() {
        return decisionType;
    }

    public void setDecisionType(FinanceDecisionType decisionType) {
        this.decisionType = decisionType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }
}
