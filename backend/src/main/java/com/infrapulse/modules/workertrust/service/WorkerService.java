package com.infrapulse.modules.workertrust.service;

import com.infrapulse.common.audit.AuditCategory;
import com.infrapulse.common.audit.AuditOutcome;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.BadRequestException;
import com.infrapulse.common.exception.ForbiddenException;
import com.infrapulse.common.exception.ResourceNotFoundException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workertrust.dto.*;
import com.infrapulse.modules.workertrust.entity.*;
import com.infrapulse.modules.workertrust.enums.*;
import com.infrapulse.modules.workertrust.repository.*;
import com.infrapulse.security.HashUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class WorkerService {

    private static final Logger log = LoggerFactory.getLogger(WorkerService.class);

    private final WorkerRepository workerRepository;
    private final WorkerVendorAssociationRepository associationRepository;
    private final WorkerConsentRepository consentRepository;
    private final WorkerDocumentRepository documentRepository;
    private final WorkerIdentityVerificationRepository verificationRepository;
    private final WorkerCertificationRepository certificationRepository;
    private final WorkerApprovalRepository approvalRepository;
    private final WorkerProjectAssignmentRepository assignmentRepository;
    private final WorkerQrCredentialRepository qrCredentialRepository;
    private final WorkerSiteAccessRepository siteAccessRepository;
    private final WorkerIncidentRepository incidentRepository;
    private final WorkerAccessSuspensionRepository suspensionRepository;
    private final WorkerNotificationRepository notificationRepository;
    private final VendorRepository vendorRepository;
    private final AuditService auditService;

    public WorkerService(
        WorkerRepository workerRepository,
        WorkerVendorAssociationRepository associationRepository,
        WorkerConsentRepository consentRepository,
        WorkerDocumentRepository documentRepository,
        WorkerIdentityVerificationRepository verificationRepository,
        WorkerCertificationRepository certificationRepository,
        WorkerApprovalRepository approvalRepository,
        WorkerProjectAssignmentRepository assignmentRepository,
        WorkerQrCredentialRepository qrCredentialRepository,
        WorkerSiteAccessRepository siteAccessRepository,
        WorkerIncidentRepository incidentRepository,
        WorkerAccessSuspensionRepository suspensionRepository,
        WorkerNotificationRepository notificationRepository,
        VendorRepository vendorRepository,
        AuditService auditService
    ) {
        this.workerRepository = workerRepository;
        this.associationRepository = associationRepository;
        this.consentRepository = consentRepository;
        this.documentRepository = documentRepository;
        this.verificationRepository = verificationRepository;
        this.certificationRepository = certificationRepository;
        this.approvalRepository = approvalRepository;
        this.assignmentRepository = assignmentRepository;
        this.qrCredentialRepository = qrCredentialRepository;
        this.siteAccessRepository = siteAccessRepository;
        this.incidentRepository = incidentRepository;
        this.suspensionRepository = suspensionRepository;
        this.notificationRepository = notificationRepository;
        this.vendorRepository = vendorRepository;
        this.auditService = auditService;
    }

    @Transactional
    public WorkerSummaryResponse registerWorker(RegisterWorkerRequest request, User currentUser) {
        log.info("Registering worker full_name={} initiated by user={}", request.fullName(), currentUser.getEmail());

        if (Boolean.FALSE.equals(request.consentGranted())) {
            throw new BadRequestException("Explicit worker privacy consent must be acknowledged before registration");
        }

        Vendor vendor;
        if (currentUser.getRole() == UserRole.VENDOR) {
            vendor = vendorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("No authorized vendor entity found for vendor user: " + currentUser.getEmail()));
        } else {
            String vId = request.vendorId();
            if (vId == null || vId.isBlank()) {
                vendor = vendorRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new BadRequestException("No vendors configured in system to associate worker"));
            } else {
                vendor = vendorRepository.findById(vId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + vId));
            }
        }

        Long seq = workerRepository.getNextWorkerSequence();
        int year = LocalDate.now().getYear();
        String workerCode = String.format("INF-WRK-%d-%06d", year, seq);

        Worker worker = new Worker();
        worker.setWorkerCode(workerCode);
        worker.setFullName(request.fullName().trim());
        worker.setMobileNumber(request.mobileNumber().trim());
        worker.setEmail(request.email() != null ? request.email().trim() : null);
        worker.setDateOfBirth(request.dateOfBirth());
        worker.setJobRole(request.jobRole() != null && !request.jobRole().isBlank() ? request.jobRole() : "GENERAL_WORKER");
        worker.setSkillsExperience(request.skillsExperience());
        worker.setEmergencyContactName(request.emergencyContactName());
        worker.setEmergencyContactPhone(request.emergencyContactPhone());
        worker.setCurrentStatus(WorkerStatus.PENDING_REVIEW);
        worker.setCreatedBy(currentUser);
        Worker savedWorker = workerRepository.save(worker);

        WorkerVendorAssociation assoc = new WorkerVendorAssociation(savedWorker, vendor, LocalDate.now());
        associationRepository.save(assoc);

        WorkerConsent consent = new WorkerConsent(
            savedWorker,
            "WORKER_IDENTITY_AND_SITE_SAFETY",
            "Consent for internal infrastructure worker identity verification, skills assessment, and worksite safety compliance under applicable DPDP regulations.",
            currentUser
        );
        consentRepository.save(consent);

        VerificationMethod method = request.verificationMethod() != null ? request.verificationMethod() : VerificationMethod.MANUAL_REVIEW;
        String maskedRef = request.verificationReference() != null && !request.verificationReference().isBlank()
            ? maskReference(request.verificationReference())
            : "REF-PENDING-" + seq;
        WorkerIdentityVerification verif = new WorkerIdentityVerification(savedWorker, method, maskedRef);
        verificationRepository.save(verif);

        auditService.recordEvent(
            currentUser.getId(),
            "WORKER_REGISTERED",
            "WORKER",
            savedWorker.getId(),
            "Worker registered: " + workerCode + " (" + savedWorker.getFullName() + ") under vendor " + vendor.getCompanyName(),
            "REGISTRATION"
        );

        return toSummaryResponse(savedWorker);
    }

    @Transactional(readOnly = true)
    public Page<WorkerSummaryResponse> listWorkers(
        WorkerStatus status,
        String search,
        String vendorId,
        int page,
        int size,
        User currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size);
        String activeSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        if (currentUser.getRole() == UserRole.VENDOR) {
            Vendor vendor = vendorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("No authorized vendor entity found"));
            Page<Worker> workers = workerRepository.findByVendorIdWithFilters(vendor.getId(), status, activeSearch, pageable);
            return workers.map(this::toSummaryResponse);
        }

        if (vendorId != null && !vendorId.isBlank()) {
            Page<Worker> workers = workerRepository.findByVendorIdWithFilters(vendorId, status, activeSearch, pageable);
            return workers.map(this::toSummaryResponse);
        }

        Page<Worker> workers = workerRepository.findAllWithFilters(status, activeSearch, pageable);
        return workers.map(this::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public WorkerDetailResponse getWorkerDetail(String workerId, User currentUser) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new ResourceNotFoundException("Worker not found with ID: " + workerId));

        if (currentUser.getRole() == UserRole.VENDOR) {
            Vendor vendor = vendorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("No authorized vendor entity found"));
            boolean belongsToVendor = associationRepository.existsByWorkerIdAndVendorIdAndAssociationStatus(
                worker.getId(), vendor.getId(), "ACTIVE"
            );
            if (!belongsToVendor) {
                throw new ForbiddenException("Access denied: Worker does not belong to your vendor organization");
            }
        }

        return toDetailResponse(worker, currentUser);
    }

    @Transactional
    public WorkerDocumentDto uploadDocument(
        String workerId,
        DocumentType documentType,
        String originalFilename,
        String contentType,
        Long fileSize,
        String secureStorageReference,
        User currentUser
    ) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new ResourceNotFoundException("Worker not found with ID: " + workerId));

        if (currentUser.getRole() == UserRole.VENDOR) {
            Vendor vendor = vendorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("No authorized vendor found"));
            if (!associationRepository.existsByWorkerIdAndVendorIdAndAssociationStatus(worker.getId(), vendor.getId(), "ACTIVE")) {
                throw new ForbiddenException("Access denied: Worker does not belong to your vendor organization");
            }
        }

        WorkerDocument doc = new WorkerDocument(
            worker,
            documentType,
            secureStorageReference != null ? secureStorageReference : "vault://workers/" + worker.getWorkerCode() + "/" + UUID.randomUUID(),
            originalFilename != null ? originalFilename : "document.pdf",
            contentType != null ? contentType : "application/pdf",
            fileSize != null ? fileSize : 1024L,
            currentUser
        );
        WorkerDocument saved = documentRepository.save(doc);

        auditService.recordEvent(
            currentUser.getId(),
            "WORKER_DOCUMENT_UPLOADED",
            "WORKER_DOCUMENT",
            worker.getId(),
            "Document " + documentType.name() + " uploaded for worker " + worker.getWorkerCode(),
            "DOCUMENT_UPLOAD"
        );

        return toDocumentDto(saved);
    }

    @Transactional
    public WorkerDocumentDto reviewDocument(String documentId, ReviewDocumentRequest request, User reviewer) {
        WorkerDocument doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        doc.setDocumentStatus(request.documentStatus());
        doc.setReviewNotes(request.reviewNotes());
        WorkerDocument updated = documentRepository.save(doc);

        auditService.recordEvent(
            reviewer.getId(),
            "WORKER_DOCUMENT_REVIEWED",
            "WORKER_DOCUMENT",
            doc.getWorker().getId(),
            "Document " + doc.getDocumentType().name() + " reviewed with status " + request.documentStatus().name(),
            "DOCUMENT_REVIEW"
        );

        return toDocumentDto(updated);
    }

    @Transactional
    public WorkerVerificationDto reviewVerification(String verificationId, UpdateVerificationRequest request, User reviewer) {
        WorkerIdentityVerification verif = verificationRepository.findById(verificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Verification record not found: " + verificationId));

        verif.setVerificationStatus(request.verificationStatus());
        verif.setReviewNotes(request.reviewNotes());
        verif.setVerifiedBy(reviewer);
        verif.setVerifiedAt(Instant.now());
        WorkerIdentityVerification updated = verificationRepository.save(verif);

        auditService.recordEvent(
            reviewer.getId(),
            "WORKER_IDENTITY_VERIFIED",
            "WORKER_VERIFICATION",
            verif.getWorker().getId(),
            "Identity verification updated to " + request.verificationStatus().name() + " for worker " + verif.getWorker().getWorkerCode(),
            "IDENTITY_VERIFICATION"
        );

        return toVerificationDto(updated);
    }

    @Transactional
    public WorkerCertificationDto addCertification(String workerId, AddCertificationRequest request, User currentUser) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        WorkerCertification cert = new WorkerCertification(
            worker,
            request.certificationType(),
            request.issuingAuthority().trim(),
            request.issueDate(),
            request.expiryDate()
        );
        cert.setCertificateNumber(request.certificateNumber());
        cert.setDocumentReference(request.documentReference());
        cert.setVerificationStatus(CertificationStatus.PENDING);
        WorkerCertification saved = certificationRepository.save(cert);

        auditService.recordEvent(
            currentUser.getId(),
            "WORKER_CERTIFICATION_ADDED",
            "WORKER_CERTIFICATION",
            worker.getId(),
            "Certification " + request.certificationType().name() + " added for worker " + worker.getWorkerCode(),
            "CERTIFICATION_SUBMISSION"
        );

        return toCertificationDto(saved);
    }

    @Transactional
    public WorkerCertificationDto verifyCertification(String certId, CertificationStatus status, User reviewer) {
        WorkerCertification cert = certificationRepository.findById(certId)
            .orElseThrow(() -> new ResourceNotFoundException("Certification not found: " + certId));

        cert.setVerificationStatus(status);
        cert.setVerifiedBy(reviewer);
        cert.setVerifiedAt(Instant.now());
        WorkerCertification updated = certificationRepository.save(cert);

        auditService.recordEvent(
            reviewer.getId(),
            "WORKER_CERTIFICATION_VERIFIED",
            "WORKER_CERTIFICATION",
            cert.getWorker().getId(),
            "Certification " + cert.getCertificationType().name() + " status set to " + status.name(),
            "CERTIFICATION_VERIFICATION"
        );

        return toCertificationDto(updated);
    }

    @Transactional
    public WorkerDetailResponse approveOrRejectWorker(String workerId, WorkerApprovalRequest request, User reviewer) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        if (suspensionRepository.existsByWorkerIdAndSuspensionStatus(worker.getId(), SuspensionStatus.ACTIVE)) {
            throw new BadRequestException("Cannot approve worker with an active suspension");
        }

        WorkerApproval approval = new WorkerApproval(worker, reviewer, request.decision(), request.reason().trim());
        approvalRepository.save(approval);

        if (request.decision() == ApprovalDecision.APPROVED) {
            worker.setCurrentStatus(WorkerStatus.APPROVED);
            generateOrUpdateQrCredential(worker, reviewer);
        } else if (request.decision() == ApprovalDecision.REJECTED) {
            worker.setCurrentStatus(WorkerStatus.REJECTED);
        } else if (request.decision() == ApprovalDecision.CORRECTION_REQUESTED) {
            worker.setCurrentStatus(WorkerStatus.REQUIRES_CORRECTION);
        }

        workerRepository.save(worker);

        auditService.recordEvent(
            reviewer.getId(),
            "WORKER_APPROVAL_DECISION",
            "WORKER",
            worker.getId(),
            "Worker " + worker.getWorkerCode() + " decision: " + request.decision().name() + ". Reason: " + request.reason(),
            "APPROVAL_DECISION"
        );

        return toDetailResponse(worker, reviewer);
    }

    @Transactional
    public WorkerDetailResponse suspendWorker(String workerId, SuspendWorkerRequest request, User currentUser) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        worker.setCurrentStatus(WorkerStatus.SUSPENDED);
        workerRepository.save(worker);

        WorkerAccessSuspension susp = new WorkerAccessSuspension(
            worker,
            request.reason().trim(),
            currentUser,
            request.reviewDate()
        );
        suspensionRepository.save(susp);

        qrCredentialRepository.findFirstByWorkerIdAndCredentialStatusOrderByIssuedAtDesc(
            worker.getId(), CredentialStatus.ACTIVE
        ).ifPresent(cred -> {
            cred.setCredentialStatus(CredentialStatus.REVOKED);
            cred.setRevokedAt(Instant.now());
            qrCredentialRepository.save(cred);
        });

        siteAccessRepository.findFirstByWorkerIdAndExitTimeIsNullAndAccessStatus(worker.getId(), SiteAccessStatus.ALLOW_ENTRY)
            .ifPresent(activeSession -> {
                activeSession.setExitTime(Instant.now());
                activeSession.setBlockingReason("AUTOMATIC_EXIT_UPON_SUSPENSION");
                siteAccessRepository.save(activeSession);
            });

        auditService.recordEvent(
            currentUser.getId(),
            "WORKER_SUSPENDED",
            "WORKER",
            worker.getId(),
            "Worker " + worker.getWorkerCode() + " suspended. Reason: " + request.reason(),
            "SAFETY_SUSPENSION"
        );

        return toDetailResponse(worker, currentUser);
    }

    @Transactional
    public WorkerDetailResponse reactivateWorker(String workerId, ReactivateWorkerRequest request, User currentUser) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        suspensionRepository.findFirstByWorkerIdAndSuspensionStatus(worker.getId(), SuspensionStatus.ACTIVE)
            .ifPresent(susp -> {
                susp.setSuspensionStatus(SuspensionStatus.LIFTED);
                susp.setEndTime(Instant.now());
                susp.setResolutionNotes(request.resolutionNotes().trim());
                suspensionRepository.save(susp);
            });

        boolean hasActiveAssignment = assignmentRepository.findActiveAssignmentForWorker(worker.getId(), LocalDate.now()).isPresent();
        worker.setCurrentStatus(hasActiveAssignment ? WorkerStatus.ASSIGNED : WorkerStatus.APPROVED);
        workerRepository.save(worker);

        generateOrUpdateQrCredential(worker, currentUser);

        auditService.recordEvent(
            currentUser.getId(),
            "WORKER_REACTIVATED",
            "WORKER",
            worker.getId(),
            "Worker " + worker.getWorkerCode() + " reactivated. Justification: " + request.resolutionNotes(),
            "SAFETY_REACTIVATION"
        );

        return toDetailResponse(worker, currentUser);
    }

    private WorkerQrCredential generateOrUpdateQrCredential(Worker worker, User issuer) {
        String opaqueToken = "WRK-SEC-" + UUID.randomUUID().toString().replace("-", "") + "-" + HashUtil.generateSecureRandomToken(16);
        String tokenHash = HashUtil.sha256(opaqueToken);
        String payload = "INFRAPULSE:WRK:" + opaqueToken + ":" + worker.getWorkerCode();

        qrCredentialRepository.findFirstByWorkerIdAndCredentialStatusOrderByIssuedAtDesc(
            worker.getId(), CredentialStatus.ACTIVE
        ).ifPresent(oldCred -> {
            oldCred.setCredentialStatus(CredentialStatus.REVOKED);
            oldCred.setRevokedAt(Instant.now());
            qrCredentialRepository.save(oldCred);
        });

        WorkerQrCredential cred = new WorkerQrCredential(
            worker,
            tokenHash,
            payload,
            Instant.now().plus(180, ChronoUnit.DAYS),
            issuer
        );
        return qrCredentialRepository.save(cred);
    }

    private String maskReference(String ref) {
        if (ref == null || ref.length() <= 4) {
            return "XXXX-****";
        }
        String lastFour = ref.substring(ref.length() - 4);
        return "XXXX-XXXX-" + lastFour;
    }

    public WorkerSummaryResponse toSummaryResponse(Worker worker) {
        Optional<WorkerVendorAssociation> assoc = associationRepository.findFirstByWorkerIdAndAssociationStatus(worker.getId(), "ACTIVE");
        String vendorId = assoc.map(a -> a.getVendor().getId()).orElse(null);
        String vendorName = assoc.map(a -> a.getVendor().getCompanyName()).orElse("Unassigned");
        String vendorCode = assoc.map(a -> a.getVendor().getVendorCode()).orElse(null);

        Optional<WorkerProjectAssignment> assign = assignmentRepository.findActiveAssignmentForWorker(worker.getId(), LocalDate.now());
        String projectId = assign.map(a -> a.getProject().getId()).orElse(null);
        String projectName = assign.map(a -> a.getProject().getProjectName()).orElse(null);
        String workZoneId = assign.map(a -> a.getWorkZone().getId()).orElse(null);
        String workZoneName = assign.map(a -> a.getWorkZone().getZoneName()).orElse(null);

        List<WorkerCertification> certs = certificationRepository.findByWorkerId(worker.getId());
        int activeCerts = (int) certs.stream().filter(c -> !c.isExpired() && c.getVerificationStatus() == CertificationStatus.VERIFIED).count();
        int expiredCerts = (int) certs.stream().filter(WorkerCertification::isExpired).count();

        boolean onSite = siteAccessRepository.findFirstByWorkerIdAndExitTimeIsNullAndAccessStatus(
            worker.getId(), SiteAccessStatus.ALLOW_ENTRY
        ).isPresent();

        boolean suspended = suspensionRepository.existsByWorkerIdAndSuspensionStatus(worker.getId(), SuspensionStatus.ACTIVE);

        return new WorkerSummaryResponse(
            worker.getId(),
            worker.getWorkerCode(),
            worker.getFullName(),
            worker.getMobileNumber(),
            worker.getEmail(),
            worker.getDateOfBirth(),
            worker.getJobRole(),
            worker.getCurrentStatus(),
            vendorId,
            vendorName,
            vendorCode,
            projectId,
            projectName,
            workZoneId,
            workZoneName,
            activeCerts,
            expiredCerts,
            onSite,
            suspended,
            worker.getCreatedAt()
        );
    }

    public WorkerDetailResponse toDetailResponse(Worker worker, User currentUser) {
        WorkerSummaryResponse summary = toSummaryResponse(worker);

        boolean isFinance = currentUser.getRole() == UserRole.FINANCE_OFFICER;

        List<WorkerDocumentDto> docs = isFinance ? List.of() : documentRepository.findByWorkerId(worker.getId())
            .stream().map(this::toDocumentDto).toList();

        List<WorkerVerificationDto> verifs = isFinance ? List.of() : verificationRepository.findByWorkerId(worker.getId())
            .stream().map(this::toVerificationDto).toList();

        List<WorkerCertificationDto> certs = certificationRepository.findByWorkerId(worker.getId())
            .stream().map(this::toCertificationDto).toList();

        List<WorkerAssignmentDto> assigns = assignmentRepository.findByWorkerId(worker.getId())
            .stream().map(this::toAssignmentDto).toList();

        List<WorkerSiteAccessDto> siteAccess = siteAccessRepository.findByWorkerIdOrderByEntryTimeDesc(worker.getId())
            .stream().limit(15).map(this::toSiteAccessDto).toList();

        List<WorkerIncidentDto> incidents = isFinance ? List.of() : incidentRepository.findByWorkerId(worker.getId())
            .stream().map(this::toIncidentDto).toList();

        List<WorkerSuspensionDto> suspensions = isFinance ? List.of() : suspensionRepository.findByWorkerIdOrderByStartTimeDesc(worker.getId())
            .stream().map(this::toSuspensionDto).toList();

        WorkerQrBadgeResponse qrBadge = null;
        if (!isFinance) {
            Optional<WorkerQrCredential> credOpt = qrCredentialRepository.findFirstByWorkerIdAndCredentialStatusOrderByIssuedAtDesc(
                worker.getId(), CredentialStatus.ACTIVE
            );
            if (credOpt.isPresent()) {
                WorkerQrCredential cred = credOpt.get();
                qrBadge = new WorkerQrBadgeResponse(
                    cred.getId(),
                    worker.getId(),
                    worker.getWorkerCode(),
                    worker.getFullName(),
                    worker.getJobRole(),
                    worker.getPhotoReference(),
                    summary.vendorName(),
                    summary.vendorCode(),
                    summary.activeProjectName(),
                    summary.activeWorkZoneName(),
                    cred.getTokenHash(),
                    cred.getCredentialPayload(),
                    cred.getCredentialStatus(),
                    cred.getIssuedAt(),
                    cred.getExpiresAt(),
                    cred.isValid()
                );
            }
        }

        return new WorkerDetailResponse(
            worker.getId(),
            worker.getWorkerCode(),
            worker.getFullName(),
            worker.getPhotoReference(),
            worker.getMobileNumber(),
            worker.getEmail(),
            worker.getDateOfBirth(),
            worker.getJobRole(),
            worker.getSkillsExperience(),
            worker.getEmergencyContactName(),
            worker.getEmergencyContactPhone(),
            worker.getCurrentStatus(),
            summary.vendorId(),
            summary.vendorName(),
            summary.vendorCode(),
            summary.activeProjectId(),
            summary.activeProjectName(),
            summary.activeWorkZoneId(),
            summary.activeWorkZoneName(),
            summary.isCurrentlyOnSite(),
            summary.isSuspended(),
            docs,
            verifs,
            certs,
            assigns,
            siteAccess,
            incidents,
            suspensions,
            qrBadge,
            worker.getCreatedAt(),
            worker.getUpdatedAt()
        );
    }

    public WorkerDocumentDto toDocumentDto(WorkerDocument doc) {
        return new WorkerDocumentDto(
            doc.getId(),
            doc.getDocumentType(),
            doc.getSecureStorageReference(),
            doc.getOriginalFilename(),
            doc.getContentType(),
            doc.getFileSize(),
            doc.getDocumentStatus(),
            doc.getReviewNotes(),
            doc.getUploadedAt(),
            doc.getUploadedBy() != null ? doc.getUploadedBy().getFullName() : "System"
        );
    }

    public WorkerVerificationDto toVerificationDto(WorkerIdentityVerification v) {
        return new WorkerVerificationDto(
            v.getId(),
            v.getVerificationMethod(),
            v.getVerificationReference(),
            v.getVerificationStatus(),
            v.getVerifiedBy() != null ? v.getVerifiedBy().getFullName() : null,
            v.getVerifiedAt(),
            v.getReviewNotes(),
            v.getCreatedAt()
        );
    }

    public WorkerCertificationDto toCertificationDto(WorkerCertification c) {
        return new WorkerCertificationDto(
            c.getId(),
            c.getCertificationType(),
            c.getIssuingAuthority(),
            c.getCertificateNumber(),
            c.getIssueDate(),
            c.getExpiryDate(),
            c.getVerificationStatus(),
            c.getDocumentReference(),
            c.isExpired(),
            c.getVerifiedAt(),
            c.getVerifiedBy() != null ? c.getVerifiedBy().getFullName() : null
        );
    }

    public WorkerAssignmentDto toAssignmentDto(WorkerProjectAssignment a) {
        return new WorkerAssignmentDto(
            a.getId(),
            a.getProject().getId(),
            a.getProject().getProjectCode(),
            a.getProject().getProjectName(),
            a.getWorkZone().getId(),
            a.getWorkZone().getZoneCode(),
            a.getWorkZone().getZoneName(),
            a.getVendor().getId(),
            a.getVendor().getCompanyName(),
            a.getStartDate(),
            a.getEndDate(),
            a.getAssignmentStatus(),
            a.getRequiredRole(),
            a.getAssignedBy().getFullName(),
            a.getCreatedAt()
        );
    }

    public WorkerSiteAccessDto toSiteAccessDto(WorkerSiteAccess sa) {
        Optional<WorkerVendorAssociation> assoc = associationRepository.findFirstByWorkerIdAndAssociationStatus(sa.getWorker().getId(), "ACTIVE");
        String vName = assoc.map(a -> a.getVendor().getCompanyName()).orElse("Unassigned");

        return new WorkerSiteAccessDto(
            sa.getId(),
            sa.getWorker().getId(),
            sa.getWorker().getWorkerCode(),
            sa.getWorker().getFullName(),
            sa.getWorker().getJobRole(),
            vName,
            sa.getProject() != null ? sa.getProject().getId() : null,
            sa.getProject() != null ? sa.getProject().getProjectCode() : null,
            sa.getProject() != null ? sa.getProject().getProjectName() : null,
            sa.getWorkZone() != null ? sa.getWorkZone().getId() : null,
            sa.getWorkZone() != null ? sa.getWorkZone().getZoneName() : null,
            sa.getEntryTime(),
            sa.getExitTime(),
            sa.getAccessStatus(),
            sa.getBlockingReason(),
            sa.getRecordingOfficer() != null ? sa.getRecordingOfficer().getFullName() : "Gate Terminal",
            sa.isCurrentlyOnSite()
        );
    }

    public WorkerIncidentDto toIncidentDto(WorkerIncident i) {
        return new WorkerIncidentDto(
            i.getId(),
            i.getIncidentReference(),
            i.getProject() != null ? i.getProject().getId() : null,
            i.getProject() != null ? i.getProject().getProjectCode() : null,
            i.getProject() != null ? i.getProject().getProjectName() : null,
            i.getWorkZone() != null ? i.getWorkZone().getId() : null,
            i.getWorkZone() != null ? i.getWorkZone().getZoneName() : null,
            i.getWorker() != null ? i.getWorker().getId() : null,
            i.getWorker() != null ? i.getWorker().getWorkerCode() : null,
            i.getWorker() != null ? i.getWorker().getFullName() : null,
            i.getIncidentType(),
            i.getSeverity(),
            i.getDescription(),
            i.getImmediateActionTaken(),
            i.getIncidentStatus(),
            i.getReportedBy().getFullName(),
            i.getAssignedInvestigator() != null ? i.getAssignedInvestigator().getFullName() : null,
            i.getResolution(),
            i.getReportedAt(),
            i.getResolvedAt()
        );
    }

    public WorkerSuspensionDto toSuspensionDto(WorkerAccessSuspension s) {
        return new WorkerSuspensionDto(
            s.getId(),
            s.getReason(),
            s.getImposedBy().getFullName(),
            s.getStartTime(),
            s.getReviewDate(),
            s.getEndTime(),
            s.getSuspensionStatus(),
            s.getResolutionNotes(),
            s.isActive()
        );
    }
}
