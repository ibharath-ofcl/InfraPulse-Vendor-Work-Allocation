package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentPolicy;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateMilestoneRequest {

    @NotBlank(message = "Milestone name is mandatory")
    private String name;

    private String description;

    @Min(value = 1, message = "Sequence number must be at least 1")
    private int sequenceNumber = 1;

    private String milestoneType;

    @NotNull(message = "Milestone value is mandatory")
    @DecimalMin(value = "0.01", message = "Milestone value must be greater than zero")
    private BigDecimal milestoneValue;

    private BigDecimal percentageOfContract;

    private LocalDate plannedStartDate;

    private LocalDate plannedEndDate;

    private LocalDate actualCompletionDate;

    private MilestoneStatus status;

    private PaymentPolicy paymentPolicy;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getSequenceNumber() {
        return sequenceNumber;
    }

    public void setSequenceNumber(int sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }

    public String getMilestoneType() {
        return milestoneType;
    }

    public void setMilestoneType(String milestoneType) {
        this.milestoneType = milestoneType;
    }

    public BigDecimal getMilestoneValue() {
        return milestoneValue;
    }

    public void setMilestoneValue(BigDecimal milestoneValue) {
        this.milestoneValue = milestoneValue;
    }

    public BigDecimal getPercentageOfContract() {
        return percentageOfContract;
    }

    public void setPercentageOfContract(BigDecimal percentageOfContract) {
        this.percentageOfContract = percentageOfContract;
    }

    public LocalDate getPlannedStartDate() {
        return plannedStartDate;
    }

    public void setPlannedStartDate(LocalDate plannedStartDate) {
        this.plannedStartDate = plannedStartDate;
    }

    public LocalDate getPlannedEndDate() {
        return plannedEndDate;
    }

    public void setPlannedEndDate(LocalDate plannedEndDate) {
        this.plannedEndDate = plannedEndDate;
    }

    public LocalDate getActualCompletionDate() {
        return actualCompletionDate;
    }

    public void setActualCompletionDate(LocalDate actualCompletionDate) {
        this.actualCompletionDate = actualCompletionDate;
    }

    public MilestoneStatus getStatus() {
        return status;
    }

    public void setStatus(MilestoneStatus status) {
        this.status = status;
    }

    public PaymentPolicy getPaymentPolicy() {
        return paymentPolicy;
    }

    public void setPaymentPolicy(PaymentPolicy paymentPolicy) {
        this.paymentPolicy = paymentPolicy;
    }
}
