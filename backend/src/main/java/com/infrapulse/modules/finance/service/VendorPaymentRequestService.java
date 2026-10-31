package com.infrapulse.modules.finance.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.finance.dto.*;
import com.infrapulse.modules.finance.entity.PaymentRequestDocument;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.entity.VendorPaymentRequest;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentDocumentType;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import com.infrapulse.modules.finance.repository.FinancialApprovalDecisionRepository;
import com.infrapulse.modules.finance.repository.InvoiceVerificationRepository;
import com.infrapulse.modules.finance.repository.PaymentRequestDocumentRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.finance.repository.VendorPaymentRequestRepository;
import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.repository.HumanInspectionDecisionRepository;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.repository.QualityAssessmentRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VendorPaymentRequestService {

    private static final Logger log = LoggerFactory.getLogger(VendorPaymentRequestService.class);

    private final VendorPaymentRequestRepository paymentRequestRepository;
    private final PaymentRequestDocumentRepository documentRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final VendorRepository vendorRepository;
    private final PaymentValidationService paymentValidationService;
    private final InvoiceVerificationRepository invoiceVerificationRepository;
    private final FinancialApprovalDecisionRepository decisionRepository;
    private final QualityAssessmentRepository qualityAssessmentRepository;
    private final HumanInspectionDecisionRepository humanInspectionDecisionRepository;
    private final AuditService auditService;
    private final EntityManager entityManager;

    public VendorPaymentRequestService(
            VendorPaymentRequestRepository paymentRequestRepository,
            PaymentRequestDocumentRepository documentRepository,
            ProjectMilestoneRepository milestoneRepository,
            VendorRepository vendorRepository,
            PaymentValidationService paymentValidationService,
            InvoiceVerificationRepository invoiceVerificationRepository,
            FinancialApprovalDecisionRepository decisionRepository,
            QualityAssessmentRepository qualityAssessmentRepository,
            HumanInspectionDecisionRepository humanInspectionDecisionRepository,
            AuditService auditService,
            EntityManager entityManager) {
        this.paymentRequestRepository = paymentRequestRepository;
        this.documentRepository = documentRepository;
        this.milestoneRepository = milestoneRepository;
        this.vendorRepository = vendorRepository;
        this.paymentValidationService = paymentValidationService;
        this.invoiceVerificationRepository = invoiceVerificationRepository;
        this.decisionRepository = decisionRepository;
        this.qualityAssessmentRepository = qualityAssessmentRepository;
        this.humanInspectionDecisionRepository = humanInspectionDecisionRepository;
        this.auditService = auditService;
        this.entityManager = entityManager;
    }

    @Transactional
    public VendorPaymentRequestResponse submitPaymentRequest(
            String milestoneId,
            CreatePaymentRequestDto dto,
            User currentUser) {

        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Milestone not found with id: " + milestoneId));

        Vendor vendor;
        if (currentUser.getRole() == UserRole.VENDOR) {
            vendor = vendorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Authenticated user is not linked to any registered vendor record"));

            if (!milestone.getVendor().getId().equals(vendor.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Vendor does not own milestone " + milestone.getMilestoneCode());
            }
        } else {
            vendor = milestone.getVendor();
        }

        paymentValidationService.validatePaymentRequestSubmission(
                milestone,
                vendor,
                dto.getInvoiceNumber(),
                dto.getInvoiceDate(),
                dto.getRequestedAmount(),
                dto.getCurrency()
        );

        String code = generatePaymentRequestCode();

        VendorPaymentRequest pr = new VendorPaymentRequest();
        pr.setPaymentRequestCode(code);
        pr.setProject(milestone.getProject());
        pr.setAgreement(milestone.getAgreement());
        pr.setMilestone(milestone);
        pr.setVendor(vendor);
        pr.setInvoiceNumber(dto.getInvoiceNumber().trim());
        pr.setInvoiceDate(dto.getInvoiceDate());
        pr.setRequestedAmount(dto.getRequestedAmount());
        pr.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : milestone.getCurrency());
        pr.setDescription(dto.getDescription());
        pr.setSupportingDocumentUrl(dto.getSupportingDocumentUrl());
        pr.setStatus(PaymentRequestStatus.SUBMITTED);
        pr.setCreatedBy(currentUser);

        VendorPaymentRequest saved = paymentRequestRepository.save(pr);

        // Save attached documents
        if (dto.getSupportingDocuments() != null && !dto.getSupportingDocuments().isEmpty()) {
            for (CreatePaymentRequestDto.DocumentAttachmentDto docDto : dto.getSupportingDocuments()) {
                PaymentRequestDocument doc = new PaymentRequestDocument();
                doc.setPaymentRequest(saved);
                doc.setDocumentName(docDto.getDocumentName());
                doc.setEvidenceOrDocumentReference(docDto.getEvidenceOrDocumentReference());
                doc.setDocumentType(docDto.getDocumentType() != null ? docDto.getDocumentType() : PaymentDocumentType.INVOICE);
                doc.setUploadedBy(currentUser);
                documentRepository.save(doc);
            }
        }

        // Update milestone status to PAYMENT_REQUESTED if it was ELIGIBLE_FOR_PAYMENT
        if (milestone.getStatus() == MilestoneStatus.ELIGIBLE_FOR_PAYMENT) {
            milestone.setStatus(MilestoneStatus.PAYMENT_REQUESTED);
            milestoneRepository.save(milestone);
        }

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "PAYMENT_REQUEST_SUBMITTED",
                "PAYMENT_REQUEST",
                saved.getId(),
                "Vendor submitted payment request " + saved.getPaymentRequestCode() + " for invoice " + saved.getInvoiceNumber(),
                "Requested amount: " + saved.getCurrency() + " " + saved.getRequestedAmount()
        );

        log.info("Payment request submitted: code={}, invoice={}, vendor={}, amount={}",
                saved.getPaymentRequestCode(), saved.getInvoiceNumber(), vendor.getVendorCode(), saved.getRequestedAmount());

        return mapToResponse(saved);
    }

    @Transactional
    public VendorPaymentRequestResponse submitClarification(
            String requestId,
            SubmitClarificationRequest request,
            User currentUser) {

        VendorPaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment request not found with id: " + requestId));

        if (currentUser.getRole() == UserRole.VENDOR) {
            Vendor ownVendor = vendorRepository.findByUserId(currentUser.getId()).orElse(null);
            if (ownVendor == null || !pr.getVendor().getId().equals(ownVendor.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to respond to this payment request");
            }
        }

        if (pr.getStatus() != PaymentRequestStatus.CLARIFICATION_REQUIRED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment request is not in CLARIFICATION_REQUIRED status (current: " + pr.getStatus() + ")");
        }

        String updatedReason = (pr.getDecisionReason() != null ? pr.getDecisionReason() + "\n" : "") +
                "[Vendor Response " + currentUser.getFullName() + "]: " + request.getClarification();

        pr.setDecisionReason(updatedReason);
        pr.setStatus(PaymentRequestStatus.UNDER_FINANCIAL_REVIEW);
        if (request.getSupportingDocumentUrl() != null && !request.getSupportingDocumentUrl().isBlank()) {
            pr.setSupportingDocumentUrl(request.getSupportingDocumentUrl());
        }

        VendorPaymentRequest updated = paymentRequestRepository.save(pr);

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "PAYMENT_REQUEST_CLARIFIED",
                "PAYMENT_REQUEST",
                updated.getId(),
                "Vendor submitted clarification for payment request " + updated.getPaymentRequestCode(),
                request.getClarification()
        );

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public VendorPaymentRequestResponse getPaymentRequestById(String requestId, User currentUser) {
        VendorPaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment request not found with id: " + requestId));

        if (currentUser.getRole() == UserRole.VENDOR) {
            Vendor ownVendor = vendorRepository.findByUserId(currentUser.getId()).orElse(null);
            if (ownVendor == null || !pr.getVendor().getId().equals(ownVendor.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied: Vendors may only view their own payment requests");
            }
        }

        return mapToResponse(pr);
    }

    @Transactional(readOnly = true)
    public Page<VendorPaymentRequestResponse> getVendorPaymentRequests(Pageable pageable, User currentUser) {
        Vendor ownVendor = vendorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Authenticated user is not linked to any vendor profile"));

        return paymentRequestRepository.findByVendorId(ownVendor.getId(), pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<VendorPaymentRequestResponse> getAllPaymentRequests(Pageable pageable) {
        return paymentRequestRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<VendorPaymentRequestResponse> getPaymentRequestsByProject(String projectId, Pageable pageable) {
        return paymentRequestRepository.findByProjectId(projectId, pageable).map(this::mapToResponse);
    }

    private String generatePaymentRequestCode() {
        try {
            Object res = entityManager.createNativeQuery("SELECT nextval('payment_request_seq')").getSingleResult();
            long nextVal = res instanceof BigInteger ? ((BigInteger) res).longValue() : ((Number) res).longValue();
            return String.format("PRQ-%04d", nextVal);
        } catch (Exception e) {
            return "PRQ-" + System.currentTimeMillis() % 100000;
        }
    }

    public VendorPaymentRequestResponse mapToResponse(VendorPaymentRequest pr) {
        VendorPaymentRequestResponse dto = new VendorPaymentRequestResponse();
        dto.setId(pr.getId());
        dto.setPaymentRequestCode(pr.getPaymentRequestCode());

        if (pr.getProject() != null) {
            dto.setProjectId(pr.getProject().getId());
            dto.setProjectName(pr.getProject().getProjectName());
        }
        if (pr.getAgreement() != null) {
            dto.setAgreementId(pr.getAgreement().getId());
            dto.setAgreementCode(pr.getAgreement().getAgreementCode());
        }
        if (pr.getMilestone() != null) {
            dto.setMilestoneId(pr.getMilestone().getId());
            dto.setMilestoneCode(pr.getMilestone().getMilestoneCode());
            dto.setMilestoneName(pr.getMilestone().getName());
        }
        if (pr.getVendor() != null) {
            dto.setVendorId(pr.getVendor().getId());
            dto.setVendorCode(pr.getVendor().getVendorCode());
            dto.setVendorName(pr.getVendor().getCompanyName());
        }

        dto.setInvoiceNumber(pr.getInvoiceNumber());
        dto.setInvoiceDate(pr.getInvoiceDate());
        dto.setRequestedAmount(pr.getRequestedAmount());
        dto.setCurrency(pr.getCurrency());
        dto.setDescription(pr.getDescription());
        dto.setSupportingDocumentUrl(pr.getSupportingDocumentUrl());
        dto.setStatus(pr.getStatus());
        dto.setSubmittedAt(pr.getSubmittedAt());

        if (pr.getFinanceReviewer() != null) {
            dto.setFinanceReviewerId(pr.getFinanceReviewer().getId());
            dto.setFinanceReviewerName(pr.getFinanceReviewer().getFullName());
        }
        dto.setDecisionReason(pr.getDecisionReason());

        // Calculation breakdown
        if (pr.getMilestone() != null && pr.getAgreement() != null) {
            FinancialCalculationBreakdownDto breakdown = paymentValidationService.calculateBreakdown(
                    pr.getRequestedAmount(), pr.getMilestone(), pr.getAgreement());
            dto.setCalculationBreakdown(breakdown);
        }

        // Invoice verification summary
        invoiceVerificationRepository.findFirstByPaymentRequestIdOrderByVerifiedAtDesc(pr.getId()).ifPresent(iv -> {
            VendorPaymentRequestResponse.InvoiceVerificationSummaryDto ivDto = new VendorPaymentRequestResponse.InvoiceVerificationSummaryDto();
            ivDto.setVerifiedById(iv.getVerifiedBy().getId());
            ivDto.setVerifiedByName(iv.getVerifiedBy().getFullName());
            ivDto.setStatus(iv.getVerificationStatus());
            ivDto.setReason(iv.getVerificationReason());
            ivDto.setVerifiedAt(iv.getVerifiedAt());
            dto.setInvoiceVerification(ivDto);
        });

        // Documents
        List<PaymentRequestDocumentResponse> docDtos = documentRepository.findByPaymentRequestId(pr.getId()).stream().map(d -> {
            PaymentRequestDocumentResponse dd = new PaymentRequestDocumentResponse();
            dd.setId(d.getId());
            dd.setPaymentRequestId(d.getPaymentRequest().getId());
            dd.setDocumentName(d.getDocumentName());
            dd.setEvidenceOrDocumentReference(d.getEvidenceOrDocumentReference());
            dd.setDocumentType(d.getDocumentType());
            if (d.getUploadedBy() != null) {
                dd.setUploadedById(d.getUploadedBy().getId());
                dd.setUploadedByName(d.getUploadedBy().getFullName());
            }
            dd.setUploadedAt(d.getUploadedAt());
            return dd;
        }).collect(Collectors.toList());
        dto.setDocuments(docDtos);

        // Decisions
        List<FinancialApprovalDecisionResponse> decDtos = decisionRepository.findByPaymentRequestIdOrderByDecidedAtDesc(pr.getId()).stream().map(d -> {
            FinancialApprovalDecisionResponse dd = new FinancialApprovalDecisionResponse();
            dd.setId(d.getId());
            dd.setPaymentRequestId(d.getPaymentRequest().getId());
            dd.setReviewerId(d.getReviewer().getId());
            dd.setReviewerName(d.getReviewer().getFullName());
            dd.setReviewerRole(d.getReviewerRole());
            dd.setDecisionType(d.getDecisionType());
            dd.setReason(d.getReason());
            dd.setComments(d.getComments());
            dd.setApprovedAmount(d.getApprovedAmount());
            if (d.getPreviousDecision() != null) {
                dd.setPreviousDecisionId(d.getPreviousDecision().getId());
            }
            dd.setDecidedAt(d.getDecidedAt());
            return dd;
        }).collect(Collectors.toList());
        dto.setDecisions(decDtos);

        // Quality and Human Review Context summary
        if (pr.getMilestone() != null && !pr.getMilestone().getAssignments().isEmpty()) {
            WorkAssignment firstAsn = pr.getMilestone().getAssignments().get(0).getAssignment();
            if (firstAsn != null) {
                List<QualityAssessment> assessments = qualityAssessmentRepository.findByAssignmentIdOrderByCreatedAtDesc(firstAsn.getId());
                if (!assessments.isEmpty()) {
                    QualityAssessment qa = assessments.get(0);
                    dto.setQualityAssessmentSummary(qa.getAssessmentCode() + " (" + qa.getStatus() + ", Passed: " + qa.getPassedCriteriaCount() + "/" + qa.getTotalCriteriaEvaluated() + ")");
                    humanInspectionDecisionRepository.findFirstByAssignmentIdOrderByDecidedAtDesc(firstAsn.getId()).ifPresent(hid -> {
                        dto.setHumanInspectionDecisionType(hid.getDecisionType().name());
                        dto.setHumanInspectionReviewerName(hid.getReviewer() != null ? hid.getReviewer().getFullName() : null);
                    });
                }
            }
        }

        if (pr.getCreatedBy() != null) {
            dto.setCreatedById(pr.getCreatedBy().getId());
            dto.setCreatedByName(pr.getCreatedBy().getFullName());
        }
        dto.setCreatedAt(pr.getCreatedAt());
        dto.setUpdatedAt(pr.getUpdatedAt());

        return dto;
    }
}
