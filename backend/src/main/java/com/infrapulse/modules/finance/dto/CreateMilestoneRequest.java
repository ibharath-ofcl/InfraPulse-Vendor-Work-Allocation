package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.PaymentPolicy;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CreateMilestoneRequest {

    @NotBlank(message = "Project ID is mandatory")
    private String projectId;

    @NotBlank(message = "Agreement ID is mandatory")
    private String agreementId;

    @NotBlank(message = "Vendor ID is mandatory")
    private String vendorId;

    @NotBlank(message = "Milestone name is mandatory")
    private String name;

    private String description;

    @Min(value = 1, message = "Sequence number must be at least 1")
    private int sequenceNumber = 1;

    private String milestoneType;

    @NotNull(message = "Milestone value is mandatory")
    @DecimalMin(value = "0.01", message = "Milestone value must be greater than zero")
    private BigDecimal milestoneValue;

    private String currency = "USD";

    private BigDecimal percentageOfContract;

    private LocalDate plannedStartDate;

    private LocalDate plannedEndDate;

    private PaymentPolicy paymentPolicy = PaymentPolicy.SINGLE_PAYMENT;

    private List<String> assignmentIds = new ArrayList<>();

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getAgreementId() {
        return agreementId;
    }

    public void setAgreementId(String agreementId) {
        this.agreementId = agreementId;
    }

    public String getVendorId() {
        return vendorId;
    }

    public void setVendorId(String vendorId) {
        this.vendorId = vendorId;
    }

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

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
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

    public PaymentPolicy getPaymentPolicy() {
        return paymentPolicy;
    }

    public void setPaymentPolicy(PaymentPolicy paymentPolicy) {
        this.paymentPolicy = paymentPolicy;
    }

    public List<String> getAssignmentIds() {
        return assignmentIds;
    }

    public void setAssignmentIds(List<String> assignmentIds) {
        this.assignmentIds = assignmentIds;
    }
}
