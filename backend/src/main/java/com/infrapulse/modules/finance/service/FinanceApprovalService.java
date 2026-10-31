package com.infrapulse.modules.finance.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.FinancialApprovalDecisionResponse;
import com.infrapulse.modules.finance.dto.FinancialDecisionRequest;
import com.infrapulse.modules.finance.dto.MilestoneEligibilityResponse;
import com.infrapulse.modules.finance.dto.VendorPaymentRequestResponse;
import com.infrapulse.modules.finance.dto.VerifyInvoiceRequest;
import com.infrapulse.modules.finance.entity.FinancialApprovalDecision;
import com.infrapulse.modules.finance.entity.InvoiceVerification;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.entity.VendorPaymentRequest;
import com.infrapulse.modules.finance.enums.FinanceDecisionType;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import com.infrapulse.modules.finance.repository.FinancialApprovalDecisionRepository;
import com.infrapulse.modules.finance.repository.InvoiceVerificationRepository;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.finance.repository.VendorPaymentRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class FinanceApprovalService {

    private static final Logger log = LoggerFactory.getLogger(FinanceApprovalService.class);

    private final VendorPaymentRequestRepository paymentRequestRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final InvoiceVerificationRepository invoiceVerificationRepository;
    private final FinancialApprovalDecisionRepository decisionRepository;
    private final PaymentAuthorizationRepository paymentAuthorizationRepository;
    private final MilestoneEligibilityService milestoneEligibilityService;
    private final VendorPaymentRequestService vendorPaymentRequestService;
    private final AuditService auditService;

    public FinanceApprovalService(
            VendorPaymentRequestRepository paymentRequestRepository,
            ProjectMilestoneRepository milestoneRepository,
            InvoiceVerificationRepository invoiceVerificationRepository,
            FinancialApprovalDecisionRepository decisionRepository,
            PaymentAuthorizationRepository paymentAuthorizationRepository,
            MilestoneEligibilityService milestoneEligibilityService,
            VendorPaymentRequestService vendorPaymentRequestService,
            AuditService auditService) {
        this.paymentRequestRepository = paymentRequestRepository;
        this.milestoneRepository = milestoneRepository;
        this.invoiceVerificationRepository = invoiceVerificationRepository;
        this.decisionRepository = decisionRepository;
        this.paymentAuthorizationRepository = paymentAuthorizationRepository;
        this.milestoneEligibilityService = milestoneEligibilityService;
        this.vendorPaymentRequestService = vendorPaymentRequestService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<VendorPaymentRequestResponse> getFinanceReviewQueue(Pageable pageable) {
        List<PaymentRequestStatus> queueStatuses = Arrays.asList(
                PaymentRequestStatus.SUBMITTED,
                PaymentRequestStatus.UNDER_FINANCIAL_REVIEW,
                PaymentRequestStatus.CLARIFICATION_REQUIRED
        );
        return paymentRequestRepository.findByStatusIn(queueStatuses, pageable)
                .map(vendorPaymentRequestService::mapToResponse);
    }

    @Transactional
    public VendorPaymentRequestResponse verifyInvoice(
            String requestId,
            VerifyInvoiceRequest request,
            User reviewer) {

        VendorPaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment request not found with id: " + requestId));

        InvoiceVerification iv = new InvoiceVerification();
        iv.setPaymentRequest(pr);
        iv.setVerifiedBy(reviewer);
        iv.setVerificationStatus(request.getVerificationStatus());
        iv.setVerificationReason(request.getVerificationReason());
        invoiceVerificationRepository.save(iv);

        pr.setFinanceReviewer(reviewer);
        if (pr.getStatus() == PaymentRequestStatus.SUBMITTED) {
            pr.setStatus(PaymentRequestStatus.UNDER_FINANCIAL_REVIEW);
        }
        paymentRequestRepository.save(pr);

        auditService.recordEvent(
                reviewer != null ? reviewer.getId() : null,
                "INVOICE_VERIFIED",
                "PAYMENT_REQUEST",
                pr.getId(),
                "Invoice " + pr.getInvoiceNumber() + " verification recorded: " + request.getVerificationStatus(),
                request.getVerificationReason()
        );

        return vendorPaymentRequestService.mapToResponse(pr);
    }

    @Transactional
    public VendorPaymentRequestResponse recordDecision(
            String requestId,
            FinancialDecisionRequest request,
            User reviewer) {

        VendorPaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment request not found with id: " + requestId));

        // Separation of duties: Reviewer cannot approve their own submission
        if (pr.getCreatedBy() != null && pr.getCreatedBy().getId().equals(reviewer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Separation of duties violation: You cannot review or approve a payment request that you submitted");
        }

        if (pr.getStatus() == PaymentRequestStatus.AUTHORIZED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot modify a payment request that has already been AUTHORIZED");
        }

        ProjectMilestone milestone = pr.getMilestone();
        BigDecimal approvedAmount = request.getApprovedAmount() != null
                ? request.getApprovedAmount()
                : pr.getRequestedAmount();

        Optional<FinancialApprovalDecision> prevDec = decisionRepository.findFirstByPaymentRequestIdOrderByDecidedAtDesc(pr.getId());

        FinancialApprovalDecision decision = new FinancialApprovalDecision();
        decision.setPaymentRequest(pr);
        decision.setReviewer(reviewer);
        decision.setReviewerRole(reviewer.getRole().name());
        decision.setDecisionType(request.getDecisionType());
        decision.setReason(request.getReason());
        decision.setComments(request.getComments());
        prevDec.ifPresent(decision::setPreviousDecision);

        switch (request.getDecisionType()) {
            case APPROVE -> {
                // Re-evaluate eligibility against real persisted records
                MilestoneEligibilityResponse eligibility = milestoneEligibilityService.evaluateMilestoneEligibility(milestone.getId(), reviewer);
                if (!eligibility.isEligible()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot approve payment request: Milestone is not eligible. Reason: " + eligibility.getReason());
                }

                // Balance check
                BigDecimal authorizedSoFar = paymentAuthorizationRepository.sumAuthorizedAmountByMilestoneId(milestone.getId());
                BigDecimal remaining = milestone.getMilestoneValue().subtract(authorizedSoFar);
                if (approvedAmount.compareTo(remaining) > 0) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, String.format(
                            "Approved amount (%s %s) exceeds remaining milestone balance (%s %s)",
                            milestone.getCurrency(), approvedAmount, milestone.getCurrency(), remaining));
                }

                decision.setApprovedAmount(approvedAmount);
                pr.setStatus(PaymentRequestStatus.APPROVED);
                pr.setFinanceReviewer(reviewer);
                pr.setDecisionReason(request.getReason());

                milestone.setStatus(MilestoneStatus.PAYMENT_APPROVED);
                milestoneRepository.save(milestone);
            }
            case REJECT -> {
                pr.setStatus(PaymentRequestStatus.REJECTED);
                pr.setFinanceReviewer(reviewer);
                pr.setDecisionReason(request.getReason());
            }
            case REQUEST_CLARIFICATION -> {
                pr.setStatus(PaymentRequestStatus.CLARIFICATION_REQUIRED);
                pr.setFinanceReviewer(reviewer);
                pr.setDecisionReason(request.getReason());
            }
            case HOLD -> {
                pr.setStatus(PaymentRequestStatus.UNDER_FINANCIAL_REVIEW);
                pr.setFinanceReviewer(reviewer);
                pr.setDecisionReason("[ON HOLD]: " + request.getReason());
            }
        }

        decisionRepository.save(decision);
        VendorPaymentRequest updated = paymentRequestRepository.save(pr);

        auditService.recordEvent(
                reviewer != null ? reviewer.getId() : null,
                "FINANCIAL_DECISION_" + request.getDecisionType(),
                "PAYMENT_REQUEST",
                updated.getId(),
                "Finance decision recorded: " + request.getDecisionType() + " for request " + updated.getPaymentRequestCode(),
                request.getReason()
        );

        log.info("Finance decision recorded: requestId={}, decision={}, reviewer={}",
                updated.getId(), request.getDecisionType(), reviewer.getEmail());

        return vendorPaymentRequestService.mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<FinancialApprovalDecisionResponse> getDecisionHistory(String requestId) {
        return decisionRepository.findByPaymentRequestIdOrderByDecidedAtDesc(requestId).stream().map(d -> {
            FinancialApprovalDecisionResponse dto = new FinancialApprovalDecisionResponse();
            dto.setId(d.getId());
            dto.setPaymentRequestId(d.getPaymentRequest().getId());
            dto.setReviewerId(d.getReviewer().getId());
            dto.setReviewerName(d.getReviewer().getFullName());
            dto.setReviewerRole(d.getReviewerRole());
            dto.setDecisionType(d.getDecisionType());
            dto.setReason(d.getReason());
            dto.setComments(d.getComments());
            dto.setApprovedAmount(d.getApprovedAmount());
            if (d.getPreviousDecision() != null) {
                dto.setPreviousDecisionId(d.getPreviousDecision().getId());
            }
            dto.setDecidedAt(d.getDecidedAt());
            return dto;
        }).toList();
    }
}
