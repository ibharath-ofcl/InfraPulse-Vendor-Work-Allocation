package com.infrapulse.modules.finance.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MilestoneEligibilityResponse {

    private String milestoneId;
    private String milestoneCode;
    private String milestoneName;
    private boolean eligible;
    private String reason;
    private List<String> blockingConditions = new ArrayList<>();
    private Map<String, Boolean> checklist = new HashMap<>();
    private BigDecimal milestoneValue;
    private BigDecimal remainingPayableAmount;
    private String currency;

    public String getMilestoneId() {
        return milestoneId;
    }

    public void setMilestoneId(String milestoneId) {
        this.milestoneId = milestoneId;
    }

    public String getMilestoneCode() {
        return milestoneCode;
    }

    public void setMilestoneCode(String milestoneCode) {
        this.milestoneCode = milestoneCode;
    }

    public String getMilestoneName() {
        return milestoneName;
    }

    public void setMilestoneName(String milestoneName) {
        this.milestoneName = milestoneName;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public List<String> getBlockingConditions() {
        return blockingConditions;
    }

    public void setBlockingConditions(List<String> blockingConditions) {
        this.blockingConditions = blockingConditions;
    }

    public Map<String, Boolean> getChecklist() {
        return checklist;
    }

    public void setChecklist(Map<String, Boolean> checklist) {
        this.checklist = checklist;
    }

    public BigDecimal getMilestoneValue() {
        return milestoneValue;
    }

    public void setMilestoneValue(BigDecimal milestoneValue) {
        this.milestoneValue = milestoneValue;
    }

    public BigDecimal getRemainingPayableAmount() {
        return remainingPayableAmount;
    }

    public void setRemainingPayableAmount(BigDecimal remainingPayableAmount) {
        this.remainingPayableAmount = remainingPayableAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
