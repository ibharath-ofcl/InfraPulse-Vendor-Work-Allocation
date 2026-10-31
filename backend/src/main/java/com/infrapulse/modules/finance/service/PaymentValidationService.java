package com.infrapulse.modules.finance.service;

import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.finance.dto.FinancialCalculationBreakdownDto;
import com.infrapulse.modules.finance.dto.MilestoneEligibilityResponse;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.entity.VendorAgreement;
import com.infrapulse.modules.finance.enums.AgreementStatus;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentPolicy;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.VendorPaymentRequestRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class PaymentValidationService {

    private static final Logger log = LoggerFactory.getLogger(PaymentValidationService.class);

    private final ProjectVendorRepository projectVendorRepository;
    private final PaymentAuthorizationRepository paymentAuthorizationRepository;
    private final VendorPaymentRequestRepository paymentRequestRepository;
    private final MilestoneEligibilityService milestoneEligibilityService;

    public PaymentValidationService(
            ProjectVendorRepository projectVendorRepository,
            PaymentAuthorizationRepository paymentAuthorizationRepository,
            VendorPaymentRequestRepository paymentRequestRepository,
            MilestoneEligibilityService milestoneEligibilityService) {
        this.projectVendorRepository = projectVendorRepository;
        this.paymentAuthorizationRepository = paymentAuthorizationRepository;
        this.paymentRequestRepository = paymentRequestRepository;
        this.milestoneEligibilityService = milestoneEligibilityService;
    }

    public void validatePaymentRequestSubmission(
            ProjectMilestone milestone,
            Vendor vendor,
            String invoiceNumber,
            LocalDate invoiceDate,
            BigDecimal requestedAmount,
            String currency) {

        // A. Vendor Validation
        if (vendor == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor cannot be null");
        }
        if (vendor.getStatus() == VendorStatus.SUSPENDED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vendor " + vendor.getCompanyName() + " is currently SUSPENDED");
        }
        if (!projectVendorRepository.hasActiveAssociation(milestone.getProject().getId(), vendor.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor is not actively associated with project " + milestone.getProject().getProjectName());
        }

        // B. Agreement Validation
        VendorAgreement agreement = milestone.getAgreement();
        if (agreement == null || agreement.getStatus() != AgreementStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Milestone commercial agreement is not in ACTIVE status");
        }
        if (LocalDate.now().isAfter(agreement.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor agreement expired on " + agreement.getEndDate());
        }
        if (currency != null && !currency.equalsIgnoreCase(agreement.getCurrency())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment currency (" + currency + ") does not match agreement currency (" + agreement.getCurrency() + ")");
        }

        // C. Milestone Validation
        if (milestone.getStatus() == MilestoneStatus.PAID) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Milestone " + milestone.getMilestoneCode() + " has already been fully PAID");
        }
        if (milestone.getStatus() == MilestoneStatus.CANCELLED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Milestone " + milestone.getMilestoneCode() + " is CANCELLED");
        }

        // Re-evaluate eligibility against real persisted records
        MilestoneEligibilityResponse eligibility = milestoneEligibilityService.evaluateMilestoneEligibility(milestone.getId(), null);
        if (!eligibility.isEligible()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Milestone is not eligible for payment: " + eligibility.getReason());
        }

        // D. Amount Validation
        if (requestedAmount == null || requestedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Requested amount must be greater than zero");
        }

        BigDecimal authorizedSoFar = paymentAuthorizationRepository.sumAuthorizedAmountByMilestoneId(milestone.getId());
        BigDecimal remainingMilestoneBalance = milestone.getMilestoneValue().subtract(authorizedSoFar);

        if (requestedAmount.compareTo(remainingMilestoneBalance) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, String.format(
                    "Requested amount (%s %s) exceeds remaining milestone balance (%s %s)",
                    agreement.getCurrency(), requestedAmount, agreement.getCurrency(), remainingMilestoneBalance));
        }

        if (milestone.getPaymentPolicy() == PaymentPolicy.SINGLE_PAYMENT &&
                requestedAmount.compareTo(remainingMilestoneBalance) != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, String.format(
                    "Milestone policy is SINGLE_PAYMENT. Requested amount must equal remaining balance (%s %s)",
                    agreement.getCurrency(), remainingMilestoneBalance));
        }

        // E. Invoice Validation
        if (invoiceNumber == null || invoiceNumber.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invoice number is mandatory");
        }
        if (invoiceDate == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invoice date is mandatory");
        }
        if (invoiceDate.isAfter(LocalDate.now().plusDays(1))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invoice date cannot be in the future");
        }

        // Duplicate Invoice Check
        if (paymentRequestRepository.existsByProjectIdAndVendorIdAndInvoiceNumber(
                milestone.getProject().getId(), vendor.getId(), invoiceNumber.trim())) {
            throw new ApiException(HttpStatus.CONFLICT, "Invoice number '" + invoiceNumber + "' has already been submitted for this project and vendor");
        }
    }

    public FinancialCalculationBreakdownDto calculateBreakdown(
            BigDecimal amount,
            ProjectMilestone milestone,
            VendorAgreement agreement) {

        BigDecimal requestedAmount = amount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal milestoneValue = milestone.getMilestoneValue().setScale(2, RoundingMode.HALF_UP);

        BigDecimal authorizedSoFar = paymentAuthorizationRepository.sumAuthorizedAmountByMilestoneId(milestone.getId()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal settledSoFar = paymentAuthorizationRepository.sumSettledAmountByMilestoneId(milestone.getId()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal remainingBalance = milestoneValue.subtract(authorizedSoFar).max(BigDecimal.ZERO);

        BigDecimal retentionPct = agreement.getRetentionPercentage() != null ? agreement.getRetentionPercentage() : BigDecimal.ZERO;
        BigDecimal taxPct = agreement.getTaxPercentage() != null ? agreement.getTaxPercentage() : BigDecimal.ZERO;

        BigDecimal retentionAmount = requestedAmount.multiply(retentionPct)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal taxAmount = requestedAmount.multiply(taxPct)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal approvedAmount = requestedAmount;
        // Net payable = approved amount - retention deduction + tax component
        BigDecimal netPayable = approvedAmount.subtract(retentionAmount).add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        FinancialCalculationBreakdownDto breakdown = new FinancialCalculationBreakdownDto();
        breakdown.setRequestedAmount(requestedAmount);
        breakdown.setContractualMilestoneValue(milestoneValue);
        breakdown.setPreviousAuthorizedAmount(authorizedSoFar);
        breakdown.setPreviousSettledAmount(settledSoFar);
        breakdown.setRemainingBalance(remainingBalance);
        breakdown.setRetentionPercentage(retentionPct);
        breakdown.setRetentionAmount(retentionAmount);
        breakdown.setTaxPercentage(taxPct);
        breakdown.setTaxAmount(taxAmount);
        breakdown.setDeductions(retentionAmount);
        breakdown.setApprovedAmount(approvedAmount);
        breakdown.setNetPayableAmount(netPayable);
        breakdown.setCurrency(agreement.getCurrency());
        breakdown.setCalculationExplanation(String.format(
                "Base requested: %s %s - Retention (%s%%): %s + Tax (%s%%): %s = Net Payable: %s %s",
                agreement.getCurrency(), requestedAmount,
                retentionPct, retentionAmount,
                taxPct, taxAmount,
                agreement.getCurrency(), netPayable
        ));

        return breakdown;
    }
}
