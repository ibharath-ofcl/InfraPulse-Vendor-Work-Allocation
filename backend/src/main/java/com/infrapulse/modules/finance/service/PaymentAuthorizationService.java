package com.infrapulse.modules.finance.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.AuthorizePaymentRequest;
import com.infrapulse.modules.finance.dto.FinancialTransactionResponse;
import com.infrapulse.modules.finance.dto.MilestoneEligibilityResponse;
import com.infrapulse.modules.finance.dto.PaymentAuthorizationResponse;
import com.infrapulse.modules.finance.entity.*;
import com.infrapulse.modules.finance.enums.*;
import com.infrapulse.modules.finance.repository.*;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentAuthorizationService {

    private static final Logger log = LoggerFactory.getLogger(PaymentAuthorizationService.class);

    private final PaymentAuthorizationRepository authorizationRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final VendorPaymentRequestRepository paymentRequestRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final MilestoneEligibilityService milestoneEligibilityService;
    private final AuditService auditService;
    private final EntityManager entityManager;

    public PaymentAuthorizationService(
            PaymentAuthorizationRepository authorizationRepository,
            FinancialTransactionRepository transactionRepository,
            VendorPaymentRequestRepository paymentRequestRepository,
            ProjectMilestoneRepository milestoneRepository,
            MilestoneEligibilityService milestoneEligibilityService,
            AuditService auditService,
            EntityManager entityManager) {
        this.authorizationRepository = authorizationRepository;
        this.transactionRepository = transactionRepository;
        this.paymentRequestRepository = paymentRequestRepository;
        this.milestoneRepository = milestoneRepository;
        this.milestoneEligibilityService = milestoneEligibilityService;
        this.auditService = auditService;
        this.entityManager = entityManager;
    }

    @Transactional
    public PaymentAuthorizationResponse authorizePayment(
            String requestId,
            AuthorizePaymentRequest request,
            User authorizer) {

        // Idempotency check: Return existing authorization if already processed
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<PaymentAuthorization> existingAuth = authorizationRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existingAuth.isPresent()) {
                log.info("Idempotent hit for payment authorization: key={}", request.getIdempotencyKey());
                return mapToResponse(existingAuth.get());
            }
        }

        VendorPaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment request not found with id: " + requestId));

        if (pr.getStatus() != PaymentRequestStatus.APPROVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment request must be in APPROVED status to authorize payment (current: " + pr.getStatus() + ")");
        }

        // Separation of duties: Authorizer cannot be the vendor applicant
        if (pr.getCreatedBy() != null && pr.getCreatedBy().getId().equals(authorizer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Separation of duties violation: You cannot authorize a payment request that you submitted");
        }

        ProjectMilestone milestone = pr.getMilestone();

        // Revalidate eligibility against persisted records
        MilestoneEligibilityResponse eligibility = milestoneEligibilityService.evaluateMilestoneEligibility(milestone.getId(), authorizer);
        if (!eligibility.isEligible()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot authorize payment: Milestone eligibility check failed. Reason: " + eligibility.getReason());
        }

        BigDecimal authorizedAmount = request.getAuthorizedAmount() != null
                ? request.getAuthorizedAmount()
                : pr.getRequestedAmount();

        if (authorizedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Authorized amount must be greater than zero");
        }

        // Concurrency-safe remaining balance check
        BigDecimal authorizedSoFar = authorizationRepository.sumAuthorizedAmountByMilestoneId(milestone.getId());
        BigDecimal remaining = milestone.getMilestoneValue().subtract(authorizedSoFar);

        if (authorizedAmount.compareTo(remaining) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, String.format(
                    "Authorized amount (%s %s) exceeds remaining milestone balance (%s %s)",
                    milestone.getCurrency(), authorizedAmount, milestone.getCurrency(), remaining));
        }

        String paymentCode = generatePaymentCode();
        String authRef = "AUTH-SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String idempotencyKey = (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank())
                ? request.getIdempotencyKey()
                : UUID.randomUUID().toString();

        PaymentAuthorization pa = new PaymentAuthorization();
        pa.setPaymentCode(paymentCode);
        pa.setPaymentRequest(pr);
        pa.setProject(milestone.getProject());
        pa.setMilestone(milestone);
        pa.setVendor(milestone.getVendor());
        pa.setAuthorizedAmount(authorizedAmount);
        pa.setCurrency(milestone.getCurrency());
        pa.setAuthorizationReference(authRef);
        pa.setStatus(PaymentAuthorizationStatus.AUTHORIZED);
        pa.setSimulationDisclaimer("SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED");
        pa.setAuthorizedBy(authorizer);
        pa.setIdempotencyKey(idempotencyKey);

        PaymentAuthorization saved = authorizationRepository.save(pa);

        // Create transaction record for authorization
        FinancialTransaction txn = new FinancialTransaction();
        txn.setPaymentAuthorization(saved);
        txn.setTransactionType(TransactionType.SIMULATED_AUTHORIZATION);
        txn.setAmount(authorizedAmount);
        txn.setCurrency(milestone.getCurrency());
        txn.setTransactionReference("TXN-SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        txn.setStatus(TransactionStatus.SUCCESS);
        txn.setDescription("Simulated payment authorization for invoice " + pr.getInvoiceNumber());
        txn.setSimulationMode(true);
        transactionRepository.save(txn);

        // Update payment request state
        pr.setStatus(PaymentRequestStatus.AUTHORIZED);
        paymentRequestRepository.save(pr);

        // Update milestone status if applicable
        BigDecimal newTotalAuthorized = authorizedSoFar.add(authorizedAmount);
        if (newTotalAuthorized.compareTo(milestone.getMilestoneValue()) >= 0) {
            milestone.setStatus(MilestoneStatus.PAYMENT_APPROVED);
        } else {
            milestone.setStatus(MilestoneStatus.PARTIALLY_PAID);
        }
        milestoneRepository.save(milestone);

        auditService.recordEvent(
                authorizer != null ? authorizer.getId() : null,
                "PAYMENT_AUTHORIZED_SIMULATED",
                "PAYMENT_AUTHORIZATION",
                saved.getId(),
                "Simulated payment authorization issued: " + saved.getPaymentCode() + " (" + saved.getAuthorizationReference() + ")",
                "Amount: " + saved.getCurrency() + " " + saved.getAuthorizedAmount() + " [SIMULATED - NO REAL FUNDS TRANSFERRED]"
        );

        log.info("Simulated payment authorized: code={}, ref={}, amount={} {}, authorizer={}",
                saved.getPaymentCode(), saved.getAuthorizationReference(), saved.getCurrency(), saved.getAuthorizedAmount(), authorizer.getEmail());

        return mapToResponse(saved);
    }

    @Transactional
    public PaymentAuthorizationResponse simulateSettlement(String paymentId, User currentUser) {
        PaymentAuthorization pa = authorizationRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment authorization not found with id: " + paymentId));

        if (pa.getStatus() == PaymentAuthorizationStatus.SETTLED_SIMULATED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment has already reached SETTLED_SIMULATED status");
        }
        if (pa.getStatus() != PaymentAuthorizationStatus.AUTHORIZED && pa.getStatus() != PaymentAuthorizationStatus.PROCESSING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot settle payment with status: " + pa.getStatus());
        }

        pa.setStatus(PaymentAuthorizationStatus.SETTLED_SIMULATED);
        pa.setSettledAt(Instant.now());
        PaymentAuthorization updated = authorizationRepository.save(pa);

        // Record simulated settlement transaction
        FinancialTransaction settleTxn = new FinancialTransaction();
        settleTxn.setPaymentAuthorization(updated);
        settleTxn.setTransactionType(TransactionType.SIMULATED_SETTLEMENT);
        settleTxn.setAmount(updated.getAuthorizedAmount());
        settleTxn.setCurrency(updated.getCurrency());
        settleTxn.setTransactionReference("TXN-SETTLE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        settleTxn.setStatus(TransactionStatus.SUCCESS);
        settleTxn.setDescription("Simulated settlement completed [SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED]");
        settleTxn.setSimulationMode(true);
        transactionRepository.save(settleTxn);

        // Update Milestone status based on cumulative settled amount
        ProjectMilestone milestone = updated.getMilestone();
        BigDecimal totalSettled = authorizationRepository.sumSettledAmountByMilestoneId(milestone.getId());

        if (totalSettled.compareTo(milestone.getMilestoneValue()) >= 0) {
            milestone.setStatus(MilestoneStatus.PAID);
        } else {
            milestone.setStatus(MilestoneStatus.PARTIALLY_PAID);
        }
        milestoneRepository.save(milestone);

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "PAYMENT_SETTLED_SIMULATED",
                "PAYMENT_AUTHORIZATION",
                updated.getId(),
                "Simulated settlement completed for payment " + updated.getPaymentCode(),
                "Settled amount: " + updated.getCurrency() + " " + updated.getAuthorizedAmount() + " [SIMULATED]"
        );

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public PaymentAuthorizationResponse getPaymentById(String paymentId) {
        PaymentAuthorization pa = authorizationRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment authorization not found with id: " + paymentId));
        return mapToResponse(pa);
    }

    @Transactional(readOnly = true)
    public Page<PaymentAuthorizationResponse> getAllPayments(Pageable pageable) {
        return authorizationRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<PaymentAuthorizationResponse> getPaymentsByMilestone(String milestoneId) {
        return authorizationRepository.findByMilestoneId(milestoneId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String generatePaymentCode() {
        try {
            Object res = entityManager.createNativeQuery("SELECT nextval('payment_auth_seq')").getSingleResult();
            long nextVal = res instanceof BigInteger ? ((BigInteger) res).longValue() : ((Number) res).longValue();
            return String.format("PAY-%04d", nextVal);
        } catch (Exception e) {
            return "PAY-" + System.currentTimeMillis() % 100000;
        }
    }

    public PaymentAuthorizationResponse mapToResponse(PaymentAuthorization pa) {
        PaymentAuthorizationResponse dto = new PaymentAuthorizationResponse();
        dto.setId(pa.getId());
        dto.setPaymentCode(pa.getPaymentCode());

        if (pa.getPaymentRequest() != null) {
            dto.setPaymentRequestId(pa.getPaymentRequest().getId());
            dto.setPaymentRequestCode(pa.getPaymentRequest().getPaymentRequestCode());
        }
        if (pa.getProject() != null) {
            dto.setProjectId(pa.getProject().getId());
            dto.setProjectName(pa.getProject().getProjectName());
        }
        if (pa.getMilestone() != null) {
            dto.setMilestoneId(pa.getMilestone().getId());
            dto.setMilestoneCode(pa.getMilestone().getMilestoneCode());
            dto.setMilestoneName(pa.getMilestone().getName());
        }
        if (pa.getVendor() != null) {
            dto.setVendorId(pa.getVendor().getId());
            dto.setVendorCode(pa.getVendor().getVendorCode());
            dto.setVendorName(pa.getVendor().getCompanyName());
        }

        dto.setAuthorizedAmount(pa.getAuthorizedAmount());
        dto.setCurrency(pa.getCurrency());
        dto.setAuthorizationReference(pa.getAuthorizationReference());
        dto.setStatus(pa.getStatus());
        dto.setSimulationDisclaimer(pa.getSimulationDisclaimer());

        if (pa.getAuthorizedBy() != null) {
            dto.setAuthorizedById(pa.getAuthorizedBy().getId());
            dto.setAuthorizedByName(pa.getAuthorizedBy().getFullName());
        }
        dto.setAuthorizedAt(pa.getAuthorizedAt());
        dto.setSettledAt(pa.getSettledAt());
        dto.setFailureReason(pa.getFailureReason());
        dto.setIdempotencyKey(pa.getIdempotencyKey());
        dto.setCreatedAt(pa.getCreatedAt());

        // Transactions
        List<FinancialTransactionResponse> txDtos = transactionRepository
                .findByPaymentAuthorizationIdOrderByCreatedAtDesc(pa.getId()).stream().map(t -> {
                    FinancialTransactionResponse td = new FinancialTransactionResponse();
                    td.setId(t.getId());
                    td.setPaymentAuthorizationId(t.getPaymentAuthorization().getId());
                    td.setTransactionType(t.getTransactionType());
                    td.setAmount(t.getAmount());
                    td.setCurrency(t.getCurrency());
                    td.setTransactionReference(t.getTransactionReference());
                    td.setStatus(t.getStatus());
                    td.setDescription(t.getDescription());
                    td.setSimulationMode(t.isSimulationMode());
                    td.setCreatedAt(t.getCreatedAt());
                    return td;
                }).collect(Collectors.toList());
        dto.setTransactions(txDtos);

        return dto;
    }
}
