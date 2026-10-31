package com.infrapulse.modules.finance.dto;

import java.math.BigDecimal;

public class FinancialCalculationBreakdownDto {

    private BigDecimal requestedAmount;
    private BigDecimal contractualMilestoneValue;
    private BigDecimal previousAuthorizedAmount;
    private BigDecimal previousSettledAmount;
    private BigDecimal remainingBalance;
    private BigDecimal retentionPercentage;
    private BigDecimal retentionAmount;
    private BigDecimal taxPercentage;
    private BigDecimal taxAmount;
    private BigDecimal deductions = BigDecimal.ZERO;
    private BigDecimal approvedAmount;
    private BigDecimal netPayableAmount;
    private String currency;
    private String calculationExplanation;

    public BigDecimal getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(BigDecimal requestedAmount) {
        this.requestedAmount = requestedAmount;
    }

    public BigDecimal getContractualMilestoneValue() {
        return contractualMilestoneValue;
    }

    public void setContractualMilestoneValue(BigDecimal contractualMilestoneValue) {
        this.contractualMilestoneValue = contractualMilestoneValue;
    }

    public BigDecimal getPreviousAuthorizedAmount() {
        return previousAuthorizedAmount;
    }

    public void setPreviousAuthorizedAmount(BigDecimal previousAuthorizedAmount) {
        this.previousAuthorizedAmount = previousAuthorizedAmount;
    }

    public BigDecimal getPreviousSettledAmount() {
        return previousSettledAmount;
    }

    public void setPreviousSettledAmount(BigDecimal previousSettledAmount) {
        this.previousSettledAmount = previousSettledAmount;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(BigDecimal remainingBalance) {
        this.remainingBalance = remainingBalance;
    }

    public BigDecimal getRetentionPercentage() {
        return retentionPercentage;
    }

    public void setRetentionPercentage(BigDecimal retentionPercentage) {
        this.retentionPercentage = retentionPercentage;
    }

    public BigDecimal getRetentionAmount() {
        return retentionAmount;
    }

    public void setRetentionAmount(BigDecimal retentionAmount) {
        this.retentionAmount = retentionAmount;
    }

    public BigDecimal getTaxPercentage() {
        return taxPercentage;
    }

    public void setTaxPercentage(BigDecimal taxPercentage) {
        this.taxPercentage = taxPercentage;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getDeductions() {
        return deductions;
    }

    public void setDeductions(BigDecimal deductions) {
        this.deductions = deductions;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public BigDecimal getNetPayableAmount() {
        return netPayableAmount;
    }

    public void setNetPayableAmount(BigDecimal netPayableAmount) {
        this.netPayableAmount = netPayableAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCalculationExplanation() {
        return calculationExplanation;
    }

    public void setCalculationExplanation(String calculationExplanation) {
        this.calculationExplanation = calculationExplanation;
    }
}
